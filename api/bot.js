const { Telegraf, Markup } = require('telegraf');
const admin = require('firebase-admin');

// 1. FIREBASE INITIALIZATION
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: "earn-bot-2026",
            clientEmail: "firebase-adminsdk-fbsvc@earn-bot-2026.iam.gserviceaccount.com",
            // Private key ko Vercel Environment se hi uthana safe hai
            privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : "",
        })
    });
}

const db = admin.firestore();

// 2. BOT TOKEN DIRECTLY INSERTED (Aapka Token)
const bot = new Telegraf("8784543392:AAEybNnS-v5VUdwB1jNeK38bU3EFCds99-w");
const DASHBOARD_URL = "https://earn-bot-2026.vercel.app";

// Verification Question Generator
function getCaptcha() {
    const a = Math.floor(Math.random() * 10) + 2;
    const b = Math.floor(Math.random() * 8) + 1;
    return { question: `${a} + ${b}`, answer: a + b };
}

// START COMMAND
bot.start(async (ctx) => {
    const userId = ctx.from.id.toString();
    const refId = ctx.startPayload || null;
    const captcha = getCaptcha();

    try {
        await db.collection('verifying').doc(userId).set({
            ans: captcha.answer,
            ref: refId,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return ctx.replyWithMarkdown(
            `🚀 *Welcome to EarnPro 2026!*\n\n` +
            `Bhai, robot verification ke liye iska jawab dein:\n\n` +
            `📝 *Sawal:* ${captcha.question} = ?`
        );
    } catch (e) {
        console.error("DB Error:", e);
        return ctx.reply("System busy hai, thodi der baad koshish karein.");
    }
});

// HANDLING MESSAGES
bot.on('text', async (ctx) => {
    const userId = ctx.from.id.toString();
    const text = ctx.message.text.trim();
    
    const verifyRef = db.collection('verifying').doc(userId);
    const verifyDoc = await verifyRef.get();

    if (verifyDoc.exists) {
        const data = verifyDoc.data();
        if (parseInt(text) === data.ans) {
            await verifyRef.delete();

            const userRef = db.collection('users').doc(userId);
            const userDoc = await userRef.get();

            if (!userDoc.exists) {
                await userRef.set({
                    id: userId,
                    name: ctx.from.first_name || "User",
                    balance: 0,
                    referredBy: data.ref,
                    joinedAt: admin.firestore.FieldValue.serverTimestamp()
                });

                if (data.ref && data.ref !== userId) {
                    await db.collection('users').doc(data.ref).update({
                        balance: admin.firestore.FieldValue.increment(5)
                    }).catch(() => {});
                }
            }

            return ctx.replyWithMarkdown(
                `🎉 *Sahi Jawab! Account Verify Ho Gaya.*\n\n` +
                `💰 Ab niche button daba kar kamayi shuru karein.\n\n` +
                `🔥 *"Mehnat ka phal aur mehnat ka paisa, dono hi sabse meethe hote hain. Lage raho!"*`,
                Markup.inlineKeyboard([
                    [Markup.button.webApp("🚀 Open Dashboard", DASHBOARD_URL)]
                ])
            );
        } else {
            return ctx.reply("❌ *Galat Jawab!* Phir se koshish karein.");
        }
    }
});

// VERCEL HANDLER
module.exports = async (req, res) => {
    try {
        if (req.method === 'POST') {
            await bot.handleUpdate(req.body);
            res.status(200).send('OK');
        } else {
            res.status(200).send('Bot Status: Online');
        }
    } catch (err) {
        console.error("Bot Error:", err);
        res.status(500).send('Error');
    }
};
