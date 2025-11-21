/*
 * Seed Incidents from frontend seed.js into MongoDB
 */

// Load environment variables
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const mongoose = require('mongoose');

const connectDB = require('../config/database');
const User = require('../models/user');
const Incident = require('../models/incident');

const FRONTEND_SEED_PATH = path.resolve(__dirname, '../../frontend/src/components/data/seed.js');

/**
 * Load the seed array from seed.js using dynamic import
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
 * Generate a username from email or name and ensure uniqueness
 */
async function generateUniqueUsername(base) {
    const sanitizedBase = String(base || '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 24) || 'user';

    let candidate = sanitizedBase;
    let suffix = 0;
    // Try up to 100 variants
    while (suffix < 100) {
        // eslint-disable-next-line no-await-in-loop
        const exists = await User.exists({ username: candidate });
        if (!exists) return candidate;
        suffix += 1;
        candidate = `${sanitizedBase}${suffix}`;
    }
    return `${sanitizedBase}${Date.now()}`;
}

async function upsertUserFromSeed(record) {
    const { name, email, phone, touristId } = record;
    if (!email) throw new Error('Seed record missing email');

    let user = await User.findOne({ email });
    if (user) return user;

    const baseUsername = (email && email.split('@')[0]) || name;
    const username = await generateUniqueUsername(baseUsername);

    // Prefer using passport-local-mongoose register for proper hashing of a dummy password
    const tempPassword = 'Seed123!';
    try {
        const newUser = new User({
            name: name || username,
            email,
            phone: phone ? String(phone) : '0000000000',
            kycDocNumber: touristId || new mongoose.Types.ObjectId().toString(),
            username
        });
        await User.register(newUser, tempPassword);
        user = newUser;
    } catch (err) {
        // Fallback: create without password if register fails
        if (err && err.name !== 'UserExistsError') {
            console.warn('User.register failed, creating without password for', email, '-', err.message);
        }
        user = await User.create({
            name: name || username,
            email,
            phone: phone ? String(phone) : '0000000000',
            kycDocNumber: touristId || new mongoose.Types.ObjectId().toString(),
            username
        });
    }
    return user;
}

function buildIncidentDoc(seedRecord, userId) {
    const { description, severity, status, location, date, address } = seedRecord;
    const coordinates = Array.isArray(location) ? location : [];
    return {
        user: userId,
        description: String(description || 'Incident'),
        location: {
            type: 'Point',
            coordinates
        },
        address: address || 'Unknown location',
        severity: ['low', 'medium', 'high'].includes(String(severity)) ? severity : 'low',
        status: ['reported', 'inProgress', 'resolved'].includes(String(status)) ? status : 'reported',
        createdAt: date instanceof Date ? date : new Date()
    };
}

async function seedIncidents({ reset = false } = {}) {
    await connectDB();

    if (reset) {
        console.log('🔄 Reset requested: clearing existing incidents...');
        await Incident.deleteMany({});
    }

    const records = await loadSeedArray(FRONTEND_SEED_PATH);
    console.log(`📦 Loaded ${records.length} seed records from seed.js`);

    let created = 0;
    let skipped = 0;

    for (const record of records) {
        // eslint-disable-next-line no-await-in-loop
        const user = await upsertUserFromSeed(record);

        const doc = buildIncidentDoc(record, user._id);

        // Idempotency: skip if same user+description+createdAt already exists
        // eslint-disable-next-line no-await-in-loop
        const exists = await Incident.exists({
            user: user._id,
            description: doc.description,
            createdAt: doc.createdAt
        });
        if (exists) {
            skipped += 1;
            continue;
        }

        // eslint-disable-next-line no-await-in-loop
        await Incident.create(doc);
        created += 1;
    }

    console.log(`✅ Seeding complete. Created: ${created}, Skipped: ${skipped}`);
}

(async () => {
    try {
        const args = process.argv.slice(2);
        const reset = args.includes('--reset') || args.includes('-r');
        await seedIncidents({ reset });
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


