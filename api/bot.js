// api/bot.js
// ============================================================
// earn-bot-2026 | Senior Full-Stack | Telegraf + Firebase
// Vercel Serverless Webhook Handler
// ============================================================

const { Telegraf, Markup, session } = require("telegraf");
const admin = require("firebase-admin");

// ─────────────────────────────────────────────
// 🔥 Firebase Initialization (Singleton Pattern)
// ─────────────────────────────────────────────
if (!admin.apps.length) {
  let serviceAccount;
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } catch (e) {
    console.error("❌ Invalid FIREBASE_SERVICE_ACCOUNT env variable:", e.message);
    process.exit(1);
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// ─────────────────────────────────────────────
// 🤖 Bot Initialization
// ─────────────────────────────────────────────
const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) throw new Error("❌ BOT_TOKEN is not set in environment variables.");

const bot = new Telegraf(BOT_TOKEN);

// ─────────────────────────────────────────────
// 📦 Constants & Config
// ─────────────────────────────────────────────
const CONFIG = {
  CHANNEL: "@Trendmansun",
  SMART_LINK: "https://horizontallyresearchpolar.com/r0wbx3kyf?key=8b0a2298684c7cea730312add326101b",
  DAILY_BONUS: 10,
  VIDEO_REWARD: 20,
  REFERRAL_REWARD: 50,
  MIN_WITHDRAWAL: 500,
  DAILY_COOLDOWN_MS: 24 * 60 * 60 * 1000, // 24 hours in ms
  VIDEO_COOLDOWN_MS: 60 * 60 * 1000,       // 1 hour per video watch
};

// ─────────────────────────────────────────────
// 🗄️ Firestore Helpers
// ─────────────────────────────────────────────

/**
 * Get or create a user document in Firestore.
 * @param {number} userId
 * @param {object} [defaultData]
 * @returns {Promise<object>}
 */
async function getOrCreateUser(userId, defaultData = {}) {
  const ref = db.collection("users").doc(String(userId));
  const snap = await ref.get();

  if (!snap.exists) {
    const newUser = {
      userId: userId,
      balance: 0,
      referrals: 0,
      referredBy: null,
      lastDailyClaim: null,
      lastVideoClaim: null,
      totalEarned: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      ...defaultData,
    };
    await ref.set(newUser);
    return newUser;
  }

  return snap.data();
}

/**
 * Update user fields atomically.
 * @param {number} userId
 * @param {object} updates
 */
async function updateUser(userId, updates) {
  const ref = db.collection("users").doc(String(userId));
  await ref.update(updates);
}

/**
 * Increment user balance and totalEarned.
 * @param {number} userId
 * @param {number} amount
 */
async function addCoins(userId, amount) {
  const ref = db.collection("users").doc(String(userId));
  await ref.update({
    balance: admin.firestore.FieldValue.increment(amount),
    totalEarned: admin.firestore.FieldValue.increment(amount),
  });
}

// ─────────────────────────────────────────────
// 🎨 UI Builder Helpers
// ─────────────────────────────────────────────

/**
 * Build the main inline keyboard menu.
 */
function mainMenuKeyboard(botUsername) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback("💰 Balance Check", "balance"),
      Markup.button.callback("🎁 Daily Bonus", "daily_bonus"),
    ],
    [
      Markup.button.url("📺 Watch Video & Earn 20 Coins", CONFIG.SMART_LINK),
      Markup.button.callback("✅ Verify Video Watch", "verify_video"),
    ],
    [
      Markup.button.callback("👥 Refer & Earn", "referral"),
      Markup.button.callback("💸 Withdraw", "withdraw"),
    ],
    [
      Markup.button.url("📢 Sponsor Ad — Click Here!", CONFIG.SMART_LINK),
    ],
    [
      Markup.button.url(`📡 Join Our Channel`, `https://t.me/${CONFIG.CHANNEL.replace("@", "")}`),
    ],
  ]);
}

/**
 * Format timestamp difference to human readable.
 */
function formatTimeLeft(ms) {
  if (ms <= 0) return "अभी available है!";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${h}h ${m}m ${s}s`;
}

// ─────────────────────────────────────────────
// 🚀 /start Command — Welcome + Referral Handler
// ─────────────────────────────────────────────
bot.start(async (ctx) => {
  try {
    const userId = ctx.from.id;
    const firstName = ctx.from.first_name || "Dost";
    const username = ctx.botInfo?.username || "earn_bot";
    const startParam = ctx.startPayload; // referral ID from deep link

    // Get or create user
    let userData = await getOrCreateUser(userId);

    // ── Process Referral ──────────────────────
    if (
      startParam &&
      startParam !== String(userId) &&
      !userData.referredBy
    ) {
      const referrerId = parseInt(startParam);
      if (!isNaN(referrerId)) {
        const referrerData = await getOrCreateUser(referrerId);

        // Credit referrer
        await addCoins(referrerId, CONFIG.REFERRAL_REWARD);
        await updateUser(referrerId, {
          referrals: admin.firestore.FieldValue.increment(1),
        });

        // Mark new user as referred
        await updateUser(userId, { referredBy: referrerId });
        userData.referredBy = referrerId;

        // Notify referrer
        try {
          await ctx.telegram.sendMessage(
            referrerId,
            `🎉 *बधाई हो!* ek naya user aapke referral se join hua!\n\n` +
              `🪙 *+${CONFIG.REFERRAL_REWARD} Coins* aapke wallet mein add ho gaye!\n` +
              `👤 Referred User: *${firstName}*\n\n` +
              `_Aur invite karo, aur zyada kamao!_ 🚀`,
            { parse_mode: "Markdown" }
          );
        } catch (_) {
          // Referrer may have blocked the bot — ignore silently
        }
      }
    }

    // Re-fetch updated user data
    userData = await getOrCreateUser(userId);

    // ── Welcome Message ───────────────────────
    const welcomeMsg =
      `🌟 *Swagat hai, ${firstName}!* 🌟\n\n` +
      `💎 *Earn Bot 2026* mein aapka dil se swagat hai!\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `🔥 *Ghar baithe Paise Kamao!*\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `✅ Har roz *${CONFIG.DAILY_BONUS} Coins* FREE\n` +
      `📺 Video dekhkar *${CONFIG.VIDEO_REWARD} Coins* earn karo\n` +
      `👥 Dosto ko refer karke *${CONFIG.REFERRAL_REWARD} Coins* per referral\n` +
      `💸 *₹ mein withdraw* karo jab chaaho!\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `💰 *Aapka Current Balance:* ${userData.balance} Coins\n` +
      `👥 *Total Referrals:* ${userData.referrals}\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `⬇️ *Niche diye buttons use karo aur aaj se kamaana shuru karo!* 💪`;

    await ctx.replyWithMarkdown(welcomeMsg, mainMenuKeyboard(username));
  } catch (err) {
    console.error("Error in /start:", err);
    await ctx.reply("⚠️ Kuch galat ho gaya. Please /start dobara try karo.");
  }
});

// ─────────────────────────────────────────────
// 💰 Balance Check
// ─────────────────────────────────────────────
bot.action("balance", async (ctx) => {
  try {
    await ctx.answerCbQuery();
    const userId = ctx.from.id;
    const userData = await getOrCreateUser(userId);
    const username = ctx.botInfo?.username || "earn_bot";

    const msg =
      `💳 *Aapka Wallet Statement*\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `💰 *Current Balance:* ${userData.balance} Coins\n` +
      `📊 *Total Ever Earned:* ${userData.totalEarned || 0} Coins\n` +
      `👥 *Total Referrals:* ${userData.referrals || 0}\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `🎯 *Withdrawal ke liye minimum:* ${CONFIG.MIN_WITHDRAWAL} Coins\n` +
      `📈 *Abhi chahiye:* ${Math.max(0, CONFIG.MIN_WITHDRAWAL - userData.balance)} more coins\n\n` +
      `_Aur coins kamao referrals aur daily bonus se!_ 🚀`;

    await ctx.editMessageText(msg, {
      parse_mode: "Markdown",
      ...mainMenuKeyboard(username),
    });
  } catch (err) {
    console.error("Error in balance:", err);
    await ctx.answerCbQuery("⚠️ Error. Please try again.");
  }
});

// ─────────────────────────────────────────────
// 🎁 Daily Bonus
// ─────────────────────────────────────────────
bot.action("daily_bonus", async (ctx) => {
  try {
    await ctx.answerCbQuery();
    const userId = ctx.from.id;
    const userData = await getOrCreateUser(userId);
    const username = ctx.botInfo?.username || "earn_bot";
    const now = Date.now();

    // Check cooldown
    const lastClaim = userData.lastDailyClaim
      ? userData.lastDailyClaim.toMillis
        ? userData.lastDailyClaim.toMillis()
        : Number(userData.lastDailyClaim)
      : 0;

    const diff = now - lastClaim;

    if (diff < CONFIG.DAILY_COOLDOWN_MS) {
      const remaining = CONFIG.DAILY_COOLDOWN_MS - diff;
      await ctx.editMessageText(
        `⏳ *Daily Bonus Already Claimed!*\n\n` +
          `🕐 Aapka next bonus:\n` +
          `⏱️ *${formatTimeLeft(remaining)}* mein milega\n\n` +
          `_Tab tak refer karo aur aur coins kamao!_ 💪`,
        {
          parse_mode: "Markdown",
          ...mainMenuKeyboard(username),
        }
      );
      return;
    }

    // Credit coins
    await addCoins(userId, CONFIG.DAILY_BONUS);
    await updateUser(userId, {
      lastDailyClaim: admin.firestore.Timestamp.now(),
    });

    const updatedUser = await getOrCreateUser(userId);

    await ctx.editMessageText(
      `🎉 *Daily Bonus Mila!* 🎉\n\n` +
        `🪙 *+${CONFIG.DAILY_BONUS} Coins* aapke wallet mein add!\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `💰 *New Balance:* ${updatedUser.balance} Coins\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `✅ Kal aao aur phir bonus lo!\n` +
        `👥 Refer karo aur *${CONFIG.REFERRAL_REWARD} coins* per referral kamao! 🚀`,
      {
        parse_mode: "Markdown",
        ...mainMenuKeyboard(username),
      }
    );
  } catch (err) {
    console.error("Error in daily_bonus:", err);
    await ctx.answerCbQuery("⚠️ Error. Please try again.");
  }
});

// ─────────────────────────────────────────────
// 📺 Verify Video Watch
// ─────────────────────────────────────────────
bot.action("verify_video", async (ctx) => {
  try {
    await ctx.answerCbQuery();
    const userId = ctx.from.id;
    const userData = await getOrCreateUser(userId);
    const username = ctx.botInfo?.username || "earn_bot";
    const now = Date.now();

    // Check 1-hour cooldown
    const lastVideo = userData.lastVideoClaim
      ? userData.lastVideoClaim.toMillis
        ? userData.lastVideoClaim.toMillis()
        : Number(userData.lastVideoClaim)
      : 0;

    const diff = now - lastVideo;

    if (diff < CONFIG.VIDEO_COOLDOWN_MS) {
      const remaining = CONFIG.VIDEO_COOLDOWN_MS - diff;
      await ctx.editMessageText(
        `⏳ *Video Reward Already Claimed!*\n\n` +
          `🕐 Next video reward:\n` +
          `⏱️ *${formatTimeLeft(remaining)}* mein milega\n\n` +
          `_Tab tak daily bonus aur referral se earn karo!_ 💪`,
        {
          parse_mode: "Markdown",
          ...mainMenuKeyboard(username),
        }
      );
      return;
    }

    // Credit coins
    await addCoins(userId, CONFIG.VIDEO_REWARD);
    await updateUser(userId, {
      lastVideoClaim: admin.firestore.Timestamp.now(),
    });

    const updatedUser = await getOrCreateUser(userId);

    await ctx.editMessageText(
      `📺 *Video Reward Credited!* ✅\n\n` +
        `🪙 *+${CONFIG.VIDEO_REWARD} Coins* aapke wallet mein!\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `💰 *New Balance:* ${updatedUser.balance} Coins\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `🔄 Har 1 ghante mein phir video dekho!\n` +
        `🚀 Zyada kamao, zyada withdraw karo!`,
      {
        parse_mode: "Markdown",
        ...mainMenuKeyboard(username),
      }
    );
  } catch (err) {
    console.error("Error in verify_video:", err);
    await ctx.answerCbQuery("⚠️ Error. Please try again.");
  }
});

// ─────────────────────────────────────────────
// 👥 Referral System
// ─────────────────────────────────────────────
bot.action("referral", async (ctx) => {
  try {
    await ctx.answerCbQuery();
    const userId = ctx.from.id;
    const userData = await getOrCreateUser(userId);
    const username = ctx.botInfo?.username || "earn_bot";

    const referralLink = `https://t.me/${username}?start=${userId}`;

    const msg =
      `👥 *Refer & Earn Program* 🚀\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `💎 *Har Referral = ${CONFIG.REFERRAL_REWARD} Coins*\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `🔗 *Aapka Unique Referral Link:*\n` +
      `\`${referralLink}\`\n\n` +
      `📊 *Aapke Stats:*\n` +
      `👥 Total Referrals: *${userData.referrals || 0}*\n` +
      `🪙 Referral Se Kamaye: *${(userData.referrals || 0) * CONFIG.REFERRAL_REWARD} Coins*\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `📤 *Apna link share karo:*\n` +
      `WhatsApp, Instagram, Facebook — jahan chaaho!\n\n` +
      `_Jitna zyada invite karoge, utna zyada kamao!_ 💪💰`;

    await ctx.editMessageText(msg, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [Markup.button.url("📤 Share on Telegram", `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent("🔥 Earn Bot se Ghar baithe paise kamao! Join karo mere link se 👇")}`)],
        [Markup.button.callback("🏠 Main Menu", "back_to_menu")],
      ]),
    });
  } catch (err) {
    console.error("Error in referral:", err);
    await ctx.answerCbQuery("⚠️ Error. Please try again.");
  }
});

// ─────────────────────────────────────────────
// 💸 Withdraw (with Mandatory Ad)
// ─────────────────────────────────────────────
bot.action("withdraw", async (ctx) => {
  try {
    await ctx.answerCbQuery();
    const userId = ctx.from.id;
    const userData = await getOrCreateUser(userId);
    const username = ctx.botInfo?.username || "earn_bot";

    // ── STEP 1: Show Mandatory Ad First ────────
    await ctx.editMessageText(
      `💸 *Withdrawal Process*\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `⚠️ *Withdrawal activate karne ke liye*\n` +
        `niche diye *Sponsor Ad* par click karo!\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `🪙 *Aapka Balance:* ${userData.balance} Coins\n` +
        `🎯 *Minimum Withdrawal:* ${CONFIG.MIN_WITHDRAWAL} Coins\n\n` +
        `_Ad click karne ke baad "Proceed" button aayega_ ✅`,
      {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [Markup.button.url("🎯 Click Sponsor Ad to Unlock Withdrawal", CONFIG.SMART_LINK)],
          [Markup.button.callback("✅ I Clicked the Ad — Proceed", "withdraw_proceed")],
          [Markup.button.callback("🏠 Main Menu", "back_to_menu")],
        ]),
      }
    );
  } catch (err) {
    console.error("Error in withdraw:", err);
    await ctx.answerCbQuery("⚠️ Error. Please try again.");
  }
});

bot.action("withdraw_proceed", async (ctx) => {
  try {
    await ctx.answerCbQuery();
    const userId = ctx.from.id;
    const userData = await getOrCreateUser(userId);
    const username = ctx.botInfo?.username || "earn_bot";

    if (userData.balance < CONFIG.MIN_WITHDRAWAL) {
      const needed = CONFIG.MIN_WITHDRAWAL - userData.balance;
      await ctx.editMessageText(
        `❌ *Insufficient Balance!*\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `💰 *Current Balance:* ${userData.balance} Coins\n` +
          `🎯 *Minimum Needed:* ${CONFIG.MIN_WITHDRAWAL} Coins\n` +
          `📉 *Abhi chahiye:* ${needed} more Coins\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `💡 *Zyada kamane ke tarike:*\n` +
          `• 👥 Refer karo — ${CONFIG.REFERRAL_REWARD} Coins each\n` +
          `• 📺 Video dekho — ${CONFIG.VIDEO_REWARD} Coins\n` +
          `• 🎁 Daily Bonus — ${CONFIG.DAILY_BONUS} Coins\n\n` +
          `_Jaldi karo, aur coins kamao!_ 🚀`,
        {
          parse_mode: "Markdown",
          ...mainMenuKeyboard(username),
        }
      );
      return;
    }

    // Sufficient balance — show withdrawal form message
    await ctx.editMessageText(
      `✅ *Withdrawal Request Ready!*\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `💰 *Withdrawable Balance:* ${userData.balance} Coins\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `📨 Apna *UPI ID / Phone Number* type karke\n` +
        `admin ko message karo:\n\n` +
        `🔑 *Aapka User ID:* \`${userId}\`\n` +
        `💰 *Amount:* ${userData.balance} Coins\n\n` +
        `📩 Admin Contact: ${CONFIG.CHANNEL}\n\n` +
        `⏰ *Processing Time:* 24-48 hours\n` +
        `_Hamare channel mein withdrawal status check karo!_ ✅`,
      {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [Markup.button.url(`📩 Contact Admin on Channel`, `https://t.me/${CONFIG.CHANNEL.replace("@", "")}`)],
          [Markup.button.callback("🏠 Main Menu", "back_to_menu")],
        ]),
      }
    );
  } catch (err) {
    console.error("Error in withdraw_proceed:", err);
    await ctx.answerCbQuery("⚠️ Error. Please try again.");
  }
});

// ─────────────────────────────────────────────
// 🏠 Back to Main Menu
// ─────────────────────────────────────────────
bot.action("back_to_menu", async (ctx) => {
  try {
    await ctx.answerCbQuery();
    const userId = ctx.from.id;
    const firstName = ctx.from.first_name || "Dost";
    const userData = await getOrCreateUser(userId);
    const username = ctx.botInfo?.username || "earn_bot";

    await ctx.editMessageText(
      `🏠 *Main Menu*\n\n` +
        `Namaste, *${firstName}!* 👋\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `💰 *Balance:* ${userData.balance} Coins\n` +
        `👥 *Referrals:* ${userData.referrals || 0}\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `Kya karna chahte ho aaj? 👇`,
      {
        parse_mode: "Markdown",
        ...mainMenuKeyboard(username),
      }
    );
  } catch (err) {
    console.error("Error in back_to_menu:", err);
  }
});

// ─────────────────────────────────────────────
// ❓ Help Command
// ─────────────────────────────────────────────
bot.command("help", async (ctx) => {
  const username = ctx.botInfo?.username || "earn_bot";
  await ctx.replyWithMarkdown(
    `❓ *Help & Guide*\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `🤖 *Earn Bot 2026 — How it Works*\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `🎁 *Daily Bonus* — Har roz ${CONFIG.DAILY_BONUS} Coins FREE\n` +
      `📺 *Video Task* — ${CONFIG.VIDEO_REWARD} Coins per video (har 1 ghante mein)\n` +
      `👥 *Referral* — ${CONFIG.REFERRAL_REWARD} Coins jab koi aapke link se join kare\n` +
      `💸 *Withdraw* — ${CONFIG.MIN_WITHDRAWAL} Coins se shuru\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `📋 *Commands:*\n` +
      `/start — Bot shuru karo\n` +
      `/help — Ye help message\n` +
      `/balance — Balance dekho\n\n` +
      `📡 Support: ${CONFIG.CHANNEL}`,
    mainMenuKeyboard(username)
  );
});

// ─────────────────────────────────────────────
// 💰 /balance Command
// ─────────────────────────────────────────────
bot.command("balance", async (ctx) => {
  try {
    const userId = ctx.from.id;
    const userData = await getOrCreateUser(userId);
    const username = ctx.botInfo?.username || "earn_bot";

    await ctx.replyWithMarkdown(
      `💳 *Balance:* ${userData.balance} Coins\n` +
        `👥 *Referrals:* ${userData.referrals || 0}\n` +
        `📊 *Total Earned:* ${userData.totalEarned || 0} Coins`,
      mainMenuKeyboard(username)
    );
  } catch (err) {
    console.error("Error in /balance:", err);
    await ctx.reply("⚠️ Error fetching balance. Try again.");
  }
});

// ─────────────────────────────────────────────
// 🌐 Vercel Serverless Handler (Webhook)
// ─────────────────────────────────────────────
module.exports = async (req, res) => {
  // Health check
  if (req.method === "GET") {
    return res.status(200).json({
      status: "✅ earn-bot-2026 is running",
      timestamp: new Date().toISOString(),
    });
  }

  if (req.method === "POST") {
    try {
      await bot.handleUpdate(req.body, res);
    } catch (err) {
      console.error("Webhook Error:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
    return;
  }

  res.status(405).json({ error: "Method Not Allowed" });
};
