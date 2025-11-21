# Tourist Safety Backend API

This is the backend API for the Tourist Safety and Monitoring System, built with Node.js, Express.js, and MongoDB.

## 🚀 Quick Start

### Installation
```bash
cd backend
npm install
```

### Environment Setup
Create a `.env` file in the backend root with the following variables:
```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/touristsafety
SESSION_SECRET=your-super-secure-session-secret-here
```

### Running the Server
```bash
# Development mode
npm run dev

# Production mode
npm run production
```

## 📋 API Endpoints

### Authentication

#### POST /users/register
Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "password": "securepassword",
  "kycDocNumber": "ABC123456789"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "user_id",
    "name": "John Doe",
    "username": "johndoe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "kycVerified": false,
    "role": "tourist",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### POST /users/login
Authenticate user login.

**Request Body:**
```json
{
  "username": "johndoe",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "id": "user_id",
    "name": "John Doe",
    "username": "johndoe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "digitalId": {...},
    "kycVerified": false,
    "role": "tourist",
    "emergencyContacts": [...],
    "tripInfo": {...},
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### POST /users/logout
Logout the current user.

**Response:**
```json
{
  "success": true,
  "message": "Logout successful",
  "data": {}
}
```

#### GET /users/profile
Get current user's profile information.

**Response:**
```json
{
  "success": true,
  "message": "User profile retrieved successfully",
  "data": {
    "id": "user_id",
    "name": "John Doe",
    "username": "johndoe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "digitalId": {...},
    "kycVerified": false,
    "kycType": "aadhaar",
    "role": "tourist",
    "emergencyContacts": [...],
    "tripInfo": {...},
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### PUT /users/profile
Update user profile information.

**Request Body:**
```json
{
  "name": "John Smith",
  "phone": "+1987654321",
  "emergencyContacts": [
    {
      "name": "Jane Doe",
      "phone": "+1234567890",
      "relation": "Sister"
    }
  ],
  "tripInfo": {
    "startLocation": "New York",
    "endLocation": "Los Angeles",
    "startDate": "2024-06-01T00:00:00.000Z",
    "endDate": "2024-06-10T00:00:00.000Z"
  }
}
```

### Incidents

#### GET /incidents
Get all incidents (filtered by user role).

**Query Parameters:**
- `status` - Filter by incident status (reported, inProgress, resolved)
- `severity` - Filter by severity (low, medium, high)
- `page` - Page number for pagination
- `limit` - Number of results per page

**Response:**
```json
{
  "success": true,
  "message": "Incidents retrieved successfully",
  "data": [
    {
      "id": "incident_id",
      "description": "Incident description",
      "location": {
        "coordinates": [-74.006, 40.7128],
        "type": "Point"
      },
      "address": "123 Main St, New York, NY",
      "severity": "medium",
      "status": "reported",
      "tripId": "trip_id",
      "reportedBy": {
        "id": "user_id",
        "name": "John Doe"
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### POST /incidents
Report a new incident.

**Request Body:**
```json
{
  "description": "Detailed description of the incident",
  "location": {
    "coordinates": [-74.006, 40.7128]
  },
  "address": "123 Main St, New York, NY",
  "severity": "medium",
  "tripId": "trip_id"
}
```

#### PUT /incidents/:id
Update an existing incident.

**Request Body:**
```json
{
  "description": "Updated description",
  "severity": "high",
  "status": "inProgress"
}
```

### Geofences

#### GET /geofences
Get all geofences.

**Response:**
```json
{
  "success": true,
  "message": "Geofences retrieved successfully",
  "data": [
    {
      "id": "geofence_id",
      "center": {
        "coordinates": [-74.006, 40.7128],
        "type": "Point"
      },
      "radius": 1000,
      "alertType": "warning",
      "active": true,
      "createdBy": {
        "id": "user_id",
        "name": "Admin User"
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### POST /geofences
Create a new geofence.

**Request Body:**
```json
{
  "center": {
    "coordinates": [-74.006, 40.7128],
    "type": "Point"
  },
  "radius": 1000,
  "alertType": "warning",
  "active": true
}
```

### Alerts

#### GET /alerts
Get user alerts.

**Response:**
```json
{
  "success": true,
  "message": "Alerts retrieved successfully",
  "data": [
    {
      "id": "alert_id",
      "user": "user_id",
      "message": "You have entered a danger zone",
      "incident": "incident_id",
      "geofence": "geofence_id",
      "read": false,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### PUT /alerts/:id
Mark alert as read.

**Request Body:**
```json
{
  "read": true
}
```

## 🔒 Authentication

All protected endpoints require authentication via session cookies. The API uses session-based authentication with the following middleware:

- `isLoggedIn` - Basic authentication check
- `isAuthenticated` - Passport.js authentication
- `isAdmin` - Admin role authorization
- `isTourist` - Tourist role authorization

## 📊 Data Models

### User Model
```javascript
{
  name: String,
  username: String,
  email: String,
  phone: String,
  emergencyContacts: [{
    name: String,
    phone: String,
    relation: String
  }],
  tripInfo: {
    startLocation: String,
    endLocation: String,
    startDate: Date,
    endDate: Date
  },
  digitalId: {
    idNumber: String,
    issuedAt: Date,
    status: String
  },
  kycVerified: Boolean,
  kycDocNumber: String,
  role: String, // 'tourist' or 'admin'
  createdAt: Date
}
```

### Incident Model
```javascript
{
  description: String,
  location: {
    coordinates: [Number], // [longitude, latitude]
    type: String // 'Point'
  },
  address: String,
  severity: String, // 'low', 'medium', 'high'
  status: String, // 'reported', 'inProgress', 'resolved'
  tripId: ObjectId,
  reportedBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### Geofence Model
```javascript
{
  center: {
    coordinates: [Number], // [longitude, latitude]
    type: String // 'Point'
  },
  radius: Number, // in meters
  alertType: String, // 'warning', 'danger'
  active: Boolean,
  createdBy: ObjectId,
  createdAt: Date
}
```

### Alert Model
```javascript
{
  user: ObjectId,
  message: String,
  incident: ObjectId,
  geofence: ObjectId,
  read: Boolean,
  createdAt: Date
}
```

## 🛡️ Security

The API implements several security measures:

- **Input Validation**: Joi schemas for all input validation
- **Authentication**: Session-based authentication with Passport.js
- **Authorization**: Role-based access control
- **Security Headers**: Helmet.js for security headers
- **CORS**: Configured CORS policies
- **Rate Limiting**: API rate limiting
- **Data Sanitization**: Input sanitization and validation

## 📝 Error Handling

The API uses consistent error response format:

```json
{
  "success": false,
  "message": "Error message",
  "error": {
    "statusCode": 400,
    "stack": "Error stack (development only)"
  }
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `429` - Too Many Requests
- `500` - Internal Server Error

## 🔧 Development

### Project Structure
```
backend/
├── config/          # Configuration files
├── controllers/     # Route handlers
├── middleware/      # Custom middleware
├── models/          # MongoDB models
├── routes/          # API routes
├── utils/           # Utility functions
├── schemas.js       # Joi validation schemas
└── app.js           # Main application file
```

### Adding New Features

1. **Create Model**: Define MongoDB schema in `models/`
2. **Add Validation**: Create Joi schema in `schemas.js`
3. **Create Controller**: Implement business logic in `controllers/`
4. **Add Routes**: Define API endpoints in `routes/`
5. **Update Middleware**: Add any required middleware
6. **Test**: Test the new functionality

### Code Style

- Use async/await for asynchronous operations
- Implement proper error handling
- Add JSDoc comments for functions
- Follow consistent naming conventions
- Validate all inputs
- Use environment variables for configuration

## 📞 Support

For API support or questions, please refer to the main project documentation or contact the development team.
