const CommandTemplate = require('../utils/commandTemplate');

class MenuCommand extends CommandTemplate {
    constructor() {
        super('menu', 'Menampilkan menu utama dengan tombol interaktif');
        this.setupActions();
    }

    setupActions() {
        // Menambahkan action untuk tombol "Info"
        this.addAction('info', async (ctx) => {
            await ctx.answerCbQuery('Menampilkan informasi bot...');
            await ctx.editMessageText('ℹ️ **Informasi Bot**\n\nBot ini dibuat dengan sistem modular yang memungkinkan setiap command mengelola session dan handler sendiri.\n\nGunakan /help untuk melihat daftar perintah.');
        });

        // Menambahkan action untuk tombol "Game"
        this.addAction('game', async (ctx) => {
            await ctx.answerCbQuery('Membuka menu game...');
            await ctx.editMessageText('🎮 **Menu Game**\n\nPilih game yang ingin dimainkan:', {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🎲 Tebak Angka', callback_data: 'tebak_game' }],
                        [{ text: '🔙 Kembali', callback_data: 'menu_main' }]
                    ]
                }
            });
        });

        // Menambahkan action untuk tombol "Settings"
        this.addAction('settings', async (ctx) => {
            await ctx.answerCbQuery('Membuka pengaturan...');
            await ctx.editMessageText('⚙️ **Pengaturan**\n\nPengaturan bot akan ditampilkan di sini.', {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🔙 Kembali', callback_data: 'menu_main' }]
                    ]
                }
            });
        });

        // Menambahkan action untuk tombol "Tebak Game"
        this.addAction('tebak_game', async (ctx) => {
            await ctx.answerCbQuery('Memulai game tebak angka...');
            // Redirect ke command tebak
            ctx.message.text = '/tebak';
            const tebakCommand = require('./tebak');
            await tebakCommand.execute(ctx);
        });

        // Menambahkan action untuk kembali ke menu utama
        this.addAction('menu_main', async (ctx) => {
            await ctx.answerCbQuery('Kembali ke menu utama...');
            await this.showMainMenu(ctx);
        });
    }

    async execute(ctx) {
        return await this.showMainMenu(ctx);
    }

    async showMainMenu(ctx) {
        const message = '🎯 **Menu Utama**\n\nSelamat datang! Pilih menu di bawah ini:';
        
        const keyboard = {
            inline_keyboard: [
                [
                    { text: 'ℹ️ Info', callback_data: 'menu_info' },
                    { text: '🎮 Game', callback_data: 'menu_game' }
                ],
                [
                    { text: '⚙️ Settings', callback_data: 'menu_settings' }
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

module.exports = new MenuCommand();