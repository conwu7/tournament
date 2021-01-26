function errorCodes (code) {
    switch (parseInt(code)) {
        // 1 to 99 - users
        case (1) : return 'Invalid credentials'
        case (2) : return 'A user is already logged in. Logout first before logging in with a different user'
        case (3) : return 'no-user'
        // 100 to 199 - tournament
        case (100) : return 'Tournament not found'
        case (101) : return 'Tournament has been completed'
        case (102) : return 'Tournament is not knockout'
        case (103) : return 'Not enough teams yet'
        case (104) : return 'Could not generate a valid starting round'
        case (105) : return 'Cannot change teams unless fixtures are cleared'
        case (106) : return 'You already have a tournament with the same name'
        case (107) : return 'Tournament is not a league'
        case (108) : return 'League fixtures have already been generated'
        case (109) : return 'No fixtures generated yet'
        // 200 to 299 - fixtures
        // 400 to 500 - misc
        case (400) : return 'Invalid request or path'
        default : return 'unknown error'
    }
}
module.exports = errorCodes;