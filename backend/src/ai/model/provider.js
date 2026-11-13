const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const MODEL_NAME = process.env.AI_MODEL_NAME || 'gemma3:4b';
// Vision uses the same model by default. Gemma 3 (4B and larger) can read images.
// Set AI_VISION_MODEL_NAME to use a different one (for example "llava" or "qwen2.5vl").
const VISION_MODEL = process.env.AI_VISION_MODEL_NAME || MODEL_NAME;

class AIModelProvider {
  // options: { temperature, json (force valid JSON), images (array of base64 strings), model, timeoutMs }
  async generate(prompt, options = {}) {
    const model = options.images && options.images.length ? options.model || VISION_MODEL : options.model || MODEL_NAME;
    const body = {
      model,
      prompt,
      stream: false,
      options: { temperature: options.temperature ?? 0.3, num_ctx: options.num_ctx || Number(process.env.AI_NUM_CTX || 4096), num_predict: Number(process.env.AI_NUM_PREDICT || 384) },
    };
    if (options.json) body.format = 'json';
    if (options.images && options.images.length) body.images = options.images;
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(Math.min(options.timeoutMs || 90000, 90000)),
    });
    if (!response.ok) throw new Error(`Ollama generate failed: ${response.status}`);
    const data = await response.json();
    return { text: data.response, model };
  }

  async healthCheck() {
    try {
      const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, { signal: AbortSignal.timeout(2000) });
      if (!response.ok) return { available: false, model: null, runtime: null };
      const data = await response.json();
      const installed = (data.models || []).some((m) => m.name.startsWith(MODEL_NAME.split(':')[0]));
      return { available: installed, model: installed ? MODEL_NAME : null, vision_model: VISION_MODEL, runtime: 'ollama' };
    } catch {
      return { available: false, model: null, runtime: null };
    }
  }
}

module.exports = new AIModelProvider();
