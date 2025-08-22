// mirror_bot.js
const { Telegraf, session } = require("telegraf");
const fs = require("fs");
const path = require("path");
const mirrorSecurity = require("./middlewares/mirrorSecurity");
const logger = require("./utils/logger");

const mirrorId = process.argv[2];
if (!mirrorId) {
    console.error("Mirror ID required");
    process.exit(1);
}

const configPath = path.join(__dirname, `mirror_${mirrorId}_config.js`);
if (!fs.existsSync(configPath)) {
    console.error("Mirror config not found");
    process.exit(1);
}

const config = require(configPath);
const mirrorDataDir = config.dataDir;

console.log(`Starting mirror bot ${mirrorId} with data dir: ${mirrorDataDir}`);

const bot = new Telegraf(config.botToken);
bot.use(session());

bot.use(mirrorSecurity(mirrorId, mirrorDataDir));

const createMirrorOwnerOnly = () => {
    return async (ctx, next) => {
        const userId = ctx.from.id;
        const ownersPath = path.join(mirrorDataDir, 'owners.json');
        
        let owners = [];
        if (fs.existsSync(ownersPath)) {
            owners = JSON.parse(fs.readFileSync(ownersPath, 'utf8'));
        }
        
        if (!owners.includes(userId)) {
            return ctx.reply('[!] Perintah ini hanya bisa digunakan oleh owner mirror bot.');
        }
        
        await next();
    };
};

const createMirrorPremiumOnly = () => {
    return async (ctx, next) => {
        const userId = ctx.from.id;
        const premiumsPath = path.join(mirrorDataDir, 'premiums.json');
        const ownersPath = path.join(mirrorDataDir, 'owners.json');
        
        let premiums = [];
        let owners = [];
        
        if (fs.existsSync(premiumsPath)) {
            premiums = JSON.parse(fs.readFileSync(premiumsPath, 'utf8'));
        }
        
        if (fs.existsSync(ownersPath)) {
            owners = JSON.parse(fs.readFileSync(ownersPath, 'utf8'));
        }
        
        if (!owners.includes(userId) && !premiums.includes(userId)) {
            return ctx.reply('[!] Perintah ini hanya bisa digunakan oleh user premium.');
        }
        
        await next();
    };
};

const loadMirrorCommands = (dir) => {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    const dangerousCommands = ['eval', 'shell', 'exec', 'restart', 'cmd', 'backup', 'viewlogs', 'clearlog', 'mirror'];
    
    for (const file of files) {
        const fullPath = path.join(dir, file.name);
        if (file.isDirectory()) {
            loadMirrorCommands(fullPath);
        } else if (file.isFile() && file.name.endsWith(".js")) {
            try {
                delete require.cache[require.resolve(fullPath)];
                
                const commandModule = require(fullPath);
                
                if (commandModule.name && dangerousCommands.includes(commandModule.name)) {
                    console.log(`[MIRROR ${mirrorId}] Blocked dangerous command: ${commandModule.name}`);
                    continue;
                }
                
                if (typeof commandModule.register === "function") {
                    if (['addowner', 'delowner', 'addprem', 'delprem', 'setnamebot', 'setownername', 'setthumb'].includes(commandModule.name)) {
                        registerMirrorOwnerCommand(bot, commandModule, mirrorDataDir);
                    } else {
                        commandModule.register(bot);
                    }
                    console.log(`[MIRROR ${mirrorId}] Loaded command: ${commandModule.name}`);
                }
            } catch (error) {
                console.error(`[MIRROR ${mirrorId}] Error loading ${file.name}:`, error.message);
            }
        }
    }
};

const registerMirrorOwnerCommand = (bot, commandModule, dataDir) => {
    const mirrorOwnerOnly = createMirrorOwnerOnly();
    
    switch (commandModule.name) {
        case 'addowner':
            bot.command("addowner", mirrorOwnerOnly, async (ctx) => {
                const args = ctx.message.text.split(" ");
                
                if (args.length < 2) {
                    return ctx.reply("Gunakan: /addowner [user_id]");
                }

                const userId = parseInt(args[1]);
                if (isNaN(userId)) {
                    return ctx.reply("ID user harus berupa angka.");
                }

                const ownersPath = path.join(dataDir, "owners.json");
                let owners = [];

                if (fs.existsSync(ownersPath)) {
                    owners = JSON.parse(fs.readFileSync(ownersPath, "utf8"));
                }

                if (owners.includes(userId)) {
                    return ctx.reply("User sudah menjadi owner mirror bot ini.");
                }

                owners.push(userId);
                fs.writeFileSync(ownersPath, JSON.stringify(owners, null, 2));
                
                ctx.reply(`User ${userId} berhasil ditambahkan sebagai owner mirror bot.`);
            });
            break;
            
        case 'delowner':
            bot.command("delowner", mirrorOwnerOnly, async (ctx) => {
                const args = ctx.message.text.split(" ");
                
                if (args.length < 2) {
                    return ctx.reply("Gunakan: /delowner [user_id]");
                }

                const userId = parseInt(args[1]);
                if (isNaN(userId)) {
                    return ctx.reply("ID user harus berupa angka.");
                }

                const ownersPath = path.join(dataDir, "owners.json");
                let owners = [];

                if (fs.existsSync(ownersPath)) {
                    owners = JSON.parse(fs.readFileSync(ownersPath, "utf8"));
                }

                if (!owners.includes(userId)) {
                    return ctx.reply("User bukan owner mirror bot ini.");
                }

                if (owners[0] === userId) {
                    return ctx.reply("Tidak bisa menghapus owner utama mirror bot.");
                }

                owners = owners.filter(id => id !== userId);
                fs.writeFileSync(ownersPath, JSON.stringify(owners, null, 2));
                
                ctx.reply(`User ${userId} berhasil dihapus dari owner mirror bot.`);
            });
            break;
            
        case 'addprem':
            bot.command("addprem", mirrorOwnerOnly, async (ctx) => {
                const args = ctx.message.text.split(" ");
                
                if (args.length < 2) {
                    return ctx.reply("Gunakan: /addprem [user_id]");
                }

                const userId = parseInt(args[1]);
                if (isNaN(userId)) {
                    return ctx.reply("ID user harus berupa angka.");
                }

                const premiumsPath = path.join(dataDir, "premiums.json");
                let premiums = [];

                if (fs.existsSync(premiumsPath)) {
                    premiums = JSON.parse(fs.readFileSync(premiumsPath, "utf8"));
                }

                if (premiums.includes(userId)) {
                    return ctx.reply("User sudah premium di mirror bot ini.");
                }

                premiums.push(userId);
                fs.writeFileSync(premiumsPath, JSON.stringify(premiums, null, 2));
                
                ctx.reply(`User ${userId} berhasil ditambahkan sebagai premium di mirror bot.`);
            });
            break;
            
        case 'delprem':
            bot.command("delprem", mirrorOwnerOnly, async (ctx) => {
                const args = ctx.message.text.split(" ");
                
                if (args.length < 2) {
                    return ctx.reply("Gunakan: /delprem [user_id]");
                }

                const userId = parseInt(args[1]);
                if (isNaN(userId)) {
                    return ctx.reply("ID user harus berupa angka.");
                }

                const premiumsPath = path.join(dataDir, "premiums.json");
                let premiums = [];

                if (fs.existsSync(premiumsPath)) {
                    premiums = JSON.parse(fs.readFileSync(premiumsPath, "utf8"));
                }

                if (!premiums.includes(userId)) {
                    return ctx.reply("User bukan premium di mirror bot ini.");
                }

                premiums = premiums.filter(id => id !== userId);
                fs.writeFileSync(premiumsPath, JSON.stringify(premiums, null, 2));
                
                ctx.reply(`User ${userId} berhasil dihapus dari premium mirror bot.`);
            });
            break;
            
        case 'setnamebot':
            bot.command("setnamebot", mirrorOwnerOnly, async (ctx) => {
                const args = ctx.message.text.split(" ").slice(1);
                
                if (args.length === 0) {
                    return ctx.reply("Gunakan: /setnamebot [nama_bot]");
                }

                const newName = args.join(" ");
                const botInfoPath = path.join(dataDir, "botinfo.json");
                
                let botInfo = { botName: "Mirror Bot", ownerName: "Mirror Owner", thumbnail: null };
                if (fs.existsSync(botInfoPath)) {
                    botInfo = JSON.parse(fs.readFileSync(botInfoPath, "utf8"));
                }

                botInfo.botName = newName;
                fs.writeFileSync(botInfoPath, JSON.stringify(botInfo, null, 2));
                
                ctx.reply(`Nama mirror bot berhasil diubah menjadi: ${newName}`);
            });
            break;
            
        case 'setownername':
            bot.command("setownername", mirrorOwnerOnly, async (ctx) => {
                const args = ctx.message.text.split(" ").slice(1);
                
                if (args.length === 0) {
                    return ctx.reply("Gunakan: /setownername [nama_owner]");
                }

                const newOwnerName = args.join(" ");
                const botInfoPath = path.join(dataDir, "botinfo.json");
                
                let botInfo = { botName: "Mirror Bot", ownerName: "Mirror Owner", thumbnail: null };
                if (fs.existsSync(botInfoPath)) {
                    botInfo = JSON.parse(fs.readFileSync(botInfoPath, "utf8"));
                }

                botInfo.ownerName = newOwnerName;
                fs.writeFileSync(botInfoPath, JSON.stringify(botInfo, null, 2));
                
                ctx.reply(`Nama owner mirror bot berhasil diubah menjadi: ${newOwnerName}`);
            });
            break;
            
        case 'setthumb':
            bot.command("setthumb", mirrorOwnerOnly, async (ctx) => {
                if (!ctx.message.reply_to_message || !ctx.message.reply_to_message.photo) {
                    return ctx.reply("Reply foto untuk mengubah thumbnail mirror bot.");
                }

                const photo = ctx.message.reply_to_message.photo;
                const fileId = photo[photo.length - 1].file_id;
                
                const botInfoPath = path.join(dataDir, "botinfo.json");
                
                let botInfo = { botName: "Mirror Bot", ownerName: "Mirror Owner", thumbnail: null };
                if (fs.existsSync(botInfoPath)) {
                    botInfo = JSON.parse(fs.readFileSync(botInfoPath, "utf8"));
                }

                botInfo.thumbnail = fileId;
                fs.writeFileSync(botInfoPath, JSON.stringify(botInfo, null, 2));
                
                ctx.reply("Thumbnail mirror bot berhasil diubah.");
            });
            break;
    }
};

bot.command("start", async (ctx) => {
    const botInfoPath = path.join(mirrorDataDir, "botinfo.json");
    let botInfo = { botName: "Mirror Bot", ownerName: "Mirror Owner", thumbnail: null };

    if (fs.existsSync(botInfoPath)) {
        botInfo = JSON.parse(fs.readFileSync(botInfoPath, "utf8"));
    }

    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    let runtimeText = "";
    if (days > 0) runtimeText += `${days} hari, `;
    if (hours > 0) runtimeText += `${hours} jam, `;
    if (minutes > 0) runtimeText += `${minutes} menit, `;
    runtimeText += `${seconds} detik`;

    const currentDate = new Date().toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    let message = `🪞 **${botInfo.botName}** (Mirror Bot)\n\n`;
    message += `- **Owner:** ${botInfo.ownerName}\n`;
    message += `- **Mirror ID:** \`${mirrorId}\`\n`;
    message += `- **Runtime:** ${runtimeText}\n`;
    message += `- **Tanggal:** ${currentDate}\n`;
    message += `- **Memory Usage:** ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB\n\n`;
    message += `🔒 **Mirror Bot Features:**\n`;
    message += `• Data terpisah dari bot utama\n`;
    message += `• Database owner/premium sendiri\n`;
    message += `• Fitur berbahaya diblokir\n`;
    message += `• Rate limiting aktif\n\n`;
    message += `- Gunakan /help untuk melihat daftar perintah.\n`;
    message += `- Gunakan /mirrorinfo untuk info detail mirror.`;

    if (botInfo.thumbnail) {
        await ctx.replyWithPhoto(botInfo.thumbnail, { 
            caption: message,
            parse_mode: "Markdown"
        });
    } else {
        await ctx.reply(message, { parse_mode: "Markdown" });
    }
});

bot.command("mirrorinfo", async (ctx) => {
    const botInfoPath = path.join(mirrorDataDir, "botinfo.json");
    const ownersPath = path.join(mirrorDataDir, "owners.json");
    const premiumsPath = path.join(mirrorDataDir, "premiums.json");
    
    let botInfo = { botName: "Mirror Bot", ownerName: "Mirror Owner", thumbnail: null };
    let owners = [];
    let premiums = [];
    
    if (fs.existsSync(botInfoPath)) {
        botInfo = JSON.parse(fs.readFileSync(botInfoPath, "utf8"));
    }
    if (fs.existsSync(ownersPath)) {
        owners = JSON.parse(fs.readFileSync(ownersPath, "utf8"));
    }
    if (fs.existsSync(premiumsPath)) {
        premiums = JSON.parse(fs.readFileSync(premiumsPath, "utf8"));
    }
    
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    
    await ctx.reply(
        `🪞 **Mirror Bot Detail Info**\n\n` +
        `🆔 **Mirror ID:** \`${mirrorId}\`\n` +
        `🤖 **Bot Name:** ${botInfo.botName}\n` +
        `👤 **Owner Name:** ${botInfo.ownerName}\n` +
        `⏱️ **Uptime:** ${hours}h ${minutes}m\n` +
        `📂 **Data Path:** \`mirror_data/${mirrorId}/\`\n\n` +
        `👑 **Owners (${owners.length}):**\n` +
        `${owners.map(id => `• \`${id}\``).join('\n') || '• (Tidak ada)'}\n\n` +
        `💎 **Premiums (${premiums.length}):**\n` +
        `${premiums.map(id => `• \`${id}\``).join('\n') || '• (Tidak ada)'}\n\n` +
        `🔒 **Security Features:**\n` +
        `• Dangerous commands blocked\n` +
        `• Isolated data storage\n` +
        `• Rate limiting active\n` +
        `• Activity monitoring enabled\n` +
        `• Separate owner/premium database\n\n` +
        `ℹ️ Ini adalah mirror bot dengan data terpisah dari bot utama.`,
        { parse_mode: "Markdown" }
    );
});

loadMirrorCommands(path.join(__dirname, "commands"));

bot.use(async (ctx, next) => {
    if (ctx.message && ctx.message.text && ctx.message.text.startsWith("/")) {
        const commandName = ctx.message.text.split(" ")[0];
        const args = ctx.message.text.split(" ").slice(1);
        const user = ctx.from;
        const chat = ctx.chat;
        
        // Create log entry untuk mirror
        const logEntry = {
            timestamp: new Date().toISOString(),
            mirrorId: mirrorId,
            command: commandName,
            args: args,
            user: {
                id: user.id,
                name: user.first_name + (user.last_name ? ` ${user.last_name}` : ''),
                username: user.username || null
            },
            chat: {
                id: chat.id,
                type: chat.type,
                title: chat.title || null
            }
        };
        
        const mirrorLogPath = path.join(__dirname, "logs", `mirror_${mirrorId}_commands.log`);
        const logDir = path.dirname(mirrorLogPath);
        
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        
        fs.appendFileSync(mirrorLogPath, JSON.stringify(logEntry) + '\n');
    }
    await next();
});

bot.catch(async (err, ctx) => {
    console.error(`[MIRROR ${mirrorId}] Error for ${ctx.updateType}:`, err);

    const errorMessage = `🚨 **Mirror Bot Error** (${mirrorId})\n\n` +
                         `Update Type: ${ctx.updateType}\n` +
                         `Error: ${err.message}\n` +
                         `Time: ${new Date().toLocaleString('id-ID')}`;

    if (config.originalOwner && ctx.chat && ctx.chat.type !== "private") {
        try {
            await bot.telegram.sendMessage(config.originalOwner, errorMessage, { parse_mode: "Markdown" });
        } catch (ownerError) {
            console.error(`[MIRROR ${mirrorId}] Failed to send error to original owner:`, ownerError.message);
        }
    }

    if (ctx.chat && ctx.chat.type !== "private") {
        await ctx.reply("Maaf, terjadi kesalahan pada mirror bot. Error telah dilaporkan.");
    }
});

bot.launch({
  dropPendingUpdates: true,
  onLaunch: () => console.log(`[MIRROR ${mirrorId}] Mirror bot started successfully!`)
});

process.once("SIGINT", () => {
    console.log(`[MIRROR ${mirrorId}] Shutting down...`);
    bot.stop("SIGINT");
});

process.once("SIGTERM", () => {
    console.log(`[MIRROR ${mirrorId}] Terminating...`);
    bot.stop("SIGTERM");
});