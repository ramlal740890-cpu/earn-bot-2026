const admin = require('firebase-admin');

// Vercel environment variables ko read karne ke liye
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  // Ye line private key ke format ko sahi karti hai
  private_key: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
};

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("✅ Firebase Connected Successfully");
  } catch (error) {
    console.error("❌ Firebase Init Error:", error.message);
  }
}

const db = admin.firestore();
module.exports = { db, admin };
