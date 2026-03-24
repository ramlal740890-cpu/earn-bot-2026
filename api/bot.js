const { Telegraf, Markup } = require('telegraf');
const { db } = require('../firebase'); // firebase.js se connection lena

// Environment Variables se data uthana
const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = process.env.ADMIN_ID;

const bot = new Telegraf(BOT_TOKEN);

// Admin Logic Import (Agar aapne admin.js alag banayi hai)
const adminLogic = require('../admin');
adminLogic(bot);

// --- DASHBOARD DATA LISTENER ---
bot.on('web_app_data', async (ctx) => {
    try {
        const data = JSON.parse(ctx.webAppData.data.json());
        const userId = ctx.from.id.toString();
        const userRef = db.collection('users').doc(userId);

        // 1. Video Reward Logic
        if (data.action === "VIDEO_REWARD") {
            await userRef.update({ 
                balance: admin.firestore.FieldValue.increment(20) 
            });
            await ctx.reply("✅ Badhai Ho! Aapne video dekhi aur 20 Points kama liye! 💰");
        }

        // 2. Daily Claim logic
        if (data.action === "DAILY_CLAIM") {
            const userDoc = await userRef.get();
            const userData = userDoc.data();
            const now = Date.now();

            if (userData.lastDaily && (now - userData.lastDaily < 86400000)) {
                return ctx.reply("❌ Aapne aaj ka bonus pehle hi le liya hai. Kal aaiye!");
            }

            await userRef.update({
                balance: admin.firestore.FieldValue.increment(10),
                lastDaily: now
            });
            await ctx.reply("🎁 Mubarak Ho! 10 Points Daily Bonus aapke wallet mein add ho gaya!");
        }
    } catch (err) {
        console.error("Dashboard Error:", err);
    }
});

// Start Command
bot.start((ctx) => {
    ctx.reply("🔥 Welcome to TrendBot! \n\nNiche button dabakar Earning shuru karein.", 
    Markup.keyboard([
        [Markup.button.webApp("🚀 Open Dashboard", "https://earn-bot-2026.vercel.app")]
    ]).resize());
});

// Vercel Serverless Function Export
module.exports = async (req, res) => {
    if (req.method === 'POST') {
        try {
            await bot.handleUpdate(req.body);
            res.status(200).send('OK');
        } catch (err) {
            console.error("Bot Error:", err);
            res.status(500).send('Error');
        }
    } else {
        res.status(200).send('Bot is running...');
    }
};
