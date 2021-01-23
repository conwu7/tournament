const {createUserLogic, getUserDetailsLogic} = require('./logic/users');
const {validate} = require('../helpers/validation');
const passport = require('passport');

exports.createUser = [
    validate('createUser'),
    async function (req, res, next) {
        try {
            const user = await createUserLogic(req.body);
            req.login(user, err => {
                if (err) return next(err.message);
                res.json({success: true});
            })
        } catch (e) {
            next(e);
        }
    }
];
exports.login = [
    validate('login'),
    function (req, res, next) {
        if (req.user) return next('A user is already logged in. Logout first before logging in with a different user');
        passport.authenticate(
            'local',
            (err, user) => {
                if (err) return next(err.message);
                if (!user) return next("Invalid Credentials");
                req.login(user, (err) => {
                    if (err) return next(err.message);
                    return res.json({success: true});
                });
            }
        )(req, res, next);
    }
];
// logout from session
exports.logout = function (req, res) {
    req.logout();
    res.json({success: true});
}
exports.getUserDetails = async function (req, res, next) {
    try {
        const userDetails = await getUserDetailsLogic(req.user);
        res.json({
            success: true,
            result: userDetails
        })
    } catch (e) {
        next(e);
    }
}