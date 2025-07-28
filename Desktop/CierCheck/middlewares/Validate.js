const validate = (schema) => {
    return (req, res, next) => {
        // FOR TESTING PURPOSES IN POSTMAN
        req.body.currentLocation = JSON.parse(req.body?.currentLocation || '{}');

        try {
            const validatedData = schema.parse(req.body);
            req.body = validatedData;
            next();
        } catch (error) {
            console.log(error);
            if (error) {
                res.status(400).json({
                    status: false,
                    message: 'Validation failed',
                    errors: error.errors.reduce((acc, err) => {
                        const key = Array.isArray(err.path) ? err.path.join('.') : err.path;
                        acc[key] = err.message;
                        return acc;
                    }, {}),
                });
                return;
            }
            res.status(500).json({
                status: false,
                message: 'Internal Server Error',
            });
            return;
        }
    };
};

module.exports = validate;
