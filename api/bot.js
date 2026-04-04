const { Telegraf, Markup } = require('telegraf');
const admin = require('firebase-admin');

// 1. FIREBASE CONFIGURATION (Directly from your JSON)
const serviceAccount = {
  "type": "service_account",
  "project_id": "earn-bot-2026",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCxSCOxygiA8fpe\ncyhKK2/1Cq/kAbkAvES7RYOjTBMU29LIDEEN9aYGZjl/gq4MsS/Hahhdo7X1OeHm\nDkOBu0qwz9Iy7vZ1VH9U9sAo7/SNm543dwYVHRe7X2MdncQb2Wa/+/Oo1IhNTPex\nd5pVFTrtjTaj0jNJSkk4OPawOu1DpgE8OAC24Fu/AHou6oXMyVq86L7SYr5Egn6R\n2BXDxh5vt+jYHoSWC+pd3s13BUTXolczvZumpIltz5OiS9m/RjJ5AjMK8Qnnh8Zl\nFhGN/GfANlfQkfgZvReI6jEw4Rq2v/hHu9HCySpISSYBwKQHfEX5BbcMyfL1Q7Nl\napVe5HdNAgMBAAECggEAFJMgwWOHNR/gRNHsnR8JcVD6NOYWSIWRHILm0i7kEAmr\nHth9PFeEGz4F8kyCUqrFtskTZtq3JWzAUOja4NWRx492/75IEDnsRToV9ypSIZUr\n+ZfwtsaXmIFriWZj+i9zA1kEYFW6M+542LneyX0bR7KZ4s1kcl8SvFmwF6ffHXiX\nIXs9fVZliObcv4HMkCAAGicYcKfVAwnk8Ges80Ocd+j5lY0o3P0v8YJB0y7r/yk0\nzZPv8Qh7HkPfV//STm1wadhfTfBMdiDjxgrCSfuwZYK8ZYVx0Zi/KXpg1pjTfAT3\nRX7ez+p9L251ncv+m/iFRqYKdtjMdcGgo/AcuXXTQQKBgQDjl0QTAYPIk/fDULXX\nDecXFfasIKt9sfTaRs76grOkibEIXtPnLD4QHzzGzbQZwR0uHUnwGA+jR6b0uK0K\nF/8PO115BsPOU5hKwgOHMkLBps8owlOyrz0Ag8wJa2A6YtNIJm+cudS6zHCKitNX\nL5aRkFBLtzhyhJlRsRO+sgY+FQKBgQDHaTtRP5BPm2/roXgQFgnFS9PlVQN23dk8\n0ceynVevbig3BgXOAopwRFkUJK5K/hyNw9TBRGLPtTzUGJE0Axq/o2XQwidc4nJq\nGooDkXGKmB6e/gaOawUUUd9oKM4EUCPGmQv6YHz7KmgWk1jbN2EvsPYBJe8X4Xum\nyNhUtC/aWQKBgQCCGDeLfbQs9ZgNB5fKJGJSafWlEs+0fALwusUZoZi6lxKhLEOI\nw1t+r7x4D6HBjwf1Ejzvh3F47j5baS1QtcLQnCikQ9+tk09cfGaz42ERfR6xt9NM\nMqt2HeCGCeDpvw/zEDWAqyEU3kP+jbic/9DbyFh9z2/u1ikl70jQGsdCuQKBgFGX\nNgUNa/+WitmvjI+QZNkMKJwaB7vYE+21q+7iQCFwghXZagCbu4cqAASk6YeXp5k9\nukyFraRs9IGXt7m/V2937M3Y0wBHSycsyrGhDgL2MPk+2PHmygJBaZaVs43COJEm\nx+bfGeQuur4Z9e5kH2jDEDTyD30G7nAUl6c4vqepAoGATHmKffr65a69nO1/2NYa\n9emG9aIkNmZ/cm/LU6Ie2EbwETHshT8xYGSNBD4C8Sdd/xL8dgIpQ14Z/W9rULXB\n+aa3yji5Gux9uDi18VIBfL7a+1s3Sgx7uGh8lvqNzXs8+7gt5vQxHXfcXTA8cW99\nWUklY5nUdElkzaE3oyQDo7c=\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@earn-bot-2026.iam.gserviceaccount.com"
};

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();
const bot = new Telegraf("8784543392:AAEybNnS-v5VUdwB1jNeK38bU3EFCds99-w");
const DASHBOARD_URL = "https://earn-bot-2026.vercel.app";

// CAPTCHA GENERATOR
function getCaptcha() {
    const a = Math.floor(Math.random() * 9) + 2;
    const b = Math.floor(Math.random() * 9) + 1;
    return { question: `${a} + ${b}`, answer: a + b };
}

// START COMMAND
bot.start(async (ctx) => {
    const userId = ctx.from.id.toString();
    const refId = ctx.startPayload || null;
    const captcha = getCaptcha();

    try {
        await db.collection('verifying').doc(userId).set({
            ans: captcha.answer,
            ref: refId,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return ctx.replyWithMarkdown(
            `🚀 *Welcome to EarnPro 2026!*\n\n` +
            `Verification ke liye jawab dein:\n\n` +
            `📝 *Sawal:* ${captcha.question} = ?`
        );
    } catch (e) {
        console.error(e);
        return ctx.reply("Database error! Rules check karein.");
    }
});

// HANDLING TEXT
bot.on('text', async (ctx) => {
    const userId = ctx.from.id.toString();
    const text = ctx.message.text.trim();
    
    const verifyRef = db.collection('verifying').doc(userId);
    const verifyDoc = await verifyRef.get();

    if (verifyDoc.exists) {
        const data = verifyDoc.data();
        if (parseInt(text) === data.ans) {
            await verifyRef.delete();

            const userRef = db.collection('users').doc(userId);
            const userDoc = await userRef.get();

            if (!userDoc.exists) {
                await userRef.set({
                    id: userId,
                    name: ctx.from.first_name || "User",
                    balance: 0,
                    referredBy: data.ref,
                    joinedAt: admin.firestore.FieldValue.serverTimestamp()
                });

                if (data.ref && data.ref !== userId) {
                    await db.collection('users').doc(data.ref).update({
                        balance: admin.firestore.FieldValue.increment(5)
                    }).catch(() => {});
                }
            }

            return ctx.replyWithMarkdown(
                `🎉 *Sahi Jawab! Account Verify Ho Gaya.*\n\n` +
                `💰 Ab kamayi shuru karein!\n\n` +
                `🔥 *"Safar mushkil hai par manzil bahut khoobsurat hai. Lage raho!"*`,
                Markup.inlineKeyboard([
                    [Markup.button.webApp("🚀 Open Dashboard", DASHBOARD_URL)]
                ])
            );
        } else {
            return ctx.reply("❌ *Galat Jawab!* Phir se koshish karein.");
        }
    }
});

module.exports = async (req, res) => {
    if (req.method === 'POST') {
        await bot.handleUpdate(req.body);
        res.status(200).send('OK');
    } else {
        res.status(200).send('Bot is Live!');
    }
};
