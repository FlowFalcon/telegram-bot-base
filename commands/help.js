const CommandTemplate = require('../utils/commandTemplate');

class HelpCommand extends CommandTemplate {
    constructor() {
        super('help', 'Menampilkan daftar perintah yang tersedia');
    }

    async execute(ctx) {
        const args = ctx.message.text.split(' ');
        
        if (args.length > 1) {
            return await this.showCommandDetail(ctx, args[1]);
        }
        
        return await this.showCommandList(ctx);
    }

    async showCommandList(ctx) {
        const CommandManager = require('../utils/commandManager');
        const commandManager = new CommandManager();
        commandManager.loadCommands(require('path').join(__dirname, '..', 'commands'));
        
        const commands = Array.from(commandManager.getAllCommands().values());
        
        let message = '📋 **Daftar Perintah**\n\n';
        
        // Kelompokkan command berdasarkan kategori
        const categories = {
            'General': [],
            'Game': [],
            'Admin': [],
            'Owner': []
        };
        
        commands.forEach(cmd => {
            if (cmd.name === 'start' || cmd.name === 'help' || cmd.name === 'menu') {
                categories['General'].push(cmd);
            } else if (cmd.name === 'tebak') {
                categories['Game'].push(cmd);
            } else if (cmd.name.includes('owner') || cmd.name.includes('prem')) {
                categories['Owner'].push(cmd);
            } else {
                categories['Admin'].push(cmd);
            }
        });
        
        // Tampilkan command berdasarkan kategori
        for (const [category, cmds] of Object.entries(categories)) {
            if (cmds.length > 0) {
                message += `**${category}:**\n`;
                cmds.forEach(cmd => {
                    const description = cmd.description || 'Tidak ada deskripsi';
                    message += `• /${cmd.name} - ${description}\n`;
                });
                message += '\n';
            }
        }
        
        message += 'Gunakan /help [nama_command] untuk informasi detail perintah.';
        
        await ctx.reply(message);
    }

    async showCommandDetail(ctx, commandName) {
        const CommandManager = require('../utils/commandManager');
        const commandManager = new CommandManager();
        commandManager.loadCommands(require('path').join(__dirname, '..', 'commands'));
        
        const command = commandManager.getCommand(commandName.replace('/', ''));
        
        if (!command) {
            return await ctx.reply('❌ Perintah tidak ditemukan. Gunakan /help untuk melihat daftar perintah.');
        }
        
        let message = `📖 **Detail Perintah: /${command.name}**\n\n`;
        message += `**Deskripsi:** ${command.description || 'Tidak ada deskripsi'}\n\n`;
        
        // Tambahkan informasi tambahan jika ada
        if (command.hasActiveSession) {
            message += '**Fitur:** Mendukung session management\n';
        }
        
        if (command.getActions && command.getActions().size > 0) {
            message += '**Fitur:** Mendukung action buttons\n';
        }
        
        if (command.getHandlers && command.getHandlers().size > 0) {
            message += '**Fitur:** Mendukung text handlers\n';
        }
        
        await ctx.reply(message);
    }
}

module.exports = new HelpCommand();