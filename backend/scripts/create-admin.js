/**
 * Create Admin User Script
 * Creates an admin user for testing the admin login functionality
 */

// Load environment variables
require('dotenv').config();

const mongoose = require('mongoose');
const User = require('../models/user');
const connectDB = require('../config/database');

async function createAdminUser() {
    try {
        // Connect to database
        await connectDB();

        // Check if test admin user already exists
        const existingTestAdmin = await User.findOne({ username: 'testadmin' });
        if (existingTestAdmin) {
            console.log('✅ Test admin user already exists:');
            console.log('   Username:', existingTestAdmin.username);
            console.log('   Email:', existingTestAdmin.email);
            return;
        }

        // Create test admin user
        const adminUser = new User({
            name: 'Test Admin',
            username: 'testadmin',
            email: 'admin@test.com',
            phone: '+1234567890',
            role: 'admin',
            kycVerified: true,
            kycDocNumber: 'ADMIN001'
        });

        // Register with password
        await User.register(adminUser, 'admin123');

        console.log('✅ Test admin user created successfully!');
        console.log('   Username: testadmin');
        console.log('   Email: admin@test.com');
        console.log('   Password: admin123');
        console.log('   Role: admin');

    } catch (error) {
        console.error('❌ Error creating admin user:', error);
    } finally {
        // Close database connection
        await mongoose.connection.close();
        console.log('📪 Database connection closed');
    }
}

// Run the script
createAdminUser();
