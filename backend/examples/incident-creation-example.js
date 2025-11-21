/**
 * Example usage of the Enhanced Incident Creation System
 * This file demonstrates how to use the modular createIncident function
 */

const { createIncident } = require('../controllers/incidents-enhanced');

// Example 1: Basic incident creation
const exampleBasicIncident = {
    description: "Road accident on main highway near metro station",
    location: {
        coordinates: [77.2090, 28.6139] // [longitude, latitude] - Delhi, India
    },
    severity: "high"
};

// Example 2: Incident with all optional fields
const exampleCompleteIncident = {
    description: "Lost tourist needs assistance near tourist attraction",
    location: {
        coordinates: [77.2190, 28.6239] // [longitude, latitude]
    },
    tripId: "trip_12345",
    address: "Red Fort, Delhi, India", // Optional: if provided, skips geocoding
    severity: "medium"
};

// Example 3: Low severity incident
const exampleLowSeverityIncident = {
    description: "Minor injury at tourist spot",
    location: {
        coordinates: [77.1990, 28.6039] // [longitude, latitude]
    },
    severity: "low"
};

/**
 * Simulate a request object for testing
 */
const createMockRequest = (body, session = { userId: 'user123' }) => {
    return {
        body,
        session,
        params: {},
        query: {}
    };
};

/**
 * Simulate a response object for testing
 */
const createMockResponse = () => {
    const res = {
        status: (code) => {
            res.statusCode = code;
            return res;
        },
        json: (data) => {
            res.data = data;
            console.log('Response:', JSON.stringify(data, null, 2));
            return res;
        }
    };
    return res;
};

/**
 * Simulate next function for error handling
 */
const mockNext = (error) => {
    if (error) {
        console.error('Error caught by next:', error);
    }
};

/**
 * Test the enhanced incident creation
 */
const testIncidentCreation = async () => {
    console.log('=== Testing Enhanced Incident Creation ===\n');

    try {
        // Test 1: Basic incident
        console.log('Test 1: Basic incident creation');
        const req1 = createMockRequest(exampleBasicIncident);
        const res1 = createMockResponse();
        
        await createIncident(req1, res1, mockNext);
        console.log('✅ Basic incident test completed\n');

        // Test 2: Complete incident
        console.log('Test 2: Complete incident creation');
        const req2 = createMockRequest(exampleCompleteIncident);
        const res2 = createMockResponse();
        
        await createIncident(req2, res2, mockNext);
        console.log('✅ Complete incident test completed\n');

        // Test 3: Low severity incident
        console.log('Test 3: Low severity incident creation');
        const req3 = createMockRequest(exampleLowSeverityIncident);
        const res3 = createMockResponse();
        
        await createIncident(req3, res3, mockNext);
        console.log('✅ Low severity incident test completed\n');

    } catch (error) {
        console.error('Test failed:', error);
    }
};

/**
 * Example API request payloads for frontend integration
 */
const apiExamples = {
    // POST /incidents
    createIncident: {
        method: 'POST',
        url: '/incidents',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': 'connect.sid=session_id_here' // Session cookie
        },
        body: {
            description: "Emergency situation at tourist location",
            location: {
                coordinates: [77.2090, 28.6139] // [lng, lat]
            },
            severity: "high"
        }
    },

    // Expected response format
    expectedResponse: {
        success: true,
        message: "Incident created successfully with all features",
        data: {
            incident: {
                id: "incident_id",
                description: "Emergency situation at tourist location",
                location: {
                    type: "Point",
                    coordinates: [77.2090, 28.6139]
                },
                address: "Geocoded address from coordinates",
                severity: "high",
                status: "reported",
                user: {
                    id: "user_id",
                    name: "User Name",
                    email: "user@example.com",
                    username: "username"
                },
                createdAt: "2024-01-15T09:00:00.000Z",
                updatedAt: "2024-01-15T09:00:00.000Z"
            },
            geocoding: {
                success: true,
                message: "Address retrieved successfully using MapTiler",
                address: "Main Highway, Delhi, India"
            },
            geofences: {
                found: 2,
                geofences: [
                    {
                        id: "geofence_id_1",
                        alertType: "danger",
                        radius: 500,
                        active: true
                    },
                    {
                        id: "geofence_id_2",
                        alertType: "warning",
                        radius: 300,
                        active: true
                    }
                ]
            },
            alerts: {
                created: 5,
                alerts: [
                    {
                        id: "alert_id",
                        user: {
                            id: "user_id",
                            name: "User Name",
                            email: "user@example.com",
                            username: "username"
                        },
                        incident: {
                            id: "incident_id",
                            description: "Emergency situation at tourist location",
                            status: "reported",
                            severity: "high"
                        },
                        geofence: {
                            id: "geofence_id",
                            center: { type: "Point", coordinates: [lng, lat] },
                            radius: 500,
                            alertType: "danger"
                        },
                        message: "🚨 ALERT: New incident reported in your area!...",
                        read: false,
                        createdAt: "2024-01-15T09:00:00.000Z"
                    }
                ]
            }
        }
    }
};

/**
 * Configuration options for different scenarios
 */
const configurationExamples = {
    // High-severity incident (emergency alerts)
    emergencyConfig: {
        severity: "high",
        alertAllUsers: true,
        excludeIncidentReporter: false, // Include reporter in emergency alerts
        userRoles: ['tourist', 'admin']
    },

    // Medium-severity incident (selective alerts)
    mediumConfig: {
        severity: "medium",
        alertAllUsers: true,
        excludeIncidentReporter: true,
        userRoles: ['tourist', 'admin'],
        geofenceTypes: ['danger'] // Only alert for danger zones
    },

    // Low-severity incident (minimal alerts)
    lowConfig: {
        severity: "low",
        alertAllUsers: false,
        specificUserIds: ['admin1', 'admin2'], // Only alert specific users
        geofenceTypes: ['danger']
    }
};

/**
 * Error handling examples
 */
const errorExamples = {
    // Missing required fields
    missingFields: {
        description: "Incomplete incident data"
        // Missing location - will cause validation error
    },

    // Invalid coordinates
    invalidCoordinates: {
        description: "Test incident",
        location: {
            coordinates: [999, 999] // Invalid coordinates
        }
    },

    // Invalid severity
    invalidSeverity: {
        description: "Test incident",
        location: {
            coordinates: [77.2090, 28.6139]
        },
        severity: "invalid" // Invalid severity level
    }
};

// Export examples for use in documentation
module.exports = {
    testIncidentCreation,
    apiExamples,
    configurationExamples,
    errorExamples,
    exampleBasicIncident,
    exampleCompleteIncident,
    exampleLowSeverityIncident
};

// Run tests if this file is executed directly
if (require.main === module) {
    testIncidentCreation();
}
