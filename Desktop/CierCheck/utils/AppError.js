const HttpStatusCode = {
    OK: 200,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
};

const ErrorType = {
    VALIDATION: 'VALIDATION_ERROR',
    AUTHENTICATION: 'AUTHENTICATION_ERROR',
    AUTHORIZATION: 'AUTHORIZATION_ERROR',
    NOT_FOUND: 'NOT_FOUND_ERROR',
    DATABASE: 'DATABASE_ERROR',
    INTERNAL: 'INTERNAL_ERROR',
};


class AppError extends Error {
    constructor(message, type, code = HttpStatusCode.INTERNAL_SERVER_ERROR, errors = []) {
        super(message);
        this.message = message;
        this.code = code;
        this.type = type;
        this.errors = errors;
        this.success = false;
        this.isOperational = true;

        // Here i am maintaining  proper stack trace for debugging
        Error.captureStackTrace(this, this.constructor);
    }

    // toJSON() {
    //     const response = {
    //         status: false,
    //         message: this.message,
    //         code: this.code,
    //         type: this.type,
    //         errors: this.errors,
    //     };

    //     if (process.env.NODE_ENV === 'development') {
    //         response.stack = this.stack;
    //     }

    //     return response;
    // }

    // Static factory methods
    static badRequest(message, errors = []) {
        return new AppError(message, ErrorType.VALIDATION, HttpStatusCode.BAD_REQUEST, errors);
    }

    static notFound(message = 'Resource not found') {
        return new AppError(message, ErrorType.NOT_FOUND, HttpStatusCode.NOT_FOUND);
    }

    static unauthorized(message = 'Unauthorized') {
        return new AppError(message, ErrorType.AUTHENTICATION, HttpStatusCode.UNAUTHORIZED);
    }

    static forbidden(message = 'Forbidden') {
        return new AppError(message, ErrorType.AUTHORIZATION, HttpStatusCode.FORBIDDEN);
    }

    static tooManyRequests(message = 'Too many requests') {
        return new AppError(message, ErrorType.VALIDATION, HttpStatusCode.TOO_MANY_REQUESTS);
    }

    static database(message = 'Database operation failed', errors = []) {
        return new AppError(message, ErrorType.DATABASE, HttpStatusCode.INTERNAL_SERVER_ERROR, errors);
    }
}

module.exports = AppError;
