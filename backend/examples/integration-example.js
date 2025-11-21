/**
 * Integration Example: Anomaly Detection with Incident Creation
 * 
 * This file shows how to integrate the anomaly detection system
 * with the existing incident creation workflow.
 */

const { detectAnomalies } = require('../utils/anomalyDetector');
const { createIncidentWithAnomalyDetection } = require('../controllers/incidents-with-anomaly-detection');

/**
 * Example 1: Basic Integration with Existing Incident Controller
 */
const integrateWithExistingController = async () => {
    console.log('=== Example 1: Basic Integration ===\n');

    // Modify existing incident creation to include anomaly detection
    const enhancedCreateIncident = async (req, res, next) => {
        try {
            // ... existing incident creation logic ...
            
            // After incident is created, add anomaly detection
            const user = await User.findById(req.session.userId);
            const incident = await Incident.findById(createdIncident._id);
            
            // Run anomaly detection
            const anomalyResult = await detectAnomalies(user, incident);
            
            // Update incident with anomaly information
            if (anomalyResult.isAnomaly) {
                incident.anomalyDetected = true;
                incident.anomalyReasons = anomalyResult.reasons;
                incident.suggestedSeverity = anomalyResult.suggestedSeverity;
                await incident.save();
            }
            
            // Return response with anomaly information
            res.status(201).json({
                success: true,
                message: "Incident created successfully",
                data: {
                    incident: incident,
                    anomalyDetection: anomalyResult
                }
            });
            
        } catch (error) {
            next(error);
        }
    };

    console.log('Integration example completed - see code above for implementation');
};

/**
 * Example 2: Route Integration
 */
const routeIntegrationExample = () => {
    console.log('\n=== Example 2: Route Integration ===\n');

    const express = require('express');
    const router = express.Router();
    const { 
        createIncidentWithAnomalyDetection,
        getIncidents,
        getIncidentById
    } = require('../controllers/incidents-with-anomaly-detection');
    const { 
        incidentCreationSchema
    } = require('../schemas');
    const { 
        isLoggedIn,
        validateRequestMiddleware, 
        asyncHandler 
    } = require('../middleware');

    // POST /incidents - Create incident with anomaly detection
    router.post('/', 
        isLoggedIn,
        validateRequestMiddleware(incidentCreationSchema),
        asyncHandler(createIncidentWithAnomalyDetection)
    );

    // GET /incidents - Get all incidents
    router.get('/', asyncHandler(getIncidents));

    // GET /incidents/:id - Get single incident
    router.get('/:id', asyncHandler(getIncidentById));

    console.log('Route integration completed - see code above for implementation');
};

/**
 * Example 3: Middleware Integration
 */
const middlewareIntegrationExample = () => {
    console.log('\n=== Example 3: Middleware Integration ===\n');

    // Create anomaly detection middleware
    const anomalyDetectionMiddleware = async (req, res, next) => {
        try {
            // This middleware can be used to run anomaly detection
            // on any incident-related request
            
            if (req.method === 'POST' && req.path === '/incidents') {
                // Store original response.json
                const originalJson = res.json;
                
                // Override response.json to add anomaly detection
                res.json = function(data) {
                    if (data.success && data.data && data.data.incident) {
                        // Run anomaly detection on created incident
                        detectAnomalies(req.user, data.data.incident)
                            .then(anomalyResult => {
                                data.data.anomalyDetection = anomalyResult;
                                originalJson.call(this, data);
                            })
                            .catch(error => {
                                console.error('Anomaly detection middleware error:', error);
                                originalJson.call(this, data);
                            });
                    } else {
                        originalJson.call(this, data);
                    }
                };
            }
            
            next();
        } catch (error) {
            console.error('Anomaly detection middleware error:', error);
            next();
        }
    };

    console.log('Middleware integration completed - see code above for implementation');
};

/**
 * Example 4: Real-time Anomaly Detection
 */
const realTimeDetectionExample = async () => {
    console.log('\n=== Example 4: Real-time Anomaly Detection ===\n');

    // Simulate real-time anomaly detection for existing incidents
    const runRealTimeAnomalyDetection = async () => {
        try {
            const Incident = require('../models/incident');
            const User = require('../models/user');
            
            // Get recent incidents that haven't been checked for anomalies
            const recentIncidents = await Incident.find({
                createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
                anomalyDetected: { $ne: true } // Not yet checked
            }).populate('user');
            
            console.log(`Running real-time anomaly detection on ${recentIncidents.length} incidents`);
            
            for (const incident of recentIncidents) {
                try {
                    const anomalyResult = await detectAnomalies(incident.user, incident);
                    
                    if (anomalyResult.isAnomaly) {
                        console.log(`🚨 Anomaly detected in incident ${incident._id}:`, anomalyResult.reasons);
                        
                        // Update incident
                        incident.anomalyDetected = true;
                        incident.anomalyReasons = anomalyResult.reasons;
                        incident.suggestedSeverity = anomalyResult.suggestedSeverity;
                        await incident.save();
                        
                        // Could trigger additional alerts here
                        // await sendAnomalyAlert(incident.user, incident, anomalyResult);
                    }
                } catch (error) {
                    console.error(`Error detecting anomalies for incident ${incident._id}:`, error);
                }
            }
            
            console.log('Real-time anomaly detection completed');
            
        } catch (error) {
            console.error('Real-time anomaly detection error:', error);
        }
    };

    // Run real-time detection
    await runRealTimeAnomalyDetection();
};

/**
 * Example 5: Batch Anomaly Detection
 */
const batchDetectionExample = async () => {
    console.log('\n=== Example 5: Batch Anomaly Detection ===\n');

    const runBatchAnomalyDetection = async (userIds) => {
        try {
            const Incident = require('../models/incident');
            const User = require('../models/user');
            
            console.log(`Running batch anomaly detection for ${userIds.length} users`);
            
            const results = [];
            
            for (const userId of userIds) {
                try {
                    const user = await User.findById(userId);
                    if (!user) continue;
                    
                    // Get user's recent incidents
                    const incidents = await Incident.find({
                        user: userId,
                        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
                    }).sort({ createdAt: -1 });
                    
                    if (incidents.length === 0) continue;
                    
                    // Check each incident for anomalies
                    for (const incident of incidents) {
                        const anomalyResult = await detectAnomalies(user, incident);
                        
                        if (anomalyResult.isAnomaly) {
                            results.push({
                                userId: userId,
                                incidentId: incident._id,
                                anomalies: anomalyResult.anomalies,
                                severity: anomalyResult.suggestedSeverity
                            });
                        }
                    }
                    
                } catch (error) {
                    console.error(`Error in batch detection for user ${userId}:`, error);
                }
            }
            
            console.log(`Batch detection completed: ${results.length} anomalies found`);
            return results;
            
        } catch (error) {
            console.error('Batch anomaly detection error:', error);
            return [];
        }
    };

    // Example usage
    const userIds = ['user1', 'user2', 'user3'];
    const batchResults = await runBatchAnomalyDetection(userIds);
    console.log('Batch results:', batchResults);
};

/**
 * Example 6: Configuration Management
 */
const configurationExample = () => {
    console.log('\n=== Example 6: Configuration Management ===\n');

    const { updateThresholds, getThresholds } = require('../utils/anomalyDetector');
    
    // Get current configuration
    console.log('Current thresholds:', getThresholds());
    
    // Update configuration based on environment
    const environment = process.env.NODE_ENV || 'development';
    
    switch (environment) {
        case 'production':
            updateThresholds({
                dropoffDistanceKm: 5,
                dropoffTimeMinutes: 10,
                inactivityHours: 6,
                deviationMeters: 500
            });
            break;
            
        case 'development':
            updateThresholds({
                dropoffDistanceKm: 2,  // More sensitive for testing
                dropoffTimeMinutes: 5,
                inactivityHours: 2,
                deviationMeters: 200
            });
            break;
            
        case 'testing':
            updateThresholds({
                dropoffDistanceKm: 1,  // Very sensitive for testing
                dropoffTimeMinutes: 1,
                inactivityHours: 1,
                deviationMeters: 100
            });
            break;
    }
    
    console.log(`Updated thresholds for ${environment}:`, getThresholds());
};

/**
 * Run all integration examples
 */
const runAllIntegrationExamples = async () => {
    console.log('🚀 Starting Integration Examples\n');

    try {
        await integrateWithExistingController();
        routeIntegrationExample();
        middlewareIntegrationExample();
        await realTimeAnomalyDetectionExample();
        await batchDetectionExample();
        configurationExample();

        console.log('\n✅ All integration examples completed successfully!');
    } catch (error) {
        console.error('❌ Error running integration examples:', error);
    }
};

// Export examples
module.exports = {
    integrateWithExistingController,
    routeIntegrationExample,
    middlewareIntegrationExample,
    realTimeAnomalyDetectionExample,
    batchDetectionExample,
    configurationExample,
    runAllIntegrationExamples
};

// Run examples if this file is executed directly
if (require.main === module) {
    runAllIntegrationExamples();
}
