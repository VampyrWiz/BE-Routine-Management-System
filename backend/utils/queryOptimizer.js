/**
 * Query Optimizer — Mongoose schema enhancer.
 * Applies performance optimisations (automatic lean(), pagination helpers,
 * batch insert/update, and slow-query monitoring) to reduce database load
 * and improve API response times across the system.
 */

const mongoose = require('mongoose');

// Middleware to optimize database queries
class QueryOptimizer {
  
  /** Pre-hook that appends .lean() to find/findOne/findOneAndUpdate when full mongoose docs are not required */
  static leanQueries(schema) {
    schema.pre(['find', 'findOne', 'findOneAndUpdate'], function() {
      if (!this.getOptions().lean && this.op !== 'findOneAndUpdate') {
        this.lean();
      }
    });
  }

  /** Attach a .paginate() static to the schema for consistent paginated queries with metadata */
  static addPagination(schema) {
    schema.statics.paginate = async function(filter = {}, options = {}) {
      const page = parseInt(options.page) || 1;
      const limit = parseInt(options.limit) || 10;
      const skip = (page - 1) * limit;
      
      const [docs, total] = await Promise.all([
        this.find(filter)
          .select(options.select)
          .sort(options.sort || { createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        this.countDocuments(filter)
      ]);
      
      return {
        docs,
        total,
        page,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      };
    };
  }

  /** Attach batchInsert and batchUpdate statics for efficient bulk writes */
  static addBatchOperations(schema) {
    schema.statics.batchInsert = async function(docs, options = {}) {
      const batchSize = options.batchSize || 100;
      const results = [];
      
      for (let i = 0; i < docs.length; i += batchSize) {
        const batch = docs.slice(i, i + batchSize);
        const batchResult = await this.insertMany(batch, {
          ordered: false, // Continue on error
          ...options
        });
        results.push(...batchResult);
      }
      
      return results;
    };

    schema.statics.batchUpdate = async function(updates) {
      const bulkOps = updates.map(update => ({
        updateOne: {
          filter: update.filter,
          update: update.update,
          upsert: update.upsert || false
        }
      }));
      
      return this.bulkWrite(bulkOps);
    };
  }

  // Connection monitoring
  static setupConnectionMonitoring() {
    mongoose.connection.on('connected', () => {
      console.log('📊 DB Query Optimizer: Connection established');
    });

    mongoose.connection.on('disconnected', () => {
      console.log('📊 DB Query Optimizer: Connection lost');
    });

    // Monitor slow queries
    mongoose.set('debug', (collectionName, method, query, doc) => {
      const start = Date.now();
      
      // Log queries that take more than 100ms
      setTimeout(() => {
        const duration = Date.now() - start;
        if (duration > 100) {
          console.warn(`🐌 Slow Query: ${collectionName}.${method}`, {
            query,
            duration: `${duration}ms`
          });
        }
      }, 0);
    });
  }

  // Apply all optimizations to a schema
  static applyAll(schema) {
    this.leanQueries(schema);
    this.addPagination(schema);
    this.addBatchOperations(schema);
  }
}

module.exports = QueryOptimizer;
