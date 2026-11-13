// Fully offline keyword search (BM25) over every knowledge source. No embeddings, no internet,
// no model call needed: it answers in milliseconds and works even when Ollama is busy.
const STOP = new Set('a an and are as at be but by for from has have he her his how i if in into is it its my no not of on or our she so some that the their them then there these they this to too was we were what when which who why will with you your me am do does did can could would should may might very also just than about over after before again up out off any all each more most other such only own same'.split(' '));

function stem(w) {
  if (w.length > 5 && w.endsWith('ing')) return w.slice(0, -3);
  if (w.length > 4 && w.endsWith('ies')) return w.slice(0, -3) + 'y';
  if (w.length > 4 && w.endsWith('es')) return w.slice(0, -2);
  if (w.length > 4 && w.endsWith('ed')) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
  return w;
}
function tokens(text) {
  return String(text || '').toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 1 && !STOP.has(w)).map(stem);
}

class Index {
  constructor() { this.docs = []; this.df = new Map(); this.avg = 0; }
  build(docs) {
    this.docs = docs.map((d) => {
      const tf = new Map();
      // title and question words count 3x: a match on the topic name matters most
      for (const t of tokens(`${d.title} ${d.title} ${d.title} ${d.question || ''} ${d.question || ''}`)) tf.set(t, (tf.get(t) || 0) + 1);
      let len = 0;
      for (const t of tokens(d.content)) { tf.set(t, (tf.get(t) || 0) + 1); len++; }
      return { d, tf, len: len + 10 };
    });
    for (const x of this.docs) for (const t of x.tf.keys()) this.df.set(t, (this.df.get(t) || 0) + 1);
    this.avg = this.docs.reduce((s, x) => s + x.len, 0) / Math.max(1, this.docs.length);
    return this;
  }
  search(query, k = 4, minScore = 3) {
    const q = [...new Set(tokens(query))];
    if (!q.length || !this.docs.length) return [];
    const N = this.docs.length, k1 = 1.4, b = 0.75;
    const scored = [];
    for (const x of this.docs) {
      let s = 0;
      for (const t of q) {
        const f = x.tf.get(t);
        if (!f) continue;
        const idf = Math.log(1 + (N - this.df.get(t) + 0.5) / (this.df.get(t) + 0.5));
        s += idf * ((f * (k1 + 1)) / (f + k1 * (1 - b + (b * x.len) / this.avg)));
      }
      if (s >= minScore) scored.push({ ...x.d, score: s });
    }
    scored.sort((a, b2) => b2.score - a.score);
    // at most 2 passages per topic so one disease cannot fill all slots
    const per = new Map(), out = [];
    for (const r of scored) {
      const n = per.get(r.title) || 0;
      if (n >= 2) continue;
      per.set(r.title, n + 1);
      out.push(r);
      if (out.length >= k) break;
    }
    return out;
  }
}

let index = null;
function load() {
  if (index) return index;
  const docs = [];
  const tryLoad = (rel, tag) => {
    try { for (const d of require(rel)) docs.push({ ...d, source: d.source || tag }); }
    catch { /* file optional */ }
  };
  tryLoad('./conditions.json', 'RuralDoc reference');
  tryLoad('./medquad_kb.json', 'MedQuAD');
  try { for (const d of require('./clinical').searchDocs()) docs.push(d); } catch { /* optional */ }
  index = new Index().build(docs);
  console.log(`Knowledge search ready: ${index.docs.length} passages (offline).`);
  return index;
}

const search = (query, k, min) => load().search(query, k, min);
module.exports = { search, tokens, load };
