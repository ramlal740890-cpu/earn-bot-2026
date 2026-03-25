const { Telegraf } = require('telegraf');
const admin = require('firebase-admin');

// 1. Firebase Initialization (Individual Variables for better stability)
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: "earn-bot-2026",
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            // Replace logic for handling newlines in Private Key
            privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
        })
    });
}

const db = admin.firestore();
const bot = new Telegraf(process.env.BOT_TOKEN);

// 2. Start Command (User Registration & Referral Logic)
bot.start(async (ctx) => {
    const userId = ctx.from.id.toString();
    const referrerId = ctx.startPayload || null; // Invitation link se aane par ID milti hai
    
    try {
        const userRef = db.collection('users').doc(userId);
        const doc = await userRef.get();

        if (!doc.exists) {
            // Naya User Register Karein
            await userRef.set({
                id: userId,
                username: ctx.from.username || 'User',
                name: ctx.from.first_name,
                balance: 0,
                referredBy: referrerId,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });

            // Agar kisi ne refer kiya hai toh usse points dein (Optional)
            if (referrerId) {
                const refUser = db.collection('users').doc(referrerId);
                await refUser.update({
                    balance: admin.firestore.FieldValue.increment(5) // Referral bonus 5 points
                });
            }
        }

        ctx.reply(`🙏 Namaste ${ctx.from.first_name}!\n\nWelcome to **Earn Bot 2026**. \n\nNiche diye gaye button par click karke Dashboard kholein aur task poore karke paise kamana shuru karein!`, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: "🚀 Open Premium Dashboard", web_app: { url: "https://earn-bot-2026.vercel.app" } }],
                    [{ text: "📢 Join Channel", url: "https://t.me/Trendmansun" }]
                ]
            }
        });
    } catch (error) {
        console.error("Start Error:", error);
        ctx.reply("Kuch error aaya hai, please thodi der baad try karein.");
    }
});

// 3. Handling Data from Dashboard (Web App Data)
bot.on('web_app_data', async (ctx) => {
    try {
        const data = JSON.parse(ctx.webAppData.data());
        const userId = ctx.from.id.toString();
        const userRef = db.collection('users').doc(userId);

        if (data.action === 'ad_watch' || data.action === 'daily_bonus') {
            // Balance update karein
            await userRef.update({
                balance: admin.firestore.FieldValue.increment(data.points)
            });
            // Telegram par feedback dein
            ctx.reply(`✅ Mubarak ho! Aapne ${data.points} points kamaye hain.`);
        } 
        
        else if (data.action === 'withdraw') {
            // Withdrawal request save karein
            await db.collection('withdrawals').add({
                userId: userId,
                upi: data.upi,
                status: 'pending',
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
            ctx.reply(`💰 Withdrawal Request Received!\n\nUPI: \`${data.upi}\` \nStatus: Pending (24h wait karein)`, { parse_mode: 'Markdown' });
            
            // Admin (Aapko) alert bheje
            if(process.env.ADMIN_ID) {
                bot.telegram.sendMessage(process.env.ADMIN_ID, `🔔 *New Withdrawal Request*\nUser: ${userId}\nUPI: ${data.upi}`, { parse_mode: 'Markdown' });
            }
        }
    } catch (e) {
        console.error("WebAppData Error:", e);
    }
});

// 4. Vercel Handler (Webhook connection)
module.exports = async (req, res) => {
    if (req.method === 'POST') {
        try {
            await bot.handleUpdate(req.body);
            res.status(200).send('OK');
        } catch (err) {
            console.error('Bot Handler Error:', err);
            res.status(500).send('Error');
        }
    } else {
        res.status(200).send('Bot is running...');
    }
};

