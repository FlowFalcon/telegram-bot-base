# telegram-bot-base

![preview](https://cloudkuimages.com/uploads/images/FMGCZLRX.jpg)

Bot Telegram ini dibangun menggunakan Telegraf.js dengan arsitektur modular, memudahkan penambahan fitur dan pemeliharaan.

Bot Preview: [@flowfalcon_project_bot](https://t.me/flowfalcon_project_bot)

## Struktur Project

```
tele-bot/
├── bot.js                                  # Bot utama untuk menjalankan sistem
├── mirror_bot.js                           # Bot khusus untuk sistem mirror
├── config.js                               # Konfigurasi utama bot
├── commands/                               # Direktori command berdasarkan kategori
│   ├── admin/                             # Command untuk admin
│   │   └── ban.js                        # Sistem banned user
│   ├── game/                              # Fitur game & hiburan
│   │   └── tebak.js                      # Game tebak-tebakan
│   ├── group/                             # Fitur khusus grup
│   │   └── groupfeature.js               # Manajemen grup
│   ├── helper/                            # Command bantuan
│   │   ├── cekid.js                      # Cek ID user/grup
│   │   └── interactive_example.js         # Contoh interaksi
│   ├── owner/                             # Command khusus owner
│   │   ├── addowner.js                   # Tambah owner
│   │   ├── addprem.js                    # Tambah user premium
│   │   ├── backup.js                     # Backup data bot
│   │   ├── mirror.js                     # Pengaturan mirror
│   │   ├── dailyrepot.js                # Laporan harian
│   │   └── [other owner commands]...     # Command owner lainnya
│   ├── premium/                           # Fitur premium
│   │   └── premiumfeature.js            # Fitur khusus premium
│   ├── tools/                             # Utilitas tambahan
│   │   ├── hdr.js                       # Handler media HD
│   │   └── hdvid.js                     # Video HD handler
│   ├── help.js                           # Command bantuan
│   └── start.js                          # Command mulai
├── data/                                  # Penyimpanan data bot
│   ├── botinfo.json                      # Informasi bot
│   ├── mirrors.json                      # Konfigurasi mirror
│   ├── owners.json                       # Data owner
│   ├── premiums.json                     # Data user premium
│   └── warns.json                        # Data peringatan
├── middlewares/                           # Middleware sistem
│   ├── groupOnly.js                      # Pembatas grup
│   ├── mirrorSecurity.js                 # Keamanan mirror
│   ├── ownerOnly.js                      # Pembatas owner
│   └── premiumOnly.js                    # Pembatas premium
├── mirror_data/                           # Data untuk sistem mirror
├── utils/                                 # Utilitas
│   └── logger.js                         # Sistem logging
└── package.json                           # Dependency & scripts

```

## Instalasi

1.  **Clone repository ini:**
    ```bash
    git clone https://github.com/FlowFalcon/telegram-bot-base
    cd telegram-bot-base
    ```

2.  **Instal dependensi:**
    ```bash
    npm install
    ```

## Konfigurasi

Edit file `config.js` dan ganti placeholder dengan informasi bot Anda:

```javascript
module.exports = {
    botToken: 'YOUR_BOT_TOKEN_HERE', // Ganti dengan token bot Telegram Anda
    ownerId: null // Ganti dengan ID Telegram owner bot (angka)
};
```

**Penting:** Untuk `botToken`, sangat disarankan di jaga kerahasiannya karena dapat di salah gunakan. jadi simpan dengan baik


Edit juga file `data/botinfo.js` untuk konfigurasi tampilan menu saat start nanti **CONTOH:**

```json
{
  "botName": "FlowFalcon TeleBot Project's",
  "ownerName": "@FlowFalcon",
  "thumbnail": null
    // ganti thumbnail bisa di atur di bot nanti menggunakan fitur /setthumb sambil reply media
}
```

atau dapat di lakukan melalu bot seperti `/setthumb`, `/setnamebot`, `/setownername`

## Menjalankan Bot

```bash
npm start
# atau
node bot.js
```

## Fungsi Utama Bot

Berikut adalah ringkasan fungsionalitas utama yang disediakan oleh bot ini:

*   **Pengategorian command otomatis** Sekarang Command mudah untuk di kategorikan dengan membuat sub-folder seperti: `commands/owner/exec.js` = fitur exec akan otomatis masuk ke kategori owner
*   **Modular Command Handling:** Command dimuat secara dinamis dari folder `commands/`, memungkinkan penambahan dan pengelolaan command yang mudah. Setiap command dapat mendaftarkan handler-nya sendiri (command, action, text).
*   **Middleware System:** Penggunaan middleware untuk validasi akses (grup, owner, premium) sebelum command dieksekusi.
*   **Manajemen Data Lokal:** Menggunakan file JSON (`data/`) untuk menyimpan konfigurasi bot yang dinamis (nama bot, owner, thumbnail) serta daftar owner, premium, dan data warn.
*   **Logging:** Mencatat aktivitas bot, termasuk setiap command yang dijalankan, ke konsol dan file log harian di folder `logs/`. dan membuat fitur `dailyreport` untuk manajemen penggunan bot hariannya


## Telegram Bot dengan Sistem Mirror

Bot Telegram ini mendukung sistem mirror, dan berbagai fitur canggih untuk administrasi grup dan pengelolaan konten.

## Fitur Utama

- 🔄 **Sistem Mirror**: Mendukung penyalinan pesan otomatis antar grup
- 👥 **Manajemen Grup**: Fitur moderasi dan administrasi grup yang lengkap
- 💎 **Sistem Premium**: Akses fitur khusus untuk pengguna premium
- 🎮 **Mini Games**: Berbagai permainan interaktif untuk member
- 🛡️ **Keamanan**: Sistem middleware untuk proteksi command dan konten
- 📊 **Pelaporan**: Sistem daily report dan logging untuk monitoring


## Penjelasan Isi File dan Potongan Kode Penting

### `bot.js`

File inti yang mengorkestrasi seluruh bot. Ini adalah tempat bot diinisialisasi, command dimuat, dan middleware global diterapkan.

**Potongan Kode: Inisialisasi Data File**

```javascript
// Inisialisasi file data jika belum ada
const dataFiles = [
    "warns.json",
    "owners.json",
    "premiums.json",
    "botinfo.json",
];

dataFiles.forEach((file) => {
    const filePath = path.join(__dirname, "data", file);
    if (!fs.existsSync(filePath)) {
        let defaultContent = "{}";
        if (file === "owners.json" || file === "premiums.json") {
            defaultContent = "[]";
        } else if (file === "botinfo.json") {
            defaultContent = JSON.stringify({ botName: "My Telegram Bot", ownerName: "Bot Owner", thumbnail: null }, null, 2);
        }
        fs.writeFileSync(filePath, defaultContent);
        logger.info(`File data ${file} berhasil diinisialisasi.`);
    }
});
```

Kode ini memastikan bahwa semua file data JSON yang diperlukan (`warns.json`, `owners.json`, `premiums.json`, `botinfo.json`) ada di folder `data/`. Jika tidak ada, file akan dibuat dengan konten default.

**Potongan Kode: Auto Load Command dan Registrasi Modul**

```javascript
// Auto load command
const commands = [];
const loadedCommandNames = new Set();

const loadCommands = (dir, category = 'main') => {
    const files = fs.readdirSync(dir, { withFileTypes: true });

    for (const file of files) {
        const fullPath = path.join(dir, file.name);
        if (file.isDirectory()) {
            // Gunakan nama folder sebagai kategori
            loadCommands(fullPath, file.name);
        } else if (file.isFile() && file.name.endsWith(".js")) {
            const commandModule = require(fullPath);
            if (typeof commandModule.register === "function") {
                commandModule.register(bot); 
                logger.info(`Module registered: ${file.name} (Category: ${category})`);
                
                if (commandModule.name && !loadedCommandNames.has(commandModule.name)) {
                    commands.push({ 
                        command: commandModule.name, 
                        description: commandModule.description || "",
                        category: category
                    });
                    loadedCommandNames.add(commandModule.name);
                }
            } else if (commandModule.name && commandModule.execute) {
                if (!loadedCommandNames.has(commandModule.name)) {
                    commands.push({ 
                        command: commandModule.name, 
                        description: commandModule.description || "",
                        category: category
                    });
                    loadedCommandNames.add(commandModule.name);
                }
                logger.info(`Legacy command loaded: ${commandModule.name} (Category: ${category})`);
                if (commandModule.middleware && Array.isArray(commandModule.middleware)) {
                    bot.command(commandModule.name, ...commandModule.middleware, commandModule.execute);
                } else {
                    bot.command(commandModule.name, commandModule.execute);
                }
            }
        }
    }
};

loadCommands(path.join(__dirname, "commands"));
bot.telegram.setMyCommands(commands.map(cmd => ({ command: cmd.command, description: cmd.description })));

```

Fungsi `loadCommands` membaca semua file `.js` di folder `commands/` (termasuk subfolder). Jika modul mengekspor fungsi `register`, fungsi tersebut akan dipanggil dengan instance `bot` Telegraf, memungkinkan modul untuk mendaftarkan semua handler-nya sendiri. Ini adalah inti dari arsitektur modular yang baru.

**Potongan Kode: Logging Command**

```javascript
bot.use(async (ctx, next) => {
    if (ctx.message && ctx.message.text && ctx.message.text.startsWith("/")) {
        const commandName = ctx.message.text.split(" ")[0];
        const args = ctx.message.text.split(" ").slice(1);
        const user = ctx.from;
        const chat = ctx.chat;
        
        // Format user info
        const userName = user.first_name + (user.last_name ? ` ${user.last_name}` : '');
        const userHandle = user.username ? `@${user.username}` : `ID:${user.id}`;
        
        // Format chat info
        let chatInfo = "";
        let chatType = "";
        switch (chat.type) {
            case "private":
                chatInfo = "Private Message";
                chatType = "🔒 Private";
                break;
            case "group":
                chatInfo = `Group: ${chat.title || 'Unknown Group'}`;
                chatType = `👥 Group`;
                break;
            case "supergroup":
                chatInfo = `Supergroup: ${chat.title || 'Unknown Supergroup'}`;
                chatType = `👥 Supergroup`;
                break;
            case "channel":
                chatInfo = `Channel: ${chat.title || 'Unknown Channel'}`;
                chatType = `📢 Channel`;
                break;
        }
        
        // Create detailed log message
        const timestamp = new Date().toLocaleString('id-ID', {
            timeZone: 'Asia/Jakarta',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
       const logMessage = [
                `=================================`,
                `COMMAND EXECUTED`,
                `Time: ${timestamp}`,
                `Command: ${commandName}`,
                `Args: ${args.length ? args.join(' ') : 'None'}`,
                `USER INFO`,
                `Name: ${userName}`,
                `Handle: ${userHandle}`,
                `User ID: ${user.id}`,
                `CHAT INFO`,
                `Type: ${chatType}`,
                `Info: ${chatInfo}`,
                `Chat ID: ${chat.id}`,
                `=================================`,
                ``
            ].join('\n');
        
        logger.info(`\n${logMessage}`);
        
        // Optional: Save to command log file
        const commandLogPath = path.join(__dirname, "logs", "commands.log");
        const commandLogDir = path.dirname(commandLogPath);
        
        if (!fs.existsSync(commandLogDir)) {
            fs.mkdirSync(commandLogDir, { recursive: true });
        }
        
        const logEntry = {
            timestamp: new Date().toISOString(),
            command: commandName,
            args: args,
            user: {
                id: user.id,
                name: userName,
                username: user.username || null
            },
            chat: {
                id: chat.id,
                type: chat.type,
                title: chat.title || null
            }
        };
        
        fs.appendFileSync(commandLogPath, JSON.stringify(logEntry) + '\n');
    }
    await next();
});

```

Middleware ini mencegat setiap pesan yang masuk. Jika pesan adalah command (diawali `/`), ia akan mencatat informasi command, user yang menjalankannya, dan detail chat (grup/private) menggunakan modul `logger`.

### `config.js`

Berisi konfigurasi dasar bot.

```javascript
module.exports = {
    botToken: process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE',
    ownerId: process.env.OWNER_ID || null // Ganti dengan ID Telegram owner bot
};
```

`botToken` adalah token API bot dari BotFather. `ownerId` adalah ID Telegram dari owner utama bot yang memiliki akses penuh ke semua command `ownerOnly`.

### `utils/logger.js`

Modul utilitas untuk logging.

```javascript
const fs = require('fs');
const path = require('path');

class Logger {
    constructor() {
        this.logDir = path.join(__dirname, '../logs');
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    formatTime() {
        return new Date().toLocaleString('id-ID');
    }

    log(level, message) {
        const timestamp = this.formatTime();
        const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
        
        console.log(logMessage);
        
        const logFile = path.join(this.logDir, `${new Date().toISOString().split('T')[0]}.log`);
        fs.appendFileSync(logFile, logMessage + '\n');
    }

    info(message) {
        this.log('info', message);
    }

    error(message) {
        this.log('error', message);
    }

    warn(message) {
        this.log('warn', message);
    }

    debug(message) {
        this.log('debug', message);
    }
}

module.exports = new Logger();
```

`Logger` mencatat pesan ke konsol dan juga menyimpannya ke file log harian di folder `logs/`. Ini sangat berguna untuk debugging dan memantau aktivitas bot.

### `middlewares/ownerOnly.js` (Contoh Middleware)

Middleware adalah fungsi yang dijalankan sebelum handler command utama. Ini adalah contoh middleware untuk membatasi akses.

```javascript
const fs = require('fs');
const path = require('path');
const config = require('../config');

module.exports = async (ctx, next) => {
    const userId = ctx.from.id;
    const ownersPath = path.join(__dirname, '../data/owners.json');
    
    let owners = [];
    if (fs.existsSync(ownersPath)) {
        owners = JSON.parse(fs.readFileSync(ownersPath, 'utf8'));
    }
    
    // Memeriksa apakah user adalah owner utama (dari config) atau owner tambahan (dari data/owners.json)
    if (userId != config.ownerId && !owners.includes(userId)) {
        return ctx.reply('Perintah ini hanya bisa digunakan oleh owner bot.');
    }
    
    await next(); // Lanjutkan ke handler command jika user adalah owner
};
```

Middleware ini memeriksa apakah `userId` pengirim pesan cocok dengan `ownerId` di `config.js` atau ada di daftar `owners.json`. Jika tidak, pesan balasan akan dikirim dan eksekusi command dihentikan.

## Fitur dan Command

### Command Minimal

*  `/addowner` - Menambahkan owner bot
*  `/addprem` - Menambahkan user premium
*  `/ban` - Ban user dari grup
*  `/backup` - Backup file bot dalam format ZIP
*  `/cekid` - Menampilkan ID user
*  `/cmd` - Manajemen file command
*  `/delowner` - Menghapus owner bot
*  `/delprem` - Menghapus user premium
*  `/eval` - Eksekusi kode JavaScript
*  `/groupfeature` - Percobaan Khusus Grup.
*  `/help` - Menampilkan daftar perintah
*  `/interactive` - Percobaan Fitur Button sesi
*  `/ownerfeature` - Percobaan Fitur Owner.
*  `/premiumfeature` - Percobaan Fitur Premium.
*  `/setnamebot` - Mengubah nama bot
*  `/setownername` - Mengubah nama owner
*  `/setthumb` - Mengubah thumbnail bot
*  `/shell` - Akses shell via bot
*  `/start` - Menampilkan info bot
*  `/tebak` - Percobaan Fitur Game

### Fitur Tambahan

*   **Kategori Otomatis** Secara otomatis mengkategorikan command bedasarkan sub-folder nya
*   **Sistem Warn:** User yang mengirim link akan mendapatkan warn. Setelah 3 warn, user akan otomatis di-kick dari grup. Data warn disimpan di `data/warns.json`.
*   **Middleware:**
    *   `groupOnly`: Memastikan command hanya bisa digunakan di grup.
    *   `ownerOnly`: Memastikan command hanya bisa digunakan oleh owner bot.
    *   `premiumOnly`: Memastikan command hanya bisa digunakan oleh user premium atau owner.
*   **Info Bot Dinamis:** Nama bot, nama owner, dan thumbnail disimpan di `data/botinfo.json` dan dapat diubah melalui command.
*   **Logger:** Sistem logging sederhana di `utils/logger.js` untuk mencatat aktivitas bot ke konsol dan file log.

## Catatan

*   Pastikan Anda telah membuat bot di BotFather dan mendapatkan token bot.
*   Untuk fitur `ban`, bot harus memiliki hak admin di grup.
*   ID owner awal bisa diatur di `config.js` atau melalui variabel lingkungan `OWNER_ID`.
*   **INI MASIH BASE, FITUR KALIAN SENDIRI YANG MENAMBAHKAN.** gimana caranya ?


## Menambah Fitur Baru (Command)

Menambahkan command baru sangat mudah berkat arsitektur modular. Setiap fitur (command, tombol interaktif, sesi) dapat dienkapsulasi dalam satu file command.

1.  **Buat File Command Baru:**
    Buat file JavaScript baru di dalam folder `commands/`. Misalnya, `commands/newcommand.js`.

2.  **Struktur File Command:**
    Setiap file command harus mengekspor sebuah objek dengan properti `name`, `description`, dan fungsi `register`. Fungsi `register` ini akan menerima instance `bot` Telegraf sebagai argumen, di mana Anda dapat mendaftarkan semua handler terkait fitur tersebut (command, action, text handler, dll.).

    ```javascript
    // commands/newcommand.js -> command ini akan dimasukan kategori main menu
    const ownerOnly = require("../middlewares/ownerOnly"); // Contoh jika perlu middleware

    module.exports = {
        name: "newcommand", // Nama command (misal: /newcommand)
        description: "Deskripsi singkat tentang command ini.",
        register: (bot) => {
            bot.command("newcommand", ownerOnly, async (ctx) => {
                // Logika command Anda di sini
                await ctx.reply("Ini adalah command baru!");
            });

            // Anda bisa menambahkan handler lain di sini, misalnya bot.action atau bot.on("text")
            // bot.action("my_button_action", async (ctx) => { /* ... */ });
            // bot.on("text", async (ctx, next) => { /* ... */ next(); });
        },
    };
    ```

3.  **Bot Akan Otomatis Memuat:**
    File `bot.js` akan secara otomatis mendeteksi dan memuat command baru ini saat bot dijalankan, serta menambahkannya ke daftar command bot Telegram (`setMyCommands`).

## Membuat Fitur Baru dengan Middleware, Session, dan Interaksi Tombol

Bot ini dirancang untuk memudahkan penambahan fitur baru, terutama yang memerlukan kontrol akses (owner, premium, grup), manajemen sesi, atau interaksi dengan tombol. Berikut panduannya:

### 1. Menggunakan Middleware untuk Kontrol Akses

Untuk membatasi akses command, Anda bisa menggunakan middleware yang sudah disediakan di folder `middlewares/`:

*   `ownerOnly.js`: Memastikan command hanya bisa diakses oleh owner bot (ID dari `config.js` atau `data/owners.json`).
*   `premiumOnly.js`: Memastikan command hanya bisa diakses oleh user premium atau owner bot.
*   `groupOnly.js`: Memastikan command hanya bisa digunakan di dalam grup, bukan di private chat.

**Contoh Penggunaan Middleware dalam Fungsi `register`:**

```javascript
// commands/owner/fitur_owner.js -> command ini akan di masukan ke kategori owner otomatis
const ownerOnly = require("../middlewares/ownerOnly");

module.exports = {
    name: "fitur_owner",
    description: "Ini adalah fitur khusus owner.",
    register: (bot) => {
        bot.command("fitur_owner", ownerOnly, async (ctx) => {
            await ctx.reply("Anda adalah owner, jadi Anda bisa mengakses ini!");
        });
    },
};
```

### 2. Membuat Fitur dengan Session (Contoh: Game Tebak Angka)

Untuk fitur yang memerlukan penyimpanan status per user (sesi), Anda bisa menggunakan `Map` atau objek JavaScript sederhana yang disimpan di memori, atau menggunakan fitur sesi Telegraf (`ctx.session`). Contoh terbaik adalah game `/tebak` yang sudah diimplementasikan.

**Konsep Session dengan `Map` (seperti di `/tebak`):**

Pada file `commands/tebak.js`, sebuah `Map` bernama `gameSession` digunakan untuk menyimpan status game setiap user. Kunci `Map` adalah `userId` dan nilainya adalah objek yang berisi `correctNumber` dan `attemptsLeft`.

```javascript
// commands/game/tebak.js (potongan kode)
const gameSession = new Map(); // userId -> { correctNumber, attemptsLeft }

module.exports = {
    name: 'tebak',
    description: 'Game tebak angka 1-10 dengan 3 kesempatan',
    register: (bot) => {
        bot.command('tebak', async (ctx) => {
            // ... logika memulai game ...
        });

        // Handler untuk pesan teks yang merupakan tebakan angka
        bot.on('text', async (ctx, next) => {
            const userId = ctx.from.id;
            const messageText = ctx.message.text.trim();

            // Cek apakah user sedang dalam sesi game tebak angka dan pesan adalah angka
            if (gameSession.has(userId) && !isNaN(parseInt(messageText)) && !messageText.startsWith('/')) {
                // ... logika memproses tebakan ...
            } else {
                await next(); // Lanjutkan ke handler lain jika bukan tebakan angka
            }
        });
    }
};
```

**Penting:** Ketika menggunakan `bot.on('text')` di dalam fungsi `register` command, pastikan untuk selalu memanggil `next()` jika pesan tidak relevan dengan sesi command Anda. Ini memungkinkan handler `bot.on('text')` dari command lain atau middleware global untuk memproses pesan.

### 3. Membuat Fitur Interaktif dengan Tombol (Inline Keyboard)

Anda dapat membuat pesan dengan tombol interaktif (inline keyboard) dan menangani aksi tombol tersebut sepenuhnya di dalam file command. Gunakan `bot.action` untuk menangani `callback_data` dari tombol.

**Contoh Fitur Interaktif (`commands/interactive_example.js`):**

```javascript
// commands/helper/interactive_example.js
module.exports = {
    name: "interactive",
    description: "Contoh fitur interaktif dengan tombol dan sesi.",
    register: (bot) => {
        const userStates = new Map(); // Untuk menyimpan state sesi per user

        bot.command("interactive", async (ctx) => {
            userStates.set(ctx.from.id, { step: 1 });
            await ctx.reply(
                "Halo! Ini adalah contoh interaktif. Pilih opsi di bawah:",
                {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: "Opsi A", callback_data: "interactive_option_a" }],
                            [{ text: "Opsi B", callback_data: "interactive_option_b" }],
                        ],
                    },
                }
            );
        });

        bot.action("interactive_option_a", async (ctx) => {
            const userId = ctx.from.id;
            const state = userStates.get(userId);

            if (state && state.step === 1) {
                userStates.set(userId, { step: 2, selectedOption: "A" });
                await ctx.editMessageText("Anda memilih Opsi A. Sekarang, ketik pesan rahasia Anda:");
            } else {
                await ctx.reply("Sesi Anda tidak valid atau sudah berakhir. Silakan mulai lagi dengan /interactive.");
            }
            await ctx.answerCbQuery(); // Penting untuk menghilangkan loading di tombol
        });

        bot.action("interactive_option_b", async (ctx) => {
            const userId = ctx.from.id;
            const state = userStates.get(userId);

            if (state && state.step === 1) {
                userStates.set(userId, { step: 2, selectedOption: "B" });
                await ctx.editMessageText("Anda memilih Opsi B. Sekarang, ketik pesan rahasia Anda:");
            } else {
                await ctx.reply("Sesi Anda tidak valid atau sudah berakhir. Silakan mulai lagi dengan /interactive.");
            }
            await ctx.answerCbQuery();
        });

        // Handle pesan teks setelah memilih opsi
        bot.on("text", async (ctx, next) => {
            const userId = ctx.from.id;
            const state = userStates.get(userId);

            // Pastikan ini adalah pesan untuk sesi interaktif ini dan bukan command lain
            if (state && state.step === 2 && !ctx.message.text.startsWith("/")) {
                const secretMessage = ctx.message.text;
                await ctx.reply(`Pesan rahasia Anda ('${secretMessage}') telah diterima untuk Opsi ${state.selectedOption}. Sesi berakhir.`);
                userStates.delete(userId); // Hapus sesi setelah selesai
            } else {
                await next(); // Lanjutkan ke handler lain jika bukan bagian dari sesi ini
            }
        });
    },
};
```

---

cukup sekian dokumentasi singkat pada repo ini, saya harap kalian semua suka dan bisa menggunakan base telegram ini secara maksimal
jangan lupa untuk berikan star pada repo ini dan follow akun github saya terima kasih
    

---

### Star History

[![Star History Chart](https://api.star-history.com/svg?repos=FlowFalcon/telegram-bot-base&type=Date)](https://www.star-history.com/#FlowFalcon/telegram-bot-base&Date)


---

## Kontributor

<table>
<!---->
  <tr>
    <td align="center" width="160" style="padding:12px;border:1px solid #e1e4e8;">
      <a href="https://github.com/FlowFalcon">
        <img src="https://avatars.githubusercontent.com/FlowFalcon?s=120" width="96" height="96" alt="p1">
        <br><sub><b>FlowFalcon</b></sub>
      </a>
    </td>
    <!---->
    <td align="center" width="160" style="padding:12px;border:1px solid #e1e4e8;">
      <a href="https://github.com/HamzLegendz">
        <img src="https://avatars.githubusercontent.com/HamzLegendz?s=120" width="96" height="96" alt="p2">
        <br><sub><b>HamzLegendz</b></sub>
      </a>
    </td>
    <!---->
    <td align="center" width="160" style="padding:12px;border:1px solid #e1e4e8;">
      <a href="https://github.com/cloudkuimages">
        <img src="https://avatars.githubusercontent.com/cloudkuimages?s=120" width="96" height="96" alt="p2">
        <br><sub><b>cloudkuimages</b></sub>
      </a>
    </td>
    <!---->
<!---->
</table>

