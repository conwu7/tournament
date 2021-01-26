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
        case 'getTournament':
        case 'getFixtures':
        case 'deleteTournament':
        case 'generateFixtures': {
            return [
                tournamentId('param')
            ]
        }
        case 'addTeams' : {
            return [
                tournamentId('param'),
                teams('body')
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
const teams = (type) =>
    types[type]('teams').customSanitizer(parseTeams);
// boolean field that is not required
const commonBool = (type, boolProp) =>
    types[type](boolProp).if(types[type](boolProp).not().isEmpty()).isBoolean();
/*Custom Validators*/
// remove mongodb reserved characters from the beginning of the string
function isValidName (name) {
    if (name[0] === '$' || name[0] === '.') {
        throw new Error(`Names cannot start with '$' or '.'`);
    }
    return true;
}
/*
    Custom sanitizers
*/
// parse teams
function parseTeams (teams) {
    let teamsArray = [];
    const splitTeams = teams.split("||");
    splitTeams.forEach(team => {
        const [teamName, teamLogo, playerName] = team.split("**");
        teamsArray.push({teamName, teamLogo, playerName});
    })
    return teamsArray;
}
// convert fields to all lowercase
function toLower (str) {
    return str ? str.toLowerCase() : str;
}
