const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const opts = { toJSON: { virtuals: true }, timestamps: true };

const incidentSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // who reported
    description: { type: String, required: true },
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'User.tripInfo' },
    location: {
        type: { type: String, enum: ['Point'], required: true },
        coordinates: { type: [Number], required: true } // [lng, lat]
    },
    address: String,
    severity: { 
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'low'
    },
    status: { type: String, enum: ['reported', 'inProgress', 'resolved'], default: 'reported' },
    // createdAt: { type: Date, default: Date.now }
}, opts);

module.exports = mongoose.model('Incident', incidentSchema);    