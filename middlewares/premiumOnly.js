const fs = require('fs');
const path = require('path');
const config = require('../config');

module.exports = async (ctx, next) => {
    const userId = ctx.from.id;
    const premiumsPath = path.join(__dirname, '../data/premiums.json');
    const ownersPath = path.join(__dirname, '../data/owners.json');
    
    let premiums = [];
    let owners = [];
    
    if (fs.existsSync(premiumsPath)) {
        premiums = JSON.parse(fs.readFileSync(premiumsPath, 'utf8'));
    }
    
    if (fs.existsSync(ownersPath)) {
        owners = JSON.parse(fs.readFileSync(ownersPath, 'utf8'));
    }
    
    if (userId != config.ownerId && !owners.includes(userId) && !premiums.includes(userId)) {
        return ctx.reply('Perintah ini hanya bisa digunakan oleh user premium.');
    }
    
    await next();
};

