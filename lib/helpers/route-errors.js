exports.errorHandler = function (err, req, res, next) {
    // handles errors for all server wide errors that are not individually handled by routes
    const error = req.app.get('env') === 'development' ? err : {};
    res.status(error.status || 500);
    res.send('Internal Server Error');
}
exports.noPageHandler = function (req, res, next) {
    res.status(404);
    res.send('404: Invalid page');
}
// handle invalid /api requests or paths
exports.apiRouterInvalidRequestHandler = function (req, res, next) {
    next('Invalid request or path');
}
// handle all errors within the /api router
exports.apiRouterErrorHandler = function (err, req, res, next) {
    // ***modify - Probably should find a way to better handle the different kind of errors
    // Error coming from validation handler is Array
    // Error coming from controllers are either string (user defined) or objects (some system error)
    res.status(err === 'no-user' ? 401 : 400);
    const errorMessage = (typeof err === 'string' || Array.isArray(err)) ? err : err.message;
    res.json({success: false, err: errorMessage});
}