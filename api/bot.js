const { Telegraf, Markup } = require('telegraf');
const admin = require('firebase-admin');

// Firebase Initialization (Singleton Pattern)
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID || "earn-bot-2026",
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL || "firebase-adminsdk-fbsvc@earn-bot-2026.iam.gserviceaccount.com",
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        })
    });
}

const db = admin.firestore();
const bot = new Telegraf(process.env.BOT_TOKEN);
const DASHBOARD_URL = "https://earn-bot-2026.vercel.app";

// Verification Question Generator
function getCaptcha() {
    const a = Math.floor(Math.random() * 15) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    return { question: `${a} + ${b}`, answer: a + b };
}

// Start Command
bot.start(async (ctx) => {
    const userId = ctx.from.id.toString();
    const refId = ctx.startPayload || null;
    const captcha = getCaptcha();

    // Store captcha in temporary 'verifying' collection
    await db.collection('verifying').doc(userId).set({
        ans: captcha.answer,
        ref: refId,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const welcomeMsg = `🚀 *Welcome to EarnPro 2026!* \n\n` +
                       `Bhai, robot verification ke liye niche diye sawal ka sahi jawab dein:\n\n` +
                       `📝 *Sawal:* What is ${captcha.question}?`;

    return ctx.replyWithMarkdown(welcomeMsg);
});

// Handling Captcha & Messages
bot.on('text', async (ctx) => {
    const userId = ctx.from.id.toString();
    const text = ctx.message.text.trim();
    const verifyRef = db.collection('verifying').doc(userId);
    const verifyDoc = await verifyRef.get();

    if (verifyDoc.exists) {
        const data = verifyDoc.data();
        if (parseInt(text) === data.ans) {
            await verifyRef.delete(); // Delete captcha after success

            const userRef = db.collection('users').doc(userId);
            const userDoc = await userRef.get();

            if (!userDoc.exists) {
                // New User Registration
                await userRef.set({
                    id: userId,
                    name: ctx.from.first_name,
                    balance: 0,
                    referredBy: data.ref,
                    joinedAt: admin.firestore.FieldValue.serverTimestamp()
                });

                // Referral Bonus Logic
                if (data.ref && data.ref !== userId) {
                    await db.collection('users').doc(data.ref).update({
                        balance: admin.firestore.FieldValue.increment(5) // Referral bonus
                    }).catch(e => console.log("Ref Error:", e));
                }
            }

            // Success Message with Buttons
            return ctx.replyWithMarkdown(
                `🎉 *Sahi Jawab! Aapka Account Verify Ho Gaya Hai.*\n\n` +
                `💰 Ab aap Daily Tasks aur Ads dekh kar kama sakte hain.\n\n` +
                `🔥 *"Sapne dekhne se pure nahi hote, unke liye mehnat karni padti hai. Shuruat aaj se karein!"*`,
                Markup.inlineKeyboard([
                    [Markup.button.webApp("🚀 Open Dashboard", DASHBOARD_URL)],
                    [Markup.button.url("📢 Join Channel", "https://t.me/yourchannel")]
                ])
            );
        } else {
            return ctx.reply("❌ *Galat Jawab!* Kripya sahi calculation karke bhejein.", { parse_mode: 'Markdown' });
        }
    }
});

// Withdrawal & Data Handling from WebApp
bot.on('web_app_data', async (ctx) => {
    try {
        const data = JSON.parse(ctx.webAppData.data());
        const userId = ctx.from.id.toString();
        const userRef = db.collection('users').doc(userId);

        if (data.action === 'withdraw') {
            await db.collection('withdrawals').add({
                userId,
                upi: data.upi,
                amount: data.amount,
                status: 'pending',
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
            return ctx.replyWithMarkdown(`✅ *Withdrawal Request Received!*\n\n💰 Amount: ₹${data.amount}\n🏦 UPI: ${data.upi}\n🕒 24-48 hours mein payment mil jayega.`);
        }
    } catch (e) {
        console.error("WebAppData Error:", e);
    }
});

// Vercel Serverless Handler
module.exports = async (req, res) => {
    try {
        if (req.method === 'POST') {
            await bot.handleUpdate(req.body);
            res.status(200).send('OK');
        } else {
            res.status(200).send('Bot is Running...');
        }
    } catch (err) {
        console.error("Handler Error:", err);
        res.status(500).send('Error');
    }
};
