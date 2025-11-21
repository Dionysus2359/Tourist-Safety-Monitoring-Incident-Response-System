// Example of how to integrate geocoding into incidents controller
const Incident = require('../models/incident');
const User = require('../models/user');
const { incidentCreationSchema, incidentUpdateSchema, validateRequest } = require('../schemas');
const { getAddressFromCoordinates } = require('../utils/geocoding');
const {
    isValidObjectId,
    formatIncidentResponse,
    formatIncidentsResponse,
    buildPaginationObject,
    buildIncidentFilter,
    validateIncidentQuery,
    canUserAccessIncident,
    getPaginationParams,
    createErrorResponse,
    createSuccessResponse
} = require('../utils/helpers');

/**
 * Create a new incident with automatic address geocoding
 * Required: user, description, location
 * Optional: tripId, address, severity
 */
const createIncidentWithGeocoding = async (req, res, next) => {
    try {
        // Get user ID from session
        const userId = req.session.userId;
        if (!userId) {
            const error = createErrorResponse(401, "User not authenticated");
            return res.status(error.statusCode).json(error.response);
        }

        // Validate input using Joi schema
        const validation = validateRequest(incidentCreationSchema, req.body);
        if (!validation.isValid) {
            const error = createErrorResponse(400, validation.error);
            return res.status(error.statusCode).json(error.response);
        }

        const { description, location, tripId, address, severity } = validation.value;

        // Create incident data
        const incidentData = {
            user: userId,
            description,
            location: {
                type: 'Point',
                coordinates: location.coordinates
            },
            status: 'reported'
        };

        // Add optional fields if provided
        if (tripId) incidentData.tripId = tripId;
        if (address) incidentData.address = address;
        if (severity) incidentData.severity = severity;

        // If no address provided, try to geocode from coordinates
        if (!address && location && location.coordinates) {
            const [lng, lat] = location.coordinates;
            console.log(`Attempting to geocode address for coordinates: ${lat}, ${lng}`);
            
            try {
                const geocodingResult = await getAddressFromCoordinates(lat, lng);
                
                if (geocodingResult.success) {
                    incidentData.address = geocodingResult.data.address;
                    console.log('Address geocoded successfully:', geocodingResult.data.address);
                } else {
                    console.warn('Geocoding failed:', geocodingResult.message);
                    // Continue without address - don't fail the incident creation
                }
            } catch (geocodingError) {
                console.error('Geocoding error:', geocodingError);
                // Continue without address - don't fail the incident creation
            }
        }

        const incident = new Incident(incidentData);
        await incident.save();

        // Populate user data for response
        await incident.populate('user', 'name email username');

        const success = createSuccessResponse(201, "Incident created successfully", {
            incident: formatIncidentResponse(incident)
        });
        res.status(success.statusCode).json(success.response);

    } catch (error) {
        console.error('Create incident with geocoding error:', error);
        next(error);
    }
};

/**
 * Update an incident with optional address geocoding
 */
const updateIncidentWithGeocoding = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Validate ObjectId format
        if (!isValidObjectId(id)) {
            const error = createErrorResponse(400, "Invalid incident ID format");
            return res.status(error.statusCode).json(error.response);
        }

        // Get user ID from session
        const userId = req.session.userId;
        if (!userId) {
            const error = createErrorResponse(401, "User not authenticated");
            return res.status(error.statusCode).json(error.response);
        }

        // Validate input using Joi schema
        const validation = validateRequest(incidentUpdateSchema, req.body);
        if (!validation.isValid) {
            const error = createErrorResponse(400, validation.error);
            return res.status(error.statusCode).json(error.response);
        }

        // Find incident and user
        const [incident, user] = await Promise.all([
            Incident.findById(id),
            User.findById(userId)
        ]);

        if (!incident) {
            const error = createErrorResponse(404, "Incident not found");
            return res.status(error.statusCode).json(error.response);
        }

        // Check if user can access incident
        if (!canUserAccessIncident(incident, userId, user.role)) {
            const error = createErrorResponse(403, "Access denied. You can only update your own incidents.");
            return res.status(error.statusCode).json(error.response);
        }

        // Build update object from validated data
        const updateData = {};
        const { description, location, address, severity, status } = validation.value;
        
        if (description !== undefined) updateData.description = description;
        if (address !== undefined) updateData.address = address;
        if (severity !== undefined) updateData.severity = severity;
        if (status !== undefined) updateData.status = status;

        // Handle location update
        if (location !== undefined) {
            updateData.location = {
                type: 'Point',
                coordinates: location.coordinates
            };

            // If location is updated and no new address provided, try to geocode
            if (!address && location.coordinates) {
                const [lng, lat] = location.coordinates;
                console.log(`Attempting to geocode new address for coordinates: ${lat}, ${lng}`);
                
                try {
                    const geocodingResult = await getAddressFromCoordinates(lat, lng);
                    
                    if (geocodingResult.success) {
                        updateData.address = geocodingResult.data.address;
                        console.log('New address geocoded successfully:', geocodingResult.data.address);
                    } else {
                        console.warn('Geocoding failed for location update:', geocodingResult.message);
                        // Continue without address update
                    }
                } catch (geocodingError) {
                    console.error('Geocoding error during update:', geocodingError);
                    // Continue without address update
                }
            }
        }

        // Update incident
        const updatedIncident = await Incident.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate('user', 'name email username');

        const success = createSuccessResponse(200, "Incident updated successfully", {
            incident: formatIncidentResponse(updatedIncident)
        });
        res.status(success.statusCode).json(success.response);

    } catch (error) {
        console.error('Update incident with geocoding error:', error);
        next(error);
    }
};

/**
 * Get incident by ID with geocoded address if missing
 */
const getIncidentByIdWithGeocoding = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Validate ObjectId format
        if (!isValidObjectId(id)) {
            const error = createErrorResponse(400, "Invalid incident ID format");
            return res.status(error.statusCode).json(error.response);
        }

        const incident = await Incident.findById(id)
            .populate('user', 'name email username');

        if (!incident) {
            const error = createErrorResponse(404, "Incident not found");
            return res.status(error.statusCode).json(error.response);
        }

        // If incident has no address but has coordinates, try to geocode
        if (!incident.address && incident.location && incident.location.coordinates) {
            const [lng, lat] = incident.location.coordinates;
            console.log(`Attempting to geocode missing address for incident ${id}: ${lat}, ${lng}`);
            
            try {
                const geocodingResult = await getAddressFromCoordinates(lat, lng);
                
                if (geocodingResult.success) {
                    // Update the incident with the geocoded address
                    incident.address = geocodingResult.data.address;
                    await incident.save();
                    console.log('Address geocoded and saved for incident:', geocodingResult.data.address);
                } else {
                    console.warn('Geocoding failed for incident:', geocodingResult.message);
                }
            } catch (geocodingError) {
                console.error('Geocoding error for incident:', geocodingError);
            }
        }

        const success = createSuccessResponse(200, "Incident retrieved successfully", {
            incident: formatIncidentResponse(incident)
        });
        res.status(success.statusCode).json(success.response);

    } catch (error) {
        console.error('Get incident by ID with geocoding error:', error);
        next(error);
    }
};

module.exports = {
    createIncidentWithGeocoding,
    updateIncidentWithGeocoding,
    getIncidentByIdWithGeocoding
};
