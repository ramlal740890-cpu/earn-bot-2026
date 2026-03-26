const { Telegraf } = require('telegraf');
const admin = require('firebase-admin');

// Firebase Initialization logic
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: "earn-bot-2026",
                clientEmail: "firebase-adminsdk-fbsvc@earn-bot-2026.iam.gserviceaccount.com",
                privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            })
        });
    } catch (error) {
        console.error("Firebase Init Error:", error.message);
    }
}

const db = admin.firestore();
const bot = new Telegraf(process.env.BOT_TOKEN);

// Verification Question Generator
function getCaptcha() {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    return { question: `${a} + ${b}`, answer: a + b };
}

// Start Command with Referral & Captcha
bot.start(async (ctx) => {
    const userId = ctx.from.id.toString();
    const refId = ctx.startPayload || null;
    const captcha = getCaptcha();

    await db.collection('verifying').doc(userId).set({
        ans: captcha.answer,
        ref: refId
    });

    ctx.reply(`🛡️ *Verification Required*\n\nBhai, bot shuru karne ke liye iska sahi jawab dein:\n\n*${captcha.question} = ?*`, { parse_mode: 'Markdown' });
});

// Handling Captcha Answers
bot.on('text', async (ctx) => {
    const userId = ctx.from.id.toString();
    const text = ctx.message.text;
    const verifyRef = db.collection('verifying').doc(userId);
    const verifyDoc = await verifyRef.get();

    if (verifyDoc.exists) {
        if (parseInt(text) === verifyDoc.data().ans) {
            const refId = verifyDoc.data().ref;
            await verifyRef.delete();

            const userRef = db.collection('users').doc(userId);
            const userDoc = await userRef.get();

            if (!userDoc.exists) {
                await userRef.set({
                    id: userId,
                    balance: 0,
                    referredBy: refId,
                    joinedAt: admin.firestore.FieldValue.serverTimestamp()
                });

                if (refId && refId !== userId) {
                    await db.collection('users').doc(refId).update({
                        balance: admin.firestore.FieldValue.increment(5)
                    }).catch(() => {});
                }
            }

            ctx.reply(`✅ *Sahi Jawab!*\n\nAb aap niche Dashboard se kama sakte hain.`, {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [[{ text: "🚀 Open Dashboard", web_app: { url: "https://earn-bot-2026.vercel.app" } }]]
                }
            });
        } else {
            ctx.reply("❌ Galat jawab! Phir se koshish karein.");
        }
    }
});

// Web App Data (Daily Bonus, Ads & Withdraw)
bot.on('web_app_data', async (ctx) => {
    const data = JSON.parse(ctx.webAppData.data());
    const userId = ctx.from.id.toString();
    const userRef = db.collection('users').doc(userId);

    if (data.action === 'ad_watch' || data.action === 'daily_bonus') {
        await userRef.update({ balance: admin.firestore.FieldValue.increment(data.points) });
        ctx.reply(`💰 *+${data.points} Points* added!`);
    } else if (data.action === 'withdraw') {
        await db.collection('withdrawals').add({
            userId, upi: data.upi, status: 'pending', time: admin.firestore.FieldValue.serverTimestamp()
        });
        ctx.reply(`💸 Withdrawal request sent for UPI: ${data.upi}`);
    }
});

module.exports = async (req, res) => {
    if (req.method === 'POST') {
        await bot.handleUpdate(req.body);
        res.status(200).send('OK');
    } else {
        res.status(200).send('Running...');
    }
};
