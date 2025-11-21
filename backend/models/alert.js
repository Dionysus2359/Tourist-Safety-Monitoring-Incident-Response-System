const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const alertSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },       // recipient
  incident: { type: Schema.Types.ObjectId, ref: 'Incident' },
  geofence: { type: Schema.Types.ObjectId, ref: 'Geofence' },
  message: String,
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Alert', alertSchema);
