const { Telegraf } = require('telegraf');
const admin = require('firebase-admin');

// Firebase Initialization
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    });
}
const db = admin.firestore();
const bot = new Telegraf(process.env.BOT_TOKEN);

// Welcome Message & User Registration
bot.start(async (ctx) => {
    const userId = ctx.from.id.toString();
    const userRef = db.collection('users').doc(userId);
    const doc = await userRef.get();

    if (!doc.exists) {
        await userRef.set({
            id: userId,
            username: ctx.from.username || 'User',
            balance: 0,
            referredBy: ctx.startPayload || null,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
    }

    ctx.reply(`🙏 Namaste ${ctx.from.first_name}!\n\nWelcome to Earn Bot 2026. Premium dashboard se task poore karein aur paise kamayein!`, {
        reply_markup: {
            inline_keyboard: [[{ text: "🚀 Open Dashboard", web_app: { url: "https://earn-bot-2026.vercel.app" } }]]
        }
    });
});

// Handling Dashboard Data (Points & Withdraw)
bot.on('web_app_data', async (ctx) => {
    try {
        const data = JSON.parse(ctx.webAppData.data());
        const userId = ctx.from.id.toString();
        const userRef = db.collection('users').doc(userId);

        if (data.action === 'ad_watch' || data.action === 'daily_bonus') {
            await userRef.update({
                balance: admin.firestore.FieldValue.increment(data.points)
            });
            ctx.answerCbQuery(`Mubarak ho! ${data.points} points add ho gaye.`);
        } 
        
        else if (data.action === 'withdraw') {
            await db.collection('withdrawals').add({
                userId: userId,
                upi: data.upi,
                status: 'pending',
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
            ctx.reply(`✅ Withdrawal request received for UPI: ${data.upi}`);
        }
    } catch (e) {
        console.error("Error updating points:", e);
    }
});

module.exports = async (req, res) => {
    try {
        await bot.handleUpdate(req.body);
        res.status(200).send('OK');
    } catch (err) {
        console.error('Bot Error:', err);
        res.status(500).send('Error');
    }
};
