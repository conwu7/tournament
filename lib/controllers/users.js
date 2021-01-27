const {createUserLogic, getUserDetailsLogic} = require('./logic/users');
const {validate} = require('../helpers/validation');
const {sendSuccess, commonController} = require('../helpers/controllers');
const passport = require('passport');

exports.createUser = [
    validate('createUser'),
    async function (req, res, next) {
        try {
            const user = await createUserLogic(req.body);
            req.login(user, err => {
                if (err) return next(err.message);
                sendSuccess(res);
            })
        } catch (e) {
            next(e);
        }
    }
];
exports.login = [
    validate('login'),
    function (req, res, next) {
        if (req.user) return next(2);
        passport.authenticate(
            'local',
            (err, user) => {
                if (err) return next(err.message);
                if (!user) return next(1);
                req.login(user, (err) => {
                    if (err) return next(err.message);
                    return sendSuccess(res);
                });
            }
        )(req, res, next);
    }
];
// logout from session
exports.logout = function (req, res) {
    req.logout();
    sendSuccess(res);
}
exports.getUserDetails = commonController(getUserDetailsLogic);