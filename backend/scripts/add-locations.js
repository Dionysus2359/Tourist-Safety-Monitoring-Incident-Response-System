/*
 * Add sample location data to existing users for testing
 */

require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../config/database');
const User = require('../models/user');

// Sample location data for Indian cities
const sampleLocations = [
  {
    city: 'Mumbai',
    coordinates: [72.8777, 19.0760], // [lng, lat]
    address: 'Mumbai, Maharashtra, India'
  },
  {
    city: 'Delhi',
    coordinates: [77.1025, 28.7041],
    address: 'New Delhi, Delhi, India'
  },
  {
    city: 'Bangalore',
    coordinates: [77.5946, 12.9716],
    address: 'Bangalore, Karnataka, India'
  },
  {
    city: 'Chennai',
    coordinates: [80.2707, 13.0827],
    address: 'Chennai, Tamil Nadu, India'
  },
  {
    city: 'Kolkata',
    coordinates: [88.3639, 22.5726],
    address: 'Kolkata, West Bengal, India'
  },
  {
    city: 'Hyderabad',
    coordinates: [78.4867, 17.3850],
    address: 'Hyderabad, Telangana, India'
  },
  {
    city: 'Pune',
    coordinates: [73.8567, 18.5204],
    address: 'Pune, Maharashtra, India'
  },
  {
    city: 'Ahmedabad',
    coordinates: [72.5714, 23.0225],
    address: 'Ahmedabad, Gujarat, India'
  },
  {
    city: 'Jaipur',
    coordinates: [75.7873, 26.9124],
    address: 'Jaipur, Rajasthan, India'
  },
  {
    city: 'Lucknow',
    coordinates: [80.9462, 26.8467],
    address: 'Lucknow, Uttar Pradesh, India'
  }
];

async function addSampleLocations() {
  try {
    await connectDB();
    console.log('🌍 Connected to database');

    // Get all tourist users
    const users = await User.find({ role: 'tourist' });
    console.log(`👥 Found ${users.length} tourist users`);

    if (users.length === 0) {
      console.log('❌ No tourist users found. Run seed-incidents.js first to create users.');
      return;
    }

    let updated = 0;
    let skipped = 0;

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const locationData = sampleLocations[i % sampleLocations.length];

      // Add some random variation to coordinates (±0.01 degrees ~ 1km)
      const randomOffset = () => (Math.random() - 0.5) * 0.02;
      const coordinates = [
        locationData.coordinates[0] + randomOffset(),
        locationData.coordinates[1] + randomOffset()
      ];

      // Update user with location data
      await User.findByIdAndUpdate(user._id, {
        location: {
          coordinates,
          address: locationData.address,
          lastUpdated: new Date(),
          accuracy: Math.floor(Math.random() * 50) + 10 // 10-60 meters accuracy
        }
      });

      console.log(`✅ Updated ${user.name} with location: ${locationData.city}`);
      updated++;
    }

    console.log(`\n🎉 Location update complete!`);
    console.log(`📍 Updated: ${updated} users`);
    console.log(`⏭️ Skipped: ${skipped} users`);

  } catch (error) {
    console.error('❌ Error adding locations:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  addSampleLocations();
}

module.exports = addSampleLocations;
