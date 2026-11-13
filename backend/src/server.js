require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const {limit,audit} = require('./security');
const secret = process.env.JWT_SECRET || '';
if (secret.length < 32 || /replace|change-me/i.test(secret)) throw new Error('Set JWT_SECRET to a random secret of at least 32 characters');
const origins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map(s=>s.trim());
const app = express();
app.disable('x-powered-by');
if (process.env.TRUST_PROXY === '1') app.set('trust proxy', 1);
app.use(audit);
app.use((req,res,next) => {
  res.set({'X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'strict-origin-when-cross-origin','Permissions-Policy':'camera=(self), microphone=(self), geolocation=(self)', 'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.tile.openstreetmap.org; connect-src 'self' https://*.tile.openstreetmap.org; media-src 'self' blob:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'"});
  if (process.env.NODE_ENV === 'production') res.set('Strict-Transport-Security','max-age=31536000');
  if (req.path.startsWith('/api')) res.set('Cache-Control','no-store');
  if (req.headers.origin && !origins.includes(req.headers.origin)) return res.status(403).json({error:'Origin not allowed'});
  if (!['GET','HEAD','OPTIONS'].includes(req.method) && !req.headers.authorization && !origins.includes(req.headers.origin)) return res.status(403).json({error:'A trusted Origin header is required'});
  next();
});
app.use(cors({origin:origins,credentials:true}));
app.use('/api', limit('api',180,60000));
app.use('/api/auth', limit('auth',15,15*60000));
app.use('/api/ai', limit('ai',20,60000));
app.use(express.json({limit:'8mb'}));
app.use('/api/auth',require('./routes/auth'));
app.use('/api/ai',require('./routes/ai'));
app.use('/api/records',require('./routes/records'));
app.use('/api/reminders',require('./routes/reminders'));
app.use('/api/hospitals',require('./routes/hospitals'));
app.get('/api/status',(req,res)=>res.json({status:'ok'}));
app.get('/api/ready',async(req,res)=>{try {await require('./lib/db').query('SELECT 1');res.json({status:'ready'});} catch {res.status(503).json({status:'unavailable'});} });
app.use('/api',(req,res)=>res.status(404).json({error:'API endpoint not found'}));
app.use(express.static(path.join(__dirname,'../../frontend/dist'),{index:false}));
app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'../../frontend/dist/index.html')));
app.use((err,req,res,next)=>{console.error(JSON.stringify({event:'error',requestId:req.requestId,code:err.code || err.type || 'internal'}));res.status(err.status === 413 ? 413 : err instanceof SyntaxError ? 400 : 500).json({error:err.status === 413 ? 'Request too large' : err instanceof SyntaxError ? 'Invalid JSON' : 'Request failed',requestId:req.requestId});});
try { require('./ai/knowledge/search').load(); } catch { console.warn('Knowledge base unavailable'); }
if (require.main === module) {
 const server=app.listen(process.env.PORT || 4000,'0.0.0.0');
 const shutdown=()=>{server.close(()=>require('./lib/db').end().then(()=>process.exit(0)));setTimeout(()=>process.exit(1),10000).unref();};
 process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
}
module.exports=app;
