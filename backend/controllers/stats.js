const User = require('../models/user');
const Alert = require('../models/alert');
const Geofence = require('../models/geofence');
const Incident = require('../models/incident');

/**
 * Get dashboard statistics for admin panel
 */
const getDashboardStats = async (req, res, next) => {
    try {
        // Get all statistics in parallel for better performance
        const [
            totalUsers,
            totalAlerts,
            unreadAlerts,
            totalGeofences,
            activeGeofences,
            totalIncidents,
            recentIncidents,
            recentUsers,
            recentAlerts
        ] = await Promise.all([
            // Users stats
            User.countDocuments({ role: { $ne: 'admin' } }),

            // Alerts stats
            Alert.countDocuments(),
            Alert.countDocuments({ read: false }),

            // Geofences stats
            Geofence.countDocuments(),
            Geofence.countDocuments({ active: true }),

            // Incidents stats
            Incident.countDocuments(),
            Incident.countDocuments({
                createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
            }),

            // Recent users (last 30 days)
            User.countDocuments({
                createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
                role: { $ne: 'admin' }
            }),

            // Recent alerts (last 7 days)
            Alert.countDocuments({
                createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
            })
        ]);

        // Calculate meaningful changes
        const stats = {
            totalTourists: {
                value: totalUsers,
                change: totalUsers > 0 ? `${recentUsers} new this month` : '0%'
            },
            activeAlerts: {
                value: unreadAlerts,
                change: totalAlerts > 0 ? `${unreadAlerts} unread` : '0%'
            },
            safeZones: {
                value: activeGeofences,
                change: totalGeofences > 0 ? `${activeGeofences}/${totalGeofences} active` : '0%'
            },
            totalIncidents: {
                value: totalIncidents,
                change: totalIncidents > 0 ? `${recentIncidents} this week` : '0%'
            }
        };

        res.status(200).json({
            success: true,
            message: "Dashboard statistics retrieved successfully",
            data: { stats }
        });

    } catch (error) {
        console.error('Error getting dashboard stats:', error);
        next(error);
    }
};

module.exports = {
    getDashboardStats
};
