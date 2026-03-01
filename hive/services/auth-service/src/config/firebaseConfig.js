const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config();

const {
  FIREBASE_PROJECT_ID,
  FIREBASE_PRIVATE_KEY,
  FIREBASE_CLIENT_EMAIL,
} = process.env;

// Initialize Firebase Admin SDK using environment variables.
if (!admin.apps.length) {
  if (!FIREBASE_PROJECT_ID || !FIREBASE_PRIVATE_KEY || !FIREBASE_CLIENT_EMAIL) {
    console.warn('Firebase environment variables are not fully configured.');
  }

  const privateKey = FIREBASE_PRIVATE_KEY
    ? FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
  });
}

module.exports = admin;
