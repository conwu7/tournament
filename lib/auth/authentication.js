// Passport authentication and session (including session store) configuration

const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const UserModel = require('../db/models/users');
const bcrypt = require('bcrypt');
const MongoStore = require('connect-mongo')(session);

/*
create session store
set passport authentication for local strategy
set session options
initialize passport
*/

function initializeAuth (app, db) {
    const sessionStore = new MongoStore({
        mongooseConnection: db,
        collection: 'sessions'
    });
    passport.use(
        new LocalStrategy(
            {
                usernameField: 'email'
            },
            (username, password, done) => {
                UserModel.findOne({email: username})
                    .exec((error, user) => {
                        if (error) return done(error);
                        if (!user) return done(null, false, {msg: "Invalid User"});
                        bcrypt.compare(password, user.hash)
                            .then(isMatched => isMatched ? done(null, user) : done(null, false, {msg: "Invalid Credentials"}))
                            // this is called even if there is a match
                            .catch(error => error ? done(null, false, {msg: error.message}) : undefined);
                    })
        })
    )
    passport.serializeUser((user, done) => done(null, user.id));
    passport.deserializeUser((id, done) =>
        UserModel.findById(id).exec((error, user)=>done(error, user)));
    app.use(session(
        {
            secret: process.env.SESSION_KEY,
            resave: false,
            saveUninitialized: true,
            store: sessionStore,
            cookie: {
                sameSite: 'none',
                maxAge: parseInt(process.env.SESSION_MAX_AGE, 10)
            }
        }
    ))
    app.use(passport.initialize());
    app.use(passport.session());
}

module.exports = initializeAuth;

