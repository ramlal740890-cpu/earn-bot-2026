const admin = require('firebase-admin');

// Vercel ke Environment Variables se Firebase key uthana
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    
    console.log("✅ Firebase Connected Successfully!");
  } catch (error) {
    console.error("❌ Firebase Connection Error:", error);
  }
}

const db = admin.firestore();

module.exports = { db, admin };

