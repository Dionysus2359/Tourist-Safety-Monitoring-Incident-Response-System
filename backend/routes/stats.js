const express = require('express');
const router = express.Router();
const {
    getDashboardStats
} = require('../controllers/stats');
const {
    isLoggedIn,
    isAdmin,
    asyncHandler
} = require('../middleware');

// GET /stats/dashboard - Get dashboard statistics (admin only)
router.get('/dashboard',
    isLoggedIn,
    isAdmin,
    asyncHandler(getDashboardStats)
);

module.exports = router;
