const Incident = require('../models/incident');
const User = require('../models/user');
const Geofence = require('../models/geofence');
const { incidentCreationSchema, incidentUpdateSchema, validateRequest } = require('../schemas');
const {
    createAlertsForGeofences,
    createEmergencyAlerts,
    createAlertsForSpecificGeofenceTypes
} = require('../utils/alertHelpers');
const { getAddressFromCoordinates } = require('../utils/geocoding');
const {
    isValidObjectId,
    formatIncidentResponse,
    formatIncidentsResponse,
    buildPaginationObject,
    buildIncidentFilter,
    validateIncidentQuery,
    canUserAccessIncident,
    getPaginationParams,
    createErrorResponse,
    createSuccessResponse
} = require('../utils/helpers');

/**
 * Create a new incident
 * Required: user, description, location
 * Optional: tripId, address, severity
 */
const createIncident = async (req, res, next) => {
    try {
        // Get user ID from session
        const userId = req.session.userId;
        if (!userId) {
            const error = createErrorResponse(401, "User not authenticated");
            return res.status(error.statusCode).json(error.response);
        }

        // Validate input using Joi schema
        const validation = validateRequest(incidentCreationSchema, req.body);
        if (!validation.isValid) {
            const error = createErrorResponse(400, validation.error);
            return res.status(error.statusCode).json(error.response);
        }

        const { description, location, tripId, address, severity } = validation.value;

        // Create incident data
        const incidentData = {
            user: userId,
            description,
            location: {
                type: 'Point',
                coordinates: location.coordinates
            },
            status: 'reported'
        };

        // Add optional fields if provided
        if (tripId) incidentData.tripId = tripId;
        if (severity) incidentData.severity = severity;

        // If address is not provided, try to get it from coordinates using reverse geocoding
        if (!address) {
            try {
                console.log('Attempting to get address from coordinates:', location.coordinates);
                const [lng, lat] = location.coordinates;
                const geocodingResult = await getAddressFromCoordinates(lat, lng);

                if (geocodingResult.data.address) {
                    incidentData.address = geocodingResult.data.address;
                    console.log('Address generated from coordinates:', incidentData.address);
                } else {
                    console.log('Could not generate address from coordinates, using fallback');
                    incidentData.address = `Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
                }
            } catch (geocodingError) {
                console.error('Geocoding error:', geocodingError);
                incidentData.address = `Location: ${location.coordinates[1].toFixed(4)}, ${location.coordinates[0].toFixed(4)}`;
            }
        } else {
            incidentData.address = address;
        }

        const incident = new Incident(incidentData);
        await incident.save();

        // Populate user data for response
        await incident.populate('user', 'name email username');

        const success = createSuccessResponse(201, "Incident created successfully", {
            incident: formatIncidentResponse(incident)
        });
        res.status(success.statusCode).json(success.response);

    } catch (error) {
        console.error('Create incident error:', error);
        next(error);
    }
};

/**
 * Get all incidents with pagination
 * Query params: page, limit, status, severity, startDate, endDate
 */
const getIncidents = async (req, res, next) => {
    try {
        // Validate query parameters
        const queryErrors = validateIncidentQuery(req.query);
        if (queryErrors.length > 0) {
            const error = createErrorResponse(400, queryErrors.join(', '));
            return res.status(error.statusCode).json(error.response);
        }

        // Get pagination parameters
        const { page, limit, skip } = getPaginationParams(req.query);

        // Build filter object
        const filter = buildIncidentFilter(req.query);

        // Get total count and incidents
        const [totalCount, incidents] = await Promise.all([
            Incident.countDocuments(filter),
            Incident.find(filter)
                .populate('user', 'name email username')
                .sort({ createdAt: -1 }) // Newest first
                .skip(skip)
                .limit(limit)
        ]);

        const success = createSuccessResponse(200, "Incidents retrieved successfully", {
            incidents: formatIncidentsResponse(incidents),
            pagination: buildPaginationObject(totalCount, page, limit)
        });
        res.status(success.statusCode).json(success.response);

    } catch (error) {
        console.error('Get incidents error:', error);
        next(error);
    }
};

/**
 * Get a single incident by ID
 */
const getIncidentById = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Validate ObjectId format
        if (!isValidObjectId(id)) {
            const error = createErrorResponse(400, "Invalid incident ID format");
            return res.status(error.statusCode).json(error.response);
        }

        const incident = await Incident.findById(id)
            .populate('user', 'name email username');

        if (!incident) {
            const error = createErrorResponse(404, "Incident not found");
            return res.status(error.statusCode).json(error.response);
        }

        const success = createSuccessResponse(200, "Incident retrieved successfully", {
            incident: formatIncidentResponse(incident)
        });
        res.status(success.statusCode).json(success.response);

    } catch (error) {
        console.error('Get incident by ID error:', error);
        next(error);
    }
};

/**
 * Update an incident by ID
 */
const updateIncident = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Validate ObjectId format
        if (!isValidObjectId(id)) {
            const error = createErrorResponse(400, "Invalid incident ID format");
            return res.status(error.statusCode).json(error.response);
        }

        // Get user ID from session
        const userId = req.session.userId;
        if (!userId) {
            const error = createErrorResponse(401, "User not authenticated");
            return res.status(error.statusCode).json(error.response);
        }

        // Validate input using Joi schema
        const validation = validateRequest(incidentUpdateSchema, req.body);
        if (!validation.isValid) {
            const error = createErrorResponse(400, validation.error);
            return res.status(error.statusCode).json(error.response);
        }

        // Find incident and user
        const [incident, user] = await Promise.all([
            Incident.findById(id),
            User.findById(userId)
        ]);

        if (!incident) {
            const error = createErrorResponse(404, "Incident not found");
            return res.status(error.statusCode).json(error.response);
        }

        // Check if user can access incident
        if (!canUserAccessIncident(incident, userId, user.role)) {
            const error = createErrorResponse(403, "Access denied. You can only update your own incidents.");
            return res.status(error.statusCode).json(error.response);
        }

        // Build update object from validated data
        const updateData = {};
        const { description, location, address, severity, status } = validation.value;
        
        if (description !== undefined) updateData.description = description;
        if (address !== undefined) updateData.address = address;
        if (severity !== undefined) updateData.severity = severity;
        if (status !== undefined) updateData.status = status;

        // Handle location update
        if (location !== undefined) {
            updateData.location = {
                type: 'Point',
                coordinates: location.coordinates
            };
        }

        // Update incident
        const updatedIncident = await Incident.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate('user', 'name email username');

        const success = createSuccessResponse(200, "Incident updated successfully", {
            incident: formatIncidentResponse(updatedIncident)
        });
        res.status(success.statusCode).json(success.response);

    } catch (error) {
        console.error('Update incident error:', error);
        next(error);
    }
};

/**
 * Delete an incident by ID
 */
const deleteIncident = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Validate ObjectId format
        if (!isValidObjectId(id)) {
            const error = createErrorResponse(400, "Invalid incident ID format");
            return res.status(error.statusCode).json(error.response);
        }

        // Get user ID from session
        const userId = req.session.userId;
        if (!userId) {
            const error = createErrorResponse(401, "User not authenticated");
            return res.status(error.statusCode).json(error.response);
        }

        // Find incident and user
        const [incident, user] = await Promise.all([
            Incident.findById(id),
            User.findById(userId)
        ]);

        if (!incident) {
            const error = createErrorResponse(404, "Incident not found");
            return res.status(error.statusCode).json(error.response);
        }

        // Check if user can access incident
        if (!canUserAccessIncident(incident, userId, user.role)) {
            const error = createErrorResponse(403, "Access denied. You can only delete your own incidents.");
            return res.status(error.statusCode).json(error.response);
        }

        // Delete incident
        await Incident.findByIdAndDelete(id);

        const success = createSuccessResponse(200, "Incident deleted successfully");
        res.status(success.statusCode).json(success.response);

    } catch (error) {
        console.error('Delete incident error:', error);
        next(error);
    }
};

/**
 * Get incidents by user ID (for user's own incidents)
 */
const getUserIncidents = async (req, res, next) => {
    try {
        const userId = req.session.userId;
        if (!userId) {
            const error = createErrorResponse(401, "User not authenticated");
            return res.status(error.statusCode).json(error.response);
        }

        // Validate query parameters
        const queryErrors = validateIncidentQuery(req.query);
        if (queryErrors.length > 0) {
            const error = createErrorResponse(400, queryErrors.join(', '));
            return res.status(error.statusCode).json(error.response);
        }

        // Get pagination parameters
        const { page, limit, skip } = getPaginationParams(req.query);

        // Build filter (user-specific)
        const filter = { user: userId };
        const generalFilter = buildIncidentFilter(req.query);
        Object.assign(filter, generalFilter);

        // Get total count and incidents
        const [totalCount, incidents] = await Promise.all([
            Incident.countDocuments(filter),
            Incident.find(filter)
                .populate('user', 'name email username')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
        ]);

        const success = createSuccessResponse(200, "User incidents retrieved successfully", {
            incidents: formatIncidentsResponse(incidents),
            pagination: buildPaginationObject(totalCount, page, limit)
        });
        res.status(success.statusCode).json(success.response);

    } catch (error) {
        console.error('Get user incidents error:', error);
        next(error);
    }
};

/**
 * Find all geofences that contain a given incident location
 * Uses MongoDB $geoWithin with $centerSphere for circular geofences
 * @param {Object} location - Incident location { type: 'Point', coordinates: [lng, lat] }
 * @returns {Promise<Object>} - { success: boolean, message: string, data: { geofences: Array } }
 */
const findGeofencesContainingLocation = async (location) => {
    try {
        // Validate location object
        if (!location || !location.type || !location.coordinates) {
            return {
                success: false,
                message: 'Invalid location object provided',
                data: { geofences: [] }
            };
        }

        if (location.type !== 'Point') {
            return {
                success: false,
                message: 'Location must be a Point type',
                data: { geofences: [] }
            };
        }

        if (!Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
            return {
                success: false,
                message: 'Location coordinates must be an array with [longitude, latitude]',
                data: { geofences: [] }
            };
        }

        const [lng, lat] = location.coordinates;

        // Validate coordinate ranges
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return {
                success: false,
                message: 'Coordinates out of valid range',
                data: { geofences: [] }
            };
        }

        console.log(`Searching for geofences containing location: ${lat}, ${lng}`);

        // Find all active geofences
        const allGeofences = await Geofence.find({ active: true });
        console.log(`Found ${allGeofences.length} active geofences to check`);

        const containingGeofences = [];

        // Check each geofence to see if the incident location is within its radius
        for (const geofence of allGeofences) {
            try {
                const isWithinGeofence = await checkPointWithinGeofence(
                    { lat, lng },
                    geofence.center.coordinates,
                    geofence.radius
                );

                if (isWithinGeofence) {
                    containingGeofences.push({
                        id: geofence._id,
                        center: geofence.center,
                        radius: geofence.radius,
                        alertType: geofence.alertType,
                        active: geofence.active,
                        createdAt: geofence.createdAt,
                        updatedAt: geofence.updatedAt
                    });
                    console.log(`Incident location is within geofence ${geofence._id} (${geofence.alertType})`);
                }
            } catch (geofenceError) {
                console.warn(`Error checking geofence ${geofence._id}:`, geofenceError.message);
                // Continue checking other geofences
            }
        }

        console.log(`Found ${containingGeofences.length} geofences containing the incident location`);

        return {
            success: true,
            message: `Found ${containingGeofences.length} geofences containing the incident location`,
            data: { geofences: containingGeofences }
        };

    } catch (error) {
        console.error('Error finding geofences containing location:', error);
        return {
            success: false,
            message: 'Internal error while searching for containing geofences',
            data: { geofences: [] }
        };
    }
};

/**
 * Check if a point is within a circular geofence
 * Uses Haversine formula for accurate distance calculation
 * @param {Object} point - { lat: number, lng: number }
 * @param {Array} geofenceCenter - [lng, lat] coordinates
 * @param {number} radius - Radius in meters
 * @returns {boolean} - True if point is within geofence
 */
const checkPointWithinGeofence = async (point, geofenceCenter, radius) => {
    try {
        const [centerLng, centerLat] = geofenceCenter;
        const distance = calculateHaversineDistance(
            point.lat, point.lng,
            centerLat, centerLng
        );

        return distance <= radius;
    } catch (error) {
        console.error('Error checking point within geofence:', error);
        return false;
    }
};

/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - First point latitude
 * @param {number} lng1 - First point longitude
 * @param {number} lat2 - Second point latitude
 * @param {number} lng2 - Second point longitude
 * @returns {number} - Distance in meters
 */
const calculateHaversineDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371000; // Earth's radius in meters
    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
};

/**
 * Convert degrees to radians
 * @param {number} degrees - Degrees to convert
 * @returns {number} - Radians
 */
const toRadians = (degrees) => {
    return degrees * (Math.PI / 180);
};

/**
 * Find geofences containing location using MongoDB geospatial queries
 * Alternative implementation using $geoWithin with $centerSphere
 * @param {Object} location - Incident location { type: 'Point', coordinates: [lng, lat] }
 * @returns {Promise<Object>} - { success: boolean, message: string, data: { geofences: Array } }
 */
const findGeofencesContainingLocationMongoDB = async (location) => {
    try {
        // Validate location object
        if (!location || !location.type || !location.coordinates) {
            return {
                success: false,
                message: 'Invalid location object provided',
                data: { geofences: [] }
            };
        }

        if (location.type !== 'Point') {
            return {
                success: false,
                message: 'Location must be a Point type',
                data: { geofences: [] }
            };
        }

        if (!Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
            return {
                success: false,
                message: 'Location coordinates must be an array with [longitude, latitude]',
                data: { geofences: [] }
            };
        }

        const [lng, lat] = location.coordinates;

        // Validate coordinate ranges
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return {
                success: false,
                message: 'Coordinates out of valid range',
                data: { geofences: [] }
            };
        }

        console.log(`Searching for geofences containing location using MongoDB: ${lat}, ${lng}`);

        // Get all active geofences
        const geofences = await Geofence.find({ active: true });
        console.log(`Found ${geofences.length} active geofences`);

        const containingGeofences = [];

        // For each geofence, check if the incident point is within its radius
        for (const geofence of geofences) {
            try {
                // Create a circular area around the geofence center
                const radiusInRadians = geofence.radius / 6371000; // Convert meters to radians
                
                // Use $geoWithin with $centerSphere to check if point is within circle
                const isWithin = await Geofence.findOne({
                    _id: geofence._id,
                    center: {
                        $geoWithin: {
                            $centerSphere: [
                                geofence.center.coordinates, // [lng, lat]
                                radiusInRadians
                            ]
                        }
                    }
                });

                if (isWithin) {
                    containingGeofences.push({
                        id: geofence._id,
                        center: geofence.center,
                        radius: geofence.radius,
                        alertType: geofence.alertType,
                        active: geofence.active,
                        createdAt: geofence.createdAt,
                        updatedAt: geofence.updatedAt
                    });
                    console.log(`Incident location is within geofence ${geofence._id} (${geofence.alertType})`);
                }
            } catch (geofenceError) {
                console.warn(`Error checking geofence ${geofence._id}:`, geofenceError.message);
                // Continue checking other geofences
            }
        }

        console.log(`Found ${containingGeofences.length} geofences containing the incident location`);

        return {
            success: true,
            message: `Found ${containingGeofences.length} geofences containing the incident location`,
            data: { geofences: containingGeofences }
        };

    } catch (error) {
        console.error('Error finding geofences containing location with MongoDB:', error);
        return {
            success: false,
            message: 'Internal error while searching for containing geofences',
            data: { geofences: [] }
        };
    }
};

/**
 * Create incident with geofence detection
 * Automatically finds and logs geofences containing the incident location
 */
const createIncidentWithGeofenceDetection = async (req, res, next) => {
    try {
        // Get user ID from session
        const userId = req.session.userId;
        if (!userId) {
            const error = createErrorResponse(401, "User not authenticated");
            return res.status(error.statusCode).json(error.response);
        }

        // Validate input using Joi schema
        const validation = validateRequest(incidentCreationSchema, req.body);
        if (!validation.isValid) {
            const error = createErrorResponse(400, validation.error);
            return res.status(error.statusCode).json(error.response);
        }

        const { description, location, tripId, address, severity } = validation.value;

        // Create incident data
        const incidentData = {
            user: userId,
            description,
            location: {
                type: 'Point',
                coordinates: location.coordinates
            },
            status: 'reported'
        };

        // Add optional fields if provided
        if (tripId) incidentData.tripId = tripId;
        if (severity) incidentData.severity = severity;

        // If address is not provided, try to get it from coordinates using reverse geocoding
        if (!address) {
            try {
                console.log('Attempting to get address from coordinates:', location.coordinates);
                const [lng, lat] = location.coordinates;
                const geocodingResult = await getAddressFromCoordinates(lat, lng);

                if (geocodingResult.data.address) {
                    incidentData.address = geocodingResult.data.address;
                    console.log('Address generated from coordinates:', incidentData.address);
                } else {
                    console.log('Could not generate address from coordinates, using fallback');
                    incidentData.address = `Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
                }
            } catch (geocodingError) {
                console.error('Geocoding error:', geocodingError);
                incidentData.address = `Location: ${location.coordinates[1].toFixed(4)}, ${location.coordinates[0].toFixed(4)}`;
            }
        } else {
            incidentData.address = address;
        }

        // Find geofences containing this incident location
        console.log('Checking for geofences containing incident location...');
        const geofenceResult = await findGeofencesContainingLocation(incidentData.location);
        
        let alertResult = { success: true, data: { alerts: [] } };
        
        if (geofenceResult.success && geofenceResult.data.geofences.length > 0) {
            console.log(`Incident location is within ${geofenceResult.data.geofences.length} geofence(s)`);
            
            // Log geofence details
            geofenceResult.data.geofences.forEach(geofence => {
                console.log(`- Geofence ${geofence.id}: ${geofence.alertType} alert (${geofence.radius}m radius)`);
            });
            
            // Create the incident first
            const incident = new Incident(incidentData);
            await incident.save();

            // Create alerts for users based on geofences
            console.log('Creating alerts for users in affected geofences...');
            
            // Configure alert options
            const alertOptions = {
                alertAllUsers: true, // Alert all users
                excludeIncidentReporter: true, // Don't alert the incident reporter
                incidentReporterId: userId,
                userRoles: ['tourist', 'admin'], // Alert tourists and admins
                includeLocation: true,
                includeSeverity: true,
                includeGeofenceDetails: true
            };

            // Create alerts based on incident severity
            if (incidentData.severity === 'high') {
                // Create emergency alerts for high-severity incidents
                alertResult = await createEmergencyAlerts(incident, geofenceResult.data.geofences, alertOptions);
            } else {
                // Create regular alerts for medium/low severity incidents
                // Only alert for 'danger' type geofences for non-emergency incidents
                alertResult = await createAlertsForSpecificGeofenceTypes(
                    incident, 
                    geofenceResult.data.geofences, 
                    ['danger'], // Only alert for danger zones
                    alertOptions
                );
            }

            if (alertResult.success) {
                console.log(`Successfully created ${alertResult.data.alerts.length} alerts`);
            } else {
                console.warn('Alert creation failed:', alertResult.message);
            }

            // Populate user data for response
            await incident.populate('user', 'name email username');

            const success = createSuccessResponse(201, "Incident created successfully with alerts", {
                incident: formatIncidentResponse(incident),
                geofences: geofenceResult.data.geofences,
                alerts: alertResult.data.alerts || []
            });
            res.status(success.statusCode).json(success.response);

        } else {
            console.log('Incident location is not within any geofences');
            
            // Create incident without alerts
            const incident = new Incident(incidentData);
            await incident.save();

            // Populate user data for response
            await incident.populate('user', 'name email username');

            const success = createSuccessResponse(201, "Incident created successfully", {
                incident: formatIncidentResponse(incident),
                geofences: [],
                alerts: []
            });
            res.status(success.statusCode).json(success.response);
        }

    } catch (error) {
        console.error('Create incident with geofence detection error:', error);
        next(error);
    }
};

/**
 * Create alerts for an existing incident
 * Useful for retroactively creating alerts when geofences are added
 */
const createAlertsForExistingIncident = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Validate ObjectId format
        if (!isValidObjectId(id)) {
            const error = createErrorResponse(400, "Invalid incident ID format");
            return res.status(error.statusCode).json(error.response);
        }

        // Get user ID from session
        const userId = req.session.userId;
        if (!userId) {
            const error = createErrorResponse(401, "User not authenticated");
            return res.status(error.statusCode).json(error.response);
        }

        // Find incident
        const incident = await Incident.findById(id);
        if (!incident) {
            const error = createErrorResponse(404, "Incident not found");
            return res.status(error.statusCode).json(error.response);
        }

        // Check if user can access incident
        const user = await User.findById(userId);
        if (!canUserAccessIncident(incident, userId, user.role)) {
            const error = createErrorResponse(403, "Access denied. You can only create alerts for your own incidents.");
            return res.status(error.statusCode).json(error.response);
        }

        // Find geofences containing this incident location
        console.log(`Creating alerts for existing incident ${id}...`);
        const geofenceResult = await findGeofencesContainingLocation(incident.location);
        
        if (!geofenceResult.success || geofenceResult.data.geofences.length === 0) {
            const success = createSuccessResponse(200, "No geofences found containing incident location", {
                incident: formatIncidentResponse(incident),
                geofences: [],
                alerts: []
            });
            return res.status(success.statusCode).json(success.response);
        }

        // Configure alert options
        const alertOptions = {
            alertAllUsers: true,
            excludeIncidentReporter: true,
            incidentReporterId: incident.user.toString(),
            userRoles: ['tourist', 'admin'],
            includeLocation: true,
            includeSeverity: true,
            includeGeofenceDetails: true
        };

        // Create alerts based on incident severity
        let alertResult;
        if (incident.severity === 'high') {
            alertResult = await createEmergencyAlerts(incident, geofenceResult.data.geofences, alertOptions);
        } else {
            alertResult = await createAlertsForSpecificGeofenceTypes(
                incident, 
                geofenceResult.data.geofences, 
                ['danger'],
                alertOptions
            );
        }

        if (alertResult.success) {
            console.log(`Successfully created ${alertResult.data.alerts.length} alerts for incident ${id}`);
        } else {
            console.warn('Alert creation failed:', alertResult.message);
        }

        const success = createSuccessResponse(200, "Alerts created successfully for incident", {
            incident: formatIncidentResponse(incident),
            geofences: geofenceResult.data.geofences,
            alerts: alertResult.data.alerts || []
        });
        res.status(success.statusCode).json(success.response);

    } catch (error) {
        console.error('Create alerts for existing incident error:', error);
        next(error);
    }
};

module.exports = {
    createIncident,
    getIncidents,
    getIncidentById,
    updateIncident,
    deleteIncident,
    getUserIncidents,
    findGeofencesContainingLocation,
    findGeofencesContainingLocationMongoDB,
    createIncidentWithGeofenceDetection,
    createAlertsForExistingIncident
};
