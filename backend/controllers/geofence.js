const Geofence = require('../models/geofence');
const { geofenceCreationSchema, geofenceUpdateSchema, validateRequest } = require('../schemas');
const {
    isValidObjectId,
    formatGeofenceResponse,
    formatGeofencesResponse,
    buildPaginationObject,
    buildGeofenceFilter,
    validateGeofenceQuery,
    getPaginationParams,
    createErrorResponse,
    createSuccessResponse
} = require('../utils/helpers');

/**
 * Create a new geofence
 * Required: center (GeoJSON Point), radius
 * Optional: alertType (default warning), active (default true)
 */
const createGeofence = async (req, res, next) => {
    try {
        // Get user ID from session
        const userId = req.session.userId;
        if (!userId) {
            const error = createErrorResponse(401, "User not authenticated");
            return res.status(error.statusCode).json(error.response);
        }

        // Validate input using Joi schema
        const validation = validateRequest(geofenceCreationSchema, req.body);
        if (!validation.isValid) {
            const error = createErrorResponse(400, validation.error);
            return res.status(error.statusCode).json(error.response);
        }

        const { center, radius, alertType, active } = validation.value;

        // Create geofence data
        const geofenceData = {
            center: {
                type: 'Point',
                coordinates: center.coordinates
            },
            radius,
            alertType: alertType || 'warning',
            active: active !== undefined ? active : true
        };

        const geofence = new Geofence(geofenceData);
        await geofence.save();

        const success = createSuccessResponse(201, "Geofence created successfully", {
            geofence: formatGeofenceResponse(geofence)
        });
        res.status(success.statusCode).json(success.response);

    } catch (error) {
        console.error('Create geofence error:', error);
        next(error);
    }
};

/**
 * Get all geofences with pagination and filtering
 * Query params: page, limit, active, alertType
 */
const getGeofences = async (req, res, next) => {
    try {
        // Validate query parameters
        const queryErrors = validateGeofenceQuery(req.query);
        if (queryErrors.length > 0) {
            const error = createErrorResponse(400, queryErrors.join(', '));
            return res.status(error.statusCode).json(error.response);
        }

        // Get pagination parameters
        const { page, limit, skip } = getPaginationParams(req.query);

        // Build filter object
        const filter = buildGeofenceFilter(req.query);

        // Get total count and geofences
        const [totalCount, geofences] = await Promise.all([
            Geofence.countDocuments(filter),
            Geofence.find(filter)
                .sort({ createdAt: -1 }) // Newest first
                .skip(skip)
                .limit(limit)
        ]);

        const success = createSuccessResponse(200, "Geofences retrieved successfully", {
            geofences: formatGeofencesResponse(geofences),
            pagination: buildPaginationObject(totalCount, page, limit)
        });
        res.status(success.statusCode).json(success.response);

    } catch (error) {
        console.error('Get geofences error:', error);
        next(error);
    }
};

/**
 * Get a single geofence by ID
 */
const getGeofenceById = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Validate ObjectId format
        if (!isValidObjectId(id)) {
            const error = createErrorResponse(400, "Invalid geofence ID format");
            return res.status(error.statusCode).json(error.response);
        }

        const geofence = await Geofence.findById(id);

        if (!geofence) {
            const error = createErrorResponse(404, "Geofence not found");
            return res.status(error.statusCode).json(error.response);
        }

        const success = createSuccessResponse(200, "Geofence retrieved successfully", {
            geofence: formatGeofenceResponse(geofence)
        });
        res.status(success.statusCode).json(success.response);

    } catch (error) {
        console.error('Get geofence by ID error:', error);
        next(error);
    }
};

/**
 * Update a geofence by ID
 */
const updateGeofence = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Validate ObjectId format
        if (!isValidObjectId(id)) {
            const error = createErrorResponse(400, "Invalid geofence ID format");
            return res.status(error.statusCode).json(error.response);
        }

        // Get user ID from session
        const userId = req.session.userId;
        if (!userId) {
            const error = createErrorResponse(401, "User not authenticated");
            return res.status(error.statusCode).json(error.response);
        }

        // Validate input using Joi schema
        const validation = validateRequest(geofenceUpdateSchema, req.body);
        if (!validation.isValid) {
            const error = createErrorResponse(400, validation.error);
            return res.status(error.statusCode).json(error.response);
        }

        // Find geofence
        const geofence = await Geofence.findById(id);
        if (!geofence) {
            const error = createErrorResponse(404, "Geofence not found");
            return res.status(error.statusCode).json(error.response);
        }

        // Build update object from validated data
        const updateData = {};
        const { center, radius, alertType, active } = validation.value;
        
        if (center !== undefined) {
            updateData.center = {
                type: 'Point',
                coordinates: center.coordinates
            };
        }
        if (radius !== undefined) updateData.radius = radius;
        if (alertType !== undefined) updateData.alertType = alertType;
        if (active !== undefined) updateData.active = active;

        // Update geofence
        const updatedGeofence = await Geofence.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        const success = createSuccessResponse(200, "Geofence updated successfully", {
            geofence: formatGeofenceResponse(updatedGeofence)
        });
        res.status(success.statusCode).json(success.response);

    } catch (error) {
        console.error('Update geofence error:', error);
        next(error);
    }
};

/**
 * Delete a geofence by ID
 */
const deleteGeofence = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Validate ObjectId format
        if (!isValidObjectId(id)) {
            const error = createErrorResponse(400, "Invalid geofence ID format");
            return res.status(error.statusCode).json(error.response);
        }

        // Get user ID from session
        const userId = req.session.userId;
        if (!userId) {
            const error = createErrorResponse(401, "User not authenticated");
            return res.status(error.statusCode).json(error.response);
        }

        // Find geofence
        const geofence = await Geofence.findById(id);
        if (!geofence) {
            const error = createErrorResponse(404, "Geofence not found");
            return res.status(error.statusCode).json(error.response);
        }

        // Delete geofence
        await Geofence.findByIdAndDelete(id);

        const success = createSuccessResponse(200, "Geofence deleted successfully");
        res.status(success.statusCode).json(success.response);

    } catch (error) {
        console.error('Delete geofence error:', error);
        next(error);
    }
};

/**
 * Get geofences near a specific location (geospatial query)
 * Query params: lng, lat, radius (in meters), page, limit
 */
const getGeofencesNearLocation = async (req, res, next) => {
    try {
        const { lng, lat, radius = 5000, page = 1, limit = 10 } = req.query;

        // Validate coordinates
        if (!lng || !lat || isNaN(lng) || isNaN(lat)) {
            const error = createErrorResponse(400, "Valid longitude and latitude are required");
            return res.status(error.statusCode).json(error.response);
        }

        // Validate radius
        if (isNaN(radius) || radius < 0 || radius > 50000) {
            const error = createErrorResponse(400, "Radius must be between 0 and 50,000 meters");
            return res.status(error.statusCode).json(error.response);
        }

        const { skip } = getPaginationParams({ page, limit });

        // Geospatial query to find geofences near the location
        const geofences = await Geofence.find({
            center: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [parseFloat(lng), parseFloat(lat)]
                    },
                    $maxDistance: parseInt(radius)
                }
            }
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

        const totalCount = await Geofence.countDocuments({
            center: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [parseFloat(lng), parseFloat(lat)]
                    },
                    $maxDistance: parseInt(radius)
                }
            }
        });

        const success = createSuccessResponse(200, "Nearby geofences retrieved successfully", {
            geofences: formatGeofencesResponse(geofences),
            pagination: buildPaginationObject(totalCount, parseInt(page), parseInt(limit)),
            searchParams: {
                location: { lng: parseFloat(lng), lat: parseFloat(lat) },
                radius: parseInt(radius)
            }
        });
        res.status(success.statusCode).json(success.response);

    } catch (error) {
        console.error('Get geofences near location error:', error);
        next(error);
    }
};

/**
 * Toggle geofence active status
 */
const toggleGeofenceStatus = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Validate ObjectId format
        if (!isValidObjectId(id)) {
            const error = createErrorResponse(400, "Invalid geofence ID format");
            return res.status(error.statusCode).json(error.response);
        }

        // Get user ID from session
        const userId = req.session.userId;
        if (!userId) {
            const error = createErrorResponse(401, "User not authenticated");
            return res.status(error.statusCode).json(error.response);
        }

        // Find geofence
        const geofence = await Geofence.findById(id);
        if (!geofence) {
            const error = createErrorResponse(404, "Geofence not found");
            return res.status(error.statusCode).json(error.response);
        }

        // Toggle active status
        const updatedGeofence = await Geofence.findByIdAndUpdate(
            id,
            { active: !geofence.active },
            { new: true, runValidators: true }
        );

        const success = createSuccessResponse(200, `Geofence ${updatedGeofence.active ? 'activated' : 'deactivated'} successfully`, {
            geofence: formatGeofenceResponse(updatedGeofence)
        });
        res.status(success.statusCode).json(success.response);

    } catch (error) {
        console.error('Toggle geofence status error:', error);
        next(error);
    }
};

module.exports = {
    createGeofence,
    getGeofences,
    getGeofenceById,
    updateGeofence,
    deleteGeofence,
    getGeofencesNearLocation,
    toggleGeofenceStatus
};
