// Lookup of first-aid guides (titles + keywords) so the AI can point people to the right offline guide.
const guides = require('./firstaid.json');
const byId = Object.fromEntries(guides.map((g) => [g.id, g]));

const ref = (id, why) => (byId[id] ? { id, title: byId[id].title, emergency: byId[id].cat === 'emergency', why: why || byId[id].summary } : null);

// Match guide keywords in plain English text.
function matchText(text, max = 3) {
  const t = ` ${String(text || '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ')} `;
  const hits = [];
  for (const g of guides) {
    let best = 0;
    for (const k of g.kw) {
      const words = k.split(' ').filter((w) => !['by', 'a', 'of', 'in', 'on'].includes(w));
      // every word of the keyword must appear (any order), so "bitten by a dog" matches "bitten by dog"
      if (words.length && words.every((w) => t.includes(` ${w} `))) best = Math.max(best, words.length);
    }
    if (best) hits.push([g.id, best]);
  }
  return hits.sort((a, b) => b[1] - a[1]).slice(0, max).map(([id]) => ref(id));
}

const isValid = (id) => !!byId[id];
module.exports = { guides, byId, ref, matchText, isValid };
