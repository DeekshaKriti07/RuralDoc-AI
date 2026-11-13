const fs = require('fs');
const path = require('path');

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const EMBEDDINGS_PATH = path.join(__dirname, 'embeddings.json');

let knowledgeBase = [];
try {
  knowledgeBase = JSON.parse(fs.readFileSync(EMBEDDINGS_PATH, 'utf8'));
} catch (err) {
  console.warn('WARNING: knowledge base embeddings not found. Run buildEmbeddings.js first. RAG will return no results until then.');
}

function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function embedQuery(text) {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'nomic-embed-text', prompt: text }),
  });
  if (!response.ok) throw new Error(`Query embedding failed: ${response.status}`);
  const data = await response.json();
  return data.embedding;
}

// Returns top-k relevant knowledge base entries for a given query,
// filtered by a minimum similarity threshold so irrelevant content
// is never injected as if it were relevant.
async function retrieve(query, topK = 3, minSimilarity = 0.5) {
  if (knowledgeBase.length === 0) return [];

  const queryEmbedding = await embedQuery(query);

  const scored = knowledgeBase.map((doc) => ({
    ...doc,
    similarity: cosineSimilarity(queryEmbedding, doc.embedding),
  }));

  return scored
    .filter((d) => d.similarity >= minSimilarity)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK)
    .map(({ embedding, ...rest }) => rest); // strip embedding vector before returning
}

module.exports = { retrieve };