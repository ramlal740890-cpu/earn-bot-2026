const { Telegraf, Markup } = require('telegraf');
const { db, admin } = require('../firebase');

const bot = new Telegraf(process.env.BOT_TOKEN);
const WEB_URL = "https://earn-bot-2026.vercel.app"; // Apni Vercel URL yahan dalein

bot.start(async (ctx) => {
    const userId = ctx.from.id.toString();
    const refBy = ctx.startPayload; // Referral ID agar link se aaya hai

    const userRef = db.collection('users').doc(userId);
    const doc = await userRef.get();

    if (!doc.exists) {
        await userRef.set({
            id: userId,
            name: ctx.from.first_name,
            balance: 0,
            referrals: 0,
            joinedAt: new Date()
        });

        if (refBy && refBy !== userId) {
            await db.collection('users').doc(refBy).update({
                balance: admin.firestore.FieldValue.increment(50),
                referrals: admin.firestore.FieldValue.increment(1)
            });
        }
    }

    ctx.reply(`💰 Welcome ${ctx.from.first_name}!`, Markup.keyboard([
        [Markup.button.webApp("🚀 Open Dashboard", `${WEB_URL}/index.html?id=${userId}`)],
        ['🎁 Daily Bonus', '👥 My Stats']
    ]).resize());
});

bot.hears('🎁 Daily Bonus', async (ctx) => {
    const userRef = db.collection('users').doc(ctx.from.id.toString());
    await userRef.update({ balance: admin.firestore.FieldValue.increment(10) });
    ctx.reply("✅ +10 Coins Added!");
});

module.exports = async (req, res) => {
    if (req.method === 'POST') {
        await bot.handleUpdate(req.body);
        res.status(200).send('OK');
    }
};
