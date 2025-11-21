const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const geofenceSchema = new Schema({
    center: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        } // [lng, lat]
    },
    radius: {
        type: Number,
        required: true
    },
    alertType: {
        type: String,
        enum: ['warning', 'danger'],
        default: 'warning'
    },
    active: {
        type: Boolean,
        default: true
    },
},
    { timestamps: true });

module.exports = mongoose.model('Geofence', geofenceSchema);