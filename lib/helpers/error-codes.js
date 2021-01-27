function errorCodes (code) {
    switch (parseInt(code)) {
        // 1 to 99 - users
        case (1) : return 'Invalid credentials'
        case (2) : return 'A user is already logged in. Logout first before logging in with a different user'
        case (3) : return 'no-user'
        // 100 to 199 - tournament, fixtures
        case (100) : return 'Tournament not found'
        case (101) : return 'Tournament has been completed'
        case (102) : return 'Tournament is not knockout'
        case (103) : return 'Minimum of 4 teams is required'
        case (104) : return 'Could not generate a valid starting round'
        case (105) : return 'Cannot change teams unless fixtures are cleared'
        case (106) : return 'You already have a tournament with the same name'
        case (107) : return 'Tournament is not a league'
        case (108) : return 'League fixtures have already been generated'
        case (109) : return 'No fixtures generated yet'
        case (110) : return 'Team details are not in the correct format'
        case (111) : return 'Max of 32 teams is allowed'
        case (112) : return "Some participants don't have a team name"
        case (113) : return `Names cannot start with '$' or '.'`
        case (114) : return 'Results are not in the correct format'
        case (115) : return 'No fixtures found'
        case (116) : return `Number of results doesn't match current round`
        case (117) : return 'Tiebreaker match cannot be a tie'
        case (118) : return `Tournament has a current round but no fixtures were found. To resolve this, reset the fixtures`
        case (119) : return 'Some matches are incomplete'
        case (120) : return `Round query does not match current round`
        case (121) : return `Number of teams needed for next round is invalid`
        // 400 to 500 - misc
        case (400) : return 'Invalid request or path'
        // 900 to 999 - validation
        case (900) : return 'Validation: Team details are not in the correct format'
        case (901) : return 'Validation: Results are not in the correct format'
        case (902) : return 'Validation: Results contain non-number characters'
        case (903) : return 'Validation: Invalid current round'
        default : return 'unknown error'
    }
}
module.exports = errorCodes;