const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verifies JWT token and attaches user + tenantId to every request
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).populate('tenantId', 'name slug plan isActive');

    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Account has been deactivated' });
    }

    if (!user.tenantId.isActive) {
      return res.status(403).json({ message: 'Organization account is suspended' });
    }

    // Attach to request — controllers use req.user and req.tenantId
    req.user = user;
    req.tenantId = user.tenantId._id;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired, please login again' });
    }
    next(error);
  }
};

// Role-based access control
// Usage: authorize('owner', 'admin')
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Role '${req.user.role}' is not allowed to perform this action`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };