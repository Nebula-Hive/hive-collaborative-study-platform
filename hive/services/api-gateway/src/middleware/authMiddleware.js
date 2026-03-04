const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized (expects env vars)
// NOTE: In production, use service account JSON or environment variables securely.
if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
  });
}

// Public routes that skip JWT verification
const PUBLIC_ROUTES = [
  { method: 'GET',  path: '/health' },
  { method: 'GET',  path: '/' },
  { method: 'POST', path: '/auth/login' },
  { method: 'POST', path: '/auth/register' },
];

const isPublicRoute = (method, path) =>
  PUBLIC_ROUTES.some(
    (r) => r.method === method && path.startsWith(r.path)
  );

const authMiddleware = async (req, res, next) => {
  // Skip auth for public routes
  if (isPublicRoute(req.method, req.path)) {
    return next();
  }

  const authHeader = req.headers.authorization;

  // No token at all → 401 Unauthorized
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: no token provided' });
  }

  const idToken = authHeader.split('Bearer ')[1].trim();

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);

    // Attach normalized user object to request
    req.user = {
      uid:   decoded.uid,
      email: decoded.email || null,
      role:  decoded.role || (decoded.customClaims && decoded.customClaims.role) || 'student',
    };

    next();
  } catch (err) {
    console.error('[AuthMiddleware] Token verification failed:', err.message);
    // Bad / expired token → 403 Forbidden
    return res.status(403).json({ message: 'Forbidden: invalid or expired token' });
  }
};

module.exports = authMiddleware;
