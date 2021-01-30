const errorCodes = require('./error-codes');

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
    next(400);
}
// handle all errors within the /api router
exports.apiRouterErrorHandler = function (err, req, res, next) {
    const success = false;
    res.status(400);
    console.log(err);
    if (!isNaN(Number(err))) return res.json( {success, err: errorCodes(Number(err))} );
    if (err.errorCode) return res.json({success, err: err.message});
    if (
        (err.message && err.message.includes('is already taken'))
        ||
        (typeof err === 'string' && err.includes('is already taken'))
    ) {
        return res.json({success, err: err.message || err});
    }
    res.json({success, err: "Invalid Request or Data"});
}