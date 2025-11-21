const Alert = require('../models/alert');
const User = require('../models/user');
const Incident = require('../models/incident');
const Geofence = require('../models/geofence');

/**
 * Create alerts for users when an incident falls within geofences
 * @param {Object} incident - Incident object with _id, description, location, etc.
 * @param {Array} geofences - Array of geofence objects that contain the incident
 * @param {Object} options - Optional configuration
 * @returns {Promise<Object>} - { success: boolean, message: string, data: { alerts: Array } }
 */
const createAlertsForGeofences = async (incident, geofences, options = {}) => {
    try {
        // Validate inputs
        if (!incident || !incident._id) {
            return {
                success: false,
                message: 'Invalid incident provided',
                data: { alerts: [] }
            };
        }

        if (!Array.isArray(geofences) || geofences.length === 0) {
            return {
                success: false,
                message: 'No geofences provided for alert creation',
                data: { alerts: [] }
            };
        }

        console.log(`Creating alerts for incident ${incident._id} within ${geofences.length} geofence(s)`);

        // Get all users who should receive alerts
        const targetUsers = await getTargetUsersForAlerts(geofences, options);
        
        if (targetUsers.length === 0) {
            console.log('No target users found for alert creation');
            return {
                success: true,
                message: 'No target users found for alert creation',
                data: { alerts: [] }
            };
        }

        console.log(`Found ${targetUsers.length} target users for alert creation`);

        // Create alerts for each user and geofence combination
        const createdAlerts = [];
        const errors = [];

        for (const geofence of geofences) {
            for (const user of targetUsers) {
                try {
                    const alert = await createSingleAlert(incident, geofence, user, options);
                    if (alert) {
                        createdAlerts.push(alert);
                    }
                } catch (alertError) {
                    console.error(`Error creating alert for user ${user._id} and geofence ${geofence.id}:`, alertError);
                    errors.push({
                        userId: user._id,
                        geofenceId: geofence.id,
                        error: alertError.message
                    });
                }
            }
        }

        console.log(`Successfully created ${createdAlerts.length} alerts`);

        if (errors.length > 0) {
            console.warn(`${errors.length} alert creation errors occurred:`, errors);
        }

        return {
            success: true,
            message: `Successfully created ${createdAlerts.length} alerts for incident within geofences`,
            data: { 
                alerts: createdAlerts,
                errors: errors.length > 0 ? errors : undefined
            }
        };

    } catch (error) {
        console.error('Error creating alerts for geofences:', error);
        return {
            success: false,
            message: 'Internal error while creating alerts for geofences',
            data: { alerts: [] }
        };
    }
};

/**
 * Get target users who should receive alerts
 * @param {Array} geofences - Array of geofence objects
 * @param {Object} options - Configuration options
 * @returns {Promise<Array>} - Array of user objects
 */
const getTargetUsersForAlerts = async (geofences, options = {}) => {
    try {
        const {
            alertAllUsers = false,
            excludeIncidentReporter = true,
            incidentReporterId = null,
            userRoles = ['tourist', 'admin'], // Default roles to alert
            specificUserIds = null // Specific user IDs to alert
        } = options;

        let targetUsers = [];

        if (specificUserIds && Array.isArray(specificUserIds)) {
            // Alert specific users
            console.log(`Alerting specific users: ${specificUserIds.join(', ')}`);
            targetUsers = await User.find({ 
                _id: { $in: specificUserIds },
                role: { $in: userRoles }
            });
        } else if (alertAllUsers) {
            // Alert all users with specified roles
            console.log(`Alerting all users with roles: ${userRoles.join(', ')}`);
            const query = { role: { $in: userRoles } };
            
            if (excludeIncidentReporter && incidentReporterId) {
                query._id = { $ne: incidentReporterId };
            }
            
            targetUsers = await User.find(query);
        } else {
            // Default: Alert all users except incident reporter
            console.log(`Alerting all users except incident reporter`);
            const query = { role: { $in: userRoles } };
            
            if (excludeIncidentReporter && incidentReporterId) {
                query._id = { $ne: incidentReporterId };
            }
            
            targetUsers = await User.find(query);
        }

        return targetUsers;
    } catch (error) {
        console.error('Error getting target users for alerts:', error);
        return [];
    }
};

/**
 * Create a single alert for a user and geofence
 * @param {Object} incident - Incident object
 * @param {Object} geofence - Geofence object
 * @param {Object} user - User object
 * @param {Object} options - Configuration options
 * @returns {Promise<Object|null>} - Created alert object or null
 */
const createSingleAlert = async (incident, geofence, user, options = {}) => {
    try {
        // Check if alert already exists to prevent duplicates
        const existingAlert = await Alert.findOne({
            user: user._id,
            incident: incident._id,
            geofence: geofence.id
        });

        if (existingAlert) {
            console.log(`Alert already exists for user ${user._id}, incident ${incident._id}, geofence ${geofence.id}`);
            return null;
        }

        // Generate alert message
        const message = generateAlertMessage(incident, geofence, user, options);

        // Create alert data
        const alertData = {
            user: user._id,
            incident: incident._id,
            geofence: geofence.id,
            message: message,
            read: false
        };

        // Create and save alert
        const alert = new Alert(alertData);
        await alert.save();

        // Populate references for response
        await alert.populate([
            { path: 'user', select: 'name email username' },
            { path: 'incident', select: 'description status severity' },
            { path: 'geofence', select: 'center radius alertType' }
        ]);

        console.log(`Alert created for user ${user.username} (${user._id}) regarding incident ${incident._id} in geofence ${geofence.id}`);

        return {
            id: alert._id,
            user: {
                id: alert.user._id,
                name: alert.user.name,
                email: alert.user.email,
                username: alert.user.username
            },
            incident: {
                id: alert.incident._id,
                description: alert.incident.description,
                status: alert.incident.status,
                severity: alert.incident.severity
            },
            geofence: {
                id: alert.geofence._id,
                center: alert.geofence.center,
                radius: alert.geofence.radius,
                alertType: alert.geofence.alertType
            },
            message: alert.message,
            read: alert.read,
            createdAt: alert.createdAt
        };

    } catch (error) {
        console.error('Error creating single alert:', error);
        throw error;
    }
};

/**
 * Generate alert message based on incident and geofence
 * @param {Object} incident - Incident object
 * @param {Object} geofence - Geofence object
 * @param {Object} user - User object
 * @param {Object} options - Configuration options
 * @returns {string} - Generated alert message
 */
const generateAlertMessage = (incident, geofence, user, options = {}) => {
    const {
        customMessage = null,
        includeLocation = true,
        includeSeverity = true,
        includeGeofenceDetails = true
    } = options;

    if (customMessage) {
        return customMessage;
    }

    let message = `🚨 ALERT: New incident reported in your area!\n\n`;
    
    // Incident details
    message += `📋 Incident: ${incident.description}\n`;
    
    if (includeSeverity && incident.severity) {
        const severityEmoji = {
            'low': '🟢',
            'medium': '🟡',
            'high': '🔴'
        };
        message += `⚠️ Severity: ${severityEmoji[incident.severity] || '⚪'} ${incident.severity.toUpperCase()}\n`;
    }
    
    if (includeLocation && incident.address) {
        message += `📍 Location: ${incident.address}\n`;
    }
    
    // Geofence details
    if (includeGeofenceDetails) {
        const alertTypeEmoji = {
            'warning': '⚠️',
            'danger': '🚨'
        };
        message += `\n${alertTypeEmoji[geofence.alertType] || '⚠️'} Geofence Alert: ${geofence.alertType.toUpperCase()}\n`;
        message += `📏 Radius: ${geofence.radius}m from center\n`;
    }
    
    message += `\n⏰ Time: ${new Date().toLocaleString()}\n`;
    message += `\nPlease stay safe and follow local safety guidelines.`;
    
    return message;
};

/**
 * Create alerts for specific geofence types only
 * @param {Object} incident - Incident object
 * @param {Array} geofences - Array of geofence objects
 * @param {Array} alertTypes - Array of alert types to create alerts for ['warning', 'danger']
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} - { success: boolean, message: string, data: { alerts: Array } }
 */
const createAlertsForSpecificGeofenceTypes = async (incident, geofences, alertTypes = ['danger'], options = {}) => {
    try {
        // Filter geofences by alert type
        const filteredGeofences = geofences.filter(geofence => 
            alertTypes.includes(geofence.alertType)
        );

        if (filteredGeofences.length === 0) {
            return {
                success: true,
                message: `No geofences with alert types ${alertTypes.join(', ')} found`,
                data: { alerts: [] }
            };
        }

        console.log(`Creating alerts for ${filteredGeofences.length} geofences with types: ${alertTypes.join(', ')}`);

        return await createAlertsForGeofences(incident, filteredGeofences, options);

    } catch (error) {
        console.error('Error creating alerts for specific geofence types:', error);
        return {
            success: false,
            message: 'Internal error while creating alerts for specific geofence types',
            data: { alerts: [] }
        };
    }
};

/**
 * Create emergency alerts for high-severity incidents
 * @param {Object} incident - Incident object
 * @param {Array} geofences - Array of geofence objects
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} - { success: boolean, message: string, data: { alerts: Array } }
 */
const createEmergencyAlerts = async (incident, geofences, options = {}) => {
    try {
        // Only create emergency alerts for high-severity incidents
        if (incident.severity !== 'high') {
            return {
                success: true,
                message: 'Incident severity is not high, no emergency alerts created',
                data: { alerts: [] }
            };
        }

        console.log('Creating emergency alerts for high-severity incident');

        // Override options for emergency alerts
        const emergencyOptions = {
            ...options,
            alertAllUsers: true,
            excludeIncidentReporter: false,
            customMessage: `🚨 EMERGENCY ALERT: High-severity incident reported in your area!\n\n` +
                          `📋 ${incident.description}\n` +
                          `📍 Location: ${incident.address || 'Location not specified'}\n` +
                          `⏰ Time: ${new Date().toLocaleString()}\n\n` +
                          `Please take immediate safety precautions and follow emergency protocols.`
        };

        return await createAlertsForGeofences(incident, geofences, emergencyOptions);

    } catch (error) {
        console.error('Error creating emergency alerts:', error);
        return {
            success: false,
            message: 'Internal error while creating emergency alerts',
            data: { alerts: [] }
        };
    }
};

/**
 * Get alert statistics for an incident
 * @param {string} incidentId - Incident ID
 * @returns {Promise<Object>} - { success: boolean, message: string, data: { stats: Object } }
 */
const getIncidentAlertStats = async (incidentId) => {
    try {
        const [
            totalAlerts,
            readAlerts,
            unreadAlerts,
            alertsByGeofence
        ] = await Promise.all([
            Alert.countDocuments({ incident: incidentId }),
            Alert.countDocuments({ incident: incidentId, read: true }),
            Alert.countDocuments({ incident: incidentId, read: false }),
            Alert.aggregate([
                { $match: { incident: incidentId } },
                { $group: { _id: '$geofence', count: { $sum: 1 } } }
            ])
        ]);

        return {
            success: true,
            message: 'Alert statistics retrieved successfully',
            data: {
                stats: {
                    total: totalAlerts,
                    read: readAlerts,
                    unread: unreadAlerts,
                    byGeofence: alertsByGeofence
                }
            }
        };

    } catch (error) {
        console.error('Error getting incident alert stats:', error);
        return {
            success: false,
            message: 'Internal error while retrieving alert statistics',
            data: { stats: null }
        };
    }
};

module.exports = {
    createAlertsForGeofences,
    createAlertsForSpecificGeofenceTypes,
    createEmergencyAlerts,
    getIncidentAlertStats,
    generateAlertMessage
};
