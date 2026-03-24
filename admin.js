const { db } = require('./firebase');

module.exports = (bot) => {
    const ADMIN_ID = process.env.ADMIN_ID;

    bot.command('admin', async (ctx) => {
        if (String(ctx.from.id) !== String(ADMIN_ID)) return;
        
        try {
            const snapshot = await db.collection('users').get();
            ctx.reply(`👑 Admin Panel\n\nTotal Users: ${snapshot.size}\n\nCommands:\n/broadcast [msg] - Sabko message bhejein`);
        } catch (e) {
            ctx.reply("Error fetching stats.");
        }
    });

    bot.command('broadcast', async (ctx) => {
        if (String(ctx.from.id) !== String(ADMIN_ID)) return;
        const msg = ctx.message.text.split(' ').slice(1).join(' ');
        if (!msg) return ctx.reply("Message likho!");

        const users = await db.collection('users').get();
        users.forEach(doc => {
            bot.telegram.sendMessage(doc.id, `📢 Announcement:\n\n${msg}`).catch(e => {});
        });
        ctx.reply("✅ Broadcast sent!");
    });
};
