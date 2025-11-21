const Alert = require('../models/alert');
const { alertCreationSchema, alertUpdateSchema, validateRequest } = require('../schemas');
const {
    isValidObjectId,
    formatAlertResponse,
    formatAlertsResponse,
    buildPaginationObject,
    buildAlertFilter,
    validateAlertQuery,
    getPaginationParams,
    createErrorResponse,
    createSuccessResponse
} = require('../utils/helpers');

/**
 * Create a new alert
 * Required: user (recipient), message
 * Optional: incident, geofence
 * Default: read = false
 */
const createAlert = async (req, res, next) => {
    try {
        // Get user ID from session
        const userId = req.session.userId;
        if (!userId) {
            const error = createErrorResponse(401, "User not authenticated");
            return res.status(error.statusCode).json(error.response);
        }

        // Validate input using Joi schema
        const validation = validateRequest(alertCreationSchema, req.body);
        if (!validation.isValid) {
            const error = createErrorResponse(400, validation.error);
            return res.status(error.statusCode).json(error.response);
        }

        const { user, message, incident, geofence, read } = validation.value;

        // Validate ObjectIds if provided
        if (incident && !isValidObjectId(incident)) {
            const error = createErrorResponse(400, "Invalid incident ID format");
            return res.status(error.statusCode).json(error.response);
        }

        if (geofence && !isValidObjectId(geofence)) {
            const error = createErrorResponse(400, "Invalid geofence ID format");
            return res.status(error.statusCode).json(error.response);
        }

        if (!isValidObjectId(user)) {
            const error = createErrorResponse(400, "Invalid user ID format");
            return res.status(error.statusCode).json(error.response);
        }

        // Create alert data
        const alertData = {
            user,
            message,
            read: read || false
        };

        // Add optional fields if provided
        if (incident) alertData.incident = incident;
        if (geofence) alertData.geofence = geofence;

        const alert = new Alert(alertData);
        await alert.save();

        // Populate references for response
        await alert.populate([
            { path: 'user', select: 'name email username' },
            { path: 'incident', select: 'description status severity' },
            { path: 'geofence', select: 'center radius alertType' }
        ]);

        const success = createSuccessResponse(201, "Alert created successfully", {
            alert: formatAlertResponse(alert)
        });
        res.status(success.statusCode).json(success.response);

    } catch (error) {
        console.error('Create alert error:', error);
        next(error);
    }
};

/**
 * Get all alerts for a specific user with pagination and filtering
 * Query params: page, limit, read, incident, geofence, startDate, endDate
 */
const getAlerts = async (req, res, next) => {
    try {
        // Get user ID from session or query
        const userId = req.session.userId || req.query.userId;
        if (!userId) {
            const error = createErrorResponse(400, "User ID is required");
            return res.status(error.statusCode).json(error.response);
        }

        // Validate query parameters
        const queryErrors = validateAlertQuery(req.query);
        if (queryErrors.length > 0) {
            const error = createErrorResponse(400, queryErrors.join(', '));
            return res.status(error.statusCode).json(error.response);
        }

        // Get pagination parameters
        const { page, limit, skip } = getPaginationParams(req.query);

        // Build filter object
        const filter = buildAlertFilter(req.query, userId);

        // Get total count and alerts
        const [totalCount, alerts] = await Promise.all([
            Alert.countDocuments(filter),
            Alert.find(filter)
                .populate([
                    { path: 'user', select: 'name email username' },
                    { path: 'incident', select: 'description status severity' },
                    { path: 'geofence', select: 'center radius alertType' }
                ])
                .sort({ createdAt: -1 }) // Newest first
                .skip(skip)
                .limit(limit)
        ]);

        const success = createSuccessResponse(200, "Alerts retrieved successfully", {
            alerts: formatAlertsResponse(alerts),
            pagination: buildPaginationObject(totalCount, page, limit)
        });
        res.status(success.statusCode).json(success.response);

    } catch (error) {
        console.error('Get alerts error:', error);
        next(error);
    }
};

/**
 * Get a single alert by ID
 */
const getAlertById = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Validate ObjectId format
        if (!isValidObjectId(id)) {
            const error = createErrorResponse(400, "Invalid alert ID format");
            return res.status(error.statusCode).json(error.response);
        }

        const alert = await Alert.findById(id)
            .populate([
                { path: 'user', select: 'name email username' },
                { path: 'incident', select: 'description status severity' },
                { path: 'geofence', select: 'center radius alertType' }
            ]);

        if (!alert) {
            const error = createErrorResponse(404, "Alert not found");
            return res.status(error.statusCode).json(error.response);
        }

        const success = createSuccessResponse(200, "Alert retrieved successfully", {
            alert: formatAlertResponse(alert)
        });
        res.status(success.statusCode).json(success.response);

    } catch (error) {
        console.error('Get alert by ID error:', error);
        next(error);
    }
};

/**
 * Update an alert by ID (mark as read/unread)
 */
const updateAlert = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Validate ObjectId format
        if (!isValidObjectId(id)) {
            const error = createErrorResponse(400, "Invalid alert ID format");
            return res.status(error.statusCode).json(error.response);
        }

        // Get user ID from session
        const userId = req.session.userId;
        if (!userId) {
            const error = createErrorResponse(401, "User not authenticated");
            return res.status(error.statusCode).json(error.response);
        }

        // Validate input using Joi schema
        const validation = validateRequest(alertUpdateSchema, req.body);
        if (!validation.isValid) {
            const error = createErrorResponse(400, validation.error);
            return res.status(error.statusCode).json(error.response);
        }

        // Find alert
        const alert = await Alert.findById(id);
        if (!alert) {
            const error = createErrorResponse(404, "Alert not found");
            return res.status(error.statusCode).json(error.response);
        }

        // Check if user can access alert (only the recipient or admin)
        if (alert.user.toString() !== userId) {
            // Check if user is admin
            const User = require('../models/user');
            const user = await User.findById(userId);
            if (!user || user.role !== 'admin') {
                const error = createErrorResponse(403, "Access denied. You can only update your own alerts.");
                return res.status(error.statusCode).json(error.response);
            }
        }

        // Update alert
        const updatedAlert = await Alert.findByIdAndUpdate(
            id,
            { read: validation.value.read },
            { new: true, runValidators: true }
        ).populate([
            { path: 'user', select: 'name email username' },
            { path: 'incident', select: 'description status severity' },
            { path: 'geofence', select: 'center radius alertType' }
        ]);

        const success = createSuccessResponse(200, "Alert updated successfully", {
            alert: formatAlertResponse(updatedAlert)
        });
        res.status(success.statusCode).json(success.response);

    } catch (error) {
        console.error('Update alert error:', error);
        next(error);
    }
};

/**
 * Delete an alert by ID
 */
const deleteAlert = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Validate ObjectId format
        if (!isValidObjectId(id)) {
            const error = createErrorResponse(400, "Invalid alert ID format");
            return res.status(error.statusCode).json(error.response);
        }

        // Get user ID from session
        const userId = req.session.userId;
        if (!userId) {
            const error = createErrorResponse(401, "User not authenticated");
            return res.status(error.statusCode).json(error.response);
        }

        // Find alert
        const alert = await Alert.findById(id);
        if (!alert) {
            const error = createErrorResponse(404, "Alert not found");
            return res.status(error.statusCode).json(error.response);
        }

        // Check if user can access alert (only the recipient or admin)
        if (alert.user.toString() !== userId) {
            // Check if user is admin
            const User = require('../models/user');
            const user = await User.findById(userId);
            if (!user || user.role !== 'admin') {
                const error = createErrorResponse(403, "Access denied. You can only delete your own alerts.");
                return res.status(error.statusCode).json(error.response);
            }
        }

        // Delete alert
        await Alert.findByIdAndDelete(id);

        const success = createSuccessResponse(200, "Alert deleted successfully");
        res.status(success.statusCode).json(success.response);

    } catch (error) {
        console.error('Delete alert error:', error);
        next(error);
    }
};

/**
 * Mark multiple alerts as read/unread (bulk update)
 */
const bulkUpdateAlerts = async (req, res, next) => {
    try {
        // Get user ID from session
        const userId = req.session.userId;
        if (!userId) {
            const error = createErrorResponse(401, "User not authenticated");
            return res.status(error.statusCode).json(error.response);
        }

        const { alertIds, read } = req.body;

        // Validate input
        if (!Array.isArray(alertIds) || alertIds.length === 0) {
            const error = createErrorResponse(400, "Alert IDs array is required");
            return res.status(error.statusCode).json(error.response);
        }

        if (typeof read !== 'boolean') {
            const error = createErrorResponse(400, "Read status must be a boolean");
            return res.status(error.statusCode).json(error.response);
        }

        // Validate all alert IDs
        const invalidIds = alertIds.filter(id => !isValidObjectId(id));
        if (invalidIds.length > 0) {
            const error = createErrorResponse(400, "Invalid alert ID format");
            return res.status(error.statusCode).json(error.response);
        }

        // Update alerts (only user's own alerts)
        const result = await Alert.updateMany(
            { _id: { $in: alertIds }, user: userId },
            { read }
        );

        const success = createSuccessResponse(200, `${result.modifiedCount} alerts updated successfully`, {
            modifiedCount: result.modifiedCount,
            totalRequested: alertIds.length
        });
        res.status(success.statusCode).json(success.response);

    } catch (error) {
        console.error('Bulk update alerts error:', error);
        next(error);
    }
};

/**
 * Get unread alerts count for a user
 */
const getUnreadCount = async (req, res, next) => {
    try {
        // Get user ID from session
        const userId = req.session.userId;
        if (!userId) {
            const error = createErrorResponse(401, "User not authenticated");
            return res.status(error.statusCode).json(error.response);
        }

        const unreadCount = await Alert.countDocuments({ user: userId, read: false });

        const success = createSuccessResponse(200, "Unread count retrieved successfully", {
            unreadCount
        });
        res.status(success.statusCode).json(success.response);

    } catch (error) {
        console.error('Get unread count error:', error);
        next(error);
    }
};

module.exports = {
    createAlert,
    getAlerts,
    getAlertById,
    updateAlert,
    deleteAlert,
    bulkUpdateAlerts,
    getUnreadCount
};
