const fs = require('fs');
const path = require('path');

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const conditions = require('./conditions.json');

async function embed(text) {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'nomic-embed-text', prompt: text }),
  });
  if (!response.ok) throw new Error(`Embedding failed: ${response.status}`);
  const data = await response.json();
  return data.embedding;
}

async function main() {
  console.log(`Embedding ${conditions.length} knowledge base entries...`);
  const results = [];

  for (const doc of conditions) {
    console.log(`- ${doc.title}`);
    const embedding = await embed(`${doc.title}\n${doc.content}`);
    results.push({ ...doc, embedding });
  }

  const outPath = path.join(__dirname, 'embeddings.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`Done. Saved to ${outPath}`);
}

main().catch((err) => {
  console.error('FAILED:', err.message);
  process.exit(1);
});