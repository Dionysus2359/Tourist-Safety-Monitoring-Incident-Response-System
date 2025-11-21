/**
 * Tourist Safety and Monitoring System - Backend Server
 *
 * This is the main entry point for the backend API server.
 * It handles user authentication, incident management, geofencing,
 * and real-time safety monitoring for tourists.
 */

// Load environment variables in development
if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
    process.env.NODE_ENV = 'development'; // Force development mode for local
}

// Core dependencies
const express = require('express');
const app = express();
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local');
// const ExpressError = require('./utils/ExpressError');

const User = require('./models/user');

// Import configurations
const connectDB = require('./config/database');
const sessionConfig = require('./config/session');

// Import middleware
const {
    errorHandler,
    notFound,
    requestLogger,
    securityHeaders,
    corsOptions
} = require('./middleware');

// Import routes
const userRoutes = require('./routes/users');
const incidentRoutes = require('./routes/incidents');
const geofenceRoutes = require('./routes/geofence');
const alertRoutes = require('./routes/alerts');
const statsRoutes = require('./routes/stats');

// Connect to database
connectDB();



// Security middleware
app.use(securityHeaders);

// CORS configuration
app.use(cors(corsOptions));

// Request logging
app.use(requestLogger);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session(sessionConfig));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get('/', (req, res) => {
    res.send('Smart Tourist Safety & Incident Response System API is running');
});

// Mount routes
app.use('/users', userRoutes);
app.use('/incidents', incidentRoutes);
app.use('/geofences', geofenceRoutes);
app.use('/alerts', alertRoutes);
app.use('/stats', statsRoutes);

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});