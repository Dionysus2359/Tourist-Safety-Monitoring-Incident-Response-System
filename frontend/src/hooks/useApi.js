import { useState, useCallback } from 'react';

/**
 * Custom hook for API calls with loading states and error handling
 * @param {Function} apiFunction - The API function to call
 * @param {Object} options - Configuration options
 * @returns {Object} - { data, loading, error, execute, reset }
 */
export const useApi = (apiFunction, options = {}) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const {
        onSuccess,
        onError,
        initialData = null,
        resetOnExecute = false
    } = options;

    const execute = useCallback(async (...args) => {
        try {
            setLoading(true);
            setError(null);

            if (resetOnExecute) {
                setData(initialData);
            }

            const response = await apiFunction(...args);

            if (response.data) {
                setData(response.data);
                if (onSuccess) {
                    onSuccess(response.data);
                }
            }

            return response;
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'An error occurred';
            setError(errorMessage);

            if (onError) {
                onError(err);
            }

            throw err; // Re-throw to allow component-level error handling
        } finally {
            setLoading(false);
        }
    }, [apiFunction, onSuccess, onError, initialData, resetOnExecute]);

    const reset = useCallback(() => {
        setData(initialData);
        setError(null);
        setLoading(false);
    }, [initialData]);

    return {
        data,
        loading,
        error,
        execute,
        reset
    };
};

/**
 * Hook for form submissions with validation
 * @param {Function} submitFunction - The submit function
 * @param {Object} validationSchema - Joi or similar validation schema
 * @returns {Object} - Form state and handlers
 */
export const useFormSubmit = (submitFunction, validationSchema = null) => {
    const [formData, setFormData] = useState({});
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

    const { execute, loading, error, data } = useApi(submitFunction, {
        onError: (err) => {
            if (err.response?.status === 400 && err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            }
        }
    });

    const handleChange = useCallback((name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    }, [errors]);

    const handleBlur = useCallback((name) => {
        setTouched(prev => ({ ...prev, [name]: true }));
    }, []);

    const validate = useCallback(() => {
        if (!validationSchema) return true;

        try {
            // Assuming Joi validation
            if (typeof validationSchema === 'function') {
                const { error } = validationSchema.validate(formData, { abortEarly: false });
                if (error) {
                    const validationErrors = {};
                    error.details.forEach(detail => {
                        validationErrors[detail.path[0]] = detail.message;
                    });
                    setErrors(validationErrors);
                    return false;
                }
            }
            return true;
        } catch (err) {
            console.error('Validation error:', err);
            return false;
        }
    }, [formData, validationSchema]);

    const handleSubmit = useCallback(async (e) => {
        e?.preventDefault();

        if (!validate()) return;

        try {
            await execute(formData);
            setErrors({});
        } catch (err) {
            // Error already handled by useApi
        }
    }, [formData, execute, validate]);

    const reset = useCallback(() => {
        setFormData({});
        setErrors({});
        setTouched({});
    }, []);

    return {
        formData,
        errors,
        touched,
        loading,
        error,
        data,
        handleChange,
        handleBlur,
        handleSubmit,
        reset,
        setFormData
    };
};
