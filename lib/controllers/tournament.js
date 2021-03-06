const {
    createTournamentLogic,
    addTeamsLogic,
    getTournament,
    resetCurrentRound,
    resetTournament,
    getUserAdminTournaments,
    deleteTournament,
    updateTournamentLogic,
    getMyTournaments,
    addToFavoritesLogic,
    removeFromFavoritesLogic,
    isTournamentAFavorite,
    searchForTournaments,
    exploreTournaments
} = require('./logic/tournament');
const {generateKnockoutFixturesLogic, generateLeagueFixturesLogic,
        getFixturesLogic, getLeagueTableDataLogic} = require('./logic/fixtures');
const {addLeagueResultLogic, addKnockoutResultLogic} = require('./logic/results');
const {validate} = require('../helpers/validation');
const {commonController} = require('../helpers/controllers');

exports.createTournament = [
    validate('createTournament'),
    commonController(createTournamentLogic, true)
];
exports.updateTournament = [
    validate('updateTournament'),
    commonController(updateTournamentLogic, true, true)
];
exports.deleteTournament = [
    validate('deleteTournament'),
    commonController(deleteTournament, false, true)
];
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
    validate('leagueResults'),
    commonController(addLeagueResultLogic, true, true)
];
exports.addKnockoutResults = [
    validate('knockoutResults'),
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
exports.getLeagueTableData = [
    validate('getTournament'),
    commonController(getLeagueTableDataLogic, false, true)
]
exports.getUserAdminTournaments = [
    commonController(getUserAdminTournaments)
];
exports.getMyTournaments = [
    commonController(getMyTournaments)
];
exports.addToFavorites = [
    validate('favorites'),
    commonController(addToFavoritesLogic, false, true)
];
exports.removeFromFavorites = [
    validate('favorites'),
    commonController(removeFromFavoritesLogic, false, true)
];
exports.isTournamentAFavorite = [
    validate('favorites'),
    commonController(isTournamentAFavorite, false, true)
];
exports.searchForTournaments = [
    validate('getSearchResults'),
    commonController(searchForTournaments, false, false, true)
];
exports.exploreTournaments = [
    commonController(exploreTournaments)
]
