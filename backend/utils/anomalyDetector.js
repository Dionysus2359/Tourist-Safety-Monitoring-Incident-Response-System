/**
 * Anomaly Detection Utility for Tourist Safety & Incident Response System
 * 
 * This module implements rule-based anomaly detection that can be easily
 * upgraded to ML/AI-based detection in the future.
 * 
 * Features:
 * - Sudden Location Drop-off Detection
 * - Prolonged Inactivity Detection  
 * - Route Deviation Detection
 * - Configurable thresholds
 * - Extensible architecture for future ML integration
 */

const User = require('../models/user');
const Incident = require('../models/incident');

/**
 * Configurable thresholds for anomaly detection
 * These can be easily adjusted based on requirements or moved to environment variables
 */
const THRESHOLDS = {
    dropoffDistanceKm: 5,        // Distance threshold for sudden drop-off (km)
    dropoffTimeMinutes: 10,      // Time threshold for sudden drop-off (minutes)
    inactivityHours: 6,          // Hours of inactivity before flagging
    deviationMeters: 500,        // Meters deviation from planned route
    maxRouteCorridorWidth: 1000  // Maximum width of route corridor (meters)
};

/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - First point latitude
 * @param {number} lng1 - First point longitude
 * @param {number} lat2 - Second point latitude
 * @param {number} lng2 - Second point longitude
 * @returns {number} - Distance in kilometers
 */
const calculateHaversineDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in kilometers
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
 * Calculate time difference in minutes between two timestamps
 * @param {Date|string} timestamp1 - First timestamp
 * @param {Date|string} timestamp2 - Second timestamp
 * @returns {number} - Time difference in minutes
 */
const getTimeDifferenceMinutes = (timestamp1, timestamp2) => {
    const date1 = new Date(timestamp1);
    const date2 = new Date(timestamp2);
    return Math.abs(date2 - date1) / (1000 * 60); // Convert to minutes
};

/**
 * Check for sudden location drop-off anomaly
 * 
 * A sudden drop-off occurs when a user moves a significant distance
 * in a very short time period, which could indicate:
 * - Transportation (car, bus, train)
 * - Potential emergency situation
 * - Data error or GPS spoofing
 * 
 * @param {Object} lastLocation - Last known location { lat, lng }
 * @param {Object} newLocation - New incident location { lat, lng }
 * @param {Date|string} lastTimestamp - Timestamp of last location
 * @param {Date|string} newTimestamp - Timestamp of new location
 * @returns {Object} - { isAnomaly: boolean, reason: string, severity: string }
 */
const checkSuddenDropOff = (lastLocation, newLocation, lastTimestamp, newTimestamp) => {
    try {
        // Validate inputs
        if (!lastLocation || !newLocation || !lastTimestamp || !newTimestamp) {
            return {
                isAnomaly: false,
                reason: null,
                severity: null
            };
        }

        // Calculate distance and time difference
        const distance = calculateHaversineDistance(
            lastLocation.lat, lastLocation.lng,
            newLocation.lat, newLocation.lng
        );
        
        const timeDiffMinutes = getTimeDifferenceMinutes(lastTimestamp, newTimestamp);

        // Check if distance and time thresholds are exceeded
        if (distance > THRESHOLDS.dropoffDistanceKm && timeDiffMinutes < THRESHOLDS.dropoffTimeMinutes) {
            const speed = distance / (timeDiffMinutes / 60); // km/h
            
            // Determine severity based on speed
            let severity = 'warning';
            if (speed > 200) { // Very high speed (>200 km/h)
                severity = 'danger';
            } else if (speed > 100) { // High speed (>100 km/h)
                severity = 'warning';
            }

            return {
                isAnomaly: true,
                reason: `Sudden drop-off detected: ${distance.toFixed(2)}km in ${timeDiffMinutes.toFixed(1)} minutes (${speed.toFixed(1)} km/h)`,
                severity: severity
            };
        }

        return {
            isAnomaly: false,
            reason: null,
            severity: null
        };

    } catch (error) {
        console.error('Error in checkSuddenDropOff:', error);
        return {
            isAnomaly: false,
            reason: null,
            severity: null
        };
    }
};

/**
 * Check for prolonged inactivity anomaly
 * 
 * Prolonged inactivity could indicate:
 * - User is lost or in distress
 * - Device battery died
 * - User forgot to report incidents
 * - Potential emergency situation
 * 
 * @param {Date|string} lastTimestamp - Last activity timestamp
 * @param {Date|string} now - Current timestamp
 * @returns {Object} - { isAnomaly: boolean, reason: string, severity: string }
 */
const checkInactivity = (lastTimestamp, now) => {
    try {
        // Validate inputs
        if (!lastTimestamp || !now) {
            return {
                isAnomaly: false,
                reason: null,
                severity: null
            };
        }

        const lastActivity = new Date(lastTimestamp);
        const currentTime = new Date(now);
        const hoursInactive = (currentTime - lastActivity) / (1000 * 60 * 60);

        if (hoursInactive > THRESHOLDS.inactivityHours) {
            // Determine severity based on duration of inactivity
            let severity = 'warning';
            if (hoursInactive > 24) { // More than 24 hours
                severity = 'danger';
            } else if (hoursInactive > 12) { // More than 12 hours
                severity = 'warning';
            }

            return {
                isAnomaly: true,
                reason: `Prolonged inactivity detected: ${hoursInactive.toFixed(1)} hours since last activity`,
                severity: severity
            };
        }

        return {
            isAnomaly: false,
            reason: null,
            severity: null
        };

    } catch (error) {
        console.error('Error in checkInactivity:', error);
        return {
            isAnomaly: false,
            reason: null,
            severity: null
        };
    }
};

/**
 * Check for route deviation anomaly
 * 
 * Route deviation occurs when a user's incident location is significantly
 * outside their planned route corridor. This could indicate:
 * - User got lost
 * - Emergency detour
 * - Unplanned side trip
 * - Potential distress situation
 * 
 * @param {Object} route - Trip route information
 * @param {Object} currentLocation - Current incident location { lat, lng }
 * @returns {Object} - { isAnomaly: boolean, reason: string, severity: string }
 */
const checkRouteDeviation = (route, currentLocation) => {
    try {
        // Validate inputs
        if (!route || !currentLocation) {
            return {
                isAnomaly: false,
                reason: null,
                severity: null
            };
        }

        const { startLocation, endLocation, waypoints = [] } = route;

        // If no route information available, cannot check deviation
        if (!startLocation || !endLocation) {
            return {
                isAnomaly: false,
                reason: null,
                severity: null
            };
        }

        // Create route corridor by checking distance to route segments
        const routePoints = [startLocation, ...waypoints, endLocation];
        let minDistanceToRoute = Infinity;

        // Check distance to each route segment
        for (let i = 0; i < routePoints.length - 1; i++) {
            const segmentStart = routePoints[i];
            const segmentEnd = routePoints[i + 1];
            
            // Calculate distance from current location to route segment
            const distanceToSegment = calculateDistanceToLineSegment(
                currentLocation,
                segmentStart,
                segmentEnd
            );
            
            minDistanceToRoute = Math.min(minDistanceToRoute, distanceToSegment);
        }

        // Check if deviation exceeds threshold
        if (minDistanceToRoute > THRESHOLDS.deviationMeters / 1000) { // Convert meters to km
            // Determine severity based on deviation distance
            let severity = 'warning';
            const deviationKm = minDistanceToRoute;
            
            if (deviationKm > 5) { // More than 5km deviation
                severity = 'danger';
            } else if (deviationKm > 2) { // More than 2km deviation
                severity = 'warning';
            }

            return {
                isAnomaly: true,
                reason: `Route deviation detected: ${(deviationKm * 1000).toFixed(0)}m from planned route`,
                severity: severity
            };
        }

        return {
            isAnomaly: false,
            reason: null,
            severity: null
        };

    } catch (error) {
        console.error('Error in checkRouteDeviation:', error);
        return {
            isAnomaly: false,
            reason: null,
            severity: null
        };
    }
};

/**
 * Calculate distance from a point to a line segment
 * @param {Object} point - Point { lat, lng }
 * @param {Object} lineStart - Line segment start { lat, lng }
 * @param {Object} lineEnd - Line segment end { lat, lng }
 * @returns {number} - Distance in kilometers
 */
const calculateDistanceToLineSegment = (point, lineStart, lineEnd) => {
    // Convert to Cartesian coordinates for easier calculation
    const A = point.lat - lineStart.lat;
    const B = point.lng - lineStart.lng;
    const C = lineEnd.lat - lineStart.lat;
    const D = lineEnd.lng - lineStart.lng;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) {
        // Line segment is actually a point
        return calculateHaversineDistance(point.lat, point.lng, lineStart.lat, lineStart.lng);
    }

    let param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
        xx = lineStart.lat;
        yy = lineStart.lng;
    } else if (param > 1) {
        xx = lineEnd.lat;
        yy = lineEnd.lng;
    } else {
        xx = lineStart.lat + param * C;
        yy = lineStart.lng + param * D;
    }

    return calculateHaversineDistance(point.lat, point.lng, xx, yy);
};

/**
 * Get user's last known location from their recent incidents
 * @param {string} userId - User ID
 * @param {string} excludeIncidentId - Incident ID to exclude from search
 * @returns {Promise<Object|null>} - Last location { lat, lng, timestamp } or null
 */
const getUserLastLocation = async (userId, excludeIncidentId = null) => {
    try {
        const query = { user: userId };
        if (excludeIncidentId) {
            query._id = { $ne: excludeIncidentId };
        }

        const lastIncident = await Incident.findOne(query)
            .sort({ createdAt: -1 })
            .select('location createdAt');

        if (!lastIncident || !lastIncident.location) {
            return null;
        }

        return {
            lat: lastIncident.location.coordinates[1], // MongoDB stores [lng, lat]
            lng: lastIncident.location.coordinates[0],
            timestamp: lastIncident.createdAt
        };

    } catch (error) {
        console.error('Error getting user last location:', error);
        return null;
    }
};

/**
 * Get user's last activity timestamp
 * @param {string} userId - User ID
 * @param {string} excludeIncidentId - Incident ID to exclude from search
 * @returns {Promise<Date|null>} - Last activity timestamp or null
 */
const getUserLastActivity = async (userId, excludeIncidentId = null) => {
    try {
        const query = { user: userId };
        if (excludeIncidentId) {
            query._id = { $ne: excludeIncidentId };
        }

        const lastIncident = await Incident.findOne(query)
            .sort({ createdAt: -1 })
            .select('createdAt');

        return lastIncident ? lastIncident.createdAt : null;

    } catch (error) {
        console.error('Error getting user last activity:', error);
        return null;
    }
};

/**
 * Main anomaly detection function that runs all checks
 * 
 * This is the primary function to be called from incident controllers.
 * It orchestrates all anomaly detection checks and returns a comprehensive result.
 * 
 * @param {Object} user - User object
 * @param {Object} incident - Incident object
 * @param {Object} trip - Trip information (optional)
 * @returns {Promise<Object>} - Anomaly detection result
 */
const detectAnomalies = async (user, incident, trip = null) => {
    try {
        console.log(`Starting anomaly detection for user ${user._id}, incident ${incident._id}`);

        const anomalies = [];
        const reasons = [];
        let suggestedSeverity = null;

        // Get user's last known location and activity
        const lastLocation = await getUserLastLocation(user._id, incident._id);
        const lastActivity = await getUserLastActivity(user._id, incident._id);

        // Current incident location
        const currentLocation = {
            lat: incident.location.coordinates[1], // MongoDB stores [lng, lat]
            lng: incident.location.coordinates[0]
        };

        // Check 1: Sudden Location Drop-off
        if (lastLocation) {
            const dropOffResult = checkSuddenDropOff(
                lastLocation,
                currentLocation,
                lastLocation.timestamp,
                incident.createdAt
            );

            if (dropOffResult.isAnomaly) {
                anomalies.push({
                    type: 'sudden_dropoff',
                    reason: dropOffResult.reason,
                    severity: dropOffResult.severity
                });
                reasons.push(dropOffResult.reason);
                
                // Update suggested severity if this is more severe
                if (!suggestedSeverity || dropOffResult.severity === 'danger') {
                    suggestedSeverity = dropOffResult.severity;
                }
            }
        }

        // Check 2: Prolonged Inactivity
        if (lastActivity) {
            const inactivityResult = checkInactivity(lastActivity, incident.createdAt);

            if (inactivityResult.isAnomaly) {
                anomalies.push({
                    type: 'prolonged_inactivity',
                    reason: inactivityResult.reason,
                    severity: inactivityResult.severity
                });
                reasons.push(inactivityResult.reason);
                
                // Update suggested severity if this is more severe
                if (!suggestedSeverity || inactivityResult.severity === 'danger') {
                    suggestedSeverity = inactivityResult.severity;
                }
            }
        }

        // Check 3: Route Deviation
        if (trip && trip.tripInfo) {
            const routeDeviationResult = checkRouteDeviation(trip.tripInfo, currentLocation);

            if (routeDeviationResult.isAnomaly) {
                anomalies.push({
                    type: 'route_deviation',
                    reason: routeDeviationResult.reason,
                    severity: routeDeviationResult.severity
                });
                reasons.push(routeDeviationResult.reason);
                
                // Update suggested severity if this is more severe
                if (!suggestedSeverity || routeDeviationResult.severity === 'danger') {
                    suggestedSeverity = routeDeviationResult.severity;
                }
            }
        }

        const result = {
            isAnomaly: anomalies.length > 0,
            reasons: reasons,
            suggestedSeverity: suggestedSeverity,
            anomalies: anomalies,
            detectionTimestamp: new Date(),
            thresholds: THRESHOLDS
        };

        console.log(`Anomaly detection completed for user ${user._id}:`, {
            isAnomaly: result.isAnomaly,
            anomalyCount: anomalies.length,
            suggestedSeverity: suggestedSeverity
        });

        return result;

    } catch (error) {
        console.error('Error in detectAnomalies:', error);
        return {
            isAnomaly: false,
            reasons: [],
            suggestedSeverity: null,
            anomalies: [],
            detectionTimestamp: new Date(),
            error: 'Anomaly detection failed due to internal error'
        };
    }
};

/**
 * Update anomaly detection thresholds
 * @param {Object} newThresholds - New threshold values
 * @returns {Object} - Updated thresholds
 */
const updateThresholds = (newThresholds) => {
    Object.assign(THRESHOLDS, newThresholds);
    console.log('Anomaly detection thresholds updated:', THRESHOLDS);
    return THRESHOLDS;
};

/**
 * Get current anomaly detection thresholds
 * @returns {Object} - Current thresholds
 */
const getThresholds = () => {
    return { ...THRESHOLDS };
};

module.exports = {
    // Main detection function
    detectAnomalies,
    
    // Individual check functions
    checkSuddenDropOff,
    checkInactivity,
    checkRouteDeviation,
    
    // Utility functions
    calculateHaversineDistance,
    getUserLastLocation,
    getUserLastActivity,
    
    // Configuration functions
    updateThresholds,
    getThresholds,
    
    // Constants
    THRESHOLDS
};
