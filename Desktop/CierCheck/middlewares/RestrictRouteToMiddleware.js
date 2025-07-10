const AppError = require('../utils/AppError.js');

const RestrictRouteToMiddleware = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.auth.role)) {
            return next(new AppError("You don't have permission to perform this action", 403));
        }
        next();
    };
};

module.exports = RestrictRouteToMiddleware;
