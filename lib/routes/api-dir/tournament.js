const {onlySignedInUsers} = require('../../helpers/middleware');
const controller = require('../../controllers/tournament');
const express = require('express');
const router = express.Router();

router.get('/myTournaments', onlySignedInUsers, controller.getUserAdminTournaments);
router.get('/:tournamentId/fixtures', controller.getFixtures);
router.get('/:tournamentId', controller.getTournament);
router.post('/:tournamentId/teams', onlySignedInUsers, controller.addTeams);
router.post('/:tournamentId/leagueFixtures', onlySignedInUsers, controller.generateLeagueFixtures);
router.post('/:tournamentId/knockoutFixtures', onlySignedInUsers, controller.generateKnockoutFixtures);
router.post('/', onlySignedInUsers, controller.createTournament);
router.delete('/:tournamentId/resetFixtures', onlySignedInUsers, controller.resetTournamentFixtures);
router.delete('/:tournamentId', onlySignedInUsers, controller.deleteTournament);

module.exports = router;