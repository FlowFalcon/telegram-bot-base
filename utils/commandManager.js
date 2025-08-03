const fs = require('fs');
const path = require('path');
const logger = require('./logger');

/**
 * Command Manager untuk mengelola semua command, action, dan handler
 */
class CommandManager {
    constructor() {
        this.commands = new Map();
        this.globalActions = new Map();
        this.globalHandlers = new Map();
        this.globalMiddleware = [];
    }

    /**
     * Mendaftarkan command
     */
    registerCommand(command) {
        this.commands.set(command.name, command);
        logger.info(`Command registered: ${command.name}`);
    }

    /**
     * Mendapatkan command berdasarkan nama
     */
    getCommand(name) {
        return this.commands.get(name);
    }

    /**
     * Mendapatkan semua command
     */
    getAllCommands() {
        return this.commands;
    }

    /**
     * Mendaftarkan global action
     */
    registerGlobalAction(actionName, handler) {
        this.globalActions.set(actionName, handler);
        logger.info(`Global action registered: ${actionName}`);
    }

    /**
     * Mendaftarkan global handler
     */
    registerGlobalHandler(condition, handler) {
        this.globalHandlers.set(condition, handler);
        logger.info(`Global handler registered: ${condition}`);
    }

    /**
     * Menambahkan global middleware
     */
    addGlobalMiddleware(middleware) {
        this.globalMiddleware.push(middleware);
    }

    /**
     * Mendapatkan semua global actions
     */
    getGlobalActions() {
        return this.globalActions;
    }

    /**
     * Mendapatkan semua global handlers
     */
    getGlobalHandlers() {
        return this.globalHandlers;
    }

    /**
     * Mendapatkan global middleware
     */
    getGlobalMiddleware() {
        return this.globalMiddleware;
    }

    /**
     * Load semua command dari folder commands
     */
    loadCommands(commandsDir) {
        const loadCommandsRecursive = (dir) => {
            const files = fs.readdirSync(dir, { withFileTypes: true });

            for (const file of files) {
                const fullPath = path.join(dir, file.name);
                if (file.isDirectory()) {
                    loadCommandsRecursive(fullPath);
                } else if (file.isFile() && file.name.endsWith('.js')) {
                    try {
                        const command = require(fullPath);
                        if (command && typeof command === 'object') {
                            this.registerCommand(command);
                        }
                    } catch (error) {
                        logger.error(`Failed to load command ${file.name}: ${error.message}`);
                    }
                }
            }
        };

        loadCommandsRecursive(commandsDir);
    }

    /**
     * Mendapatkan command yang memiliki session aktif untuk user tertentu
     */
    getCommandsWithActiveSession(userId) {
        const commandsWithSession = [];
        for (const [name, command] of this.commands) {
            if (command.hasActiveSession && command.hasActiveSession(userId)) {
                commandsWithSession.push(command);
            }
        }
        return commandsWithSession;
    }

    /**
     * Mendapatkan semua actions dari semua command
     */
    getAllActions() {
        const allActions = new Map();
        
        // Tambahkan global actions
        for (const [name, handler] of this.globalActions) {
            allActions.set(name, handler);
        }
        
        // Tambahkan actions dari setiap command
        for (const [name, command] of this.commands) {
            if (command.getActions) {
                const commandActions = command.getActions();
                for (const [actionName, handler] of commandActions) {
                    allActions.set(`${name}_${actionName}`, handler);
                }
            }
        }
        
        return allActions;
    }

    /**
     * Mendapatkan semua handlers dari semua command
     */
    getAllHandlers() {
        const allHandlers = new Map();
        
        // Tambahkan global handlers
        for (const [condition, handler] of this.globalHandlers) {
            allHandlers.set(condition, handler);
        }
        
        // Tambahkan handlers dari setiap command
        for (const [name, command] of this.commands) {
            if (command.getHandlers) {
                const commandHandlers = command.getHandlers();
                for (const [condition, handler] of commandHandlers) {
                    allHandlers.set(`${name}_${condition}`, handler);
                }
            }
        }
        
        return allHandlers;
    }
}

module.exports = CommandManager;