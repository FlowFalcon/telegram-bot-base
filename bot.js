const { Telegraf, session } = require("telegraf");
const fs = require("fs");
const path = require("path");
const config = require("./config");
const logger = require("./utils/logger");
const bot = new Telegraf(config.botToken);

bot.use(session());

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

const commands = [];
const loadedCommandNames = new Set();

const loadCommands = (dir, category = 'main') => {
    const files = fs.readdirSync(dir, { withFileTypes: true });

    for (const file of files) {
        const fullPath = path.join(dir, file.name);
        if (file.isDirectory()) {
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

const detectMessageType = (ctx) => {
    const message = ctx.message;
    if (!message) return { type: 'unknown', info: 'No message data' };
    
    const types = [];
    let info = '';
    
    if (message.text) {
        types.push('text');
        info = `Length: ${message.text.length} chars`;
    }
    
    if (message.photo) {
        types.push('photo');
        info = `Resolution: ${message.photo[message.photo.length - 1].width}x${message.photo[message.photo.length - 1].height}`;
    }
    
    if (message.video) {
        types.push('video');
        info = `Duration: ${message.video.duration}s, Size: ${Math.round(message.video.file_size / 1024)}KB`;
    }
    
    if (message.audio) {
        types.push('audio');
        info = `Duration: ${message.audio.duration}s, Size: ${Math.round(message.audio.file_size / 1024)}KB`;
    }
    
    if (message.voice) {
        types.push('voice');
        info = `Duration: ${message.voice.duration}s, Size: ${Math.round(message.voice.file_size / 1024)}KB`;
    }
    
    if (message.video_note) {
        types.push('video_note');
        info = `Duration: ${message.video_note.duration}s, Size: ${Math.round(message.video_note.file_size / 1024)}KB`;
    }
    
    if (message.document) {
        types.push('document');
        const fileName = message.document.file_name || 'unknown';
        const fileSize = Math.round(message.document.file_size / 1024);
        info = `File: ${fileName}, Size: ${fileSize}KB`;
    }
    
    if (message.sticker) {
        types.push('sticker');
        const isAnimated = message.sticker.is_animated ? 'animated' : 'static';
        const isVideo = message.sticker.is_video ? 'video' : 'regular';
        info = `Set: ${message.sticker.set_name || 'unknown'}, Type: ${isAnimated} ${isVideo}`;
    }
    
    if (message.animation) {
        types.push('animation');
        info = `Duration: ${message.animation.duration}s, Size: ${Math.round(message.animation.file_size / 1024)}KB`;
    }
    
    if (message.location) {
        types.push('location');
        info = `Lat: ${message.location.latitude}, Lon: ${message.location.longitude}`;
    }
    
    if (message.venue) {
        types.push('venue');
        info = `Title: ${message.venue.title}, Address: ${message.venue.address}`;
    }
    
    if (message.contact) {
        types.push('contact');
        info = `Name: ${message.contact.first_name} ${message.contact.last_name || ''}`;
    }
    
    if (message.poll) {
        types.push('poll');
        info = `Question: ${message.poll.question}, Options: ${message.poll.options.length}`;
    }
    
    if (message.dice) {
        types.push('dice');
        info = `Emoji: ${message.dice.emoji}, Value: ${message.dice.value}`;
    }
    
    if (message.game) {
        types.push('game');
        info = `Title: ${message.game.title}`;
    }
    
    return {
        type: types.length > 0 ? types.join(' + ') : 'unknown',
        info: info || 'No additional info'
    };
};

bot.use(async (ctx, next) => {
    if (ctx.message) {
        const user = ctx.from;
        const chat = ctx.chat;
        const messageType = detectMessageType(ctx);
        
        const userName = user.first_name + (user.last_name ? ` ${user.last_name}` : '');
        const userHandle = user.username ? `@${user.username}` : `ID:${user.id}`;
        
        let chatInfo = "";
        let chatType = "";
        switch (chat.type) {
            case "private":
                chatInfo = "Private Message";
                chatType = "Private";
                break;
            case "group":
                chatInfo = `Group: ${chat.title || 'Unknown Group'}`;
                chatType = "Group";
                break;
            case "supergroup":
                chatInfo = `Supergroup: ${chat.title || 'Unknown Supergroup'}`;
                chatType = "Supergroup";
                break;
            case "channel":
                chatInfo = `Channel: ${chat.title || 'Unknown Channel'}`;
                chatType = "Channel";
                break;
        }
        
        const timestamp = new Date().toLocaleString('id-ID', {
            timeZone: 'Asia/Jakarta',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        if (ctx.message.text && ctx.message.text.startsWith("/")) {
            const commandName = ctx.message.text.split(" ")[0];
            const args = ctx.message.text.split(" ").slice(1);
            
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
        } else {
            const logMessage = [
                `=================================`,
                `MESSAGE RECEIVED`,
                `Time: ${timestamp}`,
                `Type: ${messageType.type}`,
                `Info: ${messageType.info}`,
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
            
            const messageLogPath = path.join(__dirname, "logs", "messages.log");
            const messageLogDir = path.dirname(messageLogPath);
            
            if (!fs.existsSync(messageLogDir)) {
                fs.mkdirSync(messageLogDir, { recursive: true });
            }
            
            const logEntry = {
                timestamp: new Date().toISOString(),
                messageType: messageType.type,
                messageInfo: messageType.info,
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
            
            fs.appendFileSync(messageLogPath, JSON.stringify(logEntry) + '\n');
        }
    }
    await next();
});

loadCommands(path.join(__dirname, "commands"));
bot.telegram.setMyCommands(commands.map(cmd => ({ command: cmd.command, description: cmd.description })));

bot.catch(async (err, ctx) => {
    logger.error(`Error for ${ctx.updateType}: ${err}`);
    
    const errorMessage = `Bot Error!\nType: ${ctx.updateType}\nMessage: ${err.message}\nStack: <pre>${err.stack}</pre>`;
    
    if (config.ownerId) {
        try {
            await bot.telegram.sendMessage(config.ownerId, errorMessage, { parse_mode: "HTML" });
            logger.info(`Error sent to owner ${config.ownerId}`);
        } catch (ownerError) {
            logger.error(`Failed to notify owner: ${ownerError.message}`);
        }
    }
    
    if (ctx.chat?.type !== "private") {
        await ctx.reply("Error occurred. Owner notified.");
    }
});

bot.launch({
  dropPendingUpdates: true,
  onLaunch: () => console.log("Bot is starting!")
});

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));