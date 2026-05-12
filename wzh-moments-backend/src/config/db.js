import mongoose from 'mongoose';

/**
 * Establishes connection to MongoDB and registers connection lifecycle listeners.
 * Terminates the process on connection error to prevent running without a database.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    mongoose.connection.on('error', (err) => {
      console.error(`MongoDB connection error: ${err.message}`);
      process.exit(1);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB Disconnected');
    });
  } catch (error) {
    console.error(`Failed to connect to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
