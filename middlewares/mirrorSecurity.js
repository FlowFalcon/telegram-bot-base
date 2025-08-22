const fs = require('fs');
const path = require('path');

const BLOCKED_COMMANDS = ['eval', 'shell', 'exec', 'restart', 'cmd', 'backup', 'viewlogs', 'clearlog', 'mirror'];
const rateLimitMap = new Map(); // userId -> { count, resetTime }

module.exports = (mirrorId, mirrorDataDir) => {
    return async (ctx, next) => {
        const userId = ctx.from.id;
        const command = ctx.message?.text?.split(' ')[0]?.substring(1);
        
        const configPath = path.join(__dirname, "..", `mirror_${mirrorId}_config.js`);
        if (!fs.existsSync(configPath)) {
            return ctx.reply("❌ Mirror bot tidak terkonfigurasi.");
        }
        
        const mirrorConfig = require(configPath);
        
        if (command && BLOCKED_COMMANDS.includes(command)) {
            await ctx.reply(
                `🚫 **Command Diblokir**\n\n` +
                `Command \`/${command}\` tidak diizinkan untuk keamanan server.\n\n` +
               `📋 Command yang diblokir:\n` +
               BLOCKED_COMMANDS.map(cmd => `• /${cmd}`).join('\n') + '\n\n' +
               `ℹ️ Ini adalah mirror bot dengan akses terbatas.`,
               { parse_mode: "Markdown" }
           );
           
           const logEntry = {
               timestamp: new Date().toISOString(),
               mirrorId: mirrorId,
               userId: userId,
               username: ctx.from.username || ctx.from.first_name,
               blockedCommand: command,
               chatId: ctx.chat.id,
               chatType: ctx.chat.type
           };
           
           const securityLogPath = path.join(__dirname, "..", "logs", "mirror_security.log");
           const logDir = path.dirname(securityLogPath);
           if (!fs.existsSync(logDir)) {
               fs.mkdirSync(logDir, { recursive: true });
           }
           fs.appendFileSync(securityLogPath, JSON.stringify(logEntry) + '\n');
           
           return;
       }
       
       const now = Date.now();
       const rateLimitKey = `${mirrorId}_${userId}`;
       const userRate = rateLimitMap.get(rateLimitKey);
       const limit = 30; 
       
       if (userRate) {
           if (now > userRate.resetTime) {
               rateLimitMap.set(rateLimitKey, { count: 1, resetTime: now + 60000 });
           } else if (userRate.count >= limit) {
               return ctx.reply(
                   `⏱️ **Rate Limit Exceeded**\n\n` +
                   `Maksimal ${limit} commands per menit.\n` +
                   `Coba lagi dalam ${Math.ceil((userRate.resetTime - now) / 1000)} detik.`
               );
           } else {
               userRate.count++;
           }
       } else {
           rateLimitMap.set(rateLimitKey, { count: 1, resetTime: now + 60000 });
       }
       
       const mirrorPath = path.join(__dirname, "..", "data", "mirrors.json");
       if (fs.existsSync(mirrorPath)) {
           try {
               const mirrors = JSON.parse(fs.readFileSync(mirrorPath, "utf8"));
               if (mirrors[mirrorId]) {
                   mirrors[mirrorId].stats.totalCommands++;
                   mirrors[mirrorId].stats.lastActivity = now;
                   
                   if (!mirrors[mirrorId].stats.users.includes(userId)) {
                       mirrors[mirrorId].stats.users.push(userId);
                   }
                   
                   fs.writeFileSync(mirrorPath, JSON.stringify(mirrors, null, 2));
               }
           } catch (error) {
               console.error(`Failed to update mirror stats: ${error.message}`);
           }
       }
       
       await next();
   };
};