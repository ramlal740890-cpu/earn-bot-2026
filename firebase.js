const admin = require('firebase-admin');

try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Yahan dhyan dena: replace wala part zaruri hai
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
      databaseURL: "https://earn-bot-2026-default-rtdb.firebaseio.com"
    });
  }
} catch (error) {
  console.log("Firebase Init Error:", error.message);
}

const db = admin.firestore();
module.exports = { db, admin };
