import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { authAPI } from '../services/api';

// Create the Auth Context
const AuthContext = createContext();

// Custom hook to use the Auth Context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authCheckInProgress, setAuthCheckInProgress] = useState(false);
    const [authCheckCompleted, setAuthCheckCompleted] = useState(false);

    // Refs to track ongoing operations and prevent duplicates
    const visibilityCheckTimeoutRef = useRef(null);
    const periodicCheckTimeoutRef = useRef(null);
    const isRefreshingProfile = useRef(false);

    // Debounced function to refresh profile
    const refreshProfile = useCallback(async (source = 'unknown') => {
        // Prevent multiple simultaneous profile refreshes
        if (isRefreshingProfile.current) {
            console.log(`⏳ Profile refresh already in progress (source: ${source})`);
            return;
        }

        isRefreshingProfile.current = true;
        console.log(`🔄 Refreshing profile (source: ${source})`);

        try {
            const response = await authAPI.getProfile();
            if (response.data.success) {
                const userData = response.data.data;
                setUser(userData);
                localStorage.setItem('user', JSON.stringify(userData));
                localStorage.setItem('user_timestamp', Date.now().toString());
                console.log(`✅ Profile refreshed successfully (source: ${source})`);
            } else {
                // Session expired, logout
                console.log(`⚠️ Profile refresh failed - session expired (source: ${source})`);
                setUser(null);
                setIsAuthenticated(false);
                localStorage.removeItem('user');
                localStorage.removeItem('user_timestamp');
            }
        } catch (error) {
            if (error.response?.status === 401) {
                // Session expired, logout
                console.log(`❌ Profile refresh failed - 401 (source: ${source})`);
                setUser(null);
                setIsAuthenticated(false);
                localStorage.removeItem('user');
                localStorage.removeItem('user_timestamp');
            } else {
                console.error(`❌ Profile refresh error (source: ${source}):`, error);
            }
        } finally {
            isRefreshingProfile.current = false;
        }
    }, []);

    // Check if user is already logged in on app start
    useEffect(() => {
        const checkAuthStatus = async () => {
            // Prevent multiple auth checks
            if (authCheckCompleted || authCheckInProgress) {
                return;
            }

            setAuthCheckInProgress(true);

            try {
                // First, check localStorage for recent stored credentials
                const storedUser = localStorage.getItem('user');
                const storedTimestamp = localStorage.getItem('user_timestamp');

                if (storedUser && storedTimestamp) {
                    const timeDiff = Date.now() - parseInt(storedTimestamp);
                    const twentyFourHours = 24 * 60 * 60 * 1000;

                    if (timeDiff < twentyFourHours) {
                        try {
                            const userData = JSON.parse(storedUser);
                            // Set localStorage data first for immediate UI update
                            setUser(userData);
                            setIsAuthenticated(true);
                            console.log('✅ Using stored credentials');

                            // Then try to verify with server to refresh session
                            try {
                                const response = await authAPI.getProfile();
                                if (response.data.success) {
                                    const freshUserData = response.data.data;
                                    setUser(freshUserData);
                                    localStorage.setItem('user', JSON.stringify(freshUserData));
                                    localStorage.setItem('user_timestamp', Date.now().toString());
                                    console.log('✅ Session refreshed');
                                }
                            } catch (serverError) {
                                if (serverError.response?.status === 401) {
                                    console.log('⚠️ Session expired, clearing stored data');
                                    localStorage.removeItem('user');
                                    localStorage.removeItem('user_timestamp');
                                    setUser(null);
                                    setIsAuthenticated(false);
                                }
                            }
                        } catch (parseError) {
                            console.log('❌ Invalid stored data, clearing');
                            localStorage.removeItem('user');
                            localStorage.removeItem('user_timestamp');
                            setUser(null);
                            setIsAuthenticated(false);
                        }
                    } else {
                        console.log('⏰ Stored data too old, clearing');
                        localStorage.removeItem('user');
                        localStorage.removeItem('user_timestamp');
                        setUser(null);
                        setIsAuthenticated(false);
                    }
                } else {
                    // No stored credentials, try server directly (for fresh logins)
                    try {
                        const response = await authAPI.getProfile();
                        if (response.data.success) {
                            const userData = response.data.data;
                            setUser(userData);
                            setIsAuthenticated(true);
                            localStorage.setItem('user', JSON.stringify(userData));
                            localStorage.setItem('user_timestamp', Date.now().toString());
                            console.log('✅ Server authentication successful');
                        }
                    } catch (error) {
                        // No stored data and server auth failed - user not logged in
                        console.log('🔍 No valid authentication found');
                    }
                }
            } catch (error) {
                console.error('❌ Authentication check failed:', error);
                // Clear any invalid data
                localStorage.removeItem('user');
                localStorage.removeItem('user_timestamp');
                setUser(null);
                setIsAuthenticated(false);
            } finally {
                setLoading(false);
                setAuthCheckInProgress(false);
                setAuthCheckCompleted(true);
            }
        };

        checkAuthStatus();
    }, []);

    // Re-check authentication when page becomes visible (tab switch, etc.) - DEBOUNCED
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && isAuthenticated) {
                // Clear any existing timeout
                if (visibilityCheckTimeoutRef.current) {
                    clearTimeout(visibilityCheckTimeoutRef.current);
                }

                // Debounce the profile refresh by 1 second to prevent rapid successive calls
                visibilityCheckTimeoutRef.current = setTimeout(() => {
                    refreshProfile('visibility-change');
                }, 1000);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            // Clean up timeout on unmount
            if (visibilityCheckTimeoutRef.current) {
                clearTimeout(visibilityCheckTimeoutRef.current);
            }
        };
    }, [isAuthenticated, refreshProfile]);

    // Periodic authentication check (every 5 minutes when authenticated)
    useEffect(() => {
        if (!isAuthenticated) return;

        const interval = setInterval(() => {
            authAPI.getProfile()
                .then(response => {
                    if (response.data.success) {
                        const userData = response.data.data;
                        setUser(userData);
                        localStorage.setItem('user', JSON.stringify(userData));
                        localStorage.setItem('user_timestamp', Date.now().toString());
                    } else {
                        // Session expired, logout
                        setUser(null);
                        setIsAuthenticated(false);
                        localStorage.removeItem('user');
                        localStorage.removeItem('user_timestamp');
                    }
                })
                .catch(error => {
                    if (error.response?.status === 401) {
                        // Session expired, logout
                        setUser(null);
                        setIsAuthenticated(false);
                        localStorage.removeItem('user');
                        localStorage.removeItem('user_timestamp');
                    }
                });
        }, 5 * 60 * 1000); // 5 minutes

        return () => clearInterval(interval);
    }, [isAuthenticated]);

    // Login function
    const login = async (credentials) => {
        try {
            setLoading(true);
            console.log('🔐 Login attempt for:', credentials.email || credentials.username);

            const response = await authAPI.login(credentials);

            if (response.data.success) {
                const userData = response.data.data;
                console.log('✅ Login successful:', userData.username, 'role:', userData.role);

                setUser(userData);
                setIsAuthenticated(true);
                // Store user data and timestamp for fallback
                localStorage.setItem('user', JSON.stringify(userData));
                localStorage.setItem('user_timestamp', Date.now().toString());
                // Mark auth check as completed so protected routes can render
                setAuthCheckCompleted(true);

                console.log('🔄 Auth state updated:', {
                    user: userData,
                    isAuthenticated: true,
                    loading: false,
                    authCheckCompleted: true
                });

                return { success: true, user: userData };
            } else {
                console.log('❌ Login failed:', response.data.message);
                return { success: false, message: response.data.message };
            }
        } catch (error) {
            console.error('❌ Login error:', error.response?.data?.message || error.message);
            return {
                success: false,
                message: error.response?.data?.message || 'Login failed. Please try again.'
            };
        } finally {
            setLoading(false);
        }
    };

    // Logout function
    const logout = async () => {
        try {
            setLoading(true);
            await authAPI.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Always clear local state regardless of API call success
            setUser(null);
            setIsAuthenticated(false);
            localStorage.removeItem('user');
            localStorage.removeItem('user_timestamp');
            // Ensure protected routes don't hang in loading state
            setAuthCheckCompleted(true);
            setLoading(false);
        }
    };

    // Update user profile
    const updateProfile = async (userData) => {
        try {
            setLoading(true);
            const response = await authAPI.updateProfile(userData);

            if (response.data.success) {
                const updatedUser = response.data.data;
                setUser(updatedUser);
                // Update localStorage with timestamp
                localStorage.setItem('user', JSON.stringify(updatedUser));
                localStorage.setItem('user_timestamp', Date.now().toString());
                return { success: true };
            } else {
                return { success: false, message: response.data.message };
            }
        } catch (error) {
            console.error('Profile update error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Profile update failed.'
            };
        } finally {
            setLoading(false);
        }
    };

    // Check if user has specific role
    const hasRole = (role) => {
        return user?.role === role;
    };

    // Check if user is admin
    const isAdmin = () => {
        return hasRole('admin');
    };

    // Check if user is tourist
    const isTourist = () => {
        return hasRole('tourist');
    };

    const value = {
        user,
        loading,
        isAuthenticated,
        authCheckCompleted,
        authCheckInProgress,
        login,
        logout,
        updateProfile,
        hasRole,
        isAdmin,
        isTourist
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
