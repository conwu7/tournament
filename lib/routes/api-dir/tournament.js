const {onlySignedInUsers} = require('../../helpers/middleware');
const controller = require('../../controllers/tournament');
const express = require('express');
const router = express.Router();

router.get('/myTournaments', onlySignedInUsers, controller.getMyTournaments);
router.get('/:tournamentId/leagueTable', controller.getLeagueTableData);
router.get('/:tournamentId/fixtures', controller.getFixtures);
router.get('/:tournamentId/isFavorite', onlySignedInUsers, controller.isTournamentAFavorite);
router.get('/:tournamentId', controller.getTournament);
router.put('/:tournamentId/leagueResults', onlySignedInUsers, controller.addLeagueResults);
router.put('/:tournamentId/knockoutResults', onlySignedInUsers, controller.addKnockoutResults);
router.put('/:tournamentId', onlySignedInUsers, controller.updateTournament);
router.post('/:tournamentId/teams', onlySignedInUsers, controller.addTeams);
router.post('/:tournamentId/leagueFixtures', onlySignedInUsers, controller.generateLeagueFixtures);
router.post('/:tournamentId/knockoutFixtures', onlySignedInUsers, controller.generateKnockoutFixtures);
router.post('/:tournamentId/favorites', onlySignedInUsers, controller.addToFavorites);
router.post('/', onlySignedInUsers, controller.createTournament);
router.delete('/:tournamentId/resetAllFixtures', onlySignedInUsers, controller.resetTournamentFixtures);
router.delete('/:tournamentId/resetRound', onlySignedInUsers, controller.resetCurrentRoundFixtures);
router.delete('/:tournamentId/favorites', onlySignedInUsers, controller.removeFromFavorites);
router.delete('/:tournamentId', onlySignedInUsers, controller.deleteTournament);

module.exports = router;