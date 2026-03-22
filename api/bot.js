const { Telegraf, Markup } = require('telegraf');
const admin = require('firebase-admin');

// --- YOUR HARDCODED CREDENTIALS ---
const BOT_TOKEN = '8784543392:AAEybNnS-v5VUdwB1jNeK38bU3EFCds99-w';
const ADMIN_ID = 8711347335;
const SMART_LINK = 'https://horizontallyresearchpolar.com/r0wbx3kyf?key=8b0a2298684c7cea730312add326101b';
const CHANNEL = '@Trendmansun';

// Firebase Private Key Logic
const serviceAccount = {
  "project_id": "earn-bot-2026",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDEKKchAAWv6HB2\nXeywJm38LBYtRKs/0UPLNkM69YkYQuHDuC0uI5IV8y74W+4cmgydhfCsILwWn/YJ\n7OV+8LOL7PhYI87TbuQ3t25z2GyUoeFSdjy4bPGXcPre8z3WgCUxgmvD/ZkxuCiP\npJBzVF+uXc2l0v6SRPyY9uScSS3AlML/LJ7Gs1kU1yQQQts6A1GuWN6papIEiBAd\nXGqt6diCpyhItA4lLmYY7fVJe27b8kqmzV76S2zh1uY3cqCgsdaXGoED3RI9ssow\nhbBH4m4sYnwzszkiJo453+GdFS32Z9vb0KAztxSTsgJacg73q8QXe59zVE+Kkj9a\nX4i5C7GvAgMBAAECggEAKgXriA5RKZZKQZFtm28gMN3hAmGrrkhOlcJSNNdVP3VU\nmHFkfHXyXfFzJpHLOSVnfnerT7TTlqU+OHIf2EoIrPlfWsKRFIq1KZqKdxbubAki\nFGBwMbJlL2Rs2kaSANoDHdAq9hnmL9icF+nRaGOy+8/stpG1J/DPjJWX9ENZIeBc\nvCzJcnZkxzz5He0Qc/YTJQBUeo6i0WiX+JqW3beNASHjFwNc6YFlP0FM1p0MF2fh\nsc7j1IEgmvzQaTgK5FP+RJt3rqyysLUj/IBYBs5+9m3mXLZ4I/LlcKojiVuqAR+8\nh7B4SGRC0NJWzKicSbL9g5HBC4imW3oMVux5D+0bwQKBgQDlCkhR7FpZ+2jSTfoi\nfrftTDCbL2+mBhacXgpVIQcvq6ueipKpg+359JVpNx0ynGeD4ZPHdYmb/7Z4H4re\nZQM4etW70MkXCjN5LVHVBKoA7dy+Mmerj/g0rcNTjqhCVsNdDt+n9i7yjSEN0ZN7\nbtqBz2k9+46J4bkKXir0BMeEswKBgQDbP4yHzDOFojlcyscS3CRQx+kTSX6weoPz\nzGbz/rEpC86t5tsoleseqaokMABmgq7RUO4OXKjpbPOd6rImZKg1ilb7uJk691m+f\ndcbPURrbI71gdJbg9sZ3PVmY7slXCq26U1dexUC+mKIHXrlcyp4SwSgH9Cr4fhn5\n4/nxGth1FQKBgG0hGxg9n0ckbOtXUAlDi2s7VCV80puuZvOWMyIgnIXwK9Ncf0jZ\nnXftO4toQTcuInxJ7NmqfSihDFXr4YTZaFFu5YuZjVa2+5OPLmBq2n2a2ASfi5nI\n/SBMcrbLUAxbvrYGMjabK/9RkyA8bSLwzJfxNVndFCtKK5pvB9RAurfVAoGBAKCl\ni77k7Mt59jX7jqpPC3z1Pd6X93AwFQdKOhWGBSFiOWpKwUKYWGyR6yET4bNMnLEr\nelwE4QWBNss4KQpFOdGGj4PIJeILgXaBwc6eSuNO6LAIPZVQvFMabNAWBwj0Fh90\neYxDVBFTnUVxLrjC7dgoF8DcM7AoFbh4RudXGEuRAoGAFUi44GcHsaMCBUIuqfCo\niNSPHk0s0pewXOabCu0sU59tYD8dRNNr7BtLrwCiZ1tqAt57DBlBYWLPMSs8ORoe\nqWEQd+ZylgUXYz7fTix/r0aIJTqIJMAnCh3vx6ZA2FRjhiFNP76th3rWvIvmPe+q\n6Yk+lPPEK55uUdv33acTLCg=\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@earn-bot-2026.iam.gserviceaccount.com"
};

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();
const bot = new Telegraf(BOT_TOKEN);

// --- MAIN KEYBOARD ---
const mainBtn = Markup.inlineKeyboard([
  [Markup.button.callback('👤 My Dashboard', 'user_dashboard'), Markup.button.callback('🎁 Daily Bonus', 'get_bonus')],
  [Markup.button.url('📺 Watch Video (20 Coins)', SMART_LINK)],
  [Markup.button.callback('🔗 Invite & Earn (50 Coins)', 'get_invite'), Markup.button.callback('💰 Withdraw', 'withdraw_req')],
  [Markup.button.url('🔥 Earn Unlimited', SMART_LINK)]
]);

// --- START LOGIC ---
bot.start(async (ctx) => {
  const userId = ctx.from.id.toString();
  const userRef = db.collection('users').doc(userId);
  const doc = await userRef.get();

  if (!doc.exists) {
    await userRef.set({ id: userId, name: ctx.from.first_name, balance: 0, totalRefers: 0, lastDaily: 0 });
    
    // Referral Check
    const refId = ctx.startPayload;
    if (refId && refId !== userId) {
      const rRef = db.collection('users').doc(refId);
      const rDoc = await rRef.get();
      if (rDoc.exists) {
        await rRef.update({ balance: admin.firestore.FieldValue.increment(50), totalRefers: admin.firestore.FieldValue.increment(1) });
        bot.telegram.sendMessage(refId, "🎊 *Naya Referral!* Aapko 50 coins mile.");
      }
    }
  }

  const msg = `🔥 *SWAGAT HAI INDIA KE NO. 1 EARNING BOT MEIN!* 🔥\n\nAaj hi share karein aur unlimited paisa kamayein! 💸\n\n📢 *Mandatory Join:* ${CHANNEL}`;
  ctx.replyWithMarkdown(msg, mainBtn);
});

// --- USER DASHBOARD ---
bot.action('user_dashboard', async (ctx) => {
  const user = (await db.collection('users').doc(ctx.from.id.toString()).get()).data();
  const dash = `📊 *YOUR DASHBOARD*\n\n👤 Name: ${user.name}\n💰 Balance: ${user.balance} Coins\n👥 Refers: ${user.totalRefers}\n🆔 ID: ${user.id}`;
  ctx.editMessageText(dash, { parse_mode: 'Markdown', ...mainBtn });
});

// --- ADMIN DASHBOARD ---
bot.command('admin', async (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return ctx.reply("❌ Ye sirf Admin ke liye hai.");
  
  const total = (await db.collection('users').get()).size;
  const adminMsg = `👑 *ADMIN CONTROL PANEL*\n\n👥 Total Users: ${total}\n\n👉 Use /broadcast [Message] to alert everyone!`;
  ctx.replyWithMarkdown(adminMsg);
});

// --- ACTIONS ---
bot.action('get_bonus', async (ctx) => {
  const userRef = db.collection('users').doc(ctx.from.id.toString());
  const user = (await userRef.get()).data();
  if (Date.now() - user.lastDaily < 86400000) return ctx.answerCbQuery("❌ Aaj ka bonus mil chuka hai!", { show_alert: true });
  
  await userRef.update({ balance: admin.firestore.FieldValue.increment(10), lastDaily: Date.now() });
  ctx.answerCbQuery("✅ 10 Coins added!", { show_alert: true });
});

bot.action('get_invite', (ctx) => {
  ctx.reply(`🔗 *Aapka Link:* https://t.me/${ctx.botInfo.username}?start=${ctx.from.id}\n\nShare & Earn!`);
});

bot.action('withdraw_req', (ctx) => {
  ctx.replyWithMarkdown(`⚠️ *AD VERIFICATION*\n\nNiche button par click karke Ad dekhein, tabhi withdrawal khulega!`, 
  Markup.inlineKeyboard([[Markup.button.url('Unlock Withdrawal 🔓', SMART_LINK)]]));
});

// Export for Vercel
module.exports = async (req, res) => {
  if (req.method === 'POST') {
    await bot.handleUpdate(req.body);
    res.status(200).send('OK');
  } else {
    res.status(200).send('Bot is Running...');
  }
};
