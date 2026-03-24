const { Telegraf, Markup } = require('telegraf');
const admin = require('firebase-admin');

// Firebase Initialization
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    });
}
const db = admin.firestore();

const bot = new Telegraf(process.env.BOT_TOKEN);
const BOT_NAME = "Earn Bot 2026";
const AD_FOOTER = "\n\n📢 *Ad:* Join @Trendmansun for more rewards! 🚀";

// Start Command
bot.start(async (ctx) => {
    const userId = String(ctx.from.id);
    const username = ctx.from.username || "User";

    try {
        const userRef = db.collection('users').doc(userId);
        const doc = await userRef.get();

        if (!doc.exists) {
            await userRef.set({
                id: userId,
                username: username,
                balance: 0,
                joinedAt: new Date().toISOString()
            });
        }

        const balance = doc.exists ? doc.data().balance : 0;

        ctx.replyWithMarkdown(`👋 *Welcome to ${BOT_NAME}!*\n\nHello ${username}, aapka current balance *₹${balance}* hai.${AD_FOOTER}`, 
            Markup.inlineKeyboard([
                [Markup.button.webApp("🚀 Open Dashboard", "https://earn-bot-2026.vercel.app")],
                [Markup.button.url("📢 Join Channel", "https://t.me/Trendmansun")]
            ])
        );
    } catch (err) {
        console.error("Start Error:", err);
    }
});

// Points Collection Logic (Jab Dashboard se "Claim" ya "Video" ka signal aaye)
bot.on('web_app_data', async (ctx) => {
    try {
        const data = JSON.parse(ctx.webAppData.data());
        const userId = String(ctx.from.id);
        const userRef = db.collection('users').doc(userId);

        let reward = 0;
        if (data.action === 'DAILY_CLAIM') reward = 10;
        if (data.action === 'VIDEO_REWARD') reward = 5;

        if (reward > 0) {
            await userRef.update({
                balance: admin.firestore.FieldValue.increment(reward)
            });
            ctx.reply(`✅ Badhai ho! Aapko ${reward} Points mil gaye hain.${AD_FOOTER}`);
        }
    } catch (err) {
        console.error("Reward Error:", err);
        ctx.reply("⚠️ Points add karne mein error aaya.");
    }
});

module.exports = async (req, res) => {
    if (req.method === 'POST') {
        try {
            await bot.handleUpdate(req.body);
            res.status(200).send('OK');
        } catch (err) { res.status(500).send('Error'); }
    } else {
        res.status(200).send(`${BOT_NAME} Backend is Active!`);
    }
};
