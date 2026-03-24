const { Telegraf, Markup } = require('telegraf');
const { db } = require('../firebase');
const adminLogic = require('../admin');

// Token yahan nahi likhna, Vercel Settings mein daalna hai
const bot = new Telegraf(process.env.BOT_TOKEN);

// Admin functions ko load karna
adminLogic(bot);

bot.start(async (ctx) => {
    const userId = String(ctx.from.id);
    const username = ctx.from.username || "User";

    try {
        // User ko database mein save karna agar naya hai
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

        ctx.reply(`👋 Welcome ${username}!\n\nTrendBot mein aapka swagat hai. Paise kamane ke liye niche button par click karein.`, 
            Markup.inlineKeyboard([
                [Markup.button.webApp("🚀 Open Dashboard", "https://earn-bot-2026.vercel.app")]
            ])
        );
    } catch (err) {
        console.error("Start Error:", err);
    }
});

// Vercel Webhook Handler
module.exports = async (req, res) => {
    if (req.method === 'POST') {
        try {
            await bot.handleUpdate(req.body);
            res.status(200).send('OK');
        } catch (err) {
            console.error("Update Error:", err);
            res.status(500).send('Error');
        }
    } else {
        res.status(200).send('Bot is active!');
    }
};
