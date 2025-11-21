// Example usage of geocoding helper functions
const { 
    getAddressFromCoordinates, 
    getDetailedAddressFromCoordinates, 
    getBatchAddressesFromCoordinates 
} = require('./geocoding');

// Example 1: Basic reverse geocoding
const exampleBasicGeocoding = async () => {
    try {
        const result = await getAddressFromCoordinates(28.6139, 77.2090); // Delhi, India
        console.log('Basic geocoding result:', result);
        
        if (result.success) {
            console.log('Address found:', result.data.address);
        } else {
            console.log('Error:', result.message);
        }
    } catch (error) {
        console.error('Example error:', error);
    }
};

// Example 2: Detailed reverse geocoding
const exampleDetailedGeocoding = async () => {
    try {
        const result = await getDetailedAddressFromCoordinates(28.6139, 77.2090);
        console.log('Detailed geocoding result:', result);
        
        if (result.success) {
            console.log('Address:', result.data.address);
            console.log('Components:', result.data.components);
        } else {
            console.log('Error:', result.message);
        }
    } catch (error) {
        console.error('Example error:', error);
    }
};

// Example 3: Batch reverse geocoding
const exampleBatchGeocoding = async () => {
    try {
        const coordinates = [
            { lat: 28.6139, lng: 77.2090 }, // Delhi
            { lat: 19.0760, lng: 72.8777 }, // Mumbai
            { lat: 12.9716, lng: 77.5946 }  // Bangalore
        ];
        
        const result = await getBatchAddressesFromCoordinates(coordinates);
        console.log('Batch geocoding result:', result);
        
        if (result.success) {
            result.data.addresses.forEach((addr, index) => {
                console.log(`Location ${index + 1}:`, addr);
            });
        } else {
            console.log('Error:', result.message);
        }
    } catch (error) {
        console.error('Example error:', error);
    }
};

// Example 4: Usage in incident controller
const exampleIncidentControllerUsage = async (incidentData) => {
    try {
        const { location } = incidentData;
        
        if (location && location.coordinates) {
            const [lng, lat] = location.coordinates;
            
            // Get address for the incident location
            const geocodingResult = await getAddressFromCoordinates(lat, lng);
            
            if (geocodingResult.success) {
                // Add address to incident data
                incidentData.address = geocodingResult.data.address;
                console.log('Address added to incident:', geocodingResult.data.address);
            } else {
                console.warn('Could not get address for incident:', geocodingResult.message);
                // Continue without address
            }
        }
        
        return incidentData;
    } catch (error) {
        console.error('Error in incident controller example:', error);
        return incidentData; // Return original data if geocoding fails
    }
};

// Run examples (uncomment to test)
// exampleBasicGeocoding();
// exampleDetailedGeocoding();
// exampleBatchGeocoding();

module.exports = {
    exampleBasicGeocoding,
    exampleDetailedGeocoding,
    exampleBatchGeocoding,
    exampleIncidentControllerUsage
};
