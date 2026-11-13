// Turns the person's own words (any language, including Tanglish / Hinglish) into symptom codes.
// Two layers: fast keyword rules (work even if the AI model is down) + the language model for other languages.
const { SYMPTOMS } = require('../knowledge/clinical');
const provider = require('../model/provider');

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const PATTERNS = Object.entries(SYMPTOMS).map(([id, row]) => ({
  id, re: new RegExp(`\\b(?:${row.slice(2).sort((a, b) => b.length - a.length).map(escapeRe).join('|')})\\b`, 'gi'),
}));
const NEG = /\b(no|not|without|never|nil|denies|deny|nahi|illa|illai)\s+(?:\w+\s+){0,2}$|\b(?:don'?t|doesn'?t|didn'?t|haven'?t|hasn'?t)\s+(?:\w+\s+){0,3}$/i;

function keywordExtract(text) {
  const t = String(text || '');
  const present = new Set(), absent = new Set();
  for (const { id, re } of PATTERNS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(t))) {
      const before = t.slice(Math.max(0, m.index - 28), m.index);
      if (NEG.test(before)) absent.add(id); else present.add(id);
    }
  }
  for (const id of present) absent.delete(id);
  if (present.has('high_fever')) present.add('fever');
  if (present.has('inj_bleeding')) present.add('inj_wound');
  return { present: [...present], absent: [...absent] };
}

function factsFromText(text) {
  const t = String(text || '').toLowerCase();
  const out = {};
  if (/\bpregnan/.test(t)) out.who = 'pregnant';
  else if (/\b(baby|infant|newborn|toddler)\b|\b\d{1,2}\s*(month|months|mo)\s*old\b/.test(t)) out.who = 'infant';
  else if (/\b(grand(father|mother|pa|ma)|elderly|old (man|woman|lady))\b|\b([6-9]\d)\s*(year|years|yr|yrs)?\s*old\b/.test(t)) out.who = 'elderly';
  else if (/\b(child|kid|son|daughter|boy|girl)\b|\b([1-9]|1[0-2])\s*(year|years|yr|yrs)\s*old\b/.test(t)) out.who = 'child';
  const d = t.match(/(\d+(?:\.\d+)?)\s*(hour|hours|hr|hrs|day|days|week|weeks|month|months)\b/);
  if (d) { const n = +d[1], u = d[2]; out.duration_days = /hour|hr/.test(u) ? n / 24 : /week/.test(u) ? n * 7 : /month/.test(u) ? n * 30 : n; }
  else if (/\byesterday\b/.test(t)) out.duration_days = 1;
  else if (/\b(this morning|since morning|today|just now)\b/.test(t)) out.duration_days = 0.5;
  if (/\b(female|woman|lady|girl|wife|mother|daughter)\b/.test(t)) out.sex = 'female';
  else if (/\b(male|\bman\b|boy|husband|father|son)\b/.test(t)) out.sex = 'male';
  return out;
}

const VOCAB = Object.keys(SYMPTOMS).map((id) => `${id} = ${SYMPTOMS[id][0]}`).join('\n');
const HINTS = `Word hints (spoken words written in English letters):
Hindi: bukhar=fever, sar dard=headache, pet dard=stomach pain, khansi=cough, ulti=vomiting, dast/patle dast=loose motions, seene mein dard=chest pain, saans phoolna=breathlessness, kamzori=weakness, chakkar=dizziness, jalan=burning.
Tamil: kaichal/jvaram=fever, thalai vali=headache, vayiru vali=stomach pain, irumal=cough, vaanthi=vomiting, vayiru pokku=loose motions, nenju vali=chest pain, moochu thinaral=breathlessness, sorvu=tiredness, thalai suthal=dizziness.
Telugu: jwaram=fever, tala noppi=headache, kadupu noppi=stomach pain, dagu=cough, vaanthulu=vomiting, virechanalu=loose motions.
Kannada: jwara=fever, tale novu=headache, hotte novu=stomach pain, kemmu=cough, vaanti=vomiting.
Malayalam: pani=fever, thalavedana=headache, vayaru vedana=stomach pain, chuma=cough, charddi=vomiting.
Bengali: jwar=fever, matha byatha=headache, pet byatha=stomach pain, kashi=cough, bomi=vomiting.`;

async function llmExtract(text) {
  const prompt = `You are a medical intake parser for a rural health app. Read the person's message (it may be in English, Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali, Marathi, Gujarati, Punjabi, or a mix) and map it to the codes below.

CODES (code = meaning):
${VOCAB}

${HINTS}

Rules:
- "present" = codes the message clearly says are happening. "absent" = codes the person clearly says are NOT happening (for example "no fever").
- Only use codes from the list. Never guess a symptom that is not mentioned.
- "who": adult, child (1-12 years), infant (under 1 year), elderly (60+), pregnant, or unknown. "sex": male, female or unknown.
- "duration_days": number of days the problem has lasted, or null.
- "english": one short English sentence that summarises the problem.

Message:
"""${String(text).slice(0, 1200)}"""

Return ONLY JSON: {"present":[],"absent":[],"who":"unknown","sex":"unknown","duration_days":null,"english":""}`;
  const r = await provider.generate(prompt, { temperature: 0.1, json: true, timeoutMs: 90000 });
  const j = JSON.parse(r.text.slice(r.text.indexOf('{'), r.text.lastIndexOf('}') + 1));
  const ok = (a) => (Array.isArray(a) ? a.filter((x) => typeof x === 'string' && SYMPTOMS[x]) : []);
  return {
    present: ok(j.present), absent: ok(j.absent),
    who: ['adult', 'child', 'infant', 'elderly', 'pregnant'].includes(j.who) ? j.who : 'unknown',
    sex: ['male', 'female'].includes(j.sex) ? j.sex : 'unknown',
    duration_days: Number.isFinite(+j.duration_days) && j.duration_days !== null ? +j.duration_days : null,
    english: typeof j.english === 'string' ? j.english.trim() : '',
  };
}

// Returns { present, absent, who, sex, duration_days, english, usedModel }
async function extract(text, { useModel = true } = {}) {
  const kw = keywordExtract(text);
  const facts = factsFromText(text);
  let llm = null;
  const asciiOnly = /^[\x00-\x7F]*$/.test(String(text));
  // Plain English with clear keyword hits does not need a model call (faster, works offline without Ollama).
  if (useModel && (!asciiOnly || kw.present.length === 0)) {
    try { llm = await llmExtract(text); } catch (err) { console.warn('Model extraction failed, using keyword rules:', err.message); }
  }
  const present = new Set([...kw.present, ...(llm ? llm.present : [])]);
  const absent = new Set([...kw.absent, ...(llm ? llm.absent : [])]);
  for (const id of present) absent.delete(id);
  return {
    present: [...present], absent: [...absent],
    who: facts.who || (llm && llm.who) || 'unknown', sex: facts.sex || (llm && llm.sex) || 'unknown',
    duration_days: facts.duration_days ?? (llm ? llm.duration_days : null),
    english: (llm && llm.english) || (asciiOnly ? String(text).slice(0, 200) : ''),
    usedModel: !!llm,
  };
}

module.exports = { extract, keywordExtract, factsFromText };
