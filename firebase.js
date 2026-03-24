const admin = require('firebase-admin');

if (!admin.apps.length) {
  try {
    // Vercel se JSON uthana
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("✅ Firebase connected!");
  } catch (error) {
    console.error("❌ Firebase init error:", error.message);
  }
}

const db = admin.firestore();
module.exports = { db, admin };
