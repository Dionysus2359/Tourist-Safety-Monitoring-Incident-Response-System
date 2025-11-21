const User = require('../models/user');
const mongoose = require('mongoose');
const { userRegistrationSchema, userLoginSchema, userProfileUpdateSchema, validateRequest } = require('../schemas');

// Register a new user
const registerUser = async (req, res, next) => {
    try {
        // Validate input using Joi schema
        console.log("Incoming body:", req.body);
        const validation = validateRequest(userRegistrationSchema, req.body);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: validation.error,
                data: {}
            });
        }

        const { name, username, email, password, phone, kycDocNumber } = validation.value;

        // Check if username already exists
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.status(409).json({
                success: false,
                message: "Username already exists",
                data: {}
            });
        }

        // Check if email already exists
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(409).json({
                success: false,
                message: "User with this email already exists",
                data: {}
            });
        }

        // Check if KYC document number already exists
        const existingKyc = await User.findOne({ kycDocNumber });
        if (existingKyc) {
            return res.status(409).json({
                success: false,
                message: "User with this KYC document number already exists",
                data: {}
            });
        }

        // Create new user with passport-local-mongoose
        const newUser = new User({
            name,
            email,
            phone: phone.toString(), // Ensure phone is stored as string
            kycDocNumber,
            username
        });

        // Register user with passport-local-mongoose (handles password hashing automatically)
        await User.register(newUser, password);

        // Return user data (excluding sensitive information)
        const userData = {
            id: newUser._id,
            name: newUser.name,
            username: newUser.username,
            email: newUser.email,
            phone: newUser.phone,
            kycVerified: newUser.kycVerified,
            role: newUser.role,
            createdAt: newUser.createdAt
        };

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: userData
        });

    } catch (error) {
        console.error('Registration error:', error);
        
        // Handle specific passport-local-mongoose errors
        if (error.name === 'UserExistsError') {
            return res.status(409).json({
                success: false,
                message: "User already exists",
                data: {}
            });
        }
        
        // Forward error to centralized error handler
        next(error);
    }
};

// Login user
const loginUser = async (req, res, next) => {
    try {
        // Validate input using Joi schema
        const validation = validateRequest(userLoginSchema, req.body);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: validation.error,
                data: {}
            });
        }

        const { username, email, password } = validation.value;

        // Find user by username or email
        let user = null;
        if (username) {
            user = await User.findOne({ username });
        } else if (email) {
            user = await User.findOne({ email });
        }
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password",
                data: {}
            });
        }

        // Verify password using passport-local-mongoose authenticate method
        // Handle both promise and callback-based authenticate methods
        const authenticateResult = await new Promise((resolve, reject) => {
            user.authenticate(password, (err, user, error) => {
                if (err) reject(err);
                else if (error) resolve({ user: null, error });
                else resolve({ user, error: null });
            });
        });

        if (authenticateResult.error || !authenticateResult.user) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password",
                data: {}
            });
        }

        // Create session
        req.session.userId = user._id;
        req.session.userUsername = user.username;
        req.session.role = user.role; // Store role in session

        // Save session explicitly to ensure it's persisted
        req.session.save((err) => {
            if (err) {
                console.error('Session save error:', err);
                return res.status(500).json({
                    success: false,
                    message: "Error saving session",
                    data: {}
                });
            }

            console.log('Session created successfully for user:', user.username);

            // Return user data (excluding sensitive information)
            const userData = {
                id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                phone: user.phone,
                digitalId: user.digitalId,
                kycVerified: user.kycVerified,
                role: user.role,
                emergencyContacts: user.emergencyContacts,
                tripInfo: user.tripInfo,
                createdAt: user.createdAt
            };

            res.status(200).json({
                success: true,
                message: "Login successful",
                data: userData
            });
        });

    } catch (error) {
        console.error('Login error:', error);
        next(error);
    }
};

// Logout user
const logoutUser = async (req, res, next) => {
    try {
        // Destroy session
        req.session.destroy((err) => {
            if (err) {
                console.error('Session destruction error:', err);
                return res.status(500).json({
                    success: false,
                    message: "Error during logout",
                    data: {}
                });
            }

            // Clear session cookie
            res.clearCookie('tourist-safety.sid'); // Custom session cookie name

            res.status(200).json({
                success: true,
                message: "Logout successful",
                data: {}
            });
        });

    } catch (error) {
        console.error('Logout error:', error);
        next(error);
    }
};

// Get user profile
const getUserProfile = async (req, res, next) => {
    try {
        // Check if user is logged in
        if (!req.session.userId) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated",
                data: {}
            });
        }

        // Find user by session ID
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
                data: {}
            });
        }

        // Return user profile data
        const userData = {
            id: user._id,
            name: user.name,
            username: user.username,
            email: user.email,
            phone: user.phone,
            digitalId: user.digitalId,
            kycVerified: user.kycVerified,
            kycType: user.kycType,
            role: user.role,
            emergencyContacts: user.emergencyContacts,
            tripInfo: user.tripInfo,
            createdAt: user.createdAt
        };

        res.status(200).json({
            success: true,
            message: "User profile retrieved successfully",
            data: userData
        });

    } catch (error) {
        console.error('Get profile error:', error);
        next(error);
    }
};

// Update user profile
const updateUserProfile = async (req, res, next) => {
    try {
        // Check if user is logged in
        if (!req.session.userId) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated",
                data: {}
            });
        }

        // Validate input using Joi schema
        const validation = validateRequest(userProfileUpdateSchema, req.body);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: validation.error,
                data: {}
            });
        }

        const { name, phone, emergencyContacts, tripInfo } = validation.value;
        const updateData = {};

        // Only update fields that are provided
        if (name !== undefined) updateData.name = name;
        if (phone !== undefined) updateData.phone = phone.toString(); // Ensure phone is stored as string
        if (emergencyContacts !== undefined) {
            // Validate emergency contacts array length and structure
            if (Array.isArray(emergencyContacts)) {
                if (emergencyContacts.length > 5) {
                    return res.status(400).json({
                        success: false,
                        message: "Maximum 5 emergency contacts allowed",
                        data: {}
                    });
                }
                
                // Validate each emergency contact structure
                for (let i = 0; i < emergencyContacts.length; i++) {
                    const contact = emergencyContacts[i];
                    if (!contact.name || !contact.phone || !contact.relation) {
                        return res.status(400).json({
                            success: false,
                            message: `Emergency contact ${i + 1} must have name, phone, and relation`,
                            data: {}
                        });
                    }
                }
            }
            updateData.emergencyContacts = emergencyContacts;
        }
        if (tripInfo !== undefined) updateData.tripInfo = tripInfo;

        // Update user
        const updatedUser = await User.findByIdAndUpdate(
            req.session.userId,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "User not found",
                data: {}
            });
        }

        // Return updated user data
        const userData = {
            id: updatedUser._id,
            name: updatedUser.name,
            username: updatedUser.username,
            email: updatedUser.email,
            phone: updatedUser.phone,
            digitalId: updatedUser.digitalId,
            kycVerified: updatedUser.kycVerified,
            kycType: updatedUser.kycType,
            role: updatedUser.role,
            emergencyContacts: updatedUser.emergencyContacts,
            tripInfo: updatedUser.tripInfo,
            createdAt: updatedUser.createdAt
        };

        res.status(200).json({
            success: true,
            message: "User profile updated successfully",
            data: userData
        });

    } catch (error) {
        console.error('Update profile error:', error);
        next(error);
    }
};

// Generate digital ID (optional feature)
const generateDigitalId = async (req, res, next) => {
    try {
        // Check if user is logged in
        if (!req.session.userId) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated",
                data: {}
            });
        }

        // Find user
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
                data: {}
            });
        }

        // Generate new digital ID
        const newDigitalId = {
            idNumber: new mongoose.Types.ObjectId().toString(),
            issuedAt: new Date(),
            status: 'active'
        };

        // Optional: Add publicKey and signature if provided in request body
        if (req.body.publicKey) {
            newDigitalId.publicKey = req.body.publicKey;
        }
        if (req.body.signature) {
            newDigitalId.signature = req.body.signature;
        }

        // Update user with new digital ID
        user.digitalId = newDigitalId;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Digital ID generated successfully",
            data: {
                digitalId: user.digitalId
            }
        });

    } catch (error) {
        console.error('Generate digital ID error:', error);
        next(error);
    }
};

// Get all users (admin only)
const getAllUsers = async (req, res, next) => {
    try {
        // Check if user is logged in and is admin
        if (!req.session.userId) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated",
                data: {}
            });
        }

        // Find the current user and check if they're admin
        const currentUser = await User.findById(req.session.userId);
        if (!currentUser || currentUser.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: "Access denied. Admin privileges required.",
                data: {}
            });
        }

        // Get all users (exclude admin users from the results for tourists view)
        const users = await User.find({ role: 'tourist' }).select('-salt -hash');

        // Return user data (excluding sensitive information)
        const usersData = users.map(user => ({
            id: user._id,
            name: user.name,
            username: user.username,
            email: user.email,
            phone: user.phone,
            location: user.location,
            kycVerified: user.kycVerified,
            role: user.role,
            emergencyContacts: user.emergencyContacts,
            tripInfo: user.tripInfo,
            createdAt: user.createdAt
        }));

        res.status(200).json({
            success: true,
            message: "Users retrieved successfully",
            data: {
                users: usersData,
                total: usersData.length
            }
        });

    } catch (error) {
        console.error('Get all users error:', error);
        next(error);
    }
};

// Update user location
const updateUserLocation = async (req, res, next) => {
    try {
        // Check if user is logged in
        if (!req.session.userId) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated",
                data: {}
            });
        }

        const { latitude, longitude, address, accuracy } = req.body;

        if (!latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: "Latitude and longitude are required",
                data: {}
            });
        }

        // Update user location
        const updatedUser = await User.findByIdAndUpdate(
            req.session.userId,
            {
                location: {
                    coordinates: [longitude, latitude], // MongoDB expects [lng, lat]
                    address: address || '',
                    lastUpdated: new Date(),
                    accuracy: accuracy || null
                }
            },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "User not found",
                data: {}
            });
        }

        res.status(200).json({
            success: true,
            message: "Location updated successfully",
            data: {
                location: updatedUser.location
            }
        });

    } catch (error) {
        console.error('Update location error:', error);
        next(error);
    }
};

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    getUserProfile,
    updateUserProfile,
    generateDigitalId,
    getAllUsers,
    updateUserLocation
};