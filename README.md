# Tourist Safety and Monitoring System

A comprehensive web application designed to enhance tourist safety through real-time monitoring, incident reporting, geofencing, and emergency response coordination.

## 🚀 Features

### Core Features
- **User Authentication**: Secure registration and login system with role-based access
- **Real-time Incident Reporting**: Report and track safety incidents with location data
- **Geofencing**: Define safe zones and receive alerts when entering danger areas
- **Emergency Contacts**: Manage emergency contact information
- **Digital Tourist ID**: Generate and manage digital identification
- **Trip Planning**: Plan and track travel itineraries
- **Admin Dashboard**: Administrative interface for system management

### Technical Features
- **Responsive Design**: Mobile-first design with modern UI/UX
- **Real-time Updates**: WebSocket support for live notifications
- **Offline Support**: Basic offline functionality for critical features
- **Security**: JWT tokens, encrypted data, secure API endpoints
- **Performance**: Optimized API calls, caching, and lazy loading

## 🏗️ Architecture

### Backend
- **Framework**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Passport.js with local strategy
- **Validation**: Joi schema validation
- **Security**: Helmet, CORS, rate limiting
- **File Upload**: Multer for document uploads

### Frontend
- **Framework**: React 19 with Vite
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Routing**: React Router v7
- **HTTP Client**: Axios with interceptors
- **Maps**: Leaflet for location visualization

## 📁 Project Structure

```
├── backend/
│   ├── config/          # Configuration files
│   ├── controllers/     # Route handlers
│   ├── middleware/      # Custom middleware
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── utils/           # Utility functions
│   ├── schemas.js       # Joi validation schemas
│   └── app.js           # Main application file
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── contexts/    # React contexts
│   │   ├── hooks/       # Custom React hooks
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   ├── utils/       # Utility functions
│   │   └── constants/   # App constants
│   └── public/          # Static assets
└── docs/                # Documentation
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the backend root:
   ```env
   NODE_ENV=development
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/touristsafety
   SESSION_SECRET=your-super-secure-session-secret
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system or update the connection string for MongoDB Atlas.

5. **Run the backend server**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the frontend root:
   ```env
   VITE_API_URL=http://localhost:3000
   VITE_APP_NAME=SafeTravels
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

## 🚀 Usage

1. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

2. **Register a new account**
   - Fill in the registration form with required information
   - Complete KYC verification if required

3. **Login and explore features**
   - Access dashboard with personalized safety features
   - Set up emergency contacts
   - Plan your trip itinerary
   - Report incidents if needed

## 🔧 API Documentation

### Authentication Endpoints
- `POST /users/register` - User registration
- `POST /users/login` - User login
- `POST /users/logout` - User logout
- `GET /users/profile` - Get user profile
- `PUT /users/profile` - Update user profile

### Incident Management
- `GET /incidents` - Get all incidents
- `POST /incidents` - Report new incident
- `PUT /incidents/:id` - Update incident
- `DELETE /incidents/:id` - Delete incident

### Geofencing
- `GET /geofences` - Get all geofences
- `POST /geofences` - Create geofence
- `PUT /geofences/:id` - Update geofence
- `DELETE /geofences/:id` - Delete geofence

### Alerts
- `GET /alerts` - Get user alerts
- `PUT /alerts/:id` - Mark alert as read

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test
```

### Frontend Testing
```bash
cd frontend
npm test
```

## 📦 Deployment

### Backend Deployment
1. Set production environment variables
2. Build and deploy to your preferred hosting service (Heroku, AWS, etc.)
3. Ensure MongoDB connection is configured for production

### Frontend Deployment
1. Build the production bundle
   ```bash
   npm run build
   ```
2. Deploy to static hosting (Vercel, Netlify, etc.)
3. Configure environment variables in hosting platform

## 🔒 Security Features

- **Authentication**: Secure user authentication with bcrypt password hashing
- **Authorization**: Role-based access control (tourist/admin)
- **Data Validation**: Comprehensive input validation with Joi
- **Security Headers**: Helmet.js for security headers
- **CORS**: Configured CORS policies
- **Rate Limiting**: API rate limiting to prevent abuse
- **Session Security**: Secure session management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License - see the LICENSE file for details.

## 📞 Support

For support, email support@safetravels.com or join our Discord community.

## 🙏 Acknowledgments

- Tourist safety organizations for inspiration
- Open source community for amazing tools and libraries
- Contributors and beta testers

---

**Made with ❤️ for safer travels worldwide**
