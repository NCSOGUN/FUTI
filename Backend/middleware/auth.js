const jwt = require('jsonwebtoken');
const Patient = require('../models/Patient');
const User = require('../models/User');
 
const protect = async (req, res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized: bearer token required.' });
  }
  try {
    const decoded = jwt.verify(header.slice(7).trim(), process.env.JWT_SECRET);
    if (decoded.type === 'patient') {
      const patient = await Patient.findById(decoded.id);
      if (!patient) return res.status(401).json({ message: 'Patient account no longer exists.' });
      req.patient = patient;
    } else {
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return res.status(401).json({ message: 'User account no longer exists.' });
      if (user.role !== 'admin' && user.status !== 'approved') {
        return res.status(403).json({ message: 'This account is not approved for access.' });
      }
      req.user = user;
    }
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized: token is invalid or expired.' });
  }
};
 
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden: access denied.' });
  }
  return next();
};
 
module.exports = { protect, authorize };