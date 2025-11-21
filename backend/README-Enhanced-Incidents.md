# Enhanced Incident Creation System

## Overview
A comprehensive, modular incident creation system that automatically handles geocoding, geofence detection, and alert creation in a single API call.

## Features

### 🚀 **Automatic Features**
- ✅ **Reverse Geocoding** - Converts coordinates to addresses using MapTiler/Nominatim
- ✅ **Geofence Detection** - Finds all geofences containing the incident location
- ✅ **Smart Alert Creation** - Creates alerts based on incident severity and geofence types
- ✅ **Input Validation** - Comprehensive validation using Joi schemas
- ✅ **Error Handling** - Graceful error handling with detailed logging

### 📊 **Response Structure**
```json
{
  "success": true,
  "message": "Incident created successfully with all features",
  "data": {
    "incident": { /* incident details */ },
    "geocoding": { /* geocoding results */ },
    "geofences": { /* containing geofences */ },
    "alerts": { /* created alerts */ }
  }
}
```

## API Endpoints

### **POST /incidents** - Create Incident with All Features
```javascript
// Request Body
{
  "description": "Road accident on main highway",
  "location": {
    "coordinates": [77.2090, 28.6139] // [longitude, latitude]
  },
  "severity": "high", // optional: low, medium, high
  "tripId": "trip_123", // optional
  "address": "Main Highway, Delhi" // optional: if provided, skips geocoding
}

// Response
{
  "success": true,
  "message": "Incident created successfully with all features",
  "data": {
    "incident": {
      "id": "incident_id",
      "description": "Road accident on main highway",
      "location": {
        "type": "Point",
        "coordinates": [77.2090, 28.6139]
      },
      "address": "Main Highway, Delhi, India",
      "severity": "high",
      "status": "reported",
      "user": {
        "id": "user_id",
        "name": "User Name",
        "email": "user@example.com",
        "username": "username"
      },
      "createdAt": "2024-01-15T09:00:00.000Z",
      "updatedAt": "2024-01-15T09:00:00.000Z"
    },
    "geocoding": {
      "success": true,
      "message": "Address retrieved successfully using MapTiler",
      "address": "Main Highway, Delhi, India"
    },
    "geofences": {
      "found": 2,
      "geofences": [
        {
          "id": "geofence_id_1",
          "alertType": "danger",
          "radius": 500,
          "active": true
        }
      ]
    },
    "alerts": {
      "created": 5,
      "alerts": [
        {
          "id": "alert_id",
          "user": { /* user details */ },
          "incident": { /* incident details */ },
          "geofence": { /* geofence details */ },
          "message": "🚨 ALERT: New incident reported in your area!...",
          "read": false,
          "createdAt": "2024-01-15T09:00:00.000Z"
        }
      ]
    }
  }
}
```

## Process Flow

### **Step 1: Authentication & Validation**
- ✅ Check user authentication
- ✅ Validate input using Joi schema
- ✅ Handle missing or invalid fields gracefully

### **Step 2: Reverse Geocoding**
- ✅ Use MapTiler API (if API key available)
- ✅ Fallback to Nominatim API
- ✅ Add geocoded address to incident data

### **Step 3: Save Incident**
- ✅ Create incident in MongoDB
- ✅ Populate user data for response

### **Step 4: Geofence Detection**
- ✅ Find all active geofences
- ✅ Check if incident location is within each geofence
- ✅ Use Haversine formula for accurate distance calculation

### **Step 5: Alert Creation**
- ✅ **High Severity**: Emergency alerts to ALL users
- ✅ **Medium/Low Severity**: Regular alerts for 'danger' geofences only
- ✅ Prevent duplicate alerts
- ✅ Generate dynamic alert messages

### **Step 6: Response**
- ✅ Return comprehensive response with all data
- ✅ Include geocoding, geofence, and alert information

## Configuration

### **Alert Configuration**
```javascript
const alertOptions = {
  alertAllUsers: true,                    // Alert all users
  excludeIncidentReporter: true,          // Don't alert the reporter
  incidentReporterId: userId,             // Reporter's ID
  userRoles: ['tourist', 'admin'],       // Target roles
  includeLocation: true,                  // Include location in message
  includeSeverity: true,                  // Include severity in message
  includeGeofenceDetails: true           // Include geofence details
};
```

### **Severity-Based Logic**
- **High Severity**: Emergency alerts to ALL users (including reporter)
- **Medium Severity**: Regular alerts for 'danger' geofences only
- **Low Severity**: Regular alerts for 'danger' geofences only

## Error Handling

### **Validation Errors**
```json
{
  "success": false,
  "message": "Location coordinates must be an array with [longitude, latitude]",
  "data": {}
}
```

### **Geocoding Errors**
```json
{
  "success": true,
  "message": "Incident created successfully",
  "data": {
    "geocoding": {
      "success": false,
      "message": "Both MapTiler and Nominatim APIs failed",
      "address": null
    }
  }
}
```

### **Geofence Detection Errors**
```json
{
  "success": true,
  "message": "Incident created successfully",
  "data": {
    "geofences": {
      "found": 0,
      "geofences": []
    }
  }
}
```

## Files Structure

```
backend/
├── controllers/
│   └── incidents-enhanced.js          # Enhanced incident controller
├── routes/
│   └── incidents-enhanced.js          # Enhanced incident routes
├── utils/
│   ├── geocoding.js                   # Reverse geocoding helpers
│   └── alertHelpers.js                # Alert creation helpers
├── examples/
│   └── incident-creation-example.js   # Usage examples
└── README-Enhanced-Incidents.md       # This documentation
```

## Usage Examples

### **Basic Incident Creation**
```javascript
const { createIncident } = require('./controllers/incidents-enhanced');

const req = {
  body: {
    description: "Road accident on main highway",
    location: { coordinates: [77.2090, 28.6139] },
    severity: "high"
  },
  session: { userId: "user123" }
};

const res = createMockResponse();
await createIncident(req, res, mockNext);
```

### **Complete Incident with All Fields**
```javascript
const req = {
  body: {
    description: "Lost tourist needs assistance",
    location: { coordinates: [77.2190, 28.6239] },
    tripId: "trip_12345",
    address: "Red Fort, Delhi, India", // Skips geocoding
    severity: "medium"
  },
  session: { userId: "user123" }
};
```

## Environment Setup

### **Required Environment Variables**
```env
MAPTILER_API_KEY=your_maptiler_api_key_here
```

### **Database Indexes**
```javascript
// Ensure geofence collection has 2dsphere index
geofenceSchema.index({ center: '2dsphere' });
```

## Testing

### **Run Examples**
```bash
cd backend
node examples/incident-creation-example.js
```

### **API Testing**
```bash
# Create incident
curl -X POST http://localhost:3000/incidents \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=your_session_id" \
  -d '{
    "description": "Test incident",
    "location": {
      "coordinates": [77.2090, 28.6139]
    },
    "severity": "high"
  }'
```

## Performance Considerations

- ✅ **Parallel Processing**: Uses Promise.all for database queries
- ✅ **Error Isolation**: Individual failures don't stop the process
- ✅ **Duplicate Prevention**: Prevents duplicate alerts
- ✅ **Efficient Queries**: Optimized database queries with proper indexing

## Future Enhancements

- 🔄 **Real-time Notifications**: WebSocket integration for live alerts
- 🔄 **Push Notifications**: Mobile push notification support
- 🔄 **Email Alerts**: Email notification system
- 🔄 **SMS Alerts**: SMS notification for critical incidents
- 🔄 **Custom Alert Rules**: User-configurable alert preferences
- 🔄 **Incident Analytics**: Advanced reporting and analytics

## Support

For questions or issues with the enhanced incident creation system, please refer to the example files or contact the development team.
