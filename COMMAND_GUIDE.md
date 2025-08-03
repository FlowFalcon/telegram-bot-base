# Panduan Membuat Command Baru

Sistem bot ini telah direfactor untuk menggunakan arsitektur modular yang memungkinkan setiap command mengelola session, action, dan handler sendiri.

## Struktur Sistem Baru

### 1. CommandTemplate (`utils/commandTemplate.js`)
Template dasar untuk semua command yang menyediakan:
- Session management
- Action handlers
- Text handlers
- Middleware support

### 2. CommandManager (`utils/commandManager.js`)
Manager terpusat untuk mengelola semua command, action, dan handler.

### 3. Bot.js
File utama yang menggunakan CommandManager untuk mengelola semua command.

## Cara Membuat Command Baru

### 1. Command Dasar

```javascript
const CommandTemplate = require('../utils/commandTemplate');

class MyCommand extends CommandTemplate {
    constructor() {
        super('mycommand', 'Deskripsi command saya');
    }

    async execute(ctx) {
        // Logic utama command
        await ctx.reply('Hello World!');
    }
}

module.exports = new MyCommand();
```

### 2. Command dengan Session Management

```javascript
const CommandTemplate = require('../utils/commandTemplate');

class ChatCommand extends CommandTemplate {
    constructor() {
        super('chat', 'Command dengan session management');
        this.setupHandlers();
    }

    setupHandlers() {
        // Handler untuk menangani input text
        this.addTextHandler('chat_input', async (ctx) => {
            const userId = ctx.from.id;
            
            if (!this.hasActiveSession(userId)) {
                return false; // Tidak handle jika tidak ada session
            }

            const message = ctx.message.text;
            const session = this.getSession(userId);
            
            // Process message
            await ctx.reply(`Anda mengatakan: ${message}`);
            
            // Clear session setelah selesai
            this.clearSession(userId);
            return true; // Sudah dihandle
        });
    }

    async execute(ctx) {
        const userId = ctx.from.id;
        
        // Mulai session
        this.setSession(userId, { 
            status: 'chatting',
            startTime: Date.now()
        });
        
        await ctx.reply('Mulai chat! Ketik pesan Anda:');
    }
}

module.exports = new ChatCommand();
```

### 3. Command dengan Action Buttons

```javascript
const CommandTemplate = require('../utils/commandTemplate');

class MenuCommand extends CommandTemplate {
    constructor() {
        super('menu', 'Menu dengan tombol interaktif');
        this.setupActions();
    }

    setupActions() {
        // Action untuk tombol "Info"
        this.addAction('info', async (ctx) => {
            await ctx.answerCbQuery('Menampilkan info...');
            await ctx.editMessageText('Ini adalah informasi bot.');
        });

        // Action untuk tombol "Settings"
        this.addAction('settings', async (ctx) => {
            await ctx.answerCbQuery('Membuka settings...');
            await ctx.editMessageText('Pengaturan bot:', {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🔙 Kembali', callback_data: 'menu_main' }]
                    ]
                }
            });
        });

        // Action untuk kembali ke menu utama
        this.addAction('menu_main', async (ctx) => {
            await ctx.answerCbQuery('Kembali ke menu utama...');
            await this.showMainMenu(ctx);
        });
    }

    async execute(ctx) {
        await this.showMainMenu(ctx);
    }

    async showMainMenu(ctx) {
        const message = '🎯 **Menu Utama**\n\nPilih menu:';
        
        const keyboard = {
            inline_keyboard: [
                [
                    { text: 'ℹ️ Info', callback_data: 'menu_info' },
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
```

### 4. Command dengan Middleware

```javascript
const CommandTemplate = require('../utils/commandTemplate');

class AdminCommand extends CommandTemplate {
    constructor() {
        super('admin', 'Command untuk admin');
        // Tambahkan middleware
        this.addMiddleware(require('../middlewares/ownerOnly'));
        this.addMiddleware(require('../middlewares/groupOnly'));
    }

    async execute(ctx) {
        await ctx.reply('Anda adalah admin!');
    }
}

module.exports = new AdminCommand();
```

### 5. Command dengan Semua Fitur

```javascript
const CommandTemplate = require('../utils/commandTemplate');

class CompleteCommand extends CommandTemplate {
    constructor() {
        super('complete', 'Command lengkap dengan semua fitur');
        this.addMiddleware(require('../middlewares/ownerOnly'));
        this.setupActions();
        this.setupHandlers();
    }

    setupActions() {
        this.addAction('confirm', async (ctx) => {
            await ctx.answerCbQuery('Dikonfirmasi!');
            await ctx.editMessageText('Aksi dikonfirmasi!');
        });
    }

    setupHandlers() {
        this.addTextHandler('input_handler', async (ctx) => {
            const userId = ctx.from.id;
            
            if (!this.hasActiveSession(userId)) {
                return false;
            }

            const input = ctx.message.text;
            await ctx.reply(`Input Anda: ${input}`);
            this.clearSession(userId);
            return true;
        });
    }

    async execute(ctx) {
        const userId = ctx.from.id;
        const args = ctx.message.text.split(' ');

        if (args.length > 1) {
            // Handle dengan argumen
            await ctx.reply(`Argumen: ${args.slice(1).join(' ')}`);
        } else {
            // Mulai session dan tampilkan menu
            this.setSession(userId, { status: 'waiting_input' });
            
            await ctx.reply('Pilih aksi:', {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '✅ Konfirmasi', callback_data: 'complete_confirm' }]
                    ]
                }
            });
        }
    }
}

module.exports = new CompleteCommand();
```

## Fitur yang Tersedia

### Session Management
- `setSession(userId, data)` - Set session untuk user
- `getSession(userId)` - Ambil session user
- `clearSession(userId)` - Hapus session user
- `hasActiveSession(userId)` - Cek apakah user punya session aktif

### Action Handlers
- `addAction(actionName, handler)` - Tambah action handler
- `getActions()` - Ambil semua action handlers

### Text Handlers
- `addTextHandler(condition, handler)` - Tambah text handler
- `getHandlers()` - Ambil semua text handlers

### Middleware
- `addMiddleware(middleware)` - Tambah middleware
- `getMiddleware()` - Ambil semua middleware

## Best Practices

1. **Gunakan Class**: Setiap command harus extend `CommandTemplate`
2. **Setup di Constructor**: Panggil `setupActions()` dan `setupHandlers()` di constructor
3. **Return Boolean**: Text handler harus return `true` jika sudah dihandle, `false` jika tidak
4. **Clear Session**: Selalu clear session setelah selesai
5. **Error Handling**: Gunakan try-catch untuk operasi yang mungkin gagal
6. **Naming Convention**: Gunakan prefix untuk action dan handler (misal: `menu_info`, `chat_input`)

## Contoh Penggunaan

### Game dengan Session
```javascript
// commands/game.js
const CommandTemplate = require('../utils/commandTemplate');

class GameCommand extends CommandTemplate {
    constructor() {
        super('game', 'Game sederhana');
        this.setupHandlers();
    }

    setupHandlers() {
        this.addTextHandler('game_input', async (ctx) => {
            const userId = ctx.from.id;
            
            if (!this.hasActiveSession(userId)) {
                return false;
            }

            const input = ctx.message.text;
            const session = this.getSession(userId);
            
            // Process game logic
            if (input === session.answer) {
                await ctx.reply('🎉 Benar!');
                this.clearSession(userId);
            } else {
                session.attempts--;
                if (session.attempts <= 0) {
                    await ctx.reply(`😔 Game over! Jawaban: ${session.answer}`);
                    this.clearSession(userId);
                } else {
                    this.setSession(userId, session);
                    await ctx.reply(`❌ Salah! Sisa: ${session.attempts}`);
                }
            }
            
            return true;
        });
    }

    async execute(ctx) {
        const userId = ctx.from.id;
        
        if (this.hasActiveSession(userId)) {
            return await ctx.reply('Anda masih dalam game!');
        }

        const answer = Math.floor(Math.random() * 10) + 1;
        this.setSession(userId, { 
            answer: answer, 
            attempts: 3 
        });
        
        await ctx.reply('Tebak angka 1-10!');
    }
}

module.exports = new GameCommand();
```

Dengan sistem ini, setiap command dapat mengelola session, action, dan handler sendiri tanpa perlu mengubah file `bot.js` atau command lain.