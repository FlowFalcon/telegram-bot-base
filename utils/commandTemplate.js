/**
 * Template untuk command yang memungkinkan pengelolaan session, action, dan handler sendiri
 */
class CommandTemplate {
    constructor(name, description = '') {
        this.name = name;
        this.description = description;
        this.sessions = new Map();
        this.actions = new Map();
        this.handlers = new Map();
        this.middleware = [];
    }

    /**
     * Menambahkan session untuk user tertentu
     */
    setSession(userId, sessionData) {
        this.sessions.set(userId, sessionData);
    }

    /**
     * Mendapatkan session user
     */
    getSession(userId) {
        return this.sessions.get(userId);
    }

    /**
     * Menghapus session user
     */
    clearSession(userId) {
        this.sessions.delete(userId);
    }

    /**
     * Menambahkan action handler
     */
    addAction(actionName, handler) {
        this.actions.set(actionName, handler);
    }

    /**
     * Menambahkan text handler
     */
    addTextHandler(condition, handler) {
        this.handlers.set(condition, handler);
    }

    /**
     * Menambahkan middleware
     */
    addMiddleware(middleware) {
        this.middleware.push(middleware);
    }

    /**
     * Mendapatkan semua actions yang terdaftar
     */
    getActions() {
        return this.actions;
    }

    /**
     * Mendapatkan semua handlers yang terdaftar
     */
    getHandlers() {
        return this.handlers;
    }

    /**
     * Mendapatkan middleware
     */
    getMiddleware() {
        return this.middleware;
    }

    /**
     * Method utama yang harus diimplementasi oleh setiap command
     */
    async execute(ctx) {
        throw new Error('Method execute harus diimplementasi oleh command');
    }

    /**
     * Method untuk mengecek apakah command memiliki session aktif
     */
    hasActiveSession(userId) {
        return this.sessions.has(userId);
    }

    /**
     * Method untuk mendapatkan semua session aktif
     */
    getAllSessions() {
        return this.sessions;
    }
}

module.exports = CommandTemplate;