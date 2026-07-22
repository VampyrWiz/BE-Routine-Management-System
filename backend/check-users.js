/**
 * Diagnostic script to inspect user records in the database.
 * Connects to MongoDB, fetches up to 5 users, and prints their email + admin status.
 * Useful for verifying that user accounts exist and admin flags are set correctly.
 */
const User = require('./models/User');
require('./config/db');

/**
 * Queries the database for a sample of users and logs their email and isAdmin fields.
 * Exits with code 0 on success, 1 on failure.
 */
async function checkUsers() {
  try {
    console.log('🔍 Checking users in database...');
    
    const users = await User.find({}, 'email isAdmin').limit(5);
    console.log(`Found ${users.length} users:`);
    
    users.forEach(user => {
      console.log(`Email: ${user.email}, Admin: ${user.isAdmin}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

setTimeout(checkUsers, 1000);
