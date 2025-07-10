const EmailMiddleware = async (req, res, next) => {
    if (req?.body?.email) {
        req.body.email = req.body.email.toLowerCase();
    }
    next();
};

module.exports = EmailMiddleware;
