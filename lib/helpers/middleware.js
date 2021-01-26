// return success: false when no user is logged in. For protected routes
exports.onlySignedInUsers = function (req, res, next) {
    if (!req.user) return next(3);
    next();
}