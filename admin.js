const { db } = require('./firebase'); // Same folder mein hai isliye ./ use karein
require('dotenv').config();

const ADMIN_ID = process.env.ADMIN_ID;

const adminLogic = (bot) => {
    // Admin Check Middleware
    const isAdmin = (ctx) => String(ctx.from.id) === String(ADMIN_ID);

    // 1. Admin Main Menu
    bot.command('admin', async (ctx) => {
        if (!isAdmin(ctx)) return ctx.reply("❌ Aap admin nahi hain!");
        
        const snapshot = await db.collection('users').get();
        const totalUsers = snapshot.size;

        ctx.replyWithMarkdown(`👑 *Admin Dashboard*\n\n👥 Total Users: ${totalUsers}\n\n*Commands:*\n/broadcast [message] - Sabko message bhejein\n/edit [user_id] [coins] - Balance badlein\n/stats - User list dekhein`);
    });

    // 2. Broadcast System (All Users)
    bot.command('broadcast', async (ctx) => {
        if (!isAdmin(ctx)) return;
        
        const msg = ctx.message.text.split(' ').slice(1).join(' ');
        if (!msg) return ctx.reply("💬 Message toh likho! Example: /broadcast Hello Everyone");

        const users = await db.collection('users').get();
        let count = 0;

        users.forEach(doc => {
            bot.telegram.sendMessage(doc.id, `📢 *Announcement:*\n\n${msg}`, { parse_mode: 'Markdown' })
                .catch(e => console.log(`Error sending to ${doc.id}`));
            count++;
        });

        ctx.reply(`✅ Broadcast complete! ${count} users ko message bhej diya gaya.`);
    });

    // 3. Edit User Balance
    bot.command('edit', async (ctx) => {
        if (!isAdmin(ctx)) return;

        const args = ctx.message.text.split(' ');
        if (args.length < 3) return ctx.reply("⚠️ Format: /edit [user_id] [amount]");

        const targetId = args[1];
        const newAmount = parseInt(args[2]);

        try {
            await db.collection('users').doc(targetId).update({ balance: newAmount });
            ctx.reply(`✅ User ${targetId} ka naya balance ${newAmount} coins set kar diya gaya.`);
        } catch (e) {
            ctx.reply("❌ Error: User ID galat hai ya database issue hai.");
        }
    });
};

module.exports = adminLogic;
