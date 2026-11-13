#!/usr/bin/env node
// Converts the MedQuAD dataset (XML) into one compact JSON knowledge base for offline search.
// Usage:  node scripts/importMedQuAD.js /path/to/MedQuAD-master
//
// Only collections that (a) contain answers and (b) suit primary care are imported.
// Skipped on purpose:
//   10_MPlus_ADAM_QA, 11_MPlusDrugs_QA, 12_MPlusHerbsSupplements_QA -> answers were removed by the dataset authors (copyright)
//   2_GARD_QA (rare diseases), 3_GHR_QA (genetics)                  -> would drown out common-symptom results
//   1_CancerGov_QA                                                  -> specialist oncology, low value for first-line triage
const fs = require('fs');
const path = require('path');

const root = process.argv[2];
if (!root || !fs.existsSync(root)) {
  console.error('Usage: node scripts/importMedQuAD.js /path/to/MedQuAD-master');
  process.exit(1);
}

const COLLECTIONS = {
  '4_MPlus_Health_Topics_QA': 'MedlinePlus Health Topics',
  '5_NIDDK_QA': 'NIDDK (diabetes, digestive, kidney)',
  '6_NINDS_QA': 'NINDS (brain and nerves)',
  '7_SeniorHealth_QA': 'NIH Senior Health',
  '8_NHLBI_QA_XML': 'NHLBI (heart, lung, blood)',
  '9_CDC_QA': 'CDC',
};
const KEEP_TYPES = new Set(['information', 'symptoms', 'causes', 'treatment', 'prevention', 'considerations', 'exams and tests', 'complications', 'outlook', 'stages', 'frequency', 'susceptibility']);
const MAX_CHARS = 1100;

const decode = (s) => s
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&amp;/g, '&');
const clean = (s) => decode(s).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(dir, e.name)) : e.name.endsWith('.xml') ? [path.join(dir, e.name)] : []);
}

const out = [];
for (const [folder, label] of Object.entries(COLLECTIONS)) {
  const dir = path.join(root, folder);
  if (!fs.existsSync(dir)) { console.warn('missing folder', folder); continue; }
  let n = 0;
  for (const file of walk(dir)) {
    const xml = fs.readFileSync(file, 'utf8');
    const url = (xml.match(/<Document[^>]*\burl="([^"]*)"/) || [])[1] || '';
    const focus = clean((xml.match(/<Focus>([\s\S]*?)<\/Focus>/) || [])[1] || '');
    if (!focus) continue;
    for (const m of xml.matchAll(/<QAPair[^>]*>([\s\S]*?)<\/QAPair>/g)) {
      const qm = m[1].match(/<Question[^>]*qtype="([^"]*)"[^>]*>([\s\S]*?)<\/Question>/);
      const am = m[1].match(/<Answer>([\s\S]*?)<\/Answer>/);
      if (!qm || !am) continue;
      const qtype = qm[1].toLowerCase();
      let answer = clean(am[1]).replace(/^Summary\s*:\s*/i, '');
      if (!answer || answer.length < 60 || !KEEP_TYPES.has(qtype)) continue;
      if (answer.length > MAX_CHARS) answer = answer.slice(0, MAX_CHARS).replace(/\s+\S*$/, '') + '…';
      out.push({ id: `mq${out.length}`, title: focus, topic: qtype, source: `MedQuAD / ${label}`, url, question: clean(qm[2]), content: answer });
      n++;
    }
  }
  console.log(`${label}: ${n} Q&A kept`);
}

const dest = path.join(__dirname, '..', 'src', 'ai', 'knowledge', 'medquad_kb.json');
fs.writeFileSync(dest, JSON.stringify(out));
console.log(`\nWrote ${out.length} entries (${(fs.statSync(dest).size / 1e6).toFixed(1)} MB) to ${dest}`);
