const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { spawn } = require("child_process");
const ownerOnly = require("../../middlewares/ownerOnly");
const { Markup } = require("telegraf");

const mirrorSessions = new Map();
const runningMirrors = new Map(); // mirrorId -> process
const DANGEROUS_COMMANDS = ['eval', 'shell', 'exec', 'restart', 'cmd', 'backup', 'viewlogs', 'clearlog', 'mirror'];
const ALLOWED_OWNER_COMMANDS = ['addprem', 'delprem', 'addowner', 'delowner', 'setnamebot', 'setownername', 'setthumb'];

module.exports = {
    name: "mirror",
    description: "Manajemen mirror bot",
    register: (bot) => {
        const mirrorPath = path.join(__dirname, "..", "..", "data", "mirrors.json");
        
        const loadMirrors = () => {
            if (fs.existsSync(mirrorPath)) {
                return JSON.parse(fs.readFileSync(mirrorPath, "utf8"));
            }
            return {};
        };
        
        const saveMirrors = (mirrors) => {
            fs.writeFileSync(mirrorPath, JSON.stringify(mirrors, null, 2));
        };

        const setupMirrorData = (mirrorId, ownerId, botName = "Mirror Bot") => {
            const mirrorDataDir = path.join(__dirname, "..", "..", "mirror_data", mirrorId);
            
            if (!fs.existsSync(mirrorDataDir)) {
                fs.mkdirSync(mirrorDataDir, { recursive: true });
            }

            const dataFiles = {
                "owners.json": [ownerId],
                "premiums.json": [],
                "warns.json": {},
                "botinfo.json": {
                    botName: botName,
                    ownerName: "Mirror Owner",
                    thumbnail: null
                }
            };

            Object.keys(dataFiles).forEach(fileName => {
                const filePath = path.join(mirrorDataDir, fileName);
                if (!fs.existsSync(filePath)) {
                    fs.writeFileSync(filePath, JSON.stringify(dataFiles[fileName], null, 2));
                }
            });

            return mirrorDataDir;
        };

        const startMirrorBot = async (mirrorId, mirror, ctx) => {
            if (runningMirrors.has(mirrorId)) {
                return false; 
            }

            try {
                const mirrorDataDir = setupMirrorData(mirrorId, mirror.ownerId, mirror.botName || "Mirror Bot");

                const mirrorConfig = {
                    botToken: mirror.botToken,
                    ownerId: mirror.ownerId,
                    mirrorId: mirrorId,
                    originalOwner: mirror.createdBy,
                    dataDir: mirrorDataDir
                };
                
                const configPath = path.join(__dirname, "..", "..", `mirror_${mirrorId}_config.js`);
                const configContent = `module.exports = ${JSON.stringify(mirrorConfig, null, 2)};`;
                fs.writeFileSync(configPath, configContent);
                
                const mirrorProcess = spawn("node", [
                    path.join(__dirname, "..", "..", "mirror_bot.js"), 
                    mirrorId
                ], {
                    detached: false,
                    stdio: ['ignore', 'pipe', 'pipe']
                });
                
                runningMirrors.set(mirrorId, mirrorProcess);
                
                mirrorProcess.on('exit', (code) => {
                    runningMirrors.delete(mirrorId);
                    console.log(`Mirror ${mirrorId} exited with code ${code}`);
                });

                mirrorProcess.stdout.on('data', (data) => {
                    console.log(`Mirror ${mirrorId}: ${data}`);
                });

                mirrorProcess.stderr.on('data', (data) => {
                    console.error(`Mirror ${mirrorId} error: ${data}`);
                });
                
                return true;
                
            } catch (error) {
                console.error(`Failed to start mirror ${mirrorId}:`, error);
                return false;
            }
        };
        
        bot.command("mirror", ownerOnly, async (ctx) => {
            const mirrors = loadMirrors();
            const activeMirrors = Object.keys(mirrors).length;
            const runningCount = runningMirrors.size;
            
            const buttons = [
                [Markup.button.callback("➕ Buat Mirror Baru", "mirror_create")],
                [Markup.button.callback("📋 Daftar Mirror", "mirror_list")],
                [Markup.button.callback("🔄 Auto Start All", "mirror_startall")],
                [Markup.button.callback("⏹️ Stop All", "mirror_stopall")],
                [Markup.button.callback("📊 Statistik", "mirror_stats")]
            ];
            
            await ctx.reply(
                `🪞 **Mirror Bot Manager**\n\n` +
                `📈 Mirror Terdaftar: ${activeMirrors}\n` +
                `🟢 Mirror Aktif: ${runningCount}\n` +
                `🔒 Mode Keamanan: Aktif\n` +
                `⚡ Status Server: Online\n\n` +
                `Setiap mirror memiliki data terpisah:\n` +
                `• Database owner/premium sendiri\n` +
                `• Konfigurasi bot sendiri\n` +
                `• Log aktivitas terpisah\n\n` +
                `Pilih opsi di bawah:`,
                {
                    parse_mode: "Markdown",
                    ...Markup.inlineKeyboard(buttons)
                }
            );
        });
        
        bot.action("mirror_create", ownerOnly, async (ctx) => {
            const sessionId = crypto.randomBytes(16).toString('hex');
            mirrorSessions.set(sessionId, { 
                userId: ctx.from.id, 
                step: 'await_token',
                created: Date.now()
            });
            
            await ctx.editMessageText(
                `🤖 **Buat Mirror Bot Baru**\n\n` +
                `**Step 1:** Kirim bot token yang ingin di-mirror:\n` +
                `Format: \`1234567890:AABBCCDDeeFFggHHiiJJKKllMMnnOOppQQ\`\n\n` +
                `⚠️ **Keamanan:**\n` +
                `• Data terpisah total dari bot utama\n` +
                `• Database owner/premium sendiri\n` +
                `• Command berbahaya diblokir\n` +
                `• Auto start setelah registrasi\n\n` +
                `Session ID: \`${sessionId}\``,
                { 
                    parse_mode: "Markdown",
                    ...Markup.inlineKeyboard([[
                        Markup.button.callback("❌ Batal", "mirror_cancel")
                    ]])
                }
            );
        });
        
        bot.on("text", async (ctx, next) => {
            const userId = ctx.from.id;
            let userSession = null;
            
            for (let [sessionId, session] of mirrorSessions) {
                if (session.userId === userId) {
                    userSession = { sessionId, ...session };
                    break;
                }
            }
            
            if (!userSession || !userSession.step) {
                return next();
            }
            
            const text = ctx.message.text.trim();
            
            if (userSession.step === 'await_token') {
                const tokenRegex = /^\d{8,10}:[a-zA-Z0-9_-]{35}$/;
                if (!tokenRegex.test(text)) {
                    return ctx.reply("❌ Format token tidak valid. Kirim ulang token yang benar.");
                }
                
                mirrorSessions.set(userSession.sessionId, {
                    ...userSession,
                    botToken: text,
                    step: 'await_owner'
                });
                
                await ctx.reply(
                    `✅ Token diterima!\n\n` +
                    `**Step 2:** Kirim User ID owner mirror bot:\n` +
                    `(ID user yang akan jadi owner di mirror bot ini)\n\n` +
                    `💡 Owner ini akan punya akses penuh ke mirror bot dan database terpisah.`
                );
                
            } else if (userSession.step === 'await_owner') {
                const ownerId = parseInt(text);
                if (isNaN(ownerId)) {
                    return ctx.reply("❌ Owner ID harus berupa angka. Kirim ulang.");
                }
                
                mirrorSessions.set(userSession.sessionId, {
                    ...userSession,
                    ownerId: ownerId,
                    step: 'await_botname'
                });
                
                await ctx.reply(
                    `✅ Owner ID diterima!\n\n` +
                    `**Step 3:** Kirim nama bot mirror:\n` +
                    `(Nama yang akan ditampilkan di /start)\n\n` +
                    `Contoh: "My Awesome Mirror Bot"`
                );
                
            } else if (userSession.step === 'await_botname') {
                const botName = text;
                if (botName.length < 3) {
                    return ctx.reply("❌ Nama bot minimal 3 karakter. Kirim ulang.");
                }
                
                const mirrors = loadMirrors();
                const mirrorId = Date.now().toString();
                
                mirrors[mirrorId] = {
                    botToken: userSession.botToken,
                    ownerId: userSession.ownerId,
                    botName: botName,
                    createdBy: userId,
                    created: Date.now(),
                    permissions: {
                        allowedCommands: ALLOWED_OWNER_COMMANDS,
                        blockedCommands: DANGEROUS_COMMANDS,
                        maxUsers: 1000,
                        rateLimitPerMinute: 30
                    },
                    stats: {
                        totalCommands: 0,
                        lastActivity: null,
                        users: [],
                        uptime: 0
                    }
                };
                
                saveMirrors(mirrors);
                mirrorSessions.delete(userSession.sessionId);
                
                const startSuccess = await startMirrorBot(mirrorId, mirrors[mirrorId], ctx);
                
                const statusMsg = startSuccess ? '🟢 Auto Started' : '🔴 Start Failed';
                
                await ctx.reply(
                    `🎉 **Mirror Bot Berhasil Dibuat!**\n\n` +
                    `🆔 Mirror ID: \`${mirrorId}\`\n` +
                    `🤖 Nama Bot: **${botName}**\n` +
                    `👤 Owner Mirror: \`${userSession.ownerId}\`\n` +
                    `⚡ Status: ${statusMsg}\n\n` +
                    `📂 **Data Storage:**\n` +
                    `• Database terpisah di \`mirror_data/${mirrorId}/\`\n` +
                    `• Owner list: [${userSession.ownerId}]\n` +
                    `• Premium list: []\n` +
                    `• Bot info: Custom untuk mirror ini\n\n` +
                    `🚫 **Fitur yang diblokir:**\n` +
                    DANGEROUS_COMMANDS.map(cmd => `• /${cmd}`).join('\n') + '\n\n' +
                    `✅ **Fitur owner yang diizinkan:**\n` +
                    ALLOWED_OWNER_COMMANDS.map(cmd => `• /${cmd}`).join('\n') + '\n\n' +
                    `Mirror bot siap digunakan! 🚀`,
                    { parse_mode: "Markdown" }
                );
            } else {
                return next();
            }
        });
        
        bot.action("mirror_list", ownerOnly, async (ctx) => {
            const mirrors = loadMirrors();
            const mirrorKeys = Object.keys(mirrors);
            
            if (mirrorKeys.length === 0) {
                return ctx.editMessageText(
                    `📋 **Daftar Mirror Bot**\n\n` +
                    `Belum ada mirror bot yang dibuat.\n` +
                    `Gunakan "Buat Mirror Baru" untuk membuat yang pertama.`,
                    {
                        parse_mode: "Markdown",
                        ...Markup.inlineKeyboard([[
                            Markup.button.callback("⬅️ Kembali", "mirror_back")
                        ]])
                    }
                );
            }
            
            let message = `📋 **Daftar Mirror Bot** (${mirrorKeys.length})\n\n`;
            
            mirrorKeys.forEach((mirrorId, index) => {
                const mirror = mirrors[mirrorId];
                const created = new Date(mirror.created).toLocaleDateString('id-ID');
                const isRunning = runningMirrors.has(mirrorId);
                const status = isRunning ? '🟢' : '🔴';
                
                message += `**${index + 1}. ${mirror.botName}**\n`;
                message += `${status} ID: \`${mirrorId}\`\n`;
                message += `👤 Owner: \`${mirror.ownerId}\` | 📅 ${created}\n`;
                message += `📊 Cmd: ${mirror.stats.totalCommands} | 👥 Users: ${mirror.stats.users.length}\n\n`;
            });
            
            const buttons = [];
            for (let i = 0; i < mirrorKeys.length; i += 2) {
                const row = mirrorKeys.slice(i, i + 2).map(mirrorId => 
                    Markup.button.callback(`⚙️ ${mirrorId.slice(-4)}`, `mirror_manage_${mirrorId}`)
                );
                buttons.push(row);
            }
            buttons.push([Markup.button.callback("⬅️ Kembali", "mirror_back")]);
            
            await ctx.editMessageText(message, {
                parse_mode: "Markdown",
                ...Markup.inlineKeyboard(buttons)
            });
        });
        
        bot.action(/^mirror_manage_(.+)$/, ownerOnly, async (ctx) => {
            const mirrorId = ctx.match[1];
            const mirrors = loadMirrors();
            const mirror = mirrors[mirrorId];
            
            if (!mirror) {
                return ctx.answerCbQuery("Mirror tidak ditemukan!", { show_alert: true });
            }
            
            const isRunning = runningMirrors.has(mirrorId);
            
            const buttons = [
                [
                    Markup.button.callback(isRunning ? "⏹️ Stop" : "▶️ Start", `mirror_toggle_${mirrorId}`),
                    Markup.button.callback("🔄 Restart", `mirror_restart_${mirrorId}`)
                ],
                [
                    Markup.button.callback("📊 Stats", `mirror_stats_${mirrorId}`),
                    Markup.button.callback("🗂️ Data", `mirror_data_${mirrorId}`)
                ],
                [
                    Markup.button.callback("🔄 Reset All Data", `mirror_reset_${mirrorId}`),
                    Markup.button.callback("🗑️ Hapus Mirror", `mirror_delete_${mirrorId}`)
                ],
                [Markup.button.callback("⬅️ Kembali", "mirror_list")]
            ];
            
            const status = isRunning ? '🟢 Running' : '🔴 Stopped';
            const uptime = mirror.stats.lastActivity ? 
                Math.round((Date.now() - mirror.stats.lastActivity) / 1000 / 60) : 'N/A';
            
            await ctx.editMessageText(
                `⚙️ **${mirror.botName} Management**\n\n` +
                `🆔 ID: \`${mirrorId}\`\n` +
                `👤 Owner: \`${mirror.ownerId}\`\n` +
                `📅 Dibuat: ${new Date(mirror.created).toLocaleDateString('id-ID')}\n` +
                `${status} | ⏱️ Last: ${uptime} menit lalu\n\n` +
                `📊 **Statistik:**\n` +
                `• Commands: ${mirror.stats.totalCommands}\n` +
                `• Users: ${mirror.stats.users.length}\n` +
                `• Rate Limit: ${mirror.permissions.rateLimitPerMinute}/mnt\n\n` +
                `📂 **Data Path:** \`mirror_data/${mirrorId}/\``,
                {
                    parse_mode: "Markdown",
                    ...Markup.inlineKeyboard(buttons)
                }
            );
        });

        bot.action(/^mirror_toggle_(.+)$/, ownerOnly, async (ctx) => {
            const mirrorId = ctx.match[1];
            const mirrors = loadMirrors();
            const mirror = mirrors[mirrorId];
            
            if (!mirror) {
                return ctx.answerCbQuery("Mirror tidak ditemukan!", { show_alert: true });
            }

            const isRunning = runningMirrors.has(mirrorId);
            
            if (isRunning) {
                const process = runningMirrors.get(mirrorId);
                process.kill();
                runningMirrors.delete(mirrorId);
                await ctx.answerCbQuery("Mirror bot dihentikan");
            } else {
                const success = await startMirrorBot(mirrorId, mirror, ctx);
                await ctx.answerCbQuery(success ? "Mirror bot dijalankan" : "Gagal menjalankan mirror");
            }
            
            ctx.callbackQuery.data = `mirror_manage_${mirrorId}`;
            return bot.handleUpdate({
                ...ctx.update,
                callback_query: ctx.callbackQuery
            });
        });

        bot.action(/^mirror_reset_(.+)$/, ownerOnly, async (ctx) => {
            const mirrorId = ctx.match[1];
            const mirrors = loadMirrors();
            const mirror = mirrors[mirrorId];
            
            if (!mirror) {
                return ctx.answerCbQuery("Mirror tidak ditemukan!", { show_alert: true });
            }

            try {
                if (runningMirrors.has(mirrorId)) {
                    const process = runningMirrors.get(mirrorId);
                    process.kill();
                    runningMirrors.delete(mirrorId);
                }

                const mirrorDataDir = path.join(__dirname, "..", "..", "mirror_data", mirrorId);
                if (fs.existsSync(mirrorDataDir)) {
                    fs.rmSync(mirrorDataDir, { recursive: true, force: true });
                }

                setupMirrorData(mirrorId, mirror.ownerId, mirror.botName);

                mirrors[mirrorId].stats = {
                    totalCommands: 0,
                    lastActivity: null,
                    users: [],
                    uptime: 0
                };

                saveMirrors(mirrors);

                const success = await startMirrorBot(mirrorId, mirrors[mirrorId], ctx);
                
                await ctx.answerCbQuery("✅ Mirror data berhasil direset dan direstart", { show_alert: true });
                
                ctx.callbackQuery.data = `mirror_manage_${mirrorId}`;
                return bot.handleUpdate({
                    ...ctx.update,
                    callback_query: ctx.callbackQuery
                });

            } catch (error) {
                await ctx.answerCbQuery(`❌ Gagal reset: ${error.message}`, { show_alert: true });
            }
        });

        bot.action("mirror_startall", ownerOnly, async (ctx) => {
            const mirrors = loadMirrors();
            const mirrorIds = Object.keys(mirrors);
            let started = 0;
            let failed = 0;

            for (const mirrorId of mirrorIds) {
                if (!runningMirrors.has(mirrorId)) {
                    const success = await startMirrorBot(mirrorId, mirrors[mirrorId], ctx);
                    if (success) {
                        started++;
                    } else {
                        failed++;
                    }
                }
            }

            await ctx.answerCbQuery(
                `✅ Started: ${started} | ❌ Failed: ${failed}`,
                { show_alert: true }
            );
        });

        bot.action("mirror_stopall", ownerOnly, async (ctx) => {
            let stopped = 0;
            
            for (const [mirrorId, process] of runningMirrors) {
                try {
                    process.kill();
                    stopped++;
                } catch (error) {
                    console.error(`Failed to stop mirror ${mirrorId}:`, error);
                }
            }
            
            runningMirrors.clear();
            await ctx.answerCbQuery(`🛑 ${stopped} mirror bots dihentikan`, { show_alert: true });
        });

        bot.action(/^mirror_data_(.+)$/, ownerOnly, async (ctx) => {
            const mirrorId = ctx.match[1];
            const mirrorDataDir = path.join(__dirname, "..", "..", "mirror_data", mirrorId);
            
            if (!fs.existsSync(mirrorDataDir)) {
                return ctx.answerCbQuery("Data directory tidak ditemukan!", { show_alert: true });
            }

            try {
                const ownersData = JSON.parse(fs.readFileSync(path.join(mirrorDataDir, "owners.json"), "utf8"));
                const premiumsData = JSON.parse(fs.readFileSync(path.join(mirrorDataDir, "premiums.json"), "utf8"));
                const botInfoData = JSON.parse(fs.readFileSync(path.join(mirrorDataDir, "botinfo.json"), "utf8"));
                const warnsData = JSON.parse(fs.readFileSync(path.join(mirrorDataDir, "warns.json"), "utf8"));

                const message = `📂 **Mirror Data - ${mirrorId}**\n\n` +
                    `📁 Path: \`mirror_data/${mirrorId}/\`\n\n` +
                    `👑 **Owners:** ${ownersData.length}\n` +
                    `${ownersData.map(id => `• \`${id}\``).join('\n')}\n\n` +
                    `💎 **Premiums:** ${premiumsData.length}\n` +
                    `${premiumsData.length > 0 ? premiumsData.map(id => `• \`${id}\``).join('\n') : '• (Tidak ada)'}\n\n` +
                    `⚠️ **Warns:** ${Object.keys(warnsData).length} users\n\n` +
                    `🤖 **Bot Info:**\n` +
                    `• Nama: ${botInfoData.botName}\n` +
                    `• Owner: ${botInfoData.ownerName}\n` +
                    `• Thumbnail: ${botInfoData.thumbnail ? 'Ada' : 'Tidak ada'}`;

                await ctx.answerCbQuery();
                await ctx.reply(message, { 
                    parse_mode: "Markdown",
                    reply_markup: Markup.inlineKeyboard([[
                        Markup.button.callback("⬅️ Kembali ke Management", `mirror_manage_${mirrorId}`)
                    ]])
                });

            } catch (error) {
                await ctx.answerCbQuery(`❌ Error membaca data: ${error.message}`, { show_alert: true });
            }
        });

        bot.action(/^mirror_delete_(.+)$/, ownerOnly, async (ctx) => {
            const mirrorId = ctx.match[1];
            
            try {
                if (runningMirrors.has(mirrorId)) {
                    const process = runningMirrors.get(mirrorId);
                    process.kill();
                    runningMirrors.delete(mirrorId);
                }

                const mirrorDataDir = path.join(__dirname, "..", "..", "mirror_data", mirrorId);
                if (fs.existsSync(mirrorDataDir)) {
                    fs.rmSync(mirrorDataDir, { recursive: true, force: true });
                }

                const configPath = path.join(__dirname, "..", "..", `mirror_${mirrorId}_config.js`);
                if (fs.existsSync(configPath)) {
                    fs.unlinkSync(configPath);
                }

                const mirrors = loadMirrors();
                delete mirrors[mirrorId];
                saveMirrors(mirrors);

                await ctx.answerCbQuery("✅ Mirror berhasil dihapus", { show_alert: true });
                await ctx.editMessageText("🗑️ Mirror bot berhasil dihapus beserta semua datanya.");

            } catch (error) {
                await ctx.answerCbQuery(`❌ Gagal hapus: ${error.message}`, { show_alert: true });
            }
        });
        
        bot.action("mirror_cancel", async (ctx) => {
            const userId = ctx.from.id;
            for (let [sessionId, session] of mirrorSessions) {
                if (session.userId === userId) {
                    mirrorSessions.delete(sessionId);
                    break;
                }
            }
            await ctx.editMessageText("❌ Pembuatan mirror dibatalkan.");
        });
        
        bot.action("mirror_back", ownerOnly, async (ctx) => {
            const mirrors = loadMirrors();
            const activeMirrors = Object.keys(mirrors).length;
            const runningCount = runningMirrors.size;
            
            const buttons = [
                [Markup.button.callback("➕ Buat Mirror Baru", "mirror_create")],
                [Markup.button.callback("📋 Daftar Mirror", "mirror_list")],
                [Markup.button.callback("🔄 Auto Start All", "mirror_startall")],
                [Markup.button.callback("⏹️ Stop All", "mirror_stopall")],
                [Markup.button.callback("📊 Statistik", "mirror_stats")]
            ];
            
            await ctx.editMessageText(
                `🪞 **Mirror Bot Manager**\n\n` +
                `📈 Mirror Terdaftar: ${activeMirrors}\n` +
                `🟢 Mirror Aktif: ${runningCount}\n` +
                `🔒 Mode Keamanan: Aktif\n` +
                `⚡ Status Server: Online\n\n` +
                `Setiap mirror memiliki data terpisah:\n` +
                `• Database owner/premium sendiri\n` +
                `• Konfigurasi bot sendiri\n` +
                `• Log aktivitas terpisah\n\n` +
                `Pilih opsi di bawah:`,
                {
                    parse_mode: "Markdown",
                    ...Markup.inlineKeyboard(buttons)
                }
            );
        });
        
        setTimeout(async () => {
            const mirrors = loadMirrors();
            let autoStarted = 0;
            
            for (const [mirrorId, mirror] of Object.entries(mirrors)) {
                const success = await startMirrorBot(mirrorId, mirror, null);
                if (success) {
                    autoStarted++;
                }
            }
            
            if (autoStarted > 0) {
                console.log(`🪞 Auto-started ${autoStarted} mirror bots`);
            }
        }, 5000);

        setInterval(() => {
            const now = Date.now();
            for (let [sessionId, session] of mirrorSessions) {
                if (now - session.created > 1800000) { // 30 menit
                    mirrorSessions.delete(sessionId);
                }
            }
        }, 1800000);
    }
};