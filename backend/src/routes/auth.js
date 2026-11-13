const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../lib/db');

const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const cookieOptions = {httpOnly:true, secure:process.env.NODE_ENV === 'production', sameSite:'strict', path:'/api', maxAge:8*60*60*1000};
function session(res,id) { const token=jwt.sign({userId:id},process.env.JWT_SECRET,{expiresIn:'8h',algorithm:'HS256',issuer:'ruraldoc',audience:'ruraldoc-web'});res.cookie('rd_session',token,cookieOptions); }
router.get('/me',requireAuth,async(req,res)=>{try {const [rows]=await db.query('SELECT id,name,email FROM users WHERE id = ?',[req.user.id]);if(!rows.length)return res.status(401).json({error:'Session unavailable'});res.json({user:rows[0]});} catch {res.status(503).json({error:'Account service unavailable'});} });
router.post('/logout',(req,res)=>{res.clearCookie('rd_session',{httpOnly:true,secure:process.env.NODE_ENV === 'production',sameSite:'strict',path:'/api'});res.json({ok:true});});
router.use((req,res,next)=>{
 const {email,password,name}=req.body || {};
 if(typeof email !== 'string' || email.length>255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || typeof password !== 'string' || Buffer.byteLength(password)>72 || (name != null && (typeof name !== 'string' || name.length>120)))return res.status(400).json({error:'Enter a valid email, name and password (maximum 72 bytes)'});
 next();
});

router.post('/signup', async (req, res) => {
  try {
    const { name, password } = req.body || {};
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }
    if (typeof password !== 'string' || password.length < 10 || password.length > 128) return res.status(400).json({ error: 'Password must be 10 to 128 characters' });

    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const id = uuidv4();

    await db.query(
      'INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)',
      [id, name || null, email, passwordHash]
    );

    session(res, id);
    res.status(201).json({ user: { id, name, email } });
  } catch (err) {
    console.error('SIGNUP ERROR:', err.code);
    res.status(500).json({ error: 'Something went wrong during signup' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const password = req.body?.password;
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    session(res, user.id);
    res.json({ user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('LOGIN ERROR:', err.code);
    res.status(500).json({ error: 'Something went wrong during login' });
  }
});

module.exports = router;