const { db } = require('./firebase');
const ADMIN_ID = process.env.ADMIN_ID;

const adminLogic = (bot) => {
    bot.command('admin', async (ctx) => {
        if (String(ctx.from.id) !== String(ADMIN_ID)) return;
        const snapshot = await db.collection('users').get();
        ctx.reply(`👑 *Admin Panel*\n\nUsers: ${snapshot.size}\n\n/broadcast [msg]\n/edit [id] [amt]`);
    });

    bot.command('broadcast', async (ctx) => {
        if (String(ctx.from.id) !== String(ADMIN_ID)) return;
        const msg = ctx.message.text.split(' ').slice(1).join(' ');
        const users = await db.collection('users').get();
        users.forEach(doc => {
            bot.telegram.sendMessage(doc.id, `📢 *Announcement:*\n\n${msg}`, { parse_mode: 'Markdown' });
        });
        ctx.reply("✅ Broadcast complete!");
    });
};

module.exports = adminLogic;
