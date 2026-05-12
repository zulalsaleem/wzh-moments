/**
 * Admin promotion utility — elevates an existing registered user to the 'admin' role.
 *
 * Usage:
 *   node src/scripts/createAdmin.js <user-email>
 *
 * Example:
 *   node src/scripts/createAdmin.js admin@example.com
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';

const createAdmin = async (email) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const user = await User.findOne({ email });

    if (!user) {
      console.error('❌ No user found with email:', email);
      console.log('   Register the account first, then run this script.');
      process.exit(1);
    }

    if (user.role === 'admin') {
      console.log('⚠️  User is already an admin:', user.name);
      process.exit(0);
    }

    const previousRole = user.role;
    user.role = 'admin';
    await user.save();

    console.log('✅ User promoted to admin successfully');
    console.log('   Name:          ', user.name);
    console.log('   Email:         ', user.email);
    console.log('   Previous role: ', previousRole);
    console.log('   New role:      ', user.role);
    console.log('\n🔐 This account now has full admin access to WZH Moments.');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

const email = process.argv[2];

if (!email) {
  console.log('Usage:   node src/scripts/createAdmin.js <user-email>');
  console.log('Example: node src/scripts/createAdmin.js admin@example.com');
  process.exit(1);
}

createAdmin(email);
