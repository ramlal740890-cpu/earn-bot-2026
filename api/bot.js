const { Telegraf, Markup } = require('telegraf');
const { db } = require('../firebase');

const bot = new Telegraf("8784543392:AAEybNnS-v5VUdwB1jNeK38bU3EFCds99-w");
const DASHBOARD_URL = "https://earn-bot-2026.vercel.app";

bot.start(async (ctx) => {
    try {
        const userId = ctx.from.id.toString();
        // User ko Firestore mein save karna
        await db.collection('users').doc(userId).set({
            name: ctx.from.first_name,
            username: ctx.from.username || "N/A",
            joinedAt: new Date()
        }, { merge: true });

        return ctx.replyWithMarkdown(
            `🚀 *Welcome to EarnPro 2026!*\n\nAapka account setup ho gaya hai. Dashboard niche button se kholein.`,
            Markup.inlineKeyboard([
                [Markup.button.webApp("🚀 Open Dashboard", DASHBOARD_URL)]
            ])
        );
    } catch (e) {
        console.error(e);
        return ctx.reply("Error: Database connect nahi ho raha!");
    }
});

module.exports = async (req, res) => {
    if (req.method === 'POST') {
        await bot.handleUpdate(req.body);
        res.status(200).send('OK');
    } else {
        res.status(200).send('Bot is Live!');
    }
};
