const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    logoutUser,
    getUserProfile,
    updateUserProfile,
    generateDigitalId,
    getAllUsers,
    updateUserLocation
} = require('../controllers/users');
const { 
    userRegistrationSchema, 
    userLoginSchema, 
    userProfileUpdateSchema
} = require('../schemas');
const { 
    isLoggedIn, 
    validateRequestMiddleware, 
    asyncHandler 
} = require('../middleware');

// POST /register - Register a new user
router.post('/register', 
    validateRequestMiddleware(userRegistrationSchema),
    asyncHandler(registerUser)
);

// POST /login - Login user
router.post('/login', 
    validateRequestMiddleware(userLoginSchema),
    asyncHandler(loginUser)
);

// GET /logout - Logout user
router.get('/logout', asyncHandler(logoutUser));

// GET /profile - Get user profile (requires authentication)
router.get('/profile', 
    isLoggedIn,
    asyncHandler(getUserProfile)
);

// PUT /profile - Update user profile (requires authentication)
router.put('/profile', 
    isLoggedIn,
    validateRequestMiddleware(userProfileUpdateSchema),
    asyncHandler(updateUserProfile)
);

// POST /generate-digital-id - Generate new digital ID (requires authentication)
router.post('/generate-digital-id',
    isLoggedIn,
    asyncHandler(generateDigitalId)
);

// GET /all - Get all users (admin only)
router.get('/all',
    isLoggedIn,
    asyncHandler(getAllUsers)
);

// PUT /location - Update user location (requires authentication)
router.put('/location',
    isLoggedIn,
    asyncHandler(updateUserLocation)
);

// GET /auth-status - Check authentication status
router.get('/auth-status', asyncHandler((req, res) => {
    if (req.session && req.session.userId) {
        res.status(200).json({
            success: true,
            message: "User is authenticated",
            data: {
                isAuthenticated: true,
                userId: req.session.userId,
                username: req.session.userUsername
            }
        });
    } else {
        res.status(200).json({
            success: true,
            message: "User is not authenticated",
            data: {
                isAuthenticated: false
            }
        });
    }
}));

module.exports = router;
