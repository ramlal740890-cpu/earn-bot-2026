const { Telegraf, Markup } = require('telegraf');
const { db } = require('../firebase');
const adminLogic = require('../admin');

const bot = new Telegraf(process.env.BOT_TOKEN);

// Admin commands load karein
adminLogic(bot);

bot.start(async (ctx) => {
    const userId = String(ctx.from.id);
    const username = ctx.from.username || "User";
    const referralId = ctx.startPayload; // Agar koi referral link se aaya ho

    try {
        const userRef = db.collection('users').doc(userId);
        const doc = await userRef.get();

        // Naya user register karna
        if (!doc.exists) {
            await userRef.set({
                id: userId,
                username: username,
                balance: 0,
                referredBy: referralId || null,
                joinedAt: new Date().toISOString()
            });

            // Agar kisi ne refer kiya hai toh use points dena
            if (referralId) {
                const referrerRef = db.collection('users').doc(referralId);
                const referrerDoc = await referrerRef.get();
                if (referrerDoc.exists) {
                    await referrerRef.update({
                        balance: admin.firestore.FieldValue.increment(50) // 50 points per refer
                    });
                }
            }
        }

        // Welcome Message aur Dashboard Button
        const shareLink = `https://t.me/Trendmansun_bot?start=${userId}`; // Apna bot username check karlein
        
        return ctx.reply(`👋 Welcome ${username}!\n\nAapka account active ho gaya hai.\n\n💰 Balance: ${doc.exists ? doc.data().balance : 0} Points\n🔗 Your Invite Link: ${shareLink}`, 
            Markup.inlineKeyboard([
                [Markup.button.webApp("🚀 Open Dashboard", "https://trendmansun.com/gst-app")], // Aapka main domain
                [Markup.button.url("📢 Join Channel", "https://t.me/Trendmansun")]
            ])
        );
    } catch (err) {
        console.error("Start Logic Error:", err);
        ctx.reply("⚠️ Bot mein kuch technical issue hai, thodi der baad koshish karein.");
    }
});

module.exports = async (req, res) => {
    if (req.method === 'POST') {
        try {
            await bot.handleUpdate(req.body);
            res.status(200).send('OK');
        } catch (err) {
            res.status(500).send('Error');
        }
    } else {
        res.status(200).send('Bot is Working!');
    }
};
