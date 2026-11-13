#!/usr/bin/env node
// Pre-translates all app text into the 9 regional languages with your local Ollama model, so nothing waits at run time.
// Run once (it can take a while, leave it overnight):   node scripts/pretranslate.js [hi ta te ...]
// Results are saved to src/ai/knowledge/translations.json. Already-translated sentences are skipped, so it is safe to re-run.
// For higher quality use scripts/translate_indictrans2.py instead (it writes the same file).
require('dotenv').config();
const collect = require('./collectStrings');
const { translateMany } = require('../src/ai/translate');

(async () => {
  const langs = process.argv.slice(2).length ? process.argv.slice(2) : ['hi', 'ta', 'te', 'kn', 'ml', 'bn', 'mr', 'gu', 'pa'];
  const strings = collect();
  console.log(`${strings.length} sentences x ${langs.length} languages`);
  for (const l of langs) {
    const t0 = Date.now();
    const { complete } = await translateMany(strings, l);
    console.log(`${l}: ${complete ? 'done' : 'some sentences failed (run again)'} in ${Math.round((Date.now() - t0) / 1000)}s`);
  }
  setTimeout(() => process.exit(0), 2500); // let the cache file finish writing
})();
