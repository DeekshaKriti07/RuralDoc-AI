// Offline translation helper. All medical content is written once in English; this turns it into the user's language.
// Order of preference: (1) translations.json cache (pre-built by scripts/pretranslate.js or scripts/translate_indictrans2.py),
// (2) the local Ollama model, (3) the original English text. Results are cached on disk so each string is translated only once.
const fs = require('fs');
const path = require('path');
const provider = require('./model/provider');
const { LANGS, normalizeLang } = require('./languages');

const FILE = path.join(__dirname, 'knowledge', 'translations.json');
let cache = {};
try { cache = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { cache = {}; }
let saveTimer = null;
function scheduleSave() {
  if (process.env.RURALDOC_NO_CACHE_WRITE) return; // used by the self-test so fake translations are never saved
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { fs.writeFile(FILE, JSON.stringify(cache), () => {}); }, 1500);
}

const needsWork = (s) => typeof s === 'string' && /[A-Za-z]{2,}/.test(s);

async function translateChunk(strings, code) {
  const l = LANGS[code];
  const prompt = `Translate each English string in the JSON list into ${l.name} (${l.script}). This is health and first-aid advice for villagers, so use simple, everyday words and a calm tone.
Keep numbers, units (cm, °C, minutes), the emergency numbers 112 and 108, and medicine or brand names unchanged. Do not add explanations.

${JSON.stringify(strings)}

Return ONLY JSON: {"t": [list of ${strings.length} translated strings in the same order]}`;
  const r = await provider.generate(prompt, { temperature: 0.1, json: true, timeoutMs: 240000 });
  const j = JSON.parse(r.text.slice(r.text.indexOf('{'), r.text.lastIndexOf('}') + 1));
  if (!Array.isArray(j.t) || j.t.length !== strings.length) throw new Error('translation length mismatch');
  return j.t.map((x) => (typeof x === 'string' ? x.trim() : ''));
}

// Returns { strings: [...same length...], complete: boolean }
async function translateMany(strings, language) {
  const code = normalizeLang(language);
  if (code === 'en') return { strings: strings.slice(), complete: true };
  cache[code] = cache[code] || {};
  const missing = [...new Set(strings.filter((s) => needsWork(s) && !cache[code][s]))];
  for (let i = 0; i < missing.length; i += 14) {
    const part = missing.slice(i, i + 14);
    try {
      const out = await translateChunk(part, code);
      part.forEach((s, k) => { if (out[k]) cache[code][s] = out[k]; });
      scheduleSave();
    } catch (err) {
      console.warn(`Translation to ${code} failed for ${part.length} strings:`, err.message);
    }
  }
  let complete = true;
  const out = strings.map((s) => {
    if (!needsWork(s)) return s;
    const t = cache[code][s];
    if (!t) complete = false;
    return t || s;
  });
  return { strings: out, complete };
}

const hasLang = (language) => !!cache[normalizeLang(language)];
module.exports = { translateMany, hasLang, _cache: () => cache };
