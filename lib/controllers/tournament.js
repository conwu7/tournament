const {createTournamentLogic, addTeamsLogic, getTournament, resetCurrentRound,
    resetTournament, getUserAdminTournaments, deleteTournament} = require('./logic/tournament');
const {generateKnockoutFixturesLogic, generateLeagueFixturesLogic,
        getFixturesLogic} = require('./logic/fixtures');
const {addLeagueResultLogic, addKnockoutResultLogic} = require('./logic/results');
const {validate} = require('../helpers/validation');
const {commonController} = require('../helpers/controllers');

exports.createTournament = [
    validate('createTournament'),
    commonController(createTournamentLogic, true)
];
exports.deleteTournament = [
    validate('deleteTournament'),
    commonController(deleteTournament, false, true)
]
exports.addTeams = [
    validate('addTeams'),
    commonController(addTeamsLogic, true, true)
];
exports.generateKnockoutFixtures = [
    validate('generateFixtures'),
    commonController(generateKnockoutFixturesLogic, false, true)
];
exports.generateLeagueFixtures = [
    validate('generateFixtures'),
    commonController(generateLeagueFixturesLogic, false, true)
];
exports.addLeagueResults = [
    validate('leagueResult'),
    commonController(addLeagueResultLogic, true, true)
];
exports.addKnockoutResults = [
    validate('knockoutResult'),
    commonController(addKnockoutResultLogic, true, true)
]
exports.resetTournamentFixtures = [
    validate('reset'),
    commonController(resetTournament, true, true)
];
exports.resetCurrentRoundFixtures = [
    validate('resetCurrentRound'),
    commonController(resetCurrentRound, false, true, true)
]
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