/**
 * Admin utility — manually verify a vendor account so they can place bids.
 *
 * Usage:
 *   node src/scripts/verifyVendor.js <vendor-email>
 *
 * Example:
 *   node src/scripts/verifyVendor.js vendor@example.com
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';

const verifyVendor = async (vendorEmail) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const vendor = await User.findOne({ email: vendorEmail, role: 'vendor' });

    if (!vendor) {
      console.error('❌ No vendor found with email:', vendorEmail);
      process.exit(1);
    }

    if (vendor.isVerified) {
      console.log('⚠️  Vendor is already verified:', vendor.name);
      process.exit(0);
    }

    vendor.isVerified = true;
    await vendor.save();

    console.log('✅ Vendor verified successfully');
    console.log('   Name:', vendor.name);
    console.log('   Email:', vendor.email);
    console.log('   ID:', vendor._id.toString());
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

const vendorEmail = process.argv[2];

if (!vendorEmail) {
  console.log('Usage: node src/scripts/verifyVendor.js <vendor-email>');
  process.exit(1);
}

verifyVendor(vendorEmail);
