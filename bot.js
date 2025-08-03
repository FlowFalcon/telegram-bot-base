const { Telegraf } = require("telegraf");
const fs = require("fs");
const path = require("path");
const config = require("./config");
const logger = require("./utils/logger");
const CommandManager = require("./utils/commandManager");

// Inisialisasi bot
const bot = new Telegraf(config.botToken);

// Inisialisasi Command Manager
const commandManager = new CommandManager();

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

// Load semua command
commandManager.loadCommands(path.join(__dirname, "commands"));

// Register commands dengan Telegraf
for (const [name, command] of commandManager.getAllCommands()) {
    if (command.middleware && Array.isArray(command.middleware)) {
        bot.command(command.name, ...command.middleware, command.execute.bind(command));
    } else {
        bot.command(command.name, command.execute.bind(command));
    }
    logger.info(`Command registered with Telegraf: ${command.name}`);
}

// Logging setiap command yang dijalankan
bot.use(async (ctx, next) => {
    if (ctx.message && ctx.message.text && ctx.message.text.startsWith("/")) {
        const commandName = ctx.message.text.split(" ")[0];
        const user = ctx.from;
        const chatType = ctx.chat.type;
        const chatName = ctx.chat.title || ctx.chat.username || chatType;
        logger.info(`Command: ${commandName} | User: ${user.first_name} (${user.id}) | Chat: ${chatName} (${chatType})`);
    }
    await next();
});

// Handle callback queries (actions)
bot.on('callback_query', async (ctx) => {
    const callbackData = ctx.callbackQuery.data;
    
    // Cari action yang sesuai
    const allActions = commandManager.getAllActions();
    let handled = false;
    
    for (const [actionName, handler] of allActions) {
        if (callbackData === actionName || callbackData.startsWith(actionName + '_')) {
            try {
                await handler(ctx);
                handled = true;
                break;
            } catch (error) {
                logger.error(`Error handling action ${actionName}: ${error.message}`);
                await ctx.answerCbQuery('Terjadi kesalahan saat memproses aksi.');
                handled = true;
                break;
            }
        }
    }
    
    if (!handled) {
        await ctx.answerCbQuery('Aksi tidak ditemukan.');
    }
});

// Handle text messages untuk session management
bot.on("text", async (ctx, next) => {
    const userId = ctx.from.id;
    const messageText = ctx.message.text.trim();
    
    // Skip jika ini adalah command
    if (messageText.startsWith('/')) {
        return await next();
    }
    
    // Cari command yang memiliki session aktif
    const commandsWithSession = commandManager.getCommandsWithActiveSession(userId);
    let handled = false;
    
    for (const command of commandsWithSession) {
        if (command.getHandlers) {
            const handlers = command.getHandlers();
            for (const [condition, handler] of handlers) {
                try {
                    const result = await handler(ctx);
                    if (result === true) {
                        handled = true;
                        break;
                    }
                } catch (error) {
                    logger.error(`Error handling text for command ${command.name}: ${error.message}`);
                }
            }
            if (handled) break;
        }
    }
    
    if (!handled) {
        await next();
    }
});

// Set bot commands (for /help and Telegram's command list)
const commands = Array.from(commandManager.getAllCommands().values());
bot.telegram.setMyCommands(
    commands.map((cmd) => ({
        command: cmd.name,
        description: cmd.description || "",
    }))
);

// Anti-link feature
bot.on("message", async (ctx, next) => {
    if (ctx.message.text) {
        const messageText = ctx.message.text.toLowerCase();
        const urlRegex = /(https?:\/\/[^\s]+)/g;

        if (urlRegex.test(messageText)) {
            const chatMember = await ctx.getChatMember(ctx.from.id);
            if (!["administrator", "creator"].includes(chatMember.status)) {
                try {
                    await ctx.deleteMessage(ctx.message.message_id);
                    logger.warn(`Link terdeteksi dan dihapus dari ${ctx.chat.title || ctx.chat.type} oleh ${ctx.from.first_name} (${ctx.from.id})`);
                    
                    // Warn system
                    const warnsPath = path.join(__dirname, "data", "warns.json");
                    let warns = {};
                    if (fs.existsSync(warnsPath)) {
                        warns = JSON.parse(fs.readFileSync(warnsPath, "utf8"));
                    }

                    const userId = ctx.from.id.toString();
                    if (!warns[ctx.chat.id]) {
                        warns[ctx.chat.id] = {};
                    }
                    if (!warns[ctx.chat.id][userId]) {
                        warns[ctx.chat.id][userId] = 0;
                    }
                    warns[ctx.chat.id][userId]++;

                    fs.writeFileSync(warnsPath, JSON.stringify(warns, null, 2));

                    if (warns[ctx.chat.id][userId] >= 3) {
                        await ctx.kickChatMember(ctx.from.id);
                        ctx.reply(`${ctx.from.first_name} telah di-kick karena mencapai 3 warn.`);
                        delete warns[ctx.chat.id][userId]; // Reset warn after kick
                        fs.writeFileSync(warnsPath, JSON.stringify(warns, null, 2));
                    } else {
                        ctx.reply(`${ctx.from.first_name}, link tidak diizinkan! Warn ke-${warns[ctx.chat.id][userId]} (maks 3).`);
                    }
                } catch (error) {
                    logger.error(`Gagal menghapus pesan atau mengelola warn: ${error.message}`);
                }
            }
        }
    }
    next();
});

// Error handling
bot.catch((err, ctx) => {
    logger.error(`Error for ${ctx.updateType}: ${err}`);
});

// Start bot
bot.launch();
logger.info("Bot started with modular command system!");

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));


