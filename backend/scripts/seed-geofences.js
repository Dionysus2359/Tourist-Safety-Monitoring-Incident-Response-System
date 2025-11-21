/*
 * Seed Geofences based on incident data for demo purposes
 */

// Load environment variables
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const connectDB = require('../config/database');
const Geofence = require('../models/geofence');

// Import seed data from frontend
const FRONTEND_SEED_PATH = path.resolve(__dirname, '../../frontend/src/components/data/seed.js');

/**
 * Load the seed array from seed.js
 */
async function loadSeedArray(filePath) {
    try {
        // Use dynamic import for ES modules
        const fileUrl = `file://${filePath.replace(/\\/g, '/')}`;
        const seedData = await import(fileUrl);

        // Handle both default export and named export
        const data = seedData.default || seedData;

        if (!Array.isArray(data)) {
            throw new Error('Seed file did not export an array');
        }
        return data;
    } catch (error) {
        console.error('Error loading seed file:', error.message);
        throw error;
    }
}

/**
 * Create geofence data from incident seed data
 */
function createGeofenceFromIncident(incident, index) {
    const { location, severity, radiusMeters } = incident;

    // Create geofences with different alert types based on severity
    const geofences = [];

    // Main geofence based on incident severity
    const alertType = severity === 'high' ? 'danger' : severity === 'medium' ? 'warning' : 'warning';
    const radius = radiusMeters || (severity === 'high' ? 2000 : severity === 'medium' ? 1500 : 1000);

    geofences.push({
        center: {
            type: 'Point',
            coordinates: location // [lng, lat]
        },
        radius: radius,
        alertType: alertType,
        active: true
    });

    // Add additional geofences for demo variety (every 3rd incident)
    if (index % 3 === 0) {
        // Add a danger zone around high severity incidents
        if (severity === 'high') {
            geofences.push({
                center: {
                    type: 'Point',
                    coordinates: [
                        location[0] + (Math.random() - 0.5) * 0.01, // slight lng variation
                        location[1] + (Math.random() - 0.5) * 0.01  // slight lat variation
                    ]
                },
                radius: Math.floor(Math.random() * 1000) + 500,
                alertType: 'danger',
                active: true
            });
        }

        // Add warning zones around medium/low severity incidents
        if (severity !== 'high') {
            geofences.push({
                center: {
                    type: 'Point',
                    coordinates: [
                        location[0] + (Math.random() - 0.5) * 0.02,
                        location[1] + (Math.random() - 0.5) * 0.02
                    ]
                },
                radius: Math.floor(Math.random() * 800) + 300,
                alertType: 'warning',
                active: Math.random() > 0.3 // 70% chance of being active
            });
        }
    }

    return geofences;
}

async function seedGeofences({ reset = false, limit = null } = {}) {
    await connectDB();

    if (reset) {
        console.log('🔄 Reset requested: clearing existing geofences...');
        await Geofence.deleteMany({});
    }

    const records = await loadSeedArray(FRONTEND_SEED_PATH);
    console.log(`📦 Loaded ${records.length} seed records from seed.js`);

    let created = 0;
    let skipped = 0;
    const geofencesToCreate = [];

    // Process each incident to create geofences
    for (let i = 0; i < records.length; i++) {
        const record = records[i];

        // Skip if no location data
        if (!record.location || !Array.isArray(record.location)) {
            console.log(`⚠️  Skipping record ${i + 1}: no valid location`);
            skipped++;
            continue;
        }

        const geofences = createGeofenceFromIncident(record, i);
        geofencesToCreate.push(...geofences);

        // Limit the number of geofences if specified
        if (limit && geofencesToCreate.length >= limit) {
            break;
        }
    }

    // Create geofences in batches
    const batchSize = 10;
    for (let i = 0; i < geofencesToCreate.length; i += batchSize) {
        const batch = geofencesToCreate.slice(i, i + batchSize);

        try {
            await Geofence.insertMany(batch);
            created += batch.length;
            console.log(`✅ Created batch ${Math.floor(i / batchSize) + 1}: ${batch.length} geofences`);
        } catch (error) {
            console.error(`❌ Error creating batch ${Math.floor(i / batchSize) + 1}:`, error.message);
            skipped += batch.length;
        }
    }

    console.log(`✅ Seeding complete. Created: ${created}, Skipped: ${skipped}`);
    console.log(`📊 Total geofences in database: ${await Geofence.countDocuments()}`);
}

(async () => {
    try {
        const args = process.argv.slice(2);
        const reset = args.includes('--reset') || args.includes('-r');
        const limitArg = args.find(arg => arg.startsWith('--limit='));
        const limit = limitArg ? parseInt(limitArg.split('=')[1]) : null;

        await seedGeofences({ reset, limit });
    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exitCode = 1;
    } finally {
        try {
            await mongoose.connection.close();
        } catch (_) {
            // ignore
        }
    }
})();
