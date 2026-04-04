const { Telegraf, Markup } = require('telegraf');
const { db } = require('../firebase');

// Direct token ki jagah variable use karein
const bot = new Telegraf(process.env.BOT_TOKEN);
const DASHBOARD_URL = "https://earn-bot-2026.vercel.app";

bot.start(async (ctx) => {
    try {
        await db.collection('users').doc(ctx.from.id.toString()).set({
            name: ctx.from.first_name,
            joinedAt: new Date()
        }, { merge: true });

        return ctx.replyWithMarkdown(
            `🚀 *Welcome to EarnPro 2026!*\n\n💰 Dashboard niche hai:`,
            Markup.inlineKeyboard([
                [Markup.button.webApp("🚀 Open Dashboard", DASHBOARD_URL)]
            ])
        );
    } catch (e) {
        console.error(e);
        return ctx.reply("Database Error!");
    }
});

module.exports = async (req, res) => {
    if (req.method === 'POST') {
        await bot.handleUpdate(req.body);
        res.status(200).send('OK');
    } else {
        res.status(200).send('Bot is Live and Waiting for Webhook!');
    }
};
