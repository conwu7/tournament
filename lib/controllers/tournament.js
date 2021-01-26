const {createTournamentLogic, addTeamsLogic, getTournament,
    resetTournament, getUserAdminTournaments, deleteTournament} = require('./logic/tournament');
const {generateKnockoutFixturesLogic, generateLeagueFixturesLogic,
        getFixturesLogic} = require('./logic/fixtures');
const {validate} = require('../helpers/validation');
const {commonController} = require('../helpers/controllers');

exports.createTournament = [
    validate('createTournament'),
    commonController(createTournamentLogic)
];
exports.deleteTournament = [
    validate('deleteTournament'),
    commonController(deleteTournament, false, true)
]
exports.addTeams = [
    validate('addTeams'),
    commonController(addTeamsLogic, true)
];
exports.generateKnockoutFixtures = [
    validate('generateFixtures'),
    commonController(generateKnockoutFixturesLogic, false, true)
];
exports.generateLeagueFixtures = [
    validate('generateFixtures'),
    commonController(generateLeagueFixturesLogic, false, true)
]
exports.resetTournamentFixtures = [
    validate('reset'),
    commonController(resetTournament, true)
];
exports.getTournament = [
    validate('getTournament'),
    commonController(getTournament, false, true)
];
exports.getFixtures = [
    validate('getFixtures'),
    commonController(getFixturesLogic, false, true)
]
exports.getUserAdminTournaments = [
    commonController(getUserAdminTournaments)
];