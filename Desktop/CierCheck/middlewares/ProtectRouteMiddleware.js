const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError.js');
const UserModel = require('../models/UserModel.js');

const ProtectRouteMiddleware = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) next(AppError.unauthorized('Unauthorized - Please relogin'));

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Decoded token:', decoded);
        } catch (error) {
            return next(AppError.unauthorized('Unauthorized - Please relogin'));
        }

        if (decoded.role === 'patient' || decoded.role === 'doctor') {
            const user = await UserModel.findOne({
                _id: decoded.user,
            });
            if (!user) {
                throw AppError.unauthorized(`No such ${decoded.role} found - Access denied`);
            }

            req.user = user;
        } else {
            throw AppError.unauthorized('No such user found - Access denied');
        }

        // req.session = loggedDeviceRecord;
        // req.auth = signUpRecord;

        next();
    } catch (error) {
        next(error);
    }
};

module.exports = ProtectRouteMiddleware;
