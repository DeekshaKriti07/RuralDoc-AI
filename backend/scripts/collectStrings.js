// Collects every English sentence the app can show (questions, condition advice, first-aid steps, labels).
const { SYMPTOMS, CONDITIONS } = require('../src/ai/knowledge/clinical');
const { LABELS, URGENCY_LINE } = require('../src/ai/triage/ui');
const guides = require('../src/ai/knowledge/firstaid.json');

module.exports = function collect() {
  const s = new Set();
  const add = (x) => { if (typeof x === 'string' && /[A-Za-z]{2,}/.test(x)) s.add(x); };
  Object.values(LABELS).forEach(add); Object.values(URGENCY_LINE).forEach(add);
  ['Who is unwell?', 'Adult', 'Child (1–12 years)', 'Baby (under 1 year)', 'Elderly (60+)', 'Pregnant woman', 'How long has this been going on?', 'Less than a day', '1–3 days', '4–7 days', 'More than a week', 'More than 2 weeks'].forEach(add);
  for (const row of Object.values(SYMPTOMS)) { add(row[0]); add(row[1]); }
  for (const c of CONDITIONS) { add(c.name); add(c.care); add(c.doc); c.red.forEach(add); }
  for (const g of guides) { add(g.title); add(g.summary); add(g.call); g.steps.forEach(([t, d]) => { add(t); add(d); }); g.donts.forEach(add); }
  return [...s];
};
