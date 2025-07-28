const sendError = (error, res) => {
    const statusCode = error.code || error.statusCode || 500;

    const errorObj = {
        success: error.success || false,
        message: error.message || 'Something went wrong',
        error: {
            code: statusCode,
            type: error.type || 'INTERNAL_ERROR',
            errors: error.errors || [],
        },
        stack: error.stack,
        statusCode
    };
    if (errorObj.index !== '') {
        errorObj.index = error.index;
    }
    console.error('ERROR 😈 - ', error);
    return res.status(statusCode).json(errorObj);
};

const ErrorController = (error, req, res, next) => {
    sendError(error, res);
};

module.exports = ErrorController;
