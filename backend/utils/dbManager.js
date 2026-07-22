/**
 * Database Manager - Singleton managing MongoDB lifecycle.
 * Handles connection state tracking, event listeners for connectivity changes,
 * pool health monitoring, and graceful shutdown on process termination signals.
 */

const mongoose = require('mongoose');

class DatabaseManager {
  constructor() {
    this.isConnected = false;
    this.connectionPromise = null;
    this.setupEventListeners();
  }

  /** Register MongoDB connection event handlers and process termination hooks */
  setupEventListeners() {
    mongoose.connection.on('connected', () => {
      this.isConnected = true;
      console.log('✅ MongoDB connected successfully');
    });

    mongoose.connection.on('disconnected', () => {
      this.isConnected = false;
      console.log('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('error', (err) => {
      this.isConnected = false;
      console.error('❌ MongoDB connection error:', err);
    });

    // Graceful shutdown handling
    process.on('SIGINT', this.gracefulShutdown.bind(this));
    process.on('SIGTERM', this.gracefulShutdown.bind(this));
  }

  /** Close all database connections and exit the process cleanly */
  async gracefulShutdown() {
    console.log('🔄 Gracefully shutting down database connections...');
    try {
      await mongoose.connection.close();
      console.log('✅ Database connections closed');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during database shutdown:', error);
      process.exit(1);
    }
  }

  /** Return a summary of the current connection readiness and pool size */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      poolSize: mongoose.connection.db?.s?.topology?.s?.poolSize || 'unknown'
    };
  }

  // Monitor connection pool health
  async getPoolStats() {
    if (!this.isConnected) {
      return { error: 'Not connected' };
    }

    try {
      const stats = {
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        name: mongoose.connection.name,
        // Get pool information if available
        poolSize: mongoose.connection.db?.s?.topology?.s?.poolSize || 'unknown',
        serverStatus: mongoose.connection.db ? 'available' : 'unavailable'
      };
      return stats;
    } catch (error) {
      return { error: error.message };
    }
  }
}

module.exports = new DatabaseManager();
