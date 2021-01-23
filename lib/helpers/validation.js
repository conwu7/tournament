const {body, query, param} = require('express-validator');

// ***modify error handling below
function handleValidationErrors (req, res, next) {
    const errors = require('express-validator').validationResult(req);
    if (errors.isEmpty()) return next();
    const errorsArray = (errors.errors);
    const errorMessages = errorsArray.reduce(
        (acc, error) => acc.concat(`${error.param.toUpperCase()}: ${error.msg}`),
        []
    )
    return next(errorMessages);
}

// can pass multiple methods to validate
// returns array of middleware functions and handleValidationError
exports.validate = (...methods) => {
    let middlewareArray = methods.reduce((acc, method) => {
        return acc.concat(validateMethod(method));
    }, [])
    return middlewareArray.concat(handleValidationErrors);
}
// validate fields in req.body or req.params or req.query
// returns array of middleware functions
function validateMethod (method) {
    switch (method) {
        case 'createUser' : {
            return [
                username('body'),
                password('body'),
                email('body'),
            ]
        }
        case 'login' : {
            return [
                email('body'),
            ]
        }
        case 'getSearchResults' : {
            return [
                searchString('query'),
            ]
        }
        case 'feedback' : {
            return [
                feedbackType('body'),
                feedbackMessage('body'),
            ]
        }
        default : {
            return []
        }
    }
}
// Types - body, query or param. Used in field functions.
const types = {'body': body, 'query': query, 'param': param} // these are the express-validator functions
/*Field functions*/
const username = (type) =>
    types[type]('username').trim().not().isEmpty().isLength({min: 3, max: 20}).isAlphanumeric().customSanitizer(toLower);
const password = (type) =>
    types[type]('password').not().isEmpty().isLength({min: 6, max: 128});
const email = (type) =>
    types[type]('email').trim().not().isEmpty().isEmail().normalizeEmail();
const feedbackType = (type) =>
    types[type]('feedbackType').not().isEmpty().trim().custom(isValidFeedbackType);
const feedbackMessage = (type) =>
    types[type]('feedbackMessage').not().isEmpty().trim().isLength({max: 500});
const searchString = (type) =>
    types[type]('searchString').trim().not().isEmpty().isLength({min: 4}).withMessage("Search with at least 4 letters");
/*Custom Validators*/
// check if listCategory is valid - Required to find the right collection to query in lists controller
function isValidFeedbackType (type) {
    if (!['bugs', 'featureRequest', 'generalFeedback'].includes(type)) {
        throw new Error('Invalid Feedback Type');
    }
    return true;
}
/*
    Custom sanitizers
*/
// convert fields to all lowercase
function toLower (str) {
    return str ? str.toLowerCase() : str;
}