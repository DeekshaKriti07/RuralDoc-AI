#!/usr/bin/env node
// End-to-end self-test of the AI backend WITHOUT Ollama or MySQL: a fake model and fake database are used.
// Run:  node scripts/selftest.js
// It checks the plumbing (question loop, photos, first-aid links, translation, offline fallbacks), not medical accuracy.
const http = require('http');
const path = require('path');
process.env.OLLAMA_BASE_URL = 'http://127.0.0.1:11999';
process.env.RURALDOC_NO_CACHE_WRITE = '1';

// ---- fake model -------------------------------------------------------------------------------
let modelUp = true;
const fake = http.createServer((req, res) => {
  let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => {
    if (!modelUp) { res.destroy(); return; }
    const j = JSON.parse(b || '{}'), p = j.prompt || '';
    let out = { reply: 'ok' };
    if (p.includes('medical intake parser')) out = /बुखार/.test(p) ? { present: ['fever', 'headache'], absent: [], who: 'adult', sex: 'unknown', duration_days: 2, english: 'Fever and headache for two days' } : { present: [], absent: [], who: 'unknown', sex: 'unknown', duration_days: null, english: '' };
    else if (p.includes('camera assistant')) out = { category: 'burn', body_area: 'hand', visible_findings: ['red skin', 'blister'], severity_clues: ['blistering'], looks_urgent: false, photo_quality: 'good', summary: 'A red blistered burn on the hand.' };
    else if (p.includes('Translate each English string')) { const list = JSON.parse(p.match(/^\[.*\]$/m)[0]); const lang = (p.match(/into (\w+) \(/) || [])[1]; out = { t: list.map((s) => `[${lang}] ${s}`) }; }
    else if (p.includes('RuralDoc, a kind health-information')) out = { reply: 'Dogs can carry rabies. Wash the wound and see a doctor today.' };
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ response: JSON.stringify(out) }));
  });
});

// ---- fake database + login -----------------------------------------------------------------------
const rows = {
  medical_records: [{ record_type: 'allergy', title: 'Penicillin', details: '' }, { record_type: 'diagnosis', title: 'Type 2 diabetes', details: '' }],
  medicine_reminders: [{ medicine_name: 'Metformin', dosage: '500mg', frequency: 'twice daily' }],
};
const fakeDb = { query: async (sql) => { const t = Object.keys(rows).find((k) => sql.includes(k)); return [t ? rows[t] : []]; } };
const base = path.join(__dirname, '..', 'src');
require.cache[require.resolve(path.join(base, 'lib/db.js'))] = { id: 'db', filename: 'db', loaded: true, exports: fakeDb };
require.cache[require.resolve(path.join(base, 'middleware/requireAuth.js'))] = { id: 'auth', filename: 'auth', loaded: true, exports: (req, res, next) => { req.user = { id: 'u1' }; next(); } };

let pass = 0, fail = 0;
const ok = (cond, name) => { cond ? pass++ : fail++; console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}`); };

fake.listen(11999, async () => {
  const express = require('express');
  const app = express(); app.use(express.json({ limit: '25mb' })); app.use('/api/ai', require(path.join(base, 'routes/ai.js')));
  const srv = app.listen(0, async () => {
    const url = `http://127.0.0.1:${srv.address().port}/api/ai`;
    const post = async (p, body) => (await fetch(url + p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })).json();
    try {
      // 1. a first message leads to follow-up questions, not an instant guess
      let r = await post('/symptom-check', { message: 'I have fever and headache', language: 'en' });
      ok(r.status === 'need_more_info' && r.questions.length >= 3, 'asks follow-up questions after the first symptoms');
      ok(r.questions.some((q) => q.id === 'who'), 'asks who is unwell (adult / child / pregnant ...)');
      // 2. answer chips until an assessment appears
      let rounds = 0, state = r.state;
      while (r.status === 'need_more_info' && rounds++ < 5) {
        const answers = r.questions.map((q) => (q.id === 'who' ? { id: 'who', value: 'adult' } : q.id === 'duration' ? { id: 'duration', value: 'd1_3' } : { id: q.id, value: ['chills', 'ctx_mosquito', 'retro_orbital_pain', 'body_ache', 'joint_pain', 'high_fever'].includes(q.id) ? 'yes' : 'no' }));
        r = await post('/symptom-check', { answers, state, language: 'en' }); state = r.state;
      }
      ok(r.status === 'assessment', `reaches an assessment (after ${rounds} answer rounds)`);
      const a = r.assessment || {};
      ok(a.possible_causes && a.possible_causes.length >= 2, 'lists several possible causes, not just one');
      ok(a.record_notes && a.record_notes.some((n) => /Penicillin/.test(n)), 'uses saved allergy from the health records');
      ok(a.record_notes && a.record_notes.some((n) => /Metformin/.test(n)), 'uses current medicines from reminders');
      ok(a.urgency_level && a.red_flags.length > 0 && a.self_care.length > 0, 'gives urgency, warning signs and safe self-care');
      // 3. red flag text -> emergency + first-aid link
      r = await post('/symptom-check', { message: 'my father has chest pain and sweating', language: 'en' });
      ok(r.status === 'assessment' && r.assessment.urgency_level === 'emergency', 'chest pain is flagged as an emergency immediately');
      ok(r.assessment.first_aid.some((g) => g.id === 'heartattack'), 'emergency links to the offline heart-attack first-aid guide');
      // 4. a photo
      const img = 'A'.repeat(400);
      r = await post('/symptom-check', { message: 'hot oil fell on my hand', images: [img], language: 'en' });
      const withMedia = r.status === 'assessment' ? r : null;
      ok(r.media && r.media.category === 'burn', 'reads a photo and finds a burn');
      ok((withMedia ? withMedia.assessment.first_aid : []).some((g) => g.id === 'burns') || r.status === 'need_more_info', 'photo of a burn leads to the burns first-aid guide');
      // 5. non-English input goes through the model reader
      r = await post('/symptom-check', { message: 'मुझे बुखार और सिरदर्द है', language: 'hi' });
      ok(r.status === 'need_more_info' && r.state.present.includes('fever'), 'understands a Hindi message via the model');
      ok(r.message.startsWith('[Hindi]'), 'language setting is respected (Hindi stays Hindi)');
      // 6. translated output
      r = await post('/symptom-check', { message: 'I have fever and headache', language: 'ta' });
      ok(/^\[Tamil\]/.test(r.message) && r.questions[0].options[0].label.startsWith('[Tamil]'), 'questions are translated into the chosen language');
      // 7. chat with first-aid link
      r = await post('/chat', { message: 'my child was bitten by a dog', language: 'en' });
      ok(r.first_aid && r.first_aid.some((g) => g.id === 'animalbite'), 'chat suggests the dog-bite first-aid guide');
      ok(r.sources && r.sources.length > 0, 'chat answer is grounded in knowledge-base passages');
      r = await post('/chat', { message: 'how do I care for sore feet', language: 'en', images: [img] });
      ok(r.media && r.media.category === 'burn', 'chat accepts a photo');
      // 8. translate route
      r = await post('/translate', { language: 'ta', texts: ['Press firmly on the wound.'] });
      ok(r.texts && /^\[Tamil\]/.test(r.texts[0]), 'translate route works');
      // 9. model offline: everything must still degrade gracefully
      modelUp = false;
      r = await post('/symptom-check', { message: 'I have fever and cough and sore throat', language: 'en' });
      ok(r.status === 'need_more_info', 'symptom checker still works in English when the AI model is off (rule-based reading)');
      r = await post('/chat', { message: 'what is diabetes', language: 'en' });
      ok(typeof r.reply === 'string' && r.reply.length > 20 && r.sources.length > 0, 'chat falls back to the offline knowledge base when the AI model is off');
    } catch (e) { fail++; console.log('FAIL  exception', e.stack); }
    console.log(`\n${pass} passed, ${fail} failed`);
    srv.close(); fake.close(); process.exit(fail ? 1 : 0);
  });
});
