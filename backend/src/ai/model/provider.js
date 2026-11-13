const BASE = 'https://api.groq.com/openai/v1';
const MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';
const VISION = process.env.GROQ_VISION_MODEL || '';
class AIModelProvider {
  async generate(prompt, options = {}) {
    const images = options.images || [];
    if (images.length && !VISION) throw new Error('Image analysis is not configured. Use text input.');
    const model = images.length ? VISION : MODEL;
    const content = images.length ? [
      {type:'text',text:prompt},
      ...images.map(img => ({type:'image_url',image_url:{url:`data:image/jpeg;base64,${img}`}}))
    ] : prompt;
    const response = await fetch(`${BASE}/chat/completions`, {
      method:'POST',
      headers:{'Authorization':`Bearer ${process.env.GROQ_API_KEY}`,'Content-Type':'application/json'},
      body:JSON.stringify({model,messages:[{role:'user',content}],temperature:options.temperature ?? 0.3,max_completion_tokens:Number(process.env.AI_NUM_PREDICT || 384),...(options.json ? {response_format:{type:'json_object'}} : {})}),
      signal:AbortSignal.timeout(Math.min(options.timeoutMs || 90000,90000))
    });
    if (!response.ok) throw new Error(`Groq API failed: ${response.status}`);
    const data = await response.json();
    return {text:data.choices?.[0]?.message?.content || '',model};
  }
  async healthCheck() {
    return {available:!!process.env.GROQ_API_KEY,model:process.env.GROQ_API_KEY?MODEL:null,vision_model:VISION || null,runtime:'groq',note:'Key configured; not a live inference test'};
  }
}
module.exports = new AIModelProvider();
