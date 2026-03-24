const { Telegraf } = require('telegraf');
const admin = require('firebase-admin');

// Firebase Initialization (Using Individual Variables)
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: "earn-bot-2026",
            clientEmail: "firebase-adminsdk-fbsvc@earn-bot-2026.iam.gserviceaccount.com",
            // Yahan hum replace technique use kar rahe hain taaki \n (newlines) sahi se read hon
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        })
    });
}
