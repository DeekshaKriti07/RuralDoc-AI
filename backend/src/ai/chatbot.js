// Chat: grounded in the offline knowledge base, aware of the person's records, can look at photos,
// and points to the matching offline first-aid guide.
const provider = require('./model/provider');
const { checkRedFlags } = require('./redFlagDetector');
const { languageDirective, emergencyMessage } = require('./languages');
const { search } = require('./knowledge/search');
const firstAid = require('./knowledge/firstaid');
const { INJURY_FIRSTAID } = require('./knowledge/clinical');
const { extract } = require('./triage/extract');
const { analyzeImages } = require('./triage/media');
const E = require('./triage/engine');

const SYSTEM = `You are RuralDoc, a kind health-information assistant for people in rural India with limited access to doctors. You are NOT a doctor.
Rules:
- Answer the question directly in short, simple sentences. Give practical, safe general information.
- Use ONLY the reference passages and the person's own facts. If the references do not cover it, say so honestly and suggest a health worker.
- Never name a medicine to take and never give a dose. Never say "you have <disease>"; say "this could be".
- If the question is about a personal symptom, explain what is common, what to watch for, and when to see a doctor or go to hospital.
- If the person's saved records matter (allergy, long-term illness, current medicines), mention it briefly.
- If a first-aid guide is listed under "Offline first-aid guides available", tell the person to open it (it has step-by-step pictures and voice).
- If a photo description is given, treat it as uncertain and say a health worker should examine it.`;

function recordsText(records, meds) {
  const r = records.slice(0, 10).map((x) => `- ${String(x.record_type).replace('_', ' ')}: ${x.title}`).join('\n');
  const m = meds.slice(0, 8).map((x) => x.medicine_name).filter(Boolean).join(', ');
  return `${r || '(no saved records)'}${m ? `\nCurrent medicines: ${m}` : ''}`;
}

async function runChat({ message, history = [], language = 'en', images = [], records = [], meds = [] }) {
  const red = checkRedFlags(message);
  const guidesFromText = firstAid.matchText(message, 3);
  if (red.isEmergency) {
    const ids = [...new Set([...guidesFromText.map((g) => g.id), 'cpr'])].filter(firstAid.isValid).slice(0, 3);
    return { reply: emergencyMessage(language), emergency: true, first_aid: ids.map((id) => firstAid.ref(id)), sources: [], media: null };
  }

  // photo
  let media = null, mediaFailed = false;
  if (images && images.length) {
    try { media = await analyzeImages(images, message); } catch (err) { console.warn('Photo analysis failed:', err.message); mediaFailed = true; }
  }

  // understand the question (also gives an English version of non-English text)
  let ext = { present: [], english: '' };
  try { ext = await extract(message); } catch { /* keyword rules only */ }
  const english = ext.english || message;

  // first-aid pointers: injuries, photo category, keywords
  const ids = new Set();
  for (const s of [...ext.present, ...(media ? media.symptoms : [])]) if (INJURY_FIRSTAID[s]) ids.add(INJURY_FIRSTAID[s]);
  for (const g of firstAid.matchText(english, 3)) ids.add(g.id);
  const first_aid = [...ids].filter(firstAid.isValid).slice(0, 3).map((id) => firstAid.ref(id));

  // grounding
  const passages = search(`${english} ${media ? media.summary : ''}`, 4);
  const context = passages.length ? passages.map((p) => `[${p.title}] ${p.content}`).join('\n\n') : '(no matching reference passage)';

  const histText = history.slice(-6).map((h) => `${h.role === 'user' ? 'Person' : 'Assistant'}: ${String(h.content).slice(0, 400)}`).join('\n');
  const prompt = `${SYSTEM}

Saved health records of this person:
${recordsText(records, meds)}

Reference passages:
${context}

Offline first-aid guides available: ${first_aid.length ? first_aid.map((g) => g.title).join('; ') : '(none)'}
${media ? `\nPhoto description (uncertain): ${media.summary} Findings: ${media.visible_findings.join('; ')}. Category: ${media.category}.` : ''}

Conversation so far:
${histText || '(first message)'}

Person's question${english !== message ? ` (original wording: "${message.slice(0, 300)}")` : ''}: "${english.slice(0, 600)}"

Return ONLY JSON: {"reply": "your answer"}${languageDirective(language)}`;

  let reply, model;
  try {
    const r = await provider.generate(prompt, { temperature: 0.3, json: true, timeoutMs: 180000 });
    const j = JSON.parse(r.text.slice(r.text.indexOf('{'), r.text.lastIndexOf('}') + 1));
    reply = typeof j.reply === 'string' ? j.reply.trim() : '';
    model = r.model;
  } catch (err) {
    console.warn('Chat model failed, answering from the offline knowledge base:', err.message);
  }
  if (!reply) {
    // fully offline fallback: show the best reference passage
    reply = passages[0] ? `${passages[0].title}: ${passages[0].content}` : 'I could not answer that right now. Please ask a health worker.';
  }
  return {
    reply, emergency: false, model, first_aid,
    sources: passages.map((p) => ({ title: p.title, source: p.source, url: p.url || null })).slice(0, 3),
    media: media ? { category: media.category, summary: media.summary, findings: media.visible_findings, quality: media.photo_quality } : (mediaFailed ? { failed: true } : null),
  };
}

module.exports = { runChat };
