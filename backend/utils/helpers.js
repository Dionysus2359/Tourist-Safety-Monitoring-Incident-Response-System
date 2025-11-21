const mongoose = require('mongoose');

/**
 * Validates MongoDB ObjectId format
 */
const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Formats incident data for response
 */
const formatIncidentResponse = (incident) => {
    return {
        id: incident._id,
        description: incident.description,
        location: incident.location,
        address: incident.address,
        severity: incident.severity,
        status: incident.status,
        user: {
            id: incident.user._id,
            name: incident.user.name,
            email: incident.user.email,
            username: incident.user.username
        },
        createdAt: incident.createdAt,
        updatedAt: incident.updatedAt
    };
};

/**
 * Formats multiple incidents for response
 */
const formatIncidentsResponse = (incidents) => {
    return incidents.map(incident => formatIncidentResponse(incident));
};

/**
 * Builds pagination object
 */
const buildPaginationObject = (totalCount, page, limit) => {
    const totalPages = Math.ceil(totalCount / limit);
    return {
        totalCount,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
    };
};

/**
 * Builds filter object for incidents query
 */
const buildIncidentFilter = (query) => {
    const filter = {};
    
    // Filter by status
    if (query.status) {
        filter.status = query.status;
    }
    
    // Filter by severity
    if (query.severity) {
        filter.severity = query.severity;
    }
    
    // Filter by date range
    if (query.startDate || query.endDate) {
        filter.createdAt = {};
        if (query.startDate) {
            filter.createdAt.$gte = new Date(query.startDate);
        }
        if (query.endDate) {
            filter.createdAt.$lte = new Date(query.endDate);
        }
    }
    
    return filter;
};

/**
 * Validates incident query parameters
 */
const validateIncidentQuery = (query) => {
    const errors = [];
    
    if (query.status && !['reported', 'inProgress', 'resolved'].includes(query.status)) {
        errors.push('Status must be one of: reported, inProgress, resolved');
    }
    
    if (query.severity && !['low', 'medium', 'high'].includes(query.severity)) {
        errors.push('Severity must be one of: low, medium, high');
    }
    
    if (query.page && (isNaN(query.page) || parseInt(query.page) < 1)) {
        errors.push('Page must be a positive integer');
    }
    
    if (query.limit && (isNaN(query.limit) || parseInt(query.limit) < 1 || parseInt(query.limit) > 100)) {
        errors.push('Limit must be between 1 and 100');
    }
    
    return errors;
};

/**
 * Checks if user can access/modify incident
 */
const canUserAccessIncident = (incident, userId, userRole) => {
    return incident.user.toString() === userId || userRole === 'admin';
};

/**
 * Gets pagination parameters from query
 */
const getPaginationParams = (query) => {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
    const skip = (page - 1) * limit;
    
    return { page, limit, skip };
};

/**
 * Creates standardized error response
 */
const createErrorResponse = (statusCode, message, data = {}) => {
    return {
        statusCode,
        response: {
            success: false,
            message,
            data
        }
    };
};

/**
 * Creates standardized success response
 */
const createSuccessResponse = (statusCode, message, data = {}) => {
    return {
        statusCode,
        response: {
            success: true,
            message,
            data
        }
    };
};

/**
 * Formats geofence data for response
 */
const formatGeofenceResponse = (geofence) => {
    return {
        id: geofence._id,
        center: geofence.center,
        radius: geofence.radius,
        alertType: geofence.alertType,
        active: geofence.active,
        createdAt: geofence.createdAt,
        updatedAt: geofence.updatedAt
    };
};

/**
 * Formats multiple geofences for response
 */
const formatGeofencesResponse = (geofences) => {
    return geofences.map(geofence => formatGeofenceResponse(geofence));
};

/**
 * Builds filter object for geofences query
 */
const buildGeofenceFilter = (query) => {
    const filter = {};
    
    // Filter by active status
    if (query.active !== undefined) {
        filter.active = query.active === 'true';
    }
    
    // Filter by alert type
    if (query.alertType) {
        filter.alertType = query.alertType;
    }
    
    return filter;
};

/**
 * Validates geofence query parameters
 */
const validateGeofenceQuery = (query) => {
    const errors = [];
    
    if (query.active && !['true', 'false'].includes(query.active)) {
        errors.push('Active must be either "true" or "false"');
    }
    
    if (query.alertType && !['warning', 'danger'].includes(query.alertType)) {
        errors.push('Alert type must be either "warning" or "danger"');
    }
    
    if (query.page && (isNaN(query.page) || parseInt(query.page) < 1)) {
        errors.push('Page must be a positive integer');
    }
    
    if (query.limit && (isNaN(query.limit) || parseInt(query.limit) < 1 || parseInt(query.limit) > 100)) {
        errors.push('Limit must be between 1 and 100');
    }
    
    return errors;
};

/**
 * Formats alert data for response
 */
const formatAlertResponse = (alert) => {
    return {
        id: alert._id,
        message: alert.message,
        read: alert.read,
        user: alert.user ? {
            id: alert.user._id,
            name: alert.user.name,
            email: alert.user.email,
            username: alert.user.username
        } : null,
        incident: alert.incident ? {
            id: alert.incident._id,
            description: alert.incident.description,
            status: alert.incident.status,
            severity: alert.incident.severity
        } : null,
        geofence: alert.geofence ? {
            id: alert.geofence._id,
            center: alert.geofence.center,
            radius: alert.geofence.radius,
            alertType: alert.geofence.alertType
        } : null,
        createdAt: alert.createdAt
    };
};

/**
 * Formats multiple alerts for response
 */
const formatAlertsResponse = (alerts) => {
    return alerts.map(alert => formatAlertResponse(alert));
};

/**
 * Builds filter object for alerts query
 */
const buildAlertFilter = (query, userId = null) => {
    const filter = {};
    
    // Filter by user (if userId provided or in query)
    if (userId) {
        filter.user = userId;
    } else if (query.userId) {
        filter.user = query.userId;
    }
    
    // Filter by read status
    if (query.read !== undefined) {
        filter.read = query.read === 'true';
    }
    
    // Filter by incident
    if (query.incident) {
        filter.incident = query.incident;
    }
    
    // Filter by geofence
    if (query.geofence) {
        filter.geofence = query.geofence;
    }
    
    // Filter by date range
    if (query.startDate || query.endDate) {
        filter.createdAt = {};
        if (query.startDate) {
            filter.createdAt.$gte = new Date(query.startDate);
        }
        if (query.endDate) {
            filter.createdAt.$lte = new Date(query.endDate);
        }
    }
    
    return filter;
};

/**
 * Validates alert query parameters
 */
const validateAlertQuery = (query) => {
    const errors = [];
    
    if (query.read && !['true', 'false'].includes(query.read)) {
        errors.push('Read must be either "true" or "false"');
    }
    
    if (query.page && (isNaN(query.page) || parseInt(query.page) < 1)) {
        errors.push('Page must be a positive integer');
    }
    
    if (query.limit && (isNaN(query.limit) || parseInt(query.limit) < 1 || parseInt(query.limit) > 100)) {
        errors.push('Limit must be between 1 and 100');
    }
    
    if (query.userId && !mongoose.Types.ObjectId.isValid(query.userId)) {
        errors.push('Invalid user ID format');
    }
    
    if (query.incident && !mongoose.Types.ObjectId.isValid(query.incident)) {
        errors.push('Invalid incident ID format');
    }
    
    if (query.geofence && !mongoose.Types.ObjectId.isValid(query.geofence)) {
        errors.push('Invalid geofence ID format');
    }
    
    return errors;
};

module.exports = {
    isValidObjectId,
    formatIncidentResponse,
    formatIncidentsResponse,
    buildPaginationObject,
    buildIncidentFilter,
    validateIncidentQuery,
    canUserAccessIncident,
    getPaginationParams,
    createErrorResponse,
    createSuccessResponse,
    formatGeofenceResponse,
    formatGeofencesResponse,
    buildGeofenceFilter,
    validateGeofenceQuery,
    formatAlertResponse,
    formatAlertsResponse,
    buildAlertFilter,
    validateAlertQuery
};
