const jwt = require('jsonwebtoken');

// Authentication middleware
const auth = (req, res, next) => {
  // Accept either Authorization: Bearer <token> or x-auth-token header
  let token = null;
  const authHeader = req.header('authorization') || req.header('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  }
  if (!token) {
    token = req.header('x-auth-token');
  }

  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

// Authorization middleware (RBAC)
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ msg: 'Forbidden: Insufficient permissions' });
    }
    next();
  };
};

module.exports = { auth, authorize };
