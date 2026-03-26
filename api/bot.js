const { Telegraf } = require('telegraf');
const admin = require('firebase-admin');

// 1. Firebase Initialization (Bullet-Proof logic)
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: "earn-bot-2026",
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                // Fixing the private key format for Vercel
                privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            })
        });
        console.log("Firebase Connected");
    } catch (error) {
        console.error("Firebase Init Error:", error.message);
    }
}

const db = admin.firestore();
const bot = new Telegraf(process.env.BOT_TOKEN);

// Anti-Spam Keywords
const BANNED_KEYWORDS = ['vcc', 'crypto', 'pay', 'free money', '老板', 'hack'];

// Helper: Captcha Generator
function generateCaptcha() {
    const n1 = Math.floor(Math.random() * 10) + 1;
    const n2 = Math.floor(Math.random() * 10) + 1;
    return { q: `${n1} + ${n2}`, a: n1 + n2 };
}

// 2. Start Command with Captcha & Referral
bot.start(async (ctx) => {
    const userId = ctx.from.id.toString();
    const refId = ctx.startPayload || null;
    const captcha = generateCaptcha();

    try {
        // Save captcha in temp collection
        await db.collection('temp_users').doc(userId).set({
            answer: captcha.a,
            referredBy: refId,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        ctx.reply(`🛡️ *Human Verification Required!*\n\nBhai, bot shuru karne ke liye niche diye sawal ka jawab dein:\n\n*${captcha.q} = ?*`, { parse_mode: 'Markdown' });
    } catch (e) {
        console.error("Start Error:", e);
    }
});

// 3. Main Message Handler (Captcha Verify + Anti-Spam)
bot.on('text', async (ctx) => {
    const userId = ctx.from.id.toString();
    const text = ctx.message.text;

    // A. Anti-Spam
    if (/[\u4e00-\u9fa5]/.test(text) || BANNED_KEYWORDS.some(k => text.toLowerCase().includes(k))) {
        return ctx.deleteMessage().catch(() => {});
    }

    // B. Captcha Check
    const tempRef = db.collection('temp_users').doc(userId);
    const tempDoc = await tempRef.get();

    if (tempDoc.exists) {
        const data = tempDoc.data();
        if (parseInt(text) === data.answer) {
            await tempRef.delete();
            
            const userRef = db.collection('users').doc(userId);
            const userDoc = await userRef.get();

            if (!userDoc.exists) {
                // New User Creation
                await userRef.set({
                    id: userId,
                    name: ctx.from.first_name,
                    balance: 0,
                    referredBy: data.referredBy,
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                });

                // If referred, give 5 points to the referrer
                if (data.referredBy) {
                    const refUserRef = db.collection('users').doc(data.referredBy);
                    await refUserRef.update({
                        balance: admin.firestore.FieldValue.increment(5)
                    }).catch(() => {});
                }
            }

            ctx.reply(`✅ *Verification Successful!*\n\nAb aap niche diye gaye Dashboard se kamana shuru kar sakte hain.`, {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "🚀 Open Dashboard", web_app: { url: "https://earn-bot-2026.vercel.app" } }],
                        [{ text: "📢 Join Channel", url: "https://t.me/Trendmansun" }]
                    ]
                }
            });
        } else {
            ctx.reply("❌ Galat Jawab! /start dabayein aur sahi jawab dein.");
        }
        return;
    }
});

// 4. Web App Data (Daily Bonus & Ad Watch)
bot.on('web_app_data', async (ctx) => {
    try {
        const data = JSON.parse(ctx.webAppData.data());
        const userId = ctx.from.id.toString();
        const userRef = db.collection('users').doc(userId);

        if (data.action === 'ad_watch' || data.action === 'daily_bonus') {
            await userRef.update({
                balance: admin.firestore.FieldValue.increment(data.points)
            });
            ctx.reply(`💰 *+${data.points} Points* aapke balance mein jod diye gaye hain!`, { parse_mode: 'Markdown' });
        } 
        
        else if (data.action === 'withdraw') {
            await db.collection('withdrawals').add({
                userId: userId,
                upi: data.upi,
                status: 'pending',
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
            ctx.reply(`💸 *Withdrawal Request Sent!*\n\nUPI: \`${data.upi}\` \nStatus: 24h mein process ho jayega.`, { parse_mode: 'Markdown' });
        }
    } catch (e) {
        console.error("WebAppData Error:", e);
    }
});

// 5. Vercel Webhook Handler
module.exports = async (req, res) => {
    if (req.method === 'POST') {
        try {
            await bot.handleUpdate(req.body);
            res.status(200).send('OK');
        } catch (err) {
            console.error('Bot Handler Error:', err);
            res.status(500).send('Internal Server Error');
        }
    } else {
        res.status(200).send('Bot is active!');
    }
};
