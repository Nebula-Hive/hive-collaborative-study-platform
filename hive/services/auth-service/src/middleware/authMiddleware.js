const admin = require('../config/firebaseConfig');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const idToken = authHeader.split('Bearer ')[1].trim();

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    const role = decoded.role || (decoded.customClaims && decoded.customClaims.role) || 'student';

    req.user = {
      uid: decoded.uid,
      email: decoded.email || null,
      role,
    };

    next();
  } catch (err) {
    console.error('Firebase token verification failed', err);
    return res.status(403).json({ message: 'Invalid token' });
  }
};

module.exports = authMiddleware;
