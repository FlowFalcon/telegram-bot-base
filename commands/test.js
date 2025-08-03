const CommandTemplate = require('../utils/commandTemplate');

class TestCommand extends CommandTemplate {
    constructor() {
        super('test', 'Command test untuk sistem modular');
        this.setupActions();
        this.setupHandlers();
    }

    setupActions() {
        // Action untuk tombol "Test Action"
        this.addAction('test_action', async (ctx) => {
            await ctx.answerCbQuery('Test action berhasil!');
            await ctx.editMessageText('✅ Test action berhasil dijalankan!');
        });

        // Action untuk tombol "Input Text"
        this.addAction('input_text', async (ctx) => {
            await ctx.answerCbQuery('Silakan ketik pesan...');
            await ctx.editMessageText('Silakan ketik pesan untuk test:');
            
            // Set session untuk menunggu input
            const userId = ctx.from.id;
            this.setSession(userId, { action: 'waiting_text_input' });
        });
    }

    setupHandlers() {
        // Handler untuk menangani input text
        this.addTextHandler('text_input', async (ctx) => {
            const userId = ctx.from.id;
            
            if (!this.hasActiveSession(userId)) {
                return false; // Tidak handle jika tidak ada session
            }

            const session = this.getSession(userId);
            
            if (session.action === 'waiting_text_input') {
                const message = ctx.message.text;
                await ctx.reply(`📝 Pesan Anda: "${message}"\n\nTest input berhasil!`);
                this.clearSession(userId);
                return true; // Sudah dihandle
            }
            
            return false;
        });
    }

    async execute(ctx) {
        const userId = ctx.from.id;
        const args = ctx.message.text.split(' ');

        if (args.length > 1) {
            // Jika ada argumen, tampilkan argumen
            const argument = args.slice(1).join(' ');
            await ctx.reply(`🔍 Argumen yang diberikan: "${argument}"`);
        } else {
            // Tampilkan menu test
            await this.showTestMenu(ctx);
        }
    }

    async showTestMenu(ctx) {
        const message = '🧪 **Menu Test**\n\nPilih test yang ingin dijalankan:';
        
        const keyboard = {
            inline_keyboard: [
                [
                    { text: '🎯 Test Action', callback_data: 'test_test_action' },
                    { text: '📝 Test Input', callback_data: 'test_input_text' }
                ]
            ]
        };

        if (ctx.callbackQuery) {
            await ctx.editMessageText(message, { reply_markup: keyboard });
        } else {
            await ctx.reply(message, { reply_markup: keyboard });
        }
    }
}

module.exports = new TestCommand();