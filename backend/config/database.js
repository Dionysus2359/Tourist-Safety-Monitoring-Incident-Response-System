const mongoose = require('mongoose');

/**
 * Database Configuration
 * Handles MongoDB connection with proper error handling and configuration
 */
const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI ||
            `mongodb+srv://dionysus2359:${process.env.MONGODB_ATLAS_PASS}@cluster0.fiv12j3.mongodb.net/touristsafety?retryWrites=true&w=majority&appName=Cluster0`;

        const conn = await mongoose.connect(mongoUri);

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`📊 Database: ${conn.connection.name}`);

        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('📴 MongoDB disconnected');
        });

        // Graceful shutdown
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('🔄 MongoDB connection closed through app termination');
            process.exit(0);
        });

    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        process.exit(1);
    }
};

module.exports = connectDB;
