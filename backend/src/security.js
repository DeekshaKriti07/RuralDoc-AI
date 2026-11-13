const { randomUUID } = require('crypto');
const buckets = new Map();
setInterval(() => { for (const [key,b] of buckets) if (b.until < Date.now()) buckets.delete(key); }, 60000).unref();
function limit(name, max, windowMs) {
  return (req,res,next) => {
    if (buckets.size > 10000) return res.status(503).json({error:'Server busy'});
    const key = name + ':' + req.ip;
    let b = buckets.get(key);
    if (!b || b.until < Date.now()) { b = { n:0, until:Date.now()+windowMs }; buckets.set(key,b); }
    if (++b.n > max) { res.set('Retry-After', String(Math.ceil((b.until-Date.now())/1000))); return res.status(429).json({error:'Too many requests. Please try again later.'}); }
    next();
  };
}
function audit(req,res,next) {
  req.requestId = randomUUID(); res.set('X-Request-ID', req.requestId);
  const started = Date.now();
  res.on('finish', () => console.log(JSON.stringify({event:'http', requestId:req.requestId, method:req.method, route:req.route?.path || req.path.replace(/[0-9a-f-]{36}/gi, ':id'), status:res.statusCode, userId:req.user?.id, durationMs:Date.now()-started})));
  next();
}
module.exports = {limit,audit};
