const {body, query, param} = require('express-validator');

// ***modify error handling below
function handleValidationErrors (req, res, next) {
    const errors = require('express-validator').validationResult(req);
    if (errors.isEmpty()) return next();
    const errorsArray = (errors.errors);
    if (errorsArray.length === 1 && !isNaN(parseInt(errorsArray[0].msg))) {
        return next(parseInt(errorsArray[0].msg));
    }
    const errorMessages = errorsArray.reduce(
        (acc, error) => acc.concat(`${error.param.toUpperCase()}: ${error.msg}`),
        ""
    )
    return next({errorMessages});
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
        case 'addTeams' : {
            return [
                tournamentId('param'),
                teamProp('body', 'teamNames'),
                teamProp('body', 'teamLogos'),
                teamProp('body', 'playerNames')
            ]
        }
        case 'createTournament' : {
            const tournamentBoolProps = [
                'useRealTeams', 'isSoccerStyle', 'isKnockout', 'useTwoLegs', 'useAwayGoalsTieBreaker',
                'useGoalsForTieBreaker'
            ];
            return [
                name('body'),
                ...tournamentBoolProps.map(prop => (commonBool('body', prop)))
            ]
        }
        case 'createUser' : {
            return [
                username('body'),
                password('body'),
                email('body'),
            ]
        }
        case 'getSearchResults' : {
            return [
                searchString('query'),
            ]
        }
        case 'getTournament':
        case 'getFixtures':
        case 'deleteTournament':
        case 'generateFixtures': {
            return [
                tournamentId('param')
            ]
        }
        case 'knockoutResult' : {
            return [
                tournamentId('param'),
                results('body')
            ]
        }
        case 'login' : {
            return [
                email('body'),
            ]
        }
        case 'resetCurrentRound' : {
            return [
                tournamentId('param'),
                round('query')
            ]
        }
        case 'updateTournament' : {
            const tournamentBoolProps = [
                'useRealTeams', 'isSoccerStyle', 'isKnockout', 'useTwoLegs', 'useAwayGoalsTieBreaker',
                'useGoalsForTieBreaker'
            ];
            return [
                tournamentId('param'),
                name('body'),
                ...tournamentBoolProps.map(prop => (commonBool('body', prop)))
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
const searchString = (type) =>
    types[type]('searchString').trim().not().isEmpty().isLength({min: 4}).withMessage("Search with at least 4 letters");
const name = (type) =>
    types[type]('name').not().isEmpty().trim().custom(isValidName).isLength({min:2, max:40});
const tournamentId = (type) =>
    types[type]('tournamentId').not().isEmpty().trim().isAlphanumeric();
const teamProp = (type, teamProp) =>
    types[type](teamProp).customSanitizer(parseTeamProperties);
const results = (type) =>
    types[type]('results').not().isEmpty().customSanitizer(parseResults);
const round = (type) =>
    types[type]('round').not().isEmpty().trim().isAlphanumeric().custom(validCurrentRound);
// boolean field that is not required
const commonBool = (type, boolProp) =>
    types[type](boolProp).if(types[type](boolProp).not().isEmpty()).isBoolean();
/*Custom Validators*/
// remove mongodb reserved characters from the beginning of the string
function isValidName (name) {
    if (name[0] === '$' || name[0] === '.') {
        throw 113;
    }
    return true;
}
// check valid format
function validCurrentRound (str) {
    const roundNum = parseInt(str.slice(7));
    if (![1,2,4,8,16,32].includes(roundNum)) throw 903;
    return true;
}
/*
    Custom sanitizers
*/
// parse teams
function parseTeamProperties (propArray) {
    if (!propArray) return propArray;
    try {
        return JSON.parse(propArray);
    } catch (e) {
        throw 900;
    }
}
// parse results
function parseResults (resultsArray) {
    try {
        const parsed = JSON.parse(resultsArray);
        parsed.forEach(result => {
            if (result && !result.every(score => !isNaN(score))) throw 902;
        })
        return parsed;
    } catch (e) {
        if (!isNaN(parseInt(e))) throw e;
        else throw 901;
    }
}
// convert fields to all lowercase
function toLower (str) {
    return str ? str.toLowerCase() : str;
}
