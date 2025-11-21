/**
 * Example usage of the Anomaly Detection System
 * This file demonstrates how to integrate anomaly detection with incident creation
 */

const { detectAnomalies, checkSuddenDropOff, checkInactivity, checkRouteDeviation } = require('../utils/anomalyDetector');

// Example 1: Basic anomaly detection
const exampleBasicDetection = async () => {
    console.log('=== Example 1: Basic Anomaly Detection ===\n');

    const user = {
        _id: 'user123',
        name: 'John Doe',
        email: 'john@example.com'
    };

    const incident = {
        _id: 'incident456',
        user: 'user123',
        description: 'Road accident on main highway',
        location: {
            type: 'Point',
            coordinates: [77.2090, 28.6139] // [lng, lat] - Delhi, India
        },
        severity: 'high',
        createdAt: new Date()
    };

    const trip = {
        tripInfo: {
            startLocation: 'Delhi Airport',
            endLocation: 'Red Fort, Delhi',
            waypoints: [
                { lat: 28.6139, lng: 77.2090 }, // Delhi
                { lat: 28.6249, lng: 77.2190 }  // Near Red Fort
            ]
        }
    };

    try {
        const result = await detectAnomalies(user, incident, trip);
        console.log('Anomaly Detection Result:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Error in basic detection:', error);
    }
};

// Example 2: Sudden drop-off detection
const exampleSuddenDropOff = () => {
    console.log('\n=== Example 2: Sudden Drop-off Detection ===\n');

    const lastLocation = {
        lat: 28.6139,
        lng: 77.2090
    };

    const newLocation = {
        lat: 28.8000,
        lng: 77.4000
    };

    const lastTimestamp = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
    const newTimestamp = new Date();

    const result = checkSuddenDropOff(lastLocation, newLocation, lastTimestamp, newTimestamp);
    console.log('Sudden Drop-off Result:', JSON.stringify(result, null, 2));
};

// Example 3: Prolonged inactivity detection
const exampleProlongedInactivity = () => {
    console.log('\n=== Example 3: Prolonged Inactivity Detection ===\n');

    const lastTimestamp = new Date(Date.now() - 8 * 60 * 60 * 1000); // 8 hours ago
    const now = new Date();

    const result = checkInactivity(lastTimestamp, now);
    console.log('Prolonged Inactivity Result:', JSON.stringify(result, null, 2));
};

// Example 4: Route deviation detection
const exampleRouteDeviation = () => {
    console.log('\n=== Example 4: Route Deviation Detection ===\n');

    const route = {
        startLocation: { lat: 28.6139, lng: 77.2090 }, // Delhi
        endLocation: { lat: 28.6249, lng: 77.2190 },   // Red Fort
        waypoints: [
            { lat: 28.6200, lng: 77.2150 } // Midway point
        ]
    };

    const currentLocation = {
        lat: 28.7000, // Far from planned route
        lng: 77.3000
    };

    const result = checkRouteDeviation(route, currentLocation);
    console.log('Route Deviation Result:', JSON.stringify(result, null, 2));
};

// Example 5: Integration with incident creation
const exampleIncidentIntegration = async () => {
    console.log('\n=== Example 5: Integration with Incident Creation ===\n');

    // Simulate incident creation process
    const createIncidentWithAnomalyDetection = async (req, res, next) => {
        try {
            // ... existing incident creation logic ...
            
            // After incident is created, run anomaly detection
            const user = await User.findById(req.session.userId);
            const incident = await Incident.findById(createdIncident._id);
            const trip = await Trip.findById(incident.tripId);

            // Run anomaly detection
            const anomalyResult = await detectAnomalies(user, incident, trip);

            // Update incident with anomaly information
            if (anomalyResult.isAnomaly) {
                incident.anomalyDetected = true;
                incident.anomalyReasons = anomalyResult.reasons;
                incident.suggestedSeverity = anomalyResult.suggestedSeverity;
                await incident.save();

                console.log('🚨 Anomaly detected in incident:', {
                    incidentId: incident._id,
                    reasons: anomalyResult.reasons,
                    suggestedSeverity: anomalyResult.suggestedSeverity
                });

                // Could trigger additional alerts or notifications here
                // await sendAnomalyAlert(user, incident, anomalyResult);
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
            console.error('Error in incident creation with anomaly detection:', error);
            next(error);
        }
    };

    console.log('Integration example completed - see code above for implementation');
};

// Example 6: Configuration and thresholds
const exampleConfiguration = () => {
    console.log('\n=== Example 6: Configuration and Thresholds ===\n');

    const { updateThresholds, getThresholds } = require('../utils/anomalyDetector');

    // Get current thresholds
    console.log('Current thresholds:', getThresholds());

    // Update thresholds for different scenarios
    const customThresholds = {
        dropoffDistanceKm: 10,    // More lenient for rural areas
        dropoffTimeMinutes: 15,   // More time allowed
        inactivityHours: 4,       // More sensitive to inactivity
        deviationMeters: 1000     // Larger deviation allowed
    };

    updateThresholds(customThresholds);
    console.log('Updated thresholds:', getThresholds());
};

// Example 7: Error handling and edge cases
const exampleErrorHandling = () => {
    console.log('\n=== Example 7: Error Handling and Edge Cases ===\n');

    // Test with invalid inputs
    const invalidResult1 = checkSuddenDropOff(null, null, null, null);
    console.log('Invalid inputs result:', JSON.stringify(invalidResult1, null, 2));

    // Test with missing route information
    const invalidRoute = { startLocation: null, endLocation: null };
    const invalidResult2 = checkRouteDeviation(invalidRoute, { lat: 28.6139, lng: 77.2090 });
    console.log('Invalid route result:', JSON.stringify(invalidResult2, null, 2));

    // Test with extreme values
    const extremeResult = checkInactivity(new Date('1900-01-01'), new Date());
    console.log('Extreme inactivity result:', JSON.stringify(extremeResult, null, 2));
};

// Example 8: Performance testing
const examplePerformanceTest = async () => {
    console.log('\n=== Example 8: Performance Testing ===\n');

    const startTime = Date.now();

    // Simulate multiple anomaly detections
    const promises = [];
    for (let i = 0; i < 100; i++) {
        const user = { _id: `user${i}` };
        const incident = {
            _id: `incident${i}`,
            location: { coordinates: [77.2090 + (i * 0.001), 28.6139 + (i * 0.001)] },
            createdAt: new Date()
        };
        
        promises.push(detectAnomalies(user, incident));
    }

    await Promise.all(promises);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`Performance test completed: ${promises.length} detections in ${duration}ms`);
    console.log(`Average time per detection: ${(duration / promises.length).toFixed(2)}ms`);
};

// Run all examples
const runAllExamples = async () => {
    console.log('🚀 Starting Anomaly Detection Examples\n');

    try {
        await exampleBasicDetection();
        exampleSuddenDropOff();
        exampleProlongedInactivity();
        exampleRouteDeviation();
        await exampleIncidentIntegration();
        exampleConfiguration();
        exampleErrorHandling();
        await examplePerformanceTest();

        console.log('\n✅ All examples completed successfully!');
    } catch (error) {
        console.error('❌ Error running examples:', error);
    }
};

// Export examples for use in documentation
module.exports = {
    exampleBasicDetection,
    exampleSuddenDropOff,
    exampleProlongedInactivity,
    exampleRouteDeviation,
    exampleIncidentIntegration,
    exampleConfiguration,
    exampleErrorHandling,
    examplePerformanceTest,
    runAllExamples
};

// Run examples if this file is executed directly
if (require.main === module) {
    runAllExamples();
}
