const { db } = require('./firebase');

module.exports = (bot) => {
    const ADMIN_ID = process.env.ADMIN_ID;

    bot.command('admin', async (ctx) => {
        if (String(ctx.from.id) !== String(ADMIN_ID)) return;
        
        const snapshot = await db.collection('users').get();
        ctx.reply(`👑 Admin Panel\n\nTotal Users: ${snapshot.size}\n/broadcast - Send message to all`);
    });
};
