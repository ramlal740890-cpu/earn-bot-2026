const { Telegraf, Markup } = require('telegraf');
const { db } = require('../firebase'); // Yeh line aapki firebase.js file ko connect karti hai

const bot = new Telegraf("8784543392:AAEybNnS-v5VUdwB1jNeK38bU3EFCds99-w");
const DASHBOARD_URL = "https://earn-bot-2026.vercel.app";

// START COMMAND
bot.start(async (ctx) => {
    const userId = ctx.from.id.toString();
    
    try {
        // User ko database mein save karna
        await db.collection('users').doc(userId).set({
            id: userId,
            name: ctx.from.first_name || "User",
            balance: 0,
            joinedAt: new Date()
        }, { merge: true });

        return ctx.replyWithMarkdown(
            `🚀 *Welcome to EarnPro 2026!*\n\n` +
            `Bhai, aapka account setup ho gaya hai. Ab aap kamayi shuru kar sakte hain.`,
            Markup.inlineKeyboard([
                [Markup.button.webApp("🚀 Open Dashboard", DASHBOARD_URL)]
            ])
        );
    } catch (e) {
        console.error("Firebase Connection Error:", e);
        return ctx.reply("System Error: Database connect nahi ho raha.");
    }
});

// VERCEL HANDLER
module.exports = async (req, res) => {
    if (req.method === 'POST') {
        try {
            await bot.handleUpdate(req.body);
            res.status(200).send('OK');
        } catch (err) {
            console.error(err);
            res.status(500).send('Bot Error');
        }
    } else {
        res.status(200).send('Bot Status: Running');
    }
};
