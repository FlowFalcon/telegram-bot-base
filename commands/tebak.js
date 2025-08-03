const CommandTemplate = require('../utils/commandTemplate');

class TebakCommand extends CommandTemplate {
    constructor() {
        super('tebak', 'Game tebak angka 1-10 dengan 3 kesempatan');
        this.setupHandlers();
    }

    setupHandlers() {
        // Menambahkan text handler untuk menangani input angka
        this.addTextHandler('number_input', async (ctx) => {
            const userId = ctx.from.id;
            const messageText = ctx.message.text.trim();
            
            if (!this.hasActiveSession(userId)) {
                return false; // Tidak handle jika tidak ada session
            }

            const guess = parseInt(messageText);
            if (isNaN(guess) || guess < 1 || guess > 10) {
                await ctx.reply('Masukkan angka yang valid (1-10).');
                return true; // Sudah dihandle
            }

            await this.handleGuess(ctx, guess);
            return true; // Sudah dihandle
        });
    }

    async execute(ctx) {
        const userId = ctx.from.id;
        const args = ctx.message.text.split(' ');

        if (args.length === 1) {
            return await this.startGame(ctx);
        }

        // Jika ada argumen, langsung handle sebagai tebakan
        const guess = parseInt(args[1]);
        if (isNaN(guess) || guess < 1 || guess > 10) {
            return await ctx.reply('Masukkan angka yang valid (1-10).');
        }

        return await this.handleGuess(ctx, guess);
    }

    async startGame(ctx) {
        const userId = ctx.from.id;
        
        if (this.hasActiveSession(userId)) {
            return await ctx.reply('Kamu sudah memiliki game yang sedang berjalan. Tebak angkanya atau ketik /tebak untuk memulai ulang.');
        }

        const randomNumber = Math.floor(Math.random() * 10) + 1;
        this.setSession(userId, { 
            correctNumber: randomNumber, 
            attemptsLeft: 3 
        });

        return await ctx.reply(`Game tebak angka dimulai! Tebak angka dari 1-10. Kamu punya 3 kesempatan.`);
    }

    async handleGuess(ctx, guess) {
        const userId = ctx.from.id;
        
        if (!this.hasActiveSession(userId)) {
            return await ctx.reply('Kamu belum memulai game. Ketik /tebak untuk memulai.');
        }

        const session = this.getSession(userId);
        session.attemptsLeft--;

        if (guess === session.correctNumber) {
            this.clearSession(userId);
            return await ctx.reply(`🎉 Selamat! Tebakan kamu benar. Angkanya adalah ${session.correctNumber}.`);
        } else if (session.attemptsLeft > 0) {
            this.setSession(userId, session);
            return await ctx.reply(`❌ Salah! Sisa kesempatan: ${session.attemptsLeft}.`);
        } else {
            this.clearSession(userId);
            return await ctx.reply(`😔 Kesempatanmu habis! Angka yang benar adalah ${session.correctNumber}. Ketik /tebak untuk bermain lagi.`);
        }
    }
}

module.exports = new TebakCommand();

