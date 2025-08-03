const CommandTemplate = require('../utils/commandTemplate');
const fs = require('fs');
const path = require('path');

class SetNameBotCommand extends CommandTemplate {
    constructor() {
        super('setnamebot', 'Mengatur nama bot (Owner only)');
        this.addMiddleware(require('../middlewares/ownerOnly'));
        this.setupHandlers();
    }

    setupHandlers() {
        // Handler untuk menangani input nama bot
        this.addTextHandler('bot_name_input', async (ctx) => {
            const userId = ctx.from.id;
            
            if (!this.hasActiveSession(userId)) {
                return false; // Tidak handle jika tidak ada session
            }

            const newName = ctx.message.text.trim();
            
            if (newName.length < 3 || newName.length > 50) {
                await ctx.reply('❌ Nama bot harus antara 3-50 karakter.');
                return true;
            }

            try {
                const botInfoPath = path.join(__dirname, '..', 'data', 'botinfo.json');
                let botInfo = { botName: 'My Telegram Bot', ownerName: 'Bot Owner', thumbnail: null };

                if (fs.existsSync(botInfoPath)) {
                    botInfo = JSON.parse(fs.readFileSync(botInfoPath, 'utf8'));
                }

                botInfo.botName = newName;
                fs.writeFileSync(botInfoPath, JSON.stringify(botInfo, null, 2));

                this.clearSession(userId);
                await ctx.reply(`✅ Nama bot berhasil diubah menjadi: **${newName}**`);
            } catch (error) {
                await ctx.reply('❌ Terjadi kesalahan saat mengubah nama bot.');
            }

            return true;
        });
    }

    async execute(ctx) {
        const userId = ctx.from.id;
        const args = ctx.message.text.split(' ');

        if (args.length > 1) {
            // Jika nama bot diberikan sebagai argumen
            const newName = args.slice(1).join(' ');
            return await this.setBotName(ctx, newName);
        }

        // Jika tidak ada argumen, minta input
        this.setSession(userId, { action: 'setting_bot_name' });
        await ctx.reply('Masukkan nama baru untuk bot:');
    }

    async setBotName(ctx, newName) {
        if (newName.length < 3 || newName.length > 50) {
            return await ctx.reply('❌ Nama bot harus antara 3-50 karakter.');
        }

        try {
            const botInfoPath = path.join(__dirname, '..', 'data', 'botinfo.json');
            let botInfo = { botName: 'My Telegram Bot', ownerName: 'Bot Owner', thumbnail: null };

            if (fs.existsSync(botInfoPath)) {
                botInfo = JSON.parse(fs.readFileSync(botInfoPath, 'utf8'));
            }

            botInfo.botName = newName;
            fs.writeFileSync(botInfoPath, JSON.stringify(botInfo, null, 2));

            await ctx.reply(`✅ Nama bot berhasil diubah menjadi: **${newName}**`);
        } catch (error) {
            await ctx.reply('❌ Terjadi kesalahan saat mengubah nama bot.');
        }
    }
}

module.exports = new SetNameBotCommand();

