const axios = require('axios');
const admin = require('firebase-admin');

let db;
try {
  if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT.replace(/\\n/g, '\n'));
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    db = admin.firestore();
    console.log("✅ Firebase Connected");
  }
} catch (e) { console.error("Firebase Error:", e.message); }

const BOT_TOKEN = process.env.BOT_TOKEN;
const AD_LINK = "https://horizontallyresearchpolar.com/r0wbx3kyf?key=8b0a2298684c7cea730312add326101b";

async function sendMsg(chatId, text, keyboard = null) {
  const payload = { chat_id: chatId, text, parse_mode: 'HTML' };
  if (keyboard) payload.reply_markup = { inline_keyboard: keyboard };
  await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, payload);
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(200).send('Bot Running 🟢');

  try {
    const { message } = req.body;
    if (!message?.text) return res.status(200).send('OK');

    const chatId = message.chat.id.toString();
    const text = message.text.trim();
    const userRef = db.collection('users').doc(chatId);
    const userDoc = await userRef.get();
    let user = userDoc.exists ? userDoc.data() : { points: 0, referrals: 0 };

    if (text.startsWith('/start')) {
      const inviteCode = text.split(' ')[1] || null;
      if (!userDoc.exists) {
        await userRef.set({ points: 30, referrals: 0, lastDaily: 0, joinedAt: new Date().toISOString(), referredBy: inviteCode });
        if (inviteCode) {
          await db.collection('users').doc(inviteCode).update({
            points: admin.firestore.FieldValue.increment(50),
            referrals: admin.firestore.FieldValue.increment(1)
          });
        }
      }
      await sendMsg(chatId, `🌟 <b>Namaste! Refer & Earn Bot mein Welcome</b>\n\nRoj 10 Points\nAd dekhne pe 20 Points\nHar refer pe 50 Points!`, [
        [{ text: '👤 Profile', callback_data: 'profile' }],
        [{ text: '🎁 Daily Bonus', callback_data: 'daily' }],
        [{ text: '🎥 Watch Ad (20 pts)', callback_data: 'ad' }],
        [{ text: '🔗 Refer Link', callback_data: 'refer' }],
        [{ text: '🏦 Withdraw', callback_data: 'withdraw' }],
        [{ text: '🔥 Hot Offer', url: AD_LINK }]
      ]);
    }

    // Callback buttons handling (inline)
    if (req.body.callback_query) {
      const cb = req.body.callback_query;
      const cbId = cb.id;
      const data = cb.data;

      if (data === 'profile') {
        await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, { callback_query_id: cbId });
        await sendMsg(chatId, `👤 <b>Profile</b>\nPoints: ${user.points}\nReferrals: ${user.referrals}`);
      }
      if (data === 'daily') {
        const now = Date.now();
        if (now - (user.lastDaily || 0) < 86400000) return await sendMsg(chatId, '⏳ Daily already claimed! 24 ghante baad aao');
        await userRef.update({ points: admin.firestore.FieldValue.increment(10), lastDaily: now });
        await sendMsg(chatId, '🎉 Daily 10 Points mil gaye!');
      }
      if (data === 'ad') {
        await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, { callback_query_id: cbId });
        await sendMsg(chatId, `🎥 15 Second Ad dekhne ke liye click karo → 20 Points turant!`, [[{ text: 'Watch Ad Now 🔥', url: AD_LINK }]]);
      }
      if (data === 'refer') {
        const link = `https://t.me/${process.env.BOT_USERNAME || 'YourBotName_bot'}?start=${chatId}`;
        await sendMsg(chatId, `🔗 Tera Referral Link:\n${link}\n\nHar naye user pe 50 Points!`);
      }
      if (data === 'withdraw') {
        await sendMsg(chatId, '🏦 Withdraw ke liye UPI ID aur amount bhej do (minimum 500 points)\nExample: UPI:9876543210@paytm 600');
      }
    }
  } catch (err) {
    console.error(err);
  }
  res.status(200).send('OK');
};
