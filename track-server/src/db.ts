import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/track-point';

export const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    mongoose.connection.on('disconnected', async () => {
      console.log('Lost MongoDB connection... Retrying...');
      try {
        await mongoose.connect(MONGODB_URI);
        console.log('Reconnected to MongoDB');
      } catch (err) {
        console.error('Failed to reconnect:', err);
      }
    });
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export const closeDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
    throw error;
  }
}; 