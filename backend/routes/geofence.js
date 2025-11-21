const express = require('express');
const router = express.Router();
const { 
    createGeofence, 
    getGeofences, 
    getGeofenceById, 
    updateGeofence, 
    deleteGeofence,
    getGeofencesNearLocation,
    toggleGeofenceStatus
} = require('../controllers/geofence');
const { 
    geofenceCreationSchema, 
    geofenceUpdateSchema 
} = require('../schemas');
const { 
    isLoggedIn, 
    isAdmin,
    validateRequestMiddleware, 
    asyncHandler 
} = require('../middleware');

// GET /geofences - Get all geofences with pagination and filtering
router.get('/', asyncHandler(getGeofences));

// POST /geofences - Create a new geofence (requires authentication)
router.post('/', 
    isLoggedIn,
    validateRequestMiddleware(geofenceCreationSchema),
    asyncHandler(createGeofence)
);

// GET /geofences/near - Get geofences near a specific location (geospatial query)
router.get('/near', asyncHandler(getGeofencesNearLocation));

// GET /geofences/:id - Get a single geofence by ID
router.get('/:id', asyncHandler(getGeofenceById));

// PUT /geofences/:id - Update a geofence by ID (requires authentication)
router.put('/:id', 
    isLoggedIn,
    validateRequestMiddleware(geofenceUpdateSchema),
    asyncHandler(updateGeofence)
);

// DELETE /geofences/:id - Delete a geofence by ID (requires authentication)
router.delete('/:id', 
    isLoggedIn,
    asyncHandler(deleteGeofence)
);

// PATCH /geofences/:id/toggle - Toggle geofence active status (requires authentication)
router.patch('/:id/toggle', 
    isLoggedIn,
    asyncHandler(toggleGeofenceStatus)
);

// Admin-only routes for geofence management
// GET /geofences/admin/all - Get all geofences with admin privileges
router.get('/admin/all', 
    isLoggedIn,
    isAdmin,
    asyncHandler(getGeofences)
);

// GET /geofences/admin/stats - Get geofence statistics (admin only)
router.get('/admin/stats', 
    isLoggedIn,
    isAdmin,
    asyncHandler(async (req, res, next) => {
        try {
            const Geofence = require('../models/geofence');
            
            // Get geofence statistics
            const [
                totalGeofences,
                activeGeofences,
                inactiveGeofences,
                warningGeofences,
                dangerGeofences,
                recentGeofences
            ] = await Promise.all([
                Geofence.countDocuments(),
                Geofence.countDocuments({ active: true }),
                Geofence.countDocuments({ active: false }),
                Geofence.countDocuments({ alertType: 'warning' }),
                Geofence.countDocuments({ alertType: 'danger' }),
                Geofence.countDocuments({ 
                    createdAt: { 
                        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
                    } 
                })
            ]);

            const stats = {
                total: totalGeofences,
                byStatus: {
                    active: activeGeofences,
                    inactive: inactiveGeofences
                },
                byAlertType: {
                    warning: warningGeofences,
                    danger: dangerGeofences
                },
                recent: {
                    last7Days: recentGeofences
                }
            };

            res.status(200).json({
                success: true,
                message: "Geofence statistics retrieved successfully",
                data: { stats }
            });

        } catch (error) {
            console.error('Get geofence stats error:', error);
            next(error);
        }
    })
);

// GET /geofences/admin/search - Search geofences with advanced filters (admin only)
router.get('/admin/search', 
    isLoggedIn,
    isAdmin,
    asyncHandler(async (req, res, next) => {
        try {
            const Geofence = require('../models/geofence');
            const { 
                page = 1, 
                limit = 10, 
                active, 
                alertType, 
                startDate, 
                endDate,
                locationRadius,
                locationCenter
            } = req.query;

            // Build filter object
            const filter = {};
            
            if (active !== undefined) filter.active = active === 'true';
            if (alertType) filter.alertType = alertType;
            
            // Date range filter
            if (startDate || endDate) {
                filter.createdAt = {};
                if (startDate) filter.createdAt.$gte = new Date(startDate);
                if (endDate) filter.createdAt.$lte = new Date(endDate);
            }

            // Location-based search (if coordinates provided)
            if (locationCenter && locationRadius) {
                const [lng, lat] = locationCenter.split(',').map(Number);
                filter.center = {
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
            
            // Get geofences with advanced filtering
            const [totalCount, geofences] = await Promise.all([
                Geofence.countDocuments(filter),
                Geofence.find(filter)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(limit))
            ]);

            const { formatGeofencesResponse, buildPaginationObject } = require('../utils/helpers');

            res.status(200).json({
                success: true,
                message: "Advanced geofence search completed successfully",
                data: {
                    geofences: formatGeofencesResponse(geofences),
                    pagination: buildPaginationObject(totalCount, parseInt(page), parseInt(limit)),
                    filters: {
                        active,
                        alertType,
                        startDate,
                        endDate,
                        locationRadius,
                        locationCenter
                    }
                }
            });

        } catch (error) {
            console.error('Advanced geofence search error:', error);
            next(error);
        }
    })
);

module.exports = router;
