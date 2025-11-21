const axios = require('axios');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

/**
 * Get address from coordinates using MapTiler API with Nominatim fallback
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<Object>} - { success: boolean, message: string, data: { address: string } }
 */
const getAddressFromCoordinates = async (lat, lng) => {
    try {
        // Validate input coordinates
        if (!lat || !lng || typeof lat !== 'number' || typeof lng !== 'number') {
            return {
                success: false,
                message: 'Invalid coordinates provided',
                data: { address: null }
            };
        }

        // Validate coordinate ranges
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return {
                success: false,
                message: 'Coordinates out of valid range',
                data: { address: null }
            };
        }

        // For Indian locations, try Nominatim first (better coverage for India)
        // For other locations, try MapTiler first
        const isIndianLocation = lng >= 68 && lng <= 97 && lat >= 6 && lat <= 37; // Approximate India bounds

        if (isIndianLocation) {
            console.log('Indian location detected, trying Nominatim first...');
        } else {
            console.log('Non-Indian location, trying MapTiler first...');
        }

        // Try Nominatim first for Indian locations
        if (isIndianLocation) {
            try {
                console.log('Attempting reverse geocoding with Nominatim API (primary for India)...');

                const nominatimResponse = await axios.get(
                    'https://nominatim.openstreetmap.org/reverse',
                    {
                        params: {
                            lat: lat,
                            lon: lng,
                            format: 'json',
                            addressdetails: 1,
                            zoom: 18
                        },
                        headers: {
                            'User-Agent': 'TouristSafetyApp/1.0'
                        },
                        timeout: 10000 // 10 second timeout
                    }
                );

                if (nominatimResponse.data && nominatimResponse.data.display_name) {
                    let address = nominatimResponse.data.display_name;

                    // Try to create a more readable address from address components
                    const addressDetails = nominatimResponse.data.address || {};
                    const components = [
                        addressDetails.road || addressDetails.pedestrian,
                        addressDetails.suburb || addressDetails.neighbourhood,
                        addressDetails.city || addressDetails.town || addressDetails.village,
                        addressDetails.state,
                        addressDetails.country
                    ].filter(Boolean);

                    // Use structured address if available, otherwise use display_name
                    if (components.length >= 2) {
                        address = components.slice(0, 3).join(', '); // Limit to first 3 components for readability
                    }

                    console.log('Nominatim reverse geocoding successful:', address);
                    return {
                        success: true,
                        message: 'Address retrieved successfully using Nominatim',
                        data: { address }
                    };
                }
            } catch (nominatimError) {
                console.warn('Nominatim API failed for Indian location:', nominatimError.message);
            }
        }

        // Try MapTiler API (primary for non-Indian locations, fallback for Indian)
        const mapTilerApiKey = process.env.MAPTILER_API_KEY;

        if (mapTilerApiKey) {
            try {
                console.log('Attempting reverse geocoding with MapTiler API...');

                const mapTilerResponse = await axios.get(
                    `https://api.maptiler.com/geocoding/${lng},${lat}.json`,
                    {
                        params: {
                            key: mapTilerApiKey,
                            limit: 1
                        },
                        timeout: 10000 // 10 second timeout
                    }
                );

                if (mapTilerResponse.data && mapTilerResponse.data.features && mapTilerResponse.data.features.length > 0) {
                    const feature = mapTilerResponse.data.features[0];

                    let address = feature.properties?.label || feature.properties?.formatted_address || feature.properties?.address_line1 || feature.properties?.place_name;

                    // If still no address, try to construct one from available properties
                    if (!address || address === 'Address not found' || address.startsWith('Location:')) {
                        const components = [
                            feature.properties?.address_line1,
                            feature.properties?.address_line2,
                            feature.properties?.locality || feature.properties?.city,
                            feature.properties?.region || feature.properties?.state,
                            feature.properties?.country
                        ].filter(Boolean);

                        // Try different property names for MapTiler
                        if (components.length === 0) {
                            const altComponents = [
                                feature.properties?.name,
                                feature.properties?.place_name,
                                feature.properties?.text,
                                feature.properties?.place_name_en
                            ].filter(Boolean);
                            components.push(...altComponents);
                        }

                        address = components.length > 0 ? components.join(', ') : `Near ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
                    }

                    console.log('MapTiler reverse geocoding successful:', address);
                    return {
                        success: true,
                        message: 'Address retrieved successfully using MapTiler',
                        data: { address }
                    };
                }
            } catch (mapTilerError) {
                console.warn('MapTiler API failed, falling back to Nominatim:', mapTilerError.message);
            }
        } else {
            console.log('MapTiler API key not found, using Nominatim fallback');
        }

        // Fallback to Nominatim (OpenStreetMap) API
        try {
            console.log('Attempting reverse geocoding with Nominatim API...');
            
            const nominatimResponse = await axios.get(
                'https://nominatim.openstreetmap.org/reverse',
                {
                    params: {
                        lat: lat,
                        lon: lng,
                        format: 'json',
                        addressdetails: 1,
                        zoom: 18
                    },
                    headers: {
                        'User-Agent': 'TouristSafetyApp/1.0'
                    },
                    timeout: 10000 // 10 second timeout
                }
            );

            if (nominatimResponse.data && nominatimResponse.data.display_name) {
                let address = nominatimResponse.data.display_name;

                // Try to create a more readable address from address components
                const addressDetails = nominatimResponse.data.address || {};
                const components = [
                    addressDetails.road || addressDetails.pedestrian,
                    addressDetails.suburb || addressDetails.neighbourhood,
                    addressDetails.city || addressDetails.town || addressDetails.village,
                    addressDetails.state,
                    addressDetails.country
                ].filter(Boolean);

                // Use structured address if available, otherwise use display_name
                if (components.length >= 2) {
                    address = components.slice(0, 3).join(', '); // Limit to first 3 components for readability
                }

                console.log('Nominatim reverse geocoding successful:', address);
                return {
                    success: true,
                    message: 'Address retrieved successfully using Nominatim',
                    data: { address }
                };
            } else {
                // Fallback to coordinate-based address
                const fallbackAddress = `Near ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
                console.log('Nominatim fallback address:', fallbackAddress);
                return {
                    success: false,
                    message: 'No detailed address found, using coordinate fallback',
                    data: { address: fallbackAddress }
                };
            }
        } catch (nominatimError) {
            console.error('Nominatim API failed:', nominatimError.message);
            // Final fallback - create a coordinate-based address
            const fallbackAddress = `Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            return {
                success: false,
                message: 'Geocoding services unavailable, using coordinate fallback',
                data: { address: fallbackAddress }
            };
        }

    } catch (error) {
        console.error('Reverse geocoding error:', error);
        // Provide coordinate-based fallback even in case of errors
        const fallbackAddress = `Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        return {
            success: false,
            message: 'Geocoding service error, using coordinate fallback',
            data: { address: fallbackAddress }
        };
    }
};

/**
 * Get detailed address components from coordinates
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<Object>} - { success: boolean, message: string, data: { address, components } }
 */
const getDetailedAddressFromCoordinates = async (lat, lng) => {
    try {
        // Validate input coordinates
        if (!lat || !lng || typeof lat !== 'number' || typeof lng !== 'number') {
            return {
                success: false,
                message: 'Invalid coordinates provided',
                data: { address: null, components: null }
            };
        }

        // Validate coordinate ranges
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return {
                success: false,
                message: 'Coordinates out of valid range',
                data: { address: null, components: null }
            };
        }

        // Try MapTiler API first for detailed results
        const mapTilerApiKey = process.env.MAPTILER_API_KEY;
        
        if (mapTilerApiKey) {
            try {
                console.log('Attempting detailed reverse geocoding with MapTiler API...');
                
                const mapTilerResponse = await axios.get(
                    `https://api.maptiler.com/geocoding/${lng},${lat}.json`,
                    {
                        params: {
                            key: mapTilerApiKey,
                            limit: 1,
                            types: 'address,poi'
                        },
                        timeout: 10000
                    }
                );

                if (mapTilerResponse.data && mapTilerResponse.data.features && mapTilerResponse.data.features.length > 0) {
                    const feature = mapTilerResponse.data.features[0];
                    const address = feature.properties?.label || feature.properties?.formatted_address || 'Address not found';
                    const components = {
                        house_number: feature.properties?.housenumber || null,
                        street: feature.properties?.street || null,
                        city: feature.properties?.city || feature.properties?.locality || null,
                        state: feature.properties?.state || feature.properties?.region || null,
                        country: feature.properties?.country || null,
                        postal_code: feature.properties?.postcode || null,
                        country_code: feature.properties?.country_code || null
                    };
                    
                    console.log('MapTiler detailed reverse geocoding successful');
                    return {
                        success: true,
                        message: 'Detailed address retrieved successfully using MapTiler',
                        data: { address, components }
                    };
                }
            } catch (mapTilerError) {
                console.warn('MapTiler detailed API failed, falling back to Nominatim:', mapTilerError.message);
            }
        }

        // Fallback to Nominatim for detailed results
        try {
            console.log('Attempting detailed reverse geocoding with Nominatim API...');
            
            const nominatimResponse = await axios.get(
                'https://nominatim.openstreetmap.org/reverse',
                {
                    params: {
                        lat: lat,
                        lon: lng,
                        format: 'json',
                        addressdetails: 1,
                        zoom: 18
                    },
                    headers: {
                        'User-Agent': 'TouristSafetyApp/1.0'
                    },
                    timeout: 10000
                }
            );

            if (nominatimResponse.data && nominatimResponse.data.display_name) {
                const address = nominatimResponse.data.display_name;
                const addressDetails = nominatimResponse.data.address || {};
                const components = {
                    house_number: addressDetails.house_number || null,
                    street: addressDetails.road || addressDetails.pedestrian || null,
                    city: addressDetails.city || addressDetails.town || addressDetails.village || null,
                    state: addressDetails.state || addressDetails.region || null,
                    country: addressDetails.country || null,
                    postal_code: addressDetails.postcode || null,
                    country_code: addressDetails.country_code || null
                };
                
                console.log('Nominatim detailed reverse geocoding successful');
                return {
                    success: true,
                    message: 'Detailed address retrieved successfully using Nominatim',
                    data: { address, components }
                };
            } else {
                return {
                    success: false,
                    message: 'No detailed address found for the given coordinates',
                    data: { address: null, components: null }
                };
            }
        } catch (nominatimError) {
            console.error('Nominatim detailed API failed:', nominatimError.message);
            return {
                success: false,
                message: 'Both MapTiler and Nominatim APIs failed for detailed geocoding',
                data: { address: null, components: null }
            };
        }

    } catch (error) {
        console.error('Detailed reverse geocoding error:', error);
        return {
            success: false,
            message: 'Internal error during detailed reverse geocoding',
            data: { address: null, components: null }
        };
    }
};

/**
 * Batch reverse geocoding for multiple coordinates
 * @param {Array} coordinates - Array of {lat, lng} objects
 * @returns {Promise<Object>} - { success: boolean, message: string, data: { addresses: Array } }
 */
const getBatchAddressesFromCoordinates = async (coordinates) => {
    try {
        if (!Array.isArray(coordinates) || coordinates.length === 0) {
            return {
                success: false,
                message: 'Invalid coordinates array provided',
                data: { addresses: [] }
            };
        }

        // Limit batch size to prevent API rate limiting
        const maxBatchSize = 10;
        if (coordinates.length > maxBatchSize) {
            return {
                success: false,
                message: `Batch size exceeds maximum of ${maxBatchSize} coordinates`,
                data: { addresses: [] }
            };
        }

        const results = [];
        
        // Process coordinates in parallel with rate limiting
        const promises = coordinates.map(async (coord, index) => {
            // Add small delay between requests to respect rate limits
            await new Promise(resolve => setTimeout(resolve, index * 100));
            
            const result = await getAddressFromCoordinates(coord.lat, coord.lng);
            return {
                index,
                lat: coord.lat,
                lng: coord.lng,
                ...result
            };
        });

        const batchResults = await Promise.all(promises);
        
        console.log(`Batch reverse geocoding completed for ${coordinates.length} coordinates`);
        return {
            success: true,
            message: `Batch reverse geocoding completed for ${coordinates.length} coordinates`,
            data: { addresses: batchResults }
        };

    } catch (error) {
        console.error('Batch reverse geocoding error:', error);
        return {
            success: false,
            message: 'Internal error during batch reverse geocoding',
            data: { addresses: [] }
        };
    }
};

module.exports = {
    getAddressFromCoordinates,
    getDetailedAddressFromCoordinates,
    getBatchAddressesFromCoordinates
};
