const sendError = (error, res) => {
    const errorObj = {
        success: error.success,
        message: error.message,
        error: error,
        stack: error.stack,
    };
    if (errorObj.index !== '') {
        errorObj.index = error.index;
    }
    console.error('ERROR 😈 - ', error);
    return res.status(error.statusCode).json(errorObj);
};

const ErrorController = (error, req, res, next) => {
    error.statusCode = error.statusCode || 500;
    error.success = false;
    sendError(error, res);
};

module.exports = ErrorController;
