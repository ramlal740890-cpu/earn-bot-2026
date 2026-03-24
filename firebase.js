const admin = require('firebase-admin');

if (!admin.apps.length) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log("✅ Firebase Connected");
    } catch (error) {
        console.error("❌ Firebase Init Error:", error.message);
    }
}

const db = admin.firestore();
module.exports = { db, admin };
