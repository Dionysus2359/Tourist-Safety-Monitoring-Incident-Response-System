/**
 * Session Configuration
 * Centralized session management with security best practices
 */
const sessionConfig = {
    secret: process.env.SESSION_SECRET || 'your-super-secure-session-secret-change-this-in-production',
    resave: false,
    saveUninitialized: false, // Changed to false for better security
    cookie: {
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
        maxAge: 1000 * 60 * 60 * 24 * 7,
        httpOnly: true, // Prevents XSS attacks
        secure: false, // Allow HTTP in development (set to true in production)
        sameSite: 'lax' // CSRF protection
    },
    name: 'tourist-safety.sid' // Change default session name for security
};

module.exports = sessionConfig;
