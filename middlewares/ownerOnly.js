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
    
    if (userId != config.ownerId && !owners.includes(userId)) {
        return ctx.reply('Perintah ini hanya bisa digunakan oleh owner bot.');
    }
    
    await next();
};

