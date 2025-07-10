const AppError = require('../utils/AppError');

const DeviceMiddleware = async (req, res, next) => {
    try {
        const deviceModel = req.headers.devicemodel;
        if (!deviceModel) {
            return next(AppError.unauthorized('No device model provided'));
        }

        const deviceUniqueId = req.headers.deviceuniqueid;
        if (!deviceUniqueId) {
            return next(AppError.unauthorized('No device ID provided'));
        }
        next();
    } catch (error) {
        console.error(error);
        return next(AppError.database('Server error'));
    }
};

module.exports = DeviceMiddleware;
