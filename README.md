# telegram-bot-base

Bot Telegram ini dibangun menggunakan Telegraf.js dengan arsitektur modular yang memungkinkan setiap command mengelola session, action, dan handler sendiri. Sistem ini memudahkan penambahan fitur baru tanpa perlu mengubah file utama.

## 🚀 Fitur Utama

- **Sistem Modular**: Setiap command dapat mengelola session, action button, dan text handler sendiri
- **Session Management**: Mendukung session untuk game, chat, dan fitur interaktif
- **Action Buttons**: Mudah membuat tombol interaktif dengan callback handling
- **Text Handlers**: Menangani input text tanpa perlu command
- **Middleware Support**: Validasi akses dan preprocessing yang fleksibel
- **Auto-load Commands**: Semua command di folder `commands/` otomatis ter-load

## Struktur Project

```
telegram-bot-base/
├── commands/             # Berisi semua command bot dengan sistem modular
│   ├── start.js         # Command dasar
│   ├── tebak.js         # Game dengan session management
│   ├── menu.js          # Menu dengan action buttons
│   ├── help.js          # Help command
│   ├── test.js          # Command test untuk sistem modular
│   └── ... (command lainnya)
├── utils/                # Utilitas sistem modular
│   ├── commandTemplate.js # Template dasar untuk semua command
│   ├── commandManager.js  # Manager untuk mengelola semua command
│   └── logger.js         # Modul untuk logging aktivitas bot
├── data/                 # Penyimpanan data lokal dalam format JSON
│   ├── botinfo.json      # Informasi dasar bot (nama, owner, thumbnail)
│   ├── owners.json       # Daftar ID user yang memiliki akses owner
│   ├── premiums.json     # Daftar ID user yang memiliki akses premium
│   └── warns.json        # Data warn user di setiap grup
├── middlewares/          # Fungsi middleware untuk validasi
│   ├── groupOnly.js      # Memastikan command hanya berjalan di grup
│   ├── ownerOnly.js      # Memastikan command hanya berjalan untuk owner
│   └── premiumOnly.js    # Memastikan command hanya berjalan untuk user premium/owner
├── bot.js                # File utama dengan sistem modular
├── config.js             # Konfigurasi penting bot
├── package.json          # Metadata project dan dependensi
├── COMMAND_GUIDE.md      # Panduan lengkap membuat command baru
└── README.md             # Dokumentasi ini
```

## Instalasi

1. **Clone repository ini:**
    ```bash
    git clone https://github.com/FlowFalcon/telegram-bot-base
    cd telegram-bot-base
    ```

2. **Instal dependensi:**
    ```bash
    npm install
    ```
*rekomendasi menggunakan nodejs versi 20 keatas*

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
  "thumbnail": "AgACAgUAAxkBAAMGaI4O9KPTvmFU1TAkw4i2_cygOl8AAjnEMRtQd3FUZkMJdM9MUnwBAAMCAAN4AAM2BA"
      // ganti thumbnail bisa di atur di bot nanti menggunakan fitur /setthumbnail sambil reply media
}
```

## Menjalankan Bot

```bash
npm start
# atau
node bot.js
```

## Fitur dan Command

### Command Dasar

*   `/start` - Menampilkan info bot (nama bot, nama owner, thumbnail)
*   `/help` - Menampilkan daftar semua command yang tersedia
*   `/menu` - Menu interaktif dengan tombol (contoh penggunaan action buttons)
*   `/test` - Command test untuk menguji sistem modular

### Command Game

*   `/tebak` - Game tebak angka 1-10 dengan 3 kesempatan. Setelah memulai game, user hanya perlu mengetik angka tebakan tanpa command

### Command Admin/Owner

*   `/ban` - Ban user dari grup (hanya admin grup)
*   `/addowner [id]` - Menambahkan user sebagai owner bot (hanya owner utama)
*   `/delowner [id]` - Menghapus user dari daftar owner bot (hanya owner utama)
*   `/addprem [id]` - Menambahkan user sebagai premium (hanya owner utama)
*   `/delprem [id]` - Menghapus user dari daftar premium (hanya owner utama)
*   `/setnamebot [text]` - Mengubah nama bot (hanya owner)
*   `/setownername [text]` - Mengubah nama owner (hanya owner)
*   `/setthumb` - Mengubah thumbnail bot (reply foto, hanya owner)
*   `/cekid` - Menampilkan ID user yang mengirim command

### Fitur Tambahan

*   **Anti-link:** Secara otomatis menghapus pesan yang mengandung link dari user non-admin
*   **Sistem Warn:** User yang mengirim link akan mendapatkan warn. Setelah 3 warn, user akan otomatis di-kick dari grup. Data warn disimpan di `data/warns.json`
*   **Middleware:** Sistem validasi akses yang fleksibel

## 🛠️ Membuat Command Baru

Sistem modular ini memungkinkan Anda membuat command baru dengan mudah. Lihat `COMMAND_GUIDE.md` untuk panduan lengkap.

### Contoh Command Sederhana

```javascript
const CommandTemplate = require('../utils/commandTemplate');

class MyCommand extends CommandTemplate {
    constructor() {
        super('mycommand', 'Deskripsi command saya');
    }

    async execute(ctx) {
        await ctx.reply('Hello World!');
    }
}

module.exports = new MyCommand();
```

### Contoh Command dengan Session

```javascript
const CommandTemplate = require('../utils/commandTemplate');

class ChatCommand extends CommandTemplate {
    constructor() {
        super('chat', 'Command dengan session management');
        this.setupHandlers();
    }

    setupHandlers() {
        this.addTextHandler('chat_input', async (ctx) => {
            const userId = ctx.from.id;
            
            if (!this.hasActiveSession(userId)) {
                return false;
            }

            const message = ctx.message.text;
            await ctx.reply(`Anda mengatakan: ${message}`);
            this.clearSession(userId);
            return true;
        });
    }

    async execute(ctx) {
        const userId = ctx.from.id;
        this.setSession(userId, { status: 'chatting' });
        await ctx.reply('Mulai chat! Ketik pesan Anda:');
    }
}

module.exports = new ChatCommand();
```

## Keunggulan Sistem Modular

1. **Isolasi**: Setiap command mengelola session dan handler sendiri
2. **Mudah Diperluas**: Tambah command baru tanpa mengubah file lain
3. **Maintainable**: Kode terorganisir dengan baik
4. **Fleksibel**: Mendukung berbagai jenis command (game, menu, admin, dll)
5. **Reusable**: Template dapat digunakan untuk berbagai jenis command

## Troubleshooting

### Command tidak ter-load
- Pastikan file command berada di folder `commands/`
- Pastikan file export instance class yang extend `CommandTemplate`
- Cek console untuk error saat loading

### Action button tidak berfungsi
- Pastikan `callback_data` sesuai dengan action yang didefinisikan
- Gunakan prefix untuk menghindari konflik (misal: `menu_info`)

### Session tidak berfungsi
- Pastikan `setSession()` dipanggil sebelum `addTextHandler()`
- Pastikan `clearSession()` dipanggil setelah selesai
- Return `true` di handler jika sudah dihandle

## Kontribusi

Silakan berkontribusi dengan membuat pull request atau melaporkan issue. Pastikan mengikuti panduan di `COMMAND_GUIDE.md` untuk membuat command baru.

## License

MIT License - lihat file LICENSE untuk detail.