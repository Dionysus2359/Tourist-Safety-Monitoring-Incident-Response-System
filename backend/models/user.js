const { required } = require('joi');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const UserSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    emergencyContacts: [
        {
            name: { type: String, required: true },
            phone: { type: String, required: true },       // store as string to preserve leading 0/+91
            relation: { type: String, required: true }    // e.g., Father, Mother, Friend
        }
    ],
    tripInfo: {
        startLocation: String,
        endLocation: String,
        startDate: Date,
        endDate: Date,
    },
    digitalId: {
        idNumber: {
            type: String,
            default: () => new mongoose.Types.ObjectId().toString()
        },   // like UUID or generated string
        publicKey: { type: String },                // stored public key for verification
        signature: { type: String },                // signature over KYC/ID data
        issuedAt: { type: Date, default: Date.now },
        expiresAt: { type: Date },                  // optional: can set validity
        status: {
            type: String,
            enum: ['active', 'revoked', 'expired'],
            default: 'active'
        }
    },
    kycType: {
        type: String,
        default: 'aadhaar'
    },
    kycVerified: {
        type: Boolean,
        default: false
    },
    kycDocNumber: {
        type: String,
        required: true,
        unique: true
    },
    role: {
        type: String,
        enum: ['tourist', 'admin'],
        default: 'tourist'
    },
    location: {
        coordinates: {
            type: [Number], // [longitude, latitude]
            index: '2dsphere',
            default: null
        },
        address: String,
        lastUpdated: {
            type: Date,
            default: Date.now
        },
        accuracy: Number // Location accuracy in meters
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})
UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);