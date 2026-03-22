const { Telegraf, Markup } = require('telegraf');
const admin = require('firebase-admin');

// --- CREDENTIALS ---
const BOT_TOKEN = '8784543392:AAEybNnS-v5VUdwB1jNeK38bU3EFCds99-w';
const ADMIN_ID = 8711347335;

// Firebase Setup
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

// --- DASHBOARD DATA LISTENER ---
bot.on('web_app_data', async (ctx) => {
    const data = ctx.webAppData.data;
    const userId = ctx.from.id.toString();
    const userRef = db.collection('users').doc(userId);

    // 1. Video Reward Logic
    if (data === "VIDEO_REWARD") {
        await userRef.update({ balance: admin.firestore.FieldValue.increment(20) });
        await ctx.reply("✅ Badhai Ho! Aapne 15s video dekhi aur 20 Points kama liye! 💰");
    }

    // 2. Daily Claim Logic
    if (data === "DAILY_CLAIM") {
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
});

// Start Command
bot.start((ctx) => {
    ctx.reply("🔥 Welcome to TrendBot! 🔥\nNiche button dabakar Earning shuru karein.", 
    Markup.keyboard([
        [Markup.button.webApp("🚀 Open Dashboard", "https://earn-bot-2026.vercel.app")]
    ]).resize());
});

module.exports = async (req, res) => {
    if (req.method === 'POST') {
        await bot.handleUpdate(req.body);
        res.status(200).send('OK');
    } else {
        res.status(200).send('Bot Running...');
    }
};
