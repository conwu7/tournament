const bcrypt = require('bcrypt');
const passport = require('passport');
const UserModel = require('../../db/models/users');
const {validate} = require('../../helpers/validation');

// create user, hash password. req.body must contain username, password and email
exports.createUserLogic =
    function ({username, email, password}) {
        return new Promise((resolve, reject) => {
            const SALT_ROUNDS = 10;
            bcrypt.hash(password, SALT_ROUNDS)
                .then((hash) => {
                    const newUser = new UserModel({username, hash, email});
                    newUser.save((err, user) => {
                        if (err) return reject(err.message);
                        resolve(user);
                    })
                })
                .catch(err => reject(err))
        })
    }
// respond with username - NEVER RETURN USER
exports.getUserDetailsLogic =
    async function ({user}) {
        return new Promise((resolve, reject) => {
            if (!user) return reject(3);
            const username = user.username;
            resolve({username});
        })
}