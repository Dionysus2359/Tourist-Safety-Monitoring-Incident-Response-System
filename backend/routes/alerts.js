const express = require('express');
const router = express.Router();
const { 
    createAlert, 
    getAlerts, 
    getAlertById, 
    updateAlert, 
    deleteAlert,
    bulkUpdateAlerts,
    getUnreadCount
} = require('../controllers/alerts');
const { 
    alertCreationSchema, 
    alertUpdateSchema 
} = require('../schemas');
const { 
    isLoggedIn, 
    isAdmin,
    validateRequestMiddleware, 
    asyncHandler 
} = require('../middleware');

// GET /alerts - Get all alerts for the logged-in user (requires authentication)
router.get('/', 
    isLoggedIn,
    asyncHandler(getAlerts)
);

// POST /alerts - Create a new alert (requires authentication)
router.post('/', 
    isLoggedIn,
    validateRequestMiddleware(alertCreationSchema),
    asyncHandler(createAlert)
);

// GET /alerts/unread/count - Get unread alerts count for the logged-in user
router.get('/unread/count', 
    isLoggedIn,
    asyncHandler(getUnreadCount)
);

// PATCH /alerts/bulk - Bulk update alerts (mark multiple as read/unread)
router.patch('/bulk', 
    isLoggedIn,
    asyncHandler(bulkUpdateAlerts)
);

// GET /alerts/:id - Get a single alert by ID (requires authentication)
router.get('/:id', 
    isLoggedIn,
    asyncHandler(getAlertById)
);

// PUT /alerts/:id - Update an alert (mark read/unread) (requires authentication)
router.put('/:id', 
    isLoggedIn,
    validateRequestMiddleware(alertUpdateSchema),
    asyncHandler(updateAlert)
);

// DELETE /alerts/:id - Delete an alert by ID (requires authentication)
router.delete('/:id', 
    isLoggedIn,
    asyncHandler(deleteAlert)
);

// Admin-only routes for alert management
// GET /alerts/admin/all - Get all alerts (admin only)
router.get('/admin/all', 
    isLoggedIn,
    isAdmin,
    asyncHandler(getAlerts)
);

// GET /alerts/admin/stats - Get alert statistics (admin only)
router.get('/admin/stats', 
    isLoggedIn,
    isAdmin,
    asyncHandler(async (req, res, next) => {
        try {
            const Alert = require('../models/alert');
            
            // Get alert statistics
            const [
                totalAlerts,
                readAlerts,
                unreadAlerts,
                incidentAlerts,
                geofenceAlerts,
                recentAlerts
            ] = await Promise.all([
                Alert.countDocuments(),
                Alert.countDocuments({ read: true }),
                Alert.countDocuments({ read: false }),
                Alert.countDocuments({ incident: { $exists: true } }),
                Alert.countDocuments({ geofence: { $exists: true } }),
                Alert.countDocuments({ 
                    createdAt: { 
                        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
                    } 
                })
            ]);

            const stats = {
                total: totalAlerts,
                byReadStatus: {
                    read: readAlerts,
                    unread: unreadAlerts
                },
                byType: {
                    incident: incidentAlerts,
                    geofence: geofenceAlerts,
                    general: totalAlerts - incidentAlerts - geofenceAlerts
                },
                recent: {
                    last7Days: recentAlerts
                }
            };

            res.status(200).json({
                success: true,
                message: "Alert statistics retrieved successfully",
                data: { stats }
            });

        } catch (error) {
            console.error('Get alert stats error:', error);
            next(error);
        }
    })
);

// POST /alerts/emergency-sos - Create emergency SOS alerts for all admin users
router.post('/emergency-sos',
    isLoggedIn,
    asyncHandler(async (req, res, next) => {
        try {
            const { incidentId, location, touristInfo } = req.body;

            // Validate required fields
            if (!incidentId) {
                const error = require('../utils/helpers').createErrorResponse(400, "Incident ID is required");
                return res.status(error.statusCode).json(error.response);
            }

            // Get all admin users
            const User = require('../models/user');
            const adminUsers = await User.find({ role: 'admin' });

            if (adminUsers.length === 0) {
                const error = require('../utils/helpers').createErrorResponse(404, "No admin users found");
                return res.status(error.statusCode).json(error.response);
            }

            const Alert = require('../models/alert');

            // Create alerts for all admin users
            const alertsCreated = [];
            for (const admin of adminUsers) {
                try {
                    const alert = new Alert({
                        user: admin._id,
                        title: "🚨 EMERGENCY SOS ALERT",
                        message: `URGENT: Tourist ${touristInfo?.name || 'Unknown'} has triggered an emergency SOS signal! Location: ${location?.coordinates ? location.coordinates.join(', ') : 'Unknown'}. Immediate assistance required.`,
                        incident: incidentId,
                        read: false,
                        priority: "high",
                        type: "emergency"
                    });

                    await alert.save();
                    alertsCreated.push({
                        alertId: alert._id,
                        adminId: admin._id,
                        adminName: admin.name,
                        adminEmail: admin.email
                    });
                } catch (alertError) {
                    console.error(`Failed to create alert for admin ${admin._id}:`, alertError);
                }
            }

            const success = require('../utils/helpers').createSuccessResponse(201, `${alertsCreated.length} emergency alerts created successfully`, {
                alertsCreated,
                totalAdmins: adminUsers.length,
                incidentId
            });
            res.status(success.statusCode).json(success.response);

        } catch (error) {
            console.error('Create emergency SOS alerts error:', error);
            next(error);
        }
    })
);

// GET /alerts/admin/search - Search alerts with advanced filters (admin only)
router.get('/admin/search',
    isLoggedIn,
    isAdmin,
    asyncHandler(async (req, res, next) => {
        try {
            const Alert = require('../models/alert');
            const { 
                page = 1, 
                limit = 10, 
                read, 
                userId,
                incident,
                geofence,
                startDate, 
                endDate
            } = req.query;

            // Build filter object
            const filter = {};
            
            if (read !== undefined) filter.read = read === 'true';
            if (userId) filter.user = userId;
            if (incident) filter.incident = incident;
            if (geofence) filter.geofence = geofence;
            
            // Date range filter
            if (startDate || endDate) {
                filter.createdAt = {};
                if (startDate) filter.createdAt.$gte = new Date(startDate);
                if (endDate) filter.createdAt.$lte = new Date(endDate);
            }

            const skip = (parseInt(page) - 1) * parseInt(limit);
            
            // Get alerts with advanced filtering
            const [totalCount, alerts] = await Promise.all([
                Alert.countDocuments(filter),
                Alert.find(filter)
                    .populate([
                        { path: 'user', select: 'name email username' },
                        { path: 'incident', select: 'description status severity' },
                        { path: 'geofence', select: 'center radius alertType' }
                    ])
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(limit))
            ]);

            const { formatAlertsResponse, buildPaginationObject } = require('../utils/helpers');

            res.status(200).json({
                success: true,
                message: "Advanced alert search completed successfully",
                data: {
                    alerts: formatAlertsResponse(alerts),
                    pagination: buildPaginationObject(totalCount, parseInt(page), parseInt(limit)),
                    filters: {
                        read,
                        userId,
                        incident,
                        geofence,
                        startDate,
                        endDate
                    }
                }
            });

        } catch (error) {
            console.error('Advanced alert search error:', error);
            next(error);
        }
    })
);

// GET /alerts/admin/user/:userId - Get alerts for a specific user (admin only)
router.get('/admin/user/:userId', 
    isLoggedIn,
    isAdmin,
    asyncHandler(async (req, res, next) => {
        try {
            const { userId } = req.params;
            
            // Validate ObjectId format
            const { isValidObjectId } = require('../utils/helpers');
            if (!isValidObjectId(userId)) {
                const error = require('../utils/helpers').createErrorResponse(400, "Invalid user ID format");
                return res.status(error.statusCode).json(error.response);
            }

            // Override the query to get alerts for specific user
            req.query.userId = userId;
            await getAlerts(req, res, next);

        } catch (error) {
            console.error('Get user alerts error:', error);
            next(error);
        }
    })
);

// PATCH /alerts/admin/bulk - Bulk update alerts for any user (admin only)
router.patch('/admin/bulk', 
    isLoggedIn,
    isAdmin,
    asyncHandler(async (req, res, next) => {
        try {
            const { alertIds, read, userId } = req.body;

            // Validate input
            if (!Array.isArray(alertIds) || alertIds.length === 0) {
                const error = require('../utils/helpers').createErrorResponse(400, "Alert IDs array is required");
                return res.status(error.statusCode).json(error.response);
            }

            if (typeof read !== 'boolean') {
                const error = require('../utils/helpers').createErrorResponse(400, "Read status must be a boolean");
                return res.status(error.statusCode).json(error.response);
            }

            // Validate all alert IDs
            const { isValidObjectId } = require('../utils/helpers');
            const invalidIds = alertIds.filter(id => !isValidObjectId(id));
            if (invalidIds.length > 0) {
                const error = require('../utils/helpers').createErrorResponse(400, "Invalid alert ID format");
                return res.status(error.statusCode).json(error.response);
            }

            const Alert = require('../models/alert');
            
            // Build filter - admin can update any alerts
            const filter = { _id: { $in: alertIds } };
            if (userId) {
                filter.user = userId;
            }

            // Update alerts
            const result = await Alert.updateMany(filter, { read });

            const success = require('../utils/helpers').createSuccessResponse(200, `${result.modifiedCount} alerts updated successfully`, {
                modifiedCount: result.modifiedCount,
                totalRequested: alertIds.length
            });
            res.status(success.statusCode).json(success.response);

        } catch (error) {
            console.error('Admin bulk update alerts error:', error);
            next(error);
        }
    })
);

module.exports = router;
