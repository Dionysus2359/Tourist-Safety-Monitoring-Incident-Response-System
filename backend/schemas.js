const Joi = require('joi');

// User registration validation schema
const userRegistrationSchema = Joi.object({
    name: Joi.string()
        .min(2)
        .max(50)
        .required()
        .messages({
            'string.empty': 'Name is required',
            'string.min': 'Name must be at least 2 characters long',
            'string.max': 'Name must not exceed 50 characters',
            'any.required': 'Name is required'
        }),
    
    username: Joi.string()
        .alphanum()
        .min(3)
        .max(30)
        .required()
        .messages({
            'string.empty': 'Username is required',
            'string.alphanum': 'Username must contain only alphanumeric characters',
            'string.min': 'Username must be at least 3 characters long',
            'string.max': 'Username must not exceed 30 characters',
            'any.required': 'Username is required'
        }),
    
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.empty': 'Email is required',
            'string.email': 'Please provide a valid email address',
            'any.required': 'Email is required'
        }),
    
    password: Joi.string()
        .min(6)
        .max(128)
        .required()
        .messages({
            'string.empty': 'Password is required',
            'string.min': 'Password must be at least 6 characters long',
            'string.max': 'Password must not exceed 128 characters',
            'any.required': 'Password is required'
        }),
    
    phone: Joi.string()
        .pattern(/^[+]?[0-9]{10,15}$/)
        .required()
        .messages({
            'string.empty': 'Phone number is required',
            'string.pattern.base': 'Phone number must be a valid phone number (10-15 digits, optional + prefix)',
            'any.required': 'Phone number is required'
        }),
    
    kycDocNumber: Joi.string()
        .min(10)
        .max(20)
        .required()
        .messages({
            'string.empty': 'KYC document number is required',
            'string.min': 'KYC document number must be at least 10 characters long',
            'string.max': 'KYC document number must not exceed 20 characters',
            'any.required': 'KYC document number is required'
        })
});

// User login validation schema (accepts either username or email)
const userLoginSchema = Joi.object({
    username: Joi.string().allow(null, ''),
    email: Joi.string().email().allow(null, ''),
    password: Joi.string()
        .required()
        .messages({
            'string.empty': 'Password is required',
            'any.required': 'Password is required'
        })
})
.or('username', 'email')
.messages({
    'object.missing': 'Either username or email is required'
});

// Emergency contact validation schema
const emergencyContactSchema = Joi.object({
    name: Joi.string()
        .min(2)
        .max(50)
        .required()
        .messages({
            'string.empty': 'Emergency contact name is required',
            'string.min': 'Emergency contact name must be at least 2 characters long',
            'string.max': 'Emergency contact name must not exceed 50 characters',
            'any.required': 'Emergency contact name is required'
        }),
    
    phone: Joi.string()
        .pattern(/^[+]?[0-9]{10,15}$/)
        .required()
        .messages({
            'string.empty': 'Emergency contact phone is required',
            'string.pattern.base': 'Emergency contact phone must be a valid phone number (10-15 digits, optional + prefix)',
            'any.required': 'Emergency contact phone is required'
        }),
    
    relation: Joi.string()
        .min(2)
        .max(30)
        .required()
        .messages({
            'string.empty': 'Emergency contact relation is required',
            'string.min': 'Emergency contact relation must be at least 2 characters long',
            'string.max': 'Emergency contact relation must not exceed 30 characters',
            'any.required': 'Emergency contact relation is required'
        })
});

// Trip info validation schema
const tripInfoSchema = Joi.object({
    startLocation: Joi.string()
        .min(2)
        .max(100)
        .optional()
        .messages({
            'string.min': 'Start location must be at least 2 characters long',
            'string.max': 'Start location must not exceed 100 characters'
        }),
    
    endLocation: Joi.string()
        .min(2)
        .max(100)
        .optional()
        .messages({
            'string.min': 'End location must be at least 2 characters long',
            'string.max': 'End location must not exceed 100 characters'
        }),
    
    startDate: Joi.date()
        .optional()
        .messages({
            'date.base': 'Start date must be a valid date'
        }),
    
    endDate: Joi.date()
        .min(Joi.ref('startDate'))
        .optional()
        .messages({
            'date.base': 'End date must be a valid date',
            'date.min': 'End date must be after start date'
        })
});

// User profile update validation schema
const userProfileUpdateSchema = Joi.object({
    name: Joi.string()
        .min(2)
        .max(50)
        .optional()
        .messages({
            'string.min': 'Name must be at least 2 characters long',
            'string.max': 'Name must not exceed 50 characters'
        }),
    
    phone: Joi.string()
        .pattern(/^[+]?[0-9]{10,15}$/)
        .optional()
        .messages({
            'string.pattern.base': 'Phone number must be a valid phone number (10-15 digits, optional + prefix)'
        }),
    
    emergencyContacts: Joi.array()
        .items(emergencyContactSchema)
        .optional()
        .messages({
            'array.base': 'Emergency contacts must be an array'
        }),
    
    tripInfo: tripInfoSchema.optional()
});

// Incident creation validation schema
const incidentCreationSchema = Joi.object({
    description: Joi.string()
        .min(10)
        .max(1000)
        .required()
        .messages({
            'string.empty': 'Description is required',
            'string.min': 'Description must be at least 10 characters long',
            'string.max': 'Description must not exceed 1000 characters',
            'any.required': 'Description is required'
        }),
    
    location: Joi.object({
        coordinates: Joi.array()
            .items(Joi.number())
            .length(2)
            .required()
            .messages({
                'array.base': 'Location coordinates must be an array',
                'array.length': 'Location must have exactly 2 coordinates [longitude, latitude]',
                'any.required': 'Location coordinates are required'
            })
    }).required(),
    
    tripId: Joi.string()
        .optional()
        .messages({
            'string.base': 'Trip ID must be a string'
        }),
    
    address: Joi.string()
        .min(5)
        .max(200)
        .optional()
        .messages({
            'string.min': 'Address must be at least 5 characters long',
            'string.max': 'Address must not exceed 200 characters'
        }),
    
    severity: Joi.string()
        .valid('low', 'medium', 'high')
        .optional()
        .messages({
            'any.only': 'Severity must be one of: low, medium, high'
        })
});

// Incident update validation schema
const incidentUpdateSchema = Joi.object({
    description: Joi.string()
        .min(10)
        .max(1000)
        .optional()
        .messages({
            'string.min': 'Description must be at least 10 characters long',
            'string.max': 'Description must not exceed 1000 characters'
        }),
    
    location: Joi.object({
        coordinates: Joi.array()
            .items(Joi.number())
            .length(2)
            .optional()
            .messages({
                'array.base': 'Location coordinates must be an array',
                'array.length': 'Location must have exactly 2 coordinates [longitude, latitude]'
            })
    }).optional(),
    
    address: Joi.string()
        .min(5)
        .max(200)
        .optional()
        .messages({
            'string.min': 'Address must be at least 5 characters long',
            'string.max': 'Address must not exceed 200 characters'
        }),
    
    severity: Joi.string()
        .valid('low', 'medium', 'high')
        .optional()
        .messages({
            'any.only': 'Severity must be one of: low, medium, high'
        }),
    
    status: Joi.string()
        .valid('reported', 'inProgress', 'resolved')
        .optional()
        .messages({
            'any.only': 'Status must be one of: reported, inProgress, resolved'
        })
});

// Geofence creation validation schema
const geofenceCreationSchema = Joi.object({
    center: Joi.object({
        type: Joi.string()
            .valid('Point')
            .required()
            .messages({
                'any.only': 'Center type must be "Point"',
                'any.required': 'Center type is required'
            }),
        coordinates: Joi.array()
            .items(Joi.number())
            .length(2)
            .required()
            .messages({
                'array.base': 'Center coordinates must be an array',
                'array.length': 'Center must have exactly 2 coordinates [longitude, latitude]',
                'any.required': 'Center coordinates are required'
            })
    }).required(),
    
    radius: Joi.number()
        .positive()
        .max(10000) // Maximum 10km radius
        .required()
        .messages({
            'number.base': 'Radius must be a number',
            'number.positive': 'Radius must be a positive number',
            'number.max': 'Radius cannot exceed 10,000 meters (10km)',
            'any.required': 'Radius is required'
        }),
    
    alertType: Joi.string()
        .valid('warning', 'danger')
        .optional()
        .default('warning')
        .messages({
            'any.only': 'Alert type must be either "warning" or "danger"'
        }),
    
    active: Joi.boolean()
        .optional()
        .default(true)
        .messages({
            'boolean.base': 'Active must be a boolean value'
        })
});

// Geofence update validation schema
const geofenceUpdateSchema = Joi.object({
    center: Joi.object({
        type: Joi.string()
            .valid('Point')
            .optional()
            .messages({
                'any.only': 'Center type must be "Point"'
            }),
        coordinates: Joi.array()
            .items(Joi.number())
            .length(2)
            .optional()
            .messages({
                'array.base': 'Center coordinates must be an array',
                'array.length': 'Center must have exactly 2 coordinates [longitude, latitude]'
            })
    }).optional(),
    
    radius: Joi.number()
        .positive()
        .max(10000)
        .optional()
        .messages({
            'number.base': 'Radius must be a number',
            'number.positive': 'Radius must be a positive number',
            'number.max': 'Radius cannot exceed 10,000 meters (10km)'
        }),
    
    alertType: Joi.string()
        .valid('warning', 'danger')
        .optional()
        .messages({
            'any.only': 'Alert type must be either "warning" or "danger"'
        }),
    
    active: Joi.boolean()
        .optional()
        .messages({
            'boolean.base': 'Active must be a boolean value'
        })
});

// Alert creation validation schema
const alertCreationSchema = Joi.object({
    user: Joi.string()
        .required()
        .messages({
            'string.empty': 'User ID is required',
            'any.required': 'User ID is required'
        }),
    
    message: Joi.string()
        .min(5)
        .max(500)
        .required()
        .messages({
            'string.empty': 'Message is required',
            'string.min': 'Message must be at least 5 characters long',
            'string.max': 'Message must not exceed 500 characters',
            'any.required': 'Message is required'
        }),
    
    incident: Joi.string()
        .optional()
        .messages({
            'string.base': 'Incident ID must be a string'
        }),
    
    geofence: Joi.string()
        .optional()
        .messages({
            'string.base': 'Geofence ID must be a string'
        }),
    
    read: Joi.boolean()
        .optional()
        .default(false)
        .messages({
            'boolean.base': 'Read status must be a boolean value'
        })
});

// Alert update validation schema
const alertUpdateSchema = Joi.object({
    read: Joi.boolean()
        .required()
        .messages({
            'boolean.base': 'Read status must be a boolean value',
            'any.required': 'Read status is required'
        })
});

// Validation helper function
const validateRequest = (schema, data) => {
    const { error, value } = schema.validate(data, { abortEarly: false });
    
    if (error) {
        const errorMessage = error.details
            .map(detail => detail.message)
            .join(', ');
        return { isValid: false, error: errorMessage, value: null };
    }
    
    return { isValid: true, error: null, value };
};

module.exports = {
    userRegistrationSchema,
    userLoginSchema,
    userProfileUpdateSchema,
    incidentCreationSchema,
    incidentUpdateSchema,
    geofenceCreationSchema,
    geofenceUpdateSchema,
    alertCreationSchema,
    alertUpdateSchema,
    validateRequest
};