module.exports = async (ctx, next) => {
    if (ctx.chat.type === 'private') {
        return ctx.reply('Perintah ini hanya bisa digunakan di grup.');
    }
    await next();
};

