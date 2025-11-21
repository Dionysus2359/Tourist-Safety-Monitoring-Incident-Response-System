/**
 * Enhanced Incident Controller with Anomaly Detection Integration
 * 
 * This controller extends the basic incident creation with intelligent
 * anomaly detection capabilities.
 */

const Incident = require('../models/incident');
const User = require('../models/user');
const Geofence = require('../models/geofence');
const { incidentCreationSchema, validateRequest } = require('../schemas');
const { getAddressFromCoordinates } = require('../utils/geocoding');
const { detectAnomalies } = require('../utils/anomalyDetector');
const {
    createAlertsForGeofences,
    createEmergencyAlerts,
    createAlertsForSpecificGeofenceTypes
} = require('../utils/alertHelpers');
const {
    isValidObjectId,
    formatIncidentResponse,
    buildPaginationObject,
    buildIncidentFilter,
    validateIncidentQuery,
    canUserAccessIncident,
    getPaginationParams,
    createErrorResponse,
    createSuccessResponse
} = require('../utils/helpers');

/**
 * Enhanced createIncident function with anomaly detection
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const createIncidentWithAnomalyDetection = async (req, res, next) => {
    try {
        console.log('=== Starting Enhanced Incident Creation with Anomaly Detection ===');
        
        // Step 1: Authentication Check
        const userId = req.session.userId;
        if (!userId) {
            const error = createErrorResponse(401, "User not authenticated");
            return res.status(error.statusCode).json(error.response);
        }

        // Step 2: Input Validation
        console.log('Validating input data...');
        const validation = validateRequest(incidentCreationSchema, req.body);
        if (!validation.isValid) {
            const error = createErrorResponse(400, validation.error);
            return res.status(error.statusCode).json(error.response);
        }

        const { description, location, tripId, address, severity } = validation.value;
        console.log(`Validated input: description="${description}", severity="${severity || 'low'}"`);

        // Step 3: Get User and Trip Information
        console.log('Fetching user and trip information...');
        const [user, trip] = await Promise.all([
            User.findById(userId),
            tripId ? User.findById(userId).select('tripInfo') : null
        ]);

        if (!user) {
            const error = createErrorResponse(404, "User not found");
            return res.status(error.statusCode).json(error.response);
        }

        // Step 4: Prepare Incident Data
        console.log('Preparing incident data...');
        const incidentData = {
            user: userId,
            description,
            location: {
                type: 'Point',
                coordinates: location.coordinates
            },
            status: 'reported',
            severity: severity || 'low'
        };

        // Add optional fields
        if (tripId) incidentData.tripId = tripId;
        if (address) incidentData.address = address;

        // Step 5: Reverse Geocoding (if no address provided)
        let geocodingResult = { success: true, data: { address: null } };
        if (!address && location && location.coordinates) {
            console.log('Performing reverse geocoding...');
            const [lng, lat] = location.coordinates;
            geocodingResult = await getAddressFromCoordinates(lat, lng);
            
            if (geocodingResult.success && geocodingResult.data.address) {
                incidentData.address = geocodingResult.data.address;
                console.log(`Geocoded address: ${geocodingResult.data.address}`);
            } else {
                console.warn('Geocoding failed:', geocodingResult.message);
            }
        }

        // Step 6: Save Incident to Database
        console.log('Saving incident to database...');
        const incident = new Incident(incidentData);
        await incident.save();
        console.log(`Incident saved with ID: ${incident._id}`);

        // Step 7: Anomaly Detection
        console.log('Running anomaly detection...');
        let anomalyResult = { isAnomaly: false, reasons: [], suggestedSeverity: null };
        
        try {
            anomalyResult = await detectAnomalies(user, incident, trip);
            
            if (anomalyResult.isAnomaly) {
                console.log(`🚨 Anomaly detected: ${anomalyResult.reasons.join(', ')}`);
                
                // Update incident with anomaly information
                incident.anomalyDetected = true;
                incident.anomalyReasons = anomalyResult.reasons;
                incident.suggestedSeverity = anomalyResult.suggestedSeverity;
                incident.anomalyDetectionTimestamp = anomalyResult.detectionTimestamp;
                
                // Override severity if anomaly suggests higher severity
                if (anomalyResult.suggestedSeverity === 'danger' && incident.severity !== 'high') {
                    incident.severity = 'high';
                    console.log('⚠️ Severity upgraded to HIGH due to anomaly detection');
                } else if (anomalyResult.suggestedSeverity === 'warning' && incident.severity === 'low') {
                    incident.severity = 'medium';
                    console.log('⚠️ Severity upgraded to MEDIUM due to anomaly detection');
                }
                
                await incident.save();
            } else {
                console.log('✅ No anomalies detected');
            }
        } catch (anomalyError) {
            console.error('Anomaly detection failed:', anomalyError);
            // Continue with incident creation even if anomaly detection fails
        }

        // Step 8: Geospatial Query - Find Containing Geofences
        console.log('Finding geofences containing incident location...');
        const geofenceResult = await findGeofencesContainingLocation(incident.location);
        
        let geofences = [];
        if (geofenceResult.success) {
            geofences = geofenceResult.data.geofences;
            console.log(`Found ${geofences.length} geofences containing incident location`);
        } else {
            console.warn('Geofence detection failed:', geofenceResult.message);
        }

        // Step 9: Create Alerts for Users
        let alertResult = { success: true, data: { alerts: [] } };
        if (geofences.length > 0) {
            console.log('Creating alerts for users in affected geofences...');
            
            // Configure alert options
            const alertOptions = {
                alertAllUsers: true,
                excludeIncidentReporter: true,
                incidentReporterId: userId,
                userRoles: ['tourist', 'admin'],
                includeLocation: true,
                includeSeverity: true,
                includeGeofenceDetails: true,
                includeAnomalyInfo: anomalyResult.isAnomaly // Include anomaly information in alerts
            };

            // Create alerts based on incident severity (potentially modified by anomaly detection)
            if (incident.severity === 'high') {
                console.log('Creating emergency alerts for high-severity incident');
                alertResult = await createEmergencyAlerts(incident, geofences, alertOptions);
            } else {
                console.log('Creating regular alerts for medium/low severity incident');
                // Only alert for 'danger' type geofences for non-emergency incidents
                alertResult = await createAlertsForSpecificGeofenceTypes(
                    incident, 
                    geofences, 
                    ['danger'],
                    alertOptions
                );
            }

            if (alertResult.success) {
                console.log(`Successfully created ${alertResult.data.alerts.length} alerts`);
            } else {
                console.warn('Alert creation failed:', alertResult.message);
            }
        } else {
            console.log('No geofences found, skipping alert creation');
        }

        // Step 10: Populate User Data for Response
        console.log('Populating user data for response...');
        await incident.populate('user', 'name email username');

        // Step 11: Prepare Response Data
        const responseData = {
            incident: formatIncidentResponse(incident),
            geocoding: {
                success: geocodingResult.success,
                message: geocodingResult.message,
                address: geocodingResult.data.address
            },
            anomalyDetection: {
                isAnomaly: anomalyResult.isAnomaly,
                reasons: anomalyResult.reasons,
                suggestedSeverity: anomalyResult.suggestedSeverity,
                detectionTimestamp: anomalyResult.detectionTimestamp,
                anomalies: anomalyResult.anomalies || []
            },
            geofences: {
                found: geofences.length,
                geofences: geofences.map(g => ({
                    id: g.id,
                    alertType: g.alertType,
                    radius: g.radius,
                    active: g.active
                }))
            },
            alerts: {
                created: alertResult.data.alerts ? alertResult.data.alerts.length : 0,
                alerts: alertResult.data.alerts || []
            }
        };

        // Step 12: Send Success Response
        console.log('=== Incident Creation with Anomaly Detection Completed Successfully ===');
        const success = createSuccessResponse(201, "Incident created successfully with anomaly detection", responseData);
        res.status(success.statusCode).json(success.response);

    } catch (error) {
        console.error('=== Error in Enhanced Incident Creation with Anomaly Detection ===');
        console.error('Error details:', error);
        next(error);
    }
};

/**
 * Find all geofences that contain a given incident location
 * Uses Haversine formula for accurate distance calculation
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
 * Get all incidents with pagination and filtering
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
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
            incidents: incidents.map(incident => formatIncidentResponse(incident)),
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
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
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

module.exports = {
    createIncidentWithAnomalyDetection,
    getIncidents,
    getIncidentById,
    findGeofencesContainingLocation
};
