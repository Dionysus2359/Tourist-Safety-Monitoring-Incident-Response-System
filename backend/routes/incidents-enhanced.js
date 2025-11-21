const express = require('express');
const router = express.Router();
const { 
    createIncident, 
    getIncidents, 
    getIncidentById, 
    updateIncident, 
    deleteIncident,
    getUserIncidents
} = require('../controllers/incidents-enhanced');
const { 
    incidentCreationSchema, 
    incidentUpdateSchema 
} = require('../schemas');
const { 
    isLoggedIn, 
    isAdmin,
    validateRequestMiddleware, 
    asyncHandler 
} = require('../middleware');

// POST /incidents - Create a new incident with all features (geocoding, geofence detection, alerts)
router.post('/', 
    isLoggedIn,
    validateRequestMiddleware(incidentCreationSchema),
    asyncHandler(createIncident)
);

// GET /incidents - Get all incidents with pagination and filtering
router.get('/', asyncHandler(getIncidents));

// GET /incidents/my - Get current user's incidents (requires authentication)
router.get('/my', 
    isLoggedIn,
    asyncHandler(getUserIncidents)
);

// GET /incidents/:id - Get a single incident by ID
router.get('/:id', asyncHandler(getIncidentById));

// PUT /incidents/:id - Update an incident by ID (requires authentication)
router.put('/:id', 
    isLoggedIn,
    validateRequestMiddleware(incidentCreationSchema), // Reuse creation schema for updates
    asyncHandler(updateIncident)
);

// DELETE /incidents/:id - Delete an incident by ID (requires authentication)
router.delete('/:id', 
    isLoggedIn,
    asyncHandler(deleteIncident)
);

// Admin-only routes for incident management
// GET /incidents/admin/all - Get all incidents (admin only)
router.get('/admin/all', 
    isLoggedIn,
    isAdmin,
    asyncHandler(getIncidents)
);

// GET /incidents/stats/summary - Get incident statistics (admin only)
router.get('/stats/summary', 
    isLoggedIn,
    isAdmin,
    asyncHandler(async (req, res, next) => {
        try {
            const Incident = require('../models/incident');
            
            // Get incident statistics
            const [
                totalIncidents,
                reportedIncidents,
                inProgressIncidents,
                resolvedIncidents,
                highSeverityIncidents,
                mediumSeverityIncidents,
                lowSeverityIncidents,
                recentIncidents
            ] = await Promise.all([
                Incident.countDocuments(),
                Incident.countDocuments({ status: 'reported' }),
                Incident.countDocuments({ status: 'inProgress' }),
                Incident.countDocuments({ status: 'resolved' }),
                Incident.countDocuments({ severity: 'high' }),
                Incident.countDocuments({ severity: 'medium' }),
                Incident.countDocuments({ severity: 'low' }),
                Incident.countDocuments({ 
                    createdAt: { 
                        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
                    } 
                })
            ]);

            const stats = {
                total: totalIncidents,
                byStatus: {
                    reported: reportedIncidents,
                    inProgress: inProgressIncidents,
                    resolved: resolvedIncidents
                },
                bySeverity: {
                    high: highSeverityIncidents,
                    medium: mediumSeverityIncidents,
                    low: lowSeverityIncidents
                },
                recent: {
                    last7Days: recentIncidents
                }
            };

            res.status(200).json({
                success: true,
                message: "Incident statistics retrieved successfully",
                data: { stats }
            });

        } catch (error) {
            console.error('Get incident stats error:', error);
            next(error);
        }
    })
);

// GET /incidents/search/advanced - Search incidents with advanced filters (admin only)
router.get('/search/advanced', 
    isLoggedIn,
    isAdmin,
    asyncHandler(async (req, res, next) => {
        try {
            const Incident = require('../models/incident');
            const { 
                page = 1, 
                limit = 10, 
                status, 
                severity, 
                startDate, 
                endDate,
                userId,
                locationRadius,
                locationCenter
            } = req.query;

            // Build filter object
            const filter = {};
            
            if (status) filter.status = status;
            if (severity) filter.severity = severity;
            if (userId) filter.user = userId;
            
            // Date range filter
            if (startDate || endDate) {
                filter.createdAt = {};
                if (startDate) filter.createdAt.$gte = new Date(startDate);
                if (endDate) filter.createdAt.$lte = new Date(endDate);
            }

            // Location-based search (if coordinates provided)
            if (locationCenter && locationRadius) {
                const [lng, lat] = locationCenter.split(',').map(Number);
                filter.location = {
                    $near: {
                        $geometry: {
                            type: "Point",
                            coordinates: [lng, lat]
                        },
                        $maxDistance: parseInt(locationRadius) * 1000 // Convert km to meters
                    }
                };
            }

            const skip = (parseInt(page) - 1) * parseInt(limit);
            
            // Get incidents with advanced filtering
            const [totalCount, incidents] = await Promise.all([
                Incident.countDocuments(filter),
                Incident.find(filter)
                    .populate('user', 'name email username')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(limit))
            ]);

            const { formatIncidentsResponse, buildPaginationObject } = require('../utils/helpers');

            res.status(200).json({
                success: true,
                message: "Advanced search completed successfully",
                data: {
                    incidents: incidents.map(incident => ({
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
                    })),
                    pagination: buildPaginationObject(totalCount, parseInt(page), parseInt(limit)),
                    filters: {
                        status,
                        severity,
                        startDate,
                        endDate,
                        userId,
                        locationRadius,
                        locationCenter
                    }
                }
            });

        } catch (error) {
            console.error('Advanced search error:', error);
            next(error);
        }
    })
);

module.exports = router;
