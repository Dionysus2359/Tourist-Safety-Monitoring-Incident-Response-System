// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Route paths
export const ROUTES = {
    HOME: '/',
    LOGIN: '/login',
    REGISTER: '/register',
    EMERGENCY: '/emergency',
    TRIP_DETAILS: '/tripdetails',
    KYC_OTP: '/KycOtpPage',
    ADMIN: '/admin',
    DIGITAL_TOURIST_ID: '/DigitalTouristId',
    SAFE: '/safe',
    TOURIST_DETAILS: '/touristdetails',
    ADMIN_LOGIN: '/adminlogin'
};

// User roles
export const USER_ROLES = {
    TOURIST: 'tourist',
    ADMIN: 'admin'
};

// Incident severity levels
export const INCIDENT_SEVERITY = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high'
};

// Incident status
export const INCIDENT_STATUS = {
    REPORTED: 'reported',
    IN_PROGRESS: 'inProgress',
    RESOLVED: 'resolved'
};

// Geofence alert types
export const GEOFENCE_ALERT_TYPES = {
    WARNING: 'warning',
    DANGER: 'danger'
};

// Form validation patterns
export const VALIDATION_PATTERNS = {
    PHONE: /^[+]?[0-9]{10,15}$/,
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PASSWORD_MIN_LENGTH: 6
};

// Local storage keys
export const STORAGE_KEYS = {
    USER: 'user',
    THEME: 'theme'
};

// Default values
export const DEFAULTS = {
    MAP_CENTER: [20.5937, 78.9629], // Center of India
    MAP_ZOOM: 5,
    GEOFENCE_RADIUS: 1000, // 1km
    SESSION_TIMEOUT: 7 * 24 * 60 * 60 * 1000 // 7 days
};

// Error messages
export const ERROR_MESSAGES = {
    NETWORK_ERROR: 'Network error. Please check your connection.',
    UNAUTHORIZED: 'You are not authorized to perform this action.',
    SERVER_ERROR: 'Server error. Please try again later.',
    VALIDATION_ERROR: 'Please check your input and try again.'
};
