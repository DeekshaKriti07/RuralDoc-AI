const express = require('express');
const { v4: uuidv4 } = require('uuid');
const aiProvider = require('../ai/model/provider');
const { runSymptomCheck } = require('../ai/symptomChecker');
const { runChat } = require('../ai/chatbot');
const { normalizeLang } = require('../ai/languages');
const { translateMany } = require('../ai/translate');
const requireAuth = require('../middleware/requireAuth');
const db = require('../lib/db');

const router = express.Router();
let active = 0;
router.use((req,res,next)=>{
 if(req.method !== 'POST')return next();
 if(active>=2)return res.status(503).json({error:'AI is busy. Please try again shortly.'});
 active++;let released=false;
 const release=()=>{if(!released){released=true;active--;}};
 res.once('finish',release);res.once('close',release);next();
});
router.use((req,res,next)=>{
 const b=req.body || {};
 if(b.state != null && (typeof b.state !== 'object' || Array.isArray(b.state) || JSON.stringify(b.state).length>30000))return res.status(400).json({error:'Invalid symptom state'});
 if(b.state)for(const k of ['present','absent','english','media'])if(b.state[k] != null && (!Array.isArray(b.state[k]) || b.state[k].length>100 || (k!=='media' && b.state[k].some(v=>typeof v!=='string' || v.length>2000))))return res.status(400).json({error:'Invalid symptom state'});
 if ((b.message != null && (typeof b.message !== 'string' || b.message.length>4000)) || (b.conversation_id && !/^[0-9a-f-]{36}$/i.test(b.conversation_id)) || (b.images != null && (!Array.isArray(b.images) || b.images.length>4 || b.images.some(i=>typeof i !== 'string' || i.length>2000000 || !/^(data:image\/(jpeg|png|webp);base64,)?[A-Za-z0-9+/=]+$/.test(i)))))return res.status(400).json({error:'Invalid message, conversation or image'});
 next();
});

// The person's saved records and current medicines give the AI real context.
async function loadContext(userId) {
  let records = [], meds = [];
  try {
    [records] = await db.query('SELECT record_type, title, details FROM medical_records WHERE user_id = ? ORDER BY created_at DESC LIMIT 20', [userId]);
  } catch (err) { console.warn('Could not load records:', err.code || "internal"); }
  try {
    [meds] = await db.query('SELECT medicine_name, dosage, frequency FROM medicine_reminders WHERE user_id = ? ORDER BY created_at DESC LIMIT 12', [userId]);
  } catch (err) { console.warn('Could not load medicines:', err.code || "internal"); }
  return { records, meds };
}

const cleanImages = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string').slice(0, 4) : []);

router.get('/health', async (req, res) => {
  res.json(await aiProvider.healthCheck());
});

// POST /api/ai/symptom-check
// Body: { message?, answers?: [{id, value}], state?, images?: [dataURL], language, force_assessment?, restart? }
// Reply: { status: 'need_description' | 'need_more_info' | 'assessment', state, questions?, assessment?, ... }
router.post('/symptom-check', requireAuth, async (req, res) => {
  const body = req.body || {};
  const message = typeof body.message === 'string' ? body.message.trim().slice(0, 1500) : (typeof body.input_text === 'string' ? body.input_text.trim().slice(0, 1500) : '');
  const answers = Array.isArray(body.answers) ? body.answers.filter((a) => a && typeof a.id === 'string' && typeof a.value === 'string').slice(0, 12) : [];
  const images = cleanImages(body.images);
  if (!message && !answers.length && !images.length && !body.state) {
    return res.status(400).json({ error: 'Please describe the problem, answer a question, or add a photo.' });
  }
  const language = normalizeLang(body.language || body.source_language);

  try {
    const { records, meds } = await loadContext(req.user.id);
    const result = await runSymptomCheck({
      message, answers, images, language, records, meds,
      state: body.restart ? null : body.state, force: !!body.force_assessment,
    });

    if (result.status === 'assessment') {
      try {
        const a = result.assessment;
        await db.query(
          `INSERT INTO symptom_check_sessions (id, user_id, input_text, source_language, ai_response, urgency_level)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [uuidv4(), req.user.id, (result.state.english || []).concat(message).join('\n').slice(0, 4000) || a.what_to_tell_doctor, language,
            JSON.stringify({ status: 'assessment', assessment: { ...a, labels: undefined }, sources: result.sources }), a.urgency_level]
        );
      } catch (logErr) { console.error('Could not save symptom session:', logErr.message); }
    }
    res.json(result);
  } catch (err) {
    console.error('Symptom check failed:', err.code || "internal");
    res.status(503).json({ error: 'AI symptom checker is currently unavailable. Please consult a healthcare provider directly or use the hospital search.' });
  }
});

router.get('/symptom-check/history', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM symptom_check_sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 200', [req.user.id]);
    res.json(rows);
  } catch (err) {
    console.error('HISTORY ERROR:', err.code || "internal");
    res.status(500).json({ error: 'Failed to load history' });
  }
});

// POST /api/ai/chat   Body: { message, conversation_id?, language, images? }
router.post('/chat', requireAuth, async (req, res) => {
  const { message, conversation_id } = req.body || {};
  const images = cleanImages(req.body && req.body.images);
  const text = typeof message === 'string' ? message.trim() : '';
  if (!text && !images.length) return res.status(400).json({ error: 'message is required' });
  const language = normalizeLang(req.body.language);
  const convId = conversation_id || uuidv4();

  try {
    const [historyRows] = await db.query(
      'SELECT role, content FROM chat_messages WHERE conversation_id = ? AND user_id = ? ORDER BY created_at DESC LIMIT 30',
      [convId, req.user.id]
    );
    const { records, meds } = await loadContext(req.user.id);
    const result = await runChat({ message: text || 'Please look at this photo.', history: historyRows.reverse(), language, images, records, meds });

    await db.query('INSERT INTO chat_messages (id, user_id, conversation_id, role, content) VALUES (?, ?, ?, ?, ?)',
      [uuidv4(), req.user.id, convId, 'user', (text || '[photo]').slice(0, 4000)]);
    await db.query('INSERT INTO chat_messages (id, user_id, conversation_id, role, content) VALUES (?, ?, ?, ?, ?)',
      [uuidv4(), req.user.id, convId, 'assistant', result.reply]);

    res.json({ conversation_id: convId, ...result });
  } catch (err) {
    console.error('CHAT ERROR:', err.code || "internal");
    res.status(503).json({ error: 'Chat is currently unavailable. Please try again shortly.' });
  }
});

router.get('/chat/:conversationId', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT role, content, created_at FROM chat_messages WHERE conversation_id = ? AND user_id = ? ORDER BY created_at ASC',
      [req.params.conversationId, req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('GET CHAT ERROR:', err.code || "internal");
    res.status(500).json({ error: 'Failed to load chat history' });
  }
});

// POST /api/ai/translate   Body: { language, texts: [string] }  -> { texts, complete }
// Used by the first-aid guides to show steps in the person's regional language (cached after the first time).
router.post('/translate', requireAuth, async (req, res) => {
  const texts = Array.isArray(req.body.texts) ? req.body.texts.filter((t) => typeof t === 'string').slice(0, 80).map((t) => t.slice(0, 500)) : [];
  if (!texts.length) return res.status(400).json({ error: 'texts is required' });
  try {
    const { strings, complete } = await translateMany(texts, req.body.language);
    res.json({ texts: strings, complete });
  } catch (err) {
    console.error('TRANSLATE ERROR:', err.code || "internal");
    res.status(503).json({ error: 'Translation is unavailable right now.' });
  }
});

module.exports = router;
