// Writes static_strings.json (used by translate_indictrans2.py).  Run: node scripts/exportStrings.js
const fs = require('fs');
const path = require('path');
const strings = require('./collectStrings')();
fs.writeFileSync(path.join(__dirname, 'static_strings.json'), JSON.stringify(strings, null, 1));
console.log(`Wrote ${strings.length} sentences to scripts/static_strings.json`);
