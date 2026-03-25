const { Telegraf } = require('telegraf');
const admin = require('firebase-admin');

// 1. Firebase Initialization (Safer & Error-Proof)
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: "earn-bot-2026",
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                // Replace \n with actual newlines to avoid 'Invalid PEM key' error
                privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
            })
        });
        console.log("Firebase Admin Connected Successfully");
    } catch (error) {
        console.error("Firebase Initialization Error:", error.message);
    }
}

const db = admin.firestore();
const bot = new Telegraf(process.env.BOT_TOKEN);

// 2. Start Command Logic
bot.start(async (ctx) => {
    const userId = ctx.from.id.toString();
    const referralId = ctx.startPayload || null;

    try {
        const userRef = db.collection('users').doc(userId);
        const doc = await userRef.get();

        if (!doc.exists) {
            // New User Entry
            await userRef.set({
                id: userId,
                username: ctx.from.username || 'User',
                name: ctx.from.first_name,
                balance: 0,
                referredBy: referralId,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });

            // If referred, give 5 points to the referrer
            if (referralId) {
                const refUserRef = db.collection('users').doc(referralId);
                await refUserRef.update({
                    balance: admin.firestore.FieldValue.increment(5)
                });
            }
        }

        ctx.reply(`🙏 Namaste ${ctx.from.first_name}!\n\nEarn Bot 2026 mein aapka swagat hai.\n\nNiche diye gaye button se Dashboard kholien aur kamana shuru karein!`, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: "🚀 Open Dashboard", web_app: { url: "https://earn-bot-2026.vercel.app" } }],
                    [{ text: "📢 Join Channel", url: "https://t.me/Trendmansun" }]
                ]
            }
        });
    } catch (e) {
        console.error("Start Command Error:", e);
    }
});

// 3. Handling Dashboard Data (Points & Withdraw)
bot.on('web_app_data', async (ctx) => {
    try {
        const data = JSON.parse(ctx.webAppData.data());
        const userId = ctx.from.id.toString();
        const userRef = db.collection('users').doc(userId);

        if (data.action === 'ad_watch' || data.action === 'daily_bonus') {
            await userRef.update({
                balance: admin.firestore.FieldValue.increment(data.points)
            });
            ctx.reply(`✅ Mubarak ho! Aapne ${data.points} points kamaye hain.`);
        } 
        
        else if (data.action === 'withdraw') {
            await db.collection('withdrawals').add({
                userId: userId,
                upi: data.upi,
                status: 'pending',
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
            ctx.reply(`💰 Withdrawal Request Received!\nUPI: \`${data.upi}\` \nStatus: Pending (24h)`, { parse_mode: 'Markdown' });
            
            // Send Alert to Admin
            if(process.env.ADMIN_ID) {
                bot.telegram.sendMessage(process.env.ADMIN_ID, `🔔 *New Withdrawal*\nUser: ${userId}\nUPI: ${data.upi}`, { parse_mode: 'Markdown' });
            }
        }
    } catch (e) {
        console.error("WebAppData Error:", e);
    }
});

// 4. Vercel Webhook Handler
module.exports = async (req, res) => {
    if (req.method === 'POST') {
        try {
            await bot.handleUpdate(req.body);
            res.status(200).send('OK');
        } catch (err) {
            console.error('Bot Error:', err);
            res.status(500).send('Internal Server Error');
        }
    } else {
        res.status(200).send('<h1>Bot is running fine!</h1>');
    }
};
