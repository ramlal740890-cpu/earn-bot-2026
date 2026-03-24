const { db } = require('./firebase'); 

const ADMIN_ID = process.env.ADMIN_ID;

const adminLogic = (bot) => {
    const isAdmin = (ctx) => String(ctx.from.id) === String(ADMIN_ID);

    bot.command('admin', async (ctx) => {
        if (!isAdmin(ctx)) return;
        const snapshot = await db.collection('users').get();
        ctx.replyWithMarkdown(`👑 *Admin Panel*\n\nUsers: ${snapshot.size}\n\n/broadcast [msg]\n/edit [id] [amt]`);
    });

    bot.command('broadcast', async (ctx) => {
        if (!isAdmin(ctx)) return;
        const msg = ctx.message.text.split(' ').slice(1).join(' ');
        if (!msg) return ctx.reply("Message likho!");
        
        const users = await db.collection('users').get();
        users.forEach(doc => {
            bot.telegram.sendMessage(doc.id, `📢 *Announcement:*\n\n${msg}`).catch(e => {});
        });
        ctx.reply("✅ Done!");
    });
};

module.exports = adminLogic;
