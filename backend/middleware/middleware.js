const jwt = require('jsonwebtoken');

// Authentication middleware
const auth = (req, res, next) => {
  try {
    let token = req.header('x-auth-token');
    const authHeader = req.header('Authorization');

    if (!token && authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7, authHeader.length);
    }

    if (!token) {
      console.log('Auth middleware: No token provided.');
      return res.status(401).json({ msg: 'No token, authorization denied.' });
    }

    console.log('Auth middleware: Token received.');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Auth middleware: Decoded token:', decoded);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ msg: 'Token is not valid.' });
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
