const { Telegraf, Markup } = require('telegraf');
const admin = require('firebase-admin');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');

// ---------- Firebase Initialization ----------
const serviceAccount = {
  type: "service_account",
  project_id: "earn-bot-2026",
  private_key_id: "8d73b0726ada86417f4cd27fa7dfbb9fd245cbae",
  private_key: `-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDEKKchAAWv6HB2\nXeywJm38LBYtRKs/0UPLNkM69YkYQuHDuC0uI5IV8y74W+4cmgydhfCsILwWn/YJ\n7OV+8LOL7PhYI87TbuQ3t25z2GyUoeFSdjy4bPGXcPre8z3WgCUxgmvD/ZkxuCiP\npJBzVF+uXc2l0v6SRPyY9uScSS3AlML/LJ7Gs1kU1yQQQts6A1GuWN6papIEiBAd\nXGqt6diCpyhItA4lLmYY7fVJe27b8kqmzV76S2zh1uY3cqCgsdaXGoED3RI9ssow\nhbBH4m4sYnwzszkiJo453+GdFS32Z9vb0KAztxSTsgJacg73q8QXe59zVE+Kkj9a\nX4i5C7GvAgMBAAECggEAKgXriA5RKZZKQZFtm28gMN3hAmGrrkhOlcJSNNdVP3VU\nmHFkfHXyXfFzJpHLOSVnfnerT7TTlqU+OHIf2EoIrPlfWsKRFIq1KZqKdxbubAki\nFGBwMbJlL2Rs2kaSANoDHdAq9hnmL9icF+nRaGOy+8/stpG1J/DPjJWX9ENZIeBc\nvCzJcnZkxzz5He0Qc/YTJQBUeo6i0WiX+JqW3beNASHjFwNc6YFlP0FM1p0MF2fh\nsc7j1IEgmvzQaTgK5FP+RJt3rqyysLUj/IBYBs5+9m3mXLZ4I/LlcKojiVuqAR+8\nh7B4SGRC0NJWzKicSbL9g5HBC4imW3oMVux5D+0bwQKBgQDlCkhR7FpZ+2jSTfoi\nfrftTDCbL2+mBhacXgpVIQcvq6ueipKpg+359JVpNx0ynGeD4ZPHdYmb/7Z4H4re\nZQM4etW70MkXCjN5LVHVBKoA7dy+Mmerj/g0rcNTjqhCVsNdDt+n9i7yjSEN0ZN7\nbtqBz2k9+46J4bkKXir0BMeEswKBgQDbP4yHzDOFojlcyscS3CRQx+kTSX6weoPz\nzGbz/rEpC86t5tsoleseqaokMABmgq7RUO4OXKjpbPOd6rImZKg1ilb7uJk691m+f\ndcbPURrbI71gdJbg9sZ3PVmY7slXCq26U1dexUC+mKIHXrlcyp4SwSgH9Cr4fhn5\n4/nxGth1FQKBgG0hGxg9n0ckbOtXUAlDi2s7VCV80puuZvOWMyIgnIXwK9Ncf0jZ\nnXftO4toQTcuInxJ7NmqfSihDFXr4YTZaFFu5YuZjVa2+5OPLmBq2n2a2ASfi5nI\n/SBMcrbLUAxbvrYGMjabK/9RkyA8bSLwzJfxNVndFCtKK5pvB9RAurfVAoGBAKCl\ni77k7Mt59jX7jqpPC3z1Pd6X93AwFQdKOhWGBSFiOWpKwUKYWGyR6yET4bNMnLEr\nelwE4QWBNss4KQpFOdGGj4PIJeILgXaBwc6eSuNO6LAIPZVQvFMabNAWBwj0Fh90\neYxDVBFTnUVxLrjC7dgoF8DcM7AoFbh4RudXGEuRAoGAFUi44GcHsaMCBUIuqfCo\niNSPHk0s0pewXOabCu0sU59tYD8dRNNr7BtLrwCiZ1tqAt57DBlBYWLPMSs8ORoe\nqWEQd+ZylgUXYz7fTix/r0aIJTqIJMAnCh3vx6ZA2FRjhiFNP76th3rWvIvmPe+q\n6Yk+lPPEK55uUdv33acTLCg=\n-----END PRIVATE KEY-----\n`,
  client_email: "firebase-adminsdk-fbsvc@earn-bot-2026.iam.gserviceaccount.com"
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
const db = getFirestore();

// ---------- Bot Setup ----------
const BOT_TOKEN = "8784543392:AAEybNnS-v5VUdwB1jNeK38bU3EFCds99-w";
const ADMIN_ID = 8711347335;
const SMART_LINK = "https://horizontallyresearchpolar.com/r0wbx3kyf?key=8b0a2298684c7cea730312add326101b";
const CHANNEL = "@Trendmansun";

const bot = new Telegraf(BOT_TOKEN);

// ---------- Helper Functions ----------
async function getUser(userId) {
  const doc = await db.collection('users').doc(String(userId)).get();
  if (!doc.exists) return null;
  return { id: userId, ...doc.data() };
}

async function createUser(userId, name, referredBy = null) {
  const userRef = db.collection('users').doc(String(userId));
  const userData = {
    name,
    balance: 0,
    totalRefers: 0,
    referredBy,
    dailyBonusLastClaim: null,
    videoTaskLastClaim: null,
    adClicked: false,
    createdAt: Timestamp.now(),
  };
  await userRef.set(userData);
  return { id: userId, ...userData };
}

async function updateUser(userId, data) {
  const userRef = db.collection('users').doc(String(userId));
  await userRef.update(data);
}

async function addCoins(userId, amount, type) {
  const user = await getUser(userId);
  if (!user) return false;
  const newBalance = user.balance + amount;
  await updateUser(userId, { balance: newBalance });
  // You could log transactions in a separate collection if needed
  return true;
}

// ---------- Markup Helpers ----------
const mainMenuKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('📊 Dashboard', 'dashboard')],
  [Markup.button.callback('🎁 Daily Bonus (10💰)', 'daily_bonus')],
  [Markup.button.callback('🎬 Video Task (20💰)', 'video_task')],
  [Markup.button.callback('👥 Referral', 'referral')],
  [Markup.button.callback('💸 Withdraw', 'withdraw')],
  [Markup.button.url('🔥 Earn Unlimited', SMART_LINK)], // Sticky ad
]);

// Admin menu (only for admin)
const adminMenuKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('📢 Broadcast', 'admin_broadcast')],
  [Markup.button.callback('📊 Total Stats', 'admin_stats')],
  [Markup.button.callback('🔙 Back', 'back_to_main')],
]);

// ---------- Bot Handlers ----------

// Start command (handles deep‑link referrals)
bot.start(async (ctx) => {
  const userId = ctx.from.id;
  const username = ctx.from.first_name || ctx.from.username || 'User';
  const refParam = ctx.startPayload; // e.g., ref_12345

  let user = await getUser(userId);
  if (!user) {
    let referredBy = null;
    if (refParam && refParam.startsWith('ref_')) {
      const referrerId = refParam.split('_')[1];
      if (referrerId !== String(userId)) {
        const referrer = await getUser(referrerId);
        if (referrer) {
          referredBy = referrerId;
          // Give 50 coins to referrer
          await addCoins(referrerId, 50, 'referral');
          // Increment referrer's totalRefers
          await updateUser(referrerId, { totalRefers: admin.firestore.FieldValue.increment(1) });
          // Notify referrer
          await ctx.telegram.sendMessage(referrerId, `🎉 Someone joined using your link! You earned 50💰.`);
        }
      }
    }
    user = await createUser(userId, username, referredBy);
    // Welcome message (high‑energy Hindi/Hinglish)
    const welcomeMsg = `🔥 *NAMASTE! ${username}* 🔥\n\n` +
      `Aap ab *FINANCIALLY INDEPENDENT* banne ki raah pe ho! 💪\n` +
      `Is bot se *UNLIMITED COINS* kamao aur apne dosto ko bulao. 🚀\n\n` +
      `👇 *Abhi kamaana shuru karo* 👇`;
    await ctx.replyWithMarkdown(welcomeMsg, mainMenuKeyboard);
  } else {
    await ctx.reply(`Welcome back, ${user.name}!`, mainMenuKeyboard);
  }
});

// Dashboard
bot.action('dashboard', async (ctx) => {
  const userId = ctx.from.id;
  const user = await getUser(userId);
  if (!user) return ctx.reply('Please use /start first.');
  const text = `📊 *Your Dashboard* 📊\n\n` +
    `👤 Name: ${user.name}\n` +
    `💰 Balance: ${user.balance} coins\n` +
    `👥 Total Refers: ${user.totalRefers}\n` +
    `🆔 User ID: ${userId}\n` +
    `🔗 Referral Link: https://t.me/${ctx.botInfo.username}?start=ref_${userId}`;
  await ctx.editMessageText(text, { parse_mode: 'Markdown', ...mainMenuKeyboard });
});

// Daily Bonus (10 coins every 24h)
bot.action('daily_bonus', async (ctx) => {
  const userId = ctx.from.id;
  const user = await getUser(userId);
  if (!user) return ctx.reply('Please use /start first.');

  const now = Timestamp.now();
  const lastClaim = user.dailyBonusLastClaim;
  if (lastClaim) {
    const diff = now.toDate() - lastClaim.toDate();
    const hoursLeft = 24 - diff / (1000 * 3600);
    if (diff < 24 * 3600 * 1000) {
      return ctx.answerCbQuery(`⏳ Wait ${Math.ceil(hoursLeft)} hours for next bonus!`, { show_alert: true });
    }
  }

  await addCoins(userId, 10, 'daily_bonus');
  await updateUser(userId, { dailyBonusLastClaim: now });
  await ctx.answerCbQuery('🎉 You got 10 coins!');
  await ctx.editMessageText(`✅ Daily bonus claimed! +10💰\nYour new balance: ${user.balance + 10}`, mainMenuKeyboard);
});

// Video Task (20 coins, once per day)
bot.action('video_task', async (ctx) => {
  const userId = ctx.from.id;
  const user = await getUser(userId);
  if (!user) return ctx.reply('Please use /start first.');

  const now = Timestamp.now();
  const lastClaim = user.videoTaskLastClaim;
  if (lastClaim) {
    const diff = now.toDate() - lastClaim.toDate();
    if (diff < 24 * 3600 * 1000) {
      return ctx.answerCbQuery('⏳ You already claimed video reward today! Come back tomorrow.', { show_alert: true });
    }
  }

  // Send video link + claim button
  const msg = await ctx.reply(
    `🎬 *Watch a 15‑second video* 🎬\n\n` +
    `👉 [Click here to watch](${SMART_LINK})\n\n` +
    `After watching, press the button below to claim 20💰.`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([Markup.button.callback('✅ Claim 20 Coins', `claim_video_${userId}`)]),
    }
  );

  // Store a temporary flag to ensure they clicked the link? Not needed – we just check 24h cooldown.
  // The claim button will verify the cooldown again.
  await ctx.answerCbQuery('Watch the video and then click Claim!');
});

bot.action(/claim_video_(\d+)/, async (ctx) => {
  const userId = ctx.from.id;
  const expectedUserId = ctx.match[1];
  if (userId.toString() !== expectedUserId) return ctx.answerCbQuery('This is not your claim!', { show_alert: true });

  const user = await getUser(userId);
  if (!user) return ctx.reply('Please use /start first.');

  const now = Timestamp.now();
  const lastClaim = user.videoTaskLastClaim;
  if (lastClaim) {
    const diff = now.toDate() - lastClaim.toDate();
    if (diff < 24 * 3600 * 1000) {
      return ctx.answerCbQuery('⏳ You already claimed video reward today!', { show_alert: true });
    }
  }

  await addCoins(userId, 20, 'video_task');
  await updateUser(userId, { videoTaskLastClaim: now });
  await ctx.answerCbQuery('🎉 +20 coins earned!');
  await ctx.deleteMessage();
  await ctx.reply(`✅ Video reward claimed! +20💰\nYour new balance: ${user.balance + 20}`, mainMenuKeyboard);
});

// Referral – show link
bot.action('referral', async (ctx) => {
  const userId = ctx.from.id;
  const user = await getUser(userId);
  if (!user) return ctx.reply('Please use /start first.');
  const link = `https://t.me/${ctx.botInfo.username}?start=ref_${userId}`;
  const text = `👥 *Referral Program* 👥\n\n` +
    `Share this link with your friends:\n` +
    `\`${link}\`\n\n` +
    `For every friend who joins, you get *50💰*!`;
  await ctx.editMessageText(text, { parse_mode: 'Markdown', ...mainMenuKeyboard });
});

// Withdraw – mandatory ad click check
bot.action('withdraw', async (ctx) => {
  const userId = ctx.from.id;
  const user = await getUser(userId);
  if (!user) return ctx.reply('Please use /start first.');

  if (!user.adClicked) {
    // User hasn't clicked the ad yet – force them to do so
    await ctx.editMessageText(
      `🔒 *Ad Verification Required* 🔒\n\n` +
      `To withdraw your earnings, you must first click the ad below and then confirm.\n\n` +
      `👉 [Click here to watch ad](${SMART_LINK})`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([Markup.button.callback('✅ I clicked the ad', 'confirm_ad_click')]),
      }
    );
  } else {
    // Withdrawal flow
    const minWithdrawal = 100; // example minimum
    if (user.balance < minWithdrawal) {
      await ctx.editMessageText(
        `💸 *Withdrawal* 💸\n\n` +
        `Your balance: ${user.balance}💰\n` +
        `Minimum withdrawal: ${minWithdrawal}💰\n\n` +
        `Keep earning to reach the threshold!`,
        { parse_mode: 'Markdown', ...mainMenuKeyboard }
      );
    } else {
      // In a real bot, you'd ask for payment details and process.
      await ctx.editMessageText(
        `💸 *Withdrawal Request* 💸\n\n` +
        `Your balance: ${user.balance}💰\n` +
        `Please contact @SupportBot to complete withdrawal.\n\n` +
        `We'll process soon!`,
        { parse_mode: 'Markdown', ...mainMenuKeyboard }
      );
    }
  }
});

// Confirm ad click (sets flag and then shows withdrawal again)
bot.action('confirm_ad_click', async (ctx) => {
  const userId = ctx.from.id;
  const user = await getUser(userId);
  if (!user) return ctx.reply('Please use /start first.');

  await updateUser(userId, { adClicked: true });
  await ctx.answerCbQuery('✅ Ad confirmed! You can now withdraw.');
  // Re‑run withdraw action to show withdrawal screen
  await ctx.editMessageText(`Ad verification complete! You can now withdraw.`);
  // Optionally redirect to withdraw menu
  await ctx.reply('💸 *Withdrawal* 💸\n\nYou can now withdraw your earnings.', {
    parse_mode: 'Markdown',
    ...mainMenuKeyboard,
  });
});

// Admin handlers (only for ADMIN_ID)
bot.action(/^admin_/, async (ctx) => {
  if (ctx.from.id !== ADMIN_ID) {
    await ctx.answerCbQuery('⛔ You are not an admin.', { show_alert: true });
    return;
  }

  const action = ctx.match[0]; // e.g., 'admin_broadcast'
  switch (action) {
    case 'admin_broadcast':
      await ctx.editMessageText('📢 Send the message you want to broadcast to all users.\n(Type /cancel to cancel)', adminMenuKeyboard);
      // We need to store admin state in a temporary session – we'll use a simple object
      ctx.session = ctx.session || {};
      ctx.session.broadcastMode = true;
      break;
    case 'admin_stats':
      const usersSnapshot = await db.collection('users').get();
      const totalUsers = usersSnapshot.size;
      let totalBalance = 0;
      let totalRefers = 0;
      usersSnapshot.forEach(doc => {
        const data = doc.data();
        totalBalance += data.balance || 0;
        totalRefers += data.totalRefers || 0;
      });
      const statsText = `📊 *Total Stats* 📊\n\n` +
        `👥 Total Users: ${totalUsers}\n` +
        `💰 Total Balance: ${totalBalance} coins\n` +
        `👥 Total Refers: ${totalRefers}\n` +
        `🎁 Daily Bonus: 10 coins/day\n` +
        `🎬 Video Task: 20 coins/day\n` +
        `👥 Referral Bonus: 50 coins/friend`;
      await ctx.editMessageText(statsText, { parse_mode: 'Markdown', ...adminMenuKeyboard });
      break;
    case 'back_to_main':
      await ctx.editMessageText('Main Menu:', mainMenuKeyboard);
      break;
  }
});

// Handle text messages (for broadcast)
bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  // Admin broadcast mode
  if (ctx.from.id === ADMIN_ID && ctx.session && ctx.session.broadcastMode) {
    const broadcastText = ctx.message.text;
    if (broadcastText === '/cancel') {
      delete ctx.session.broadcastMode;
      await ctx.reply('Broadcast cancelled.', mainMenuKeyboard);
      return;
    }
    // Get all users
    const usersSnapshot = await db.collection('users').get();
    let successCount = 0;
    let failCount = 0;
    for (const doc of usersSnapshot.docs) {
      const uid = doc.id;
      try {
        await ctx.telegram.sendMessage(uid, broadcastText, { parse_mode: 'Markdown' });
        successCount++;
      } catch (err) {
        failCount++;
      }
    }
    await ctx.reply(`📢 Broadcast finished.\n✅ Sent: ${successCount}\n❌ Failed: ${failCount}`, mainMenuKeyboard);
    delete ctx.session.broadcastMode;
  }
});

// Simple inline menu back to main
bot.action('back_to_main', async (ctx) => {
  await ctx.editMessageText('Main Menu:', mainMenuKeyboard);
});

// Catch all actions – default fallback
bot.action(/.*/, (ctx) => ctx.answerCbQuery('Action not recognized'));

// ---------- Webhook Handler for Vercel ----------
module.exports = async (req, res) => {
  if (req.method === 'POST') {
    try {
      await bot.handleUpdate(req.body, res);
      res.status(200).send('OK');
    } catch (error) {
      console.error('Error handling update:', error);
      res.status(500).send('Internal Server Error');
    }
  } else {
    res.status(405).send('Method Not Allowed');
  }
};
