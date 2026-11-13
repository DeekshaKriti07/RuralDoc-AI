// Photo / video-frame analysis using a vision-capable local model (no internet needed).
// The model is asked to DESCRIBE what is visible. It does not diagnose; the findings feed the same safe triage engine.
const provider = require('../model/provider');

const MAX_IMAGES = 4;
const MAX_B64 = 6 * 1024 * 1024; // per image, after the browser has already shrunk it

const CATEGORY_TO_SYMPTOMS = {
  burn: ['inj_burn'], cut_wound: ['inj_wound'], heavy_bleeding: ['inj_wound', 'inj_bleeding'], rash: ['rash'], hives: ['hives', 'itching'],
  skin_infection: ['skin_infection_signs', 'skin_pus'], swelling_or_bruise: ['injury_pain', 'joint_swelling'], deformity: ['deformity', 'inj_fracture'],
  bite_or_sting: ['inj_sting'], eye_problem: ['red_eye'], jaundice: ['jaundice'], other: [],
};
const CATEGORIES = Object.keys(CATEGORY_TO_SYMPTOMS);

function cleanImages(images) {
  if (!Array.isArray(images)) return [];
  return images.slice(0, MAX_IMAGES)
    .map((s) => (typeof s === 'string' ? s.replace(/^data:image\/\w+;base64,/, '') : ''))
    .filter((s) => s.length > 100 && s.length <= MAX_B64 && /^[A-Za-z0-9+/=\s]+$/.test(s.slice(0, 200)));
}

async function analyzeImages(rawImages, userText = '') {
  const images = cleanImages(rawImages);
  if (!images.length) return null;
  const prompt = `You are the camera assistant of a first-aid and health app. Look carefully at the photo(s). Describe ONLY what you can actually see. Do not diagnose and do not name a disease as a fact.
${userText ? `The person also wrote: "${String(userText).slice(0, 300)}"\n` : ''}
Return ONLY JSON:
{
  "category": one of ${JSON.stringify(CATEGORIES)},
  "body_area": "e.g. hand, foot, face, leg, skin, eye, unknown",
  "visible_findings": ["short plain observations, max 5"],
  "severity_clues": ["things that suggest it is serious (large area, deep, pus, blistering, active heavy bleeding, bone visible, black or white skin, spreading redness)"],
  "looks_urgent": true or false,
  "photo_quality": "good" or "poor",
  "summary": "one plain English sentence describing what is visible"
}
If the photo is blurry, too dark, or does not show a health problem, set category "other" and photo_quality "poor".`;

  const r = await provider.generate(prompt, { images, temperature: 0.1, json: true, timeoutMs: 240000 });
  const j = JSON.parse(r.text.slice(r.text.indexOf('{'), r.text.lastIndexOf('}') + 1));
  const category = CATEGORIES.includes(j.category) ? j.category : 'other';
  const arr = (a) => (Array.isArray(a) ? a.map((x) => String(x).slice(0, 140)).slice(0, 5) : []);
  return {
    category, body_area: String(j.body_area || 'unknown').slice(0, 40), visible_findings: arr(j.visible_findings),
    severity_clues: arr(j.severity_clues), looks_urgent: j.looks_urgent === true, photo_quality: j.photo_quality === 'poor' ? 'poor' : 'good',
    summary: String(j.summary || '').slice(0, 240), symptoms: CATEGORY_TO_SYMPTOMS[category],
  };
}

module.exports = { analyzeImages, cleanImages };
