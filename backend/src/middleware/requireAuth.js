const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const cookie = (req.headers.cookie || '').split(';').map(s=>s.trim()).find(s=>s.startsWith('rd_session='));
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : cookie?.slice(11);

  if (!token) {
    return res.status(401).json({ error: 'Missing authentication token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {algorithms:['HS256'],issuer:'ruraldoc',audience:'ruraldoc-web'});
    req.user = { id: decoded.userId };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
}

module.exports = requireAuth;