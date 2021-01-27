const TournamentModel = require('../../db/models/tounament');
const FixtureModel = require('../../db/models/fixtures');

// create tournament and return the name
exports.createTournamentLogic =
    async function ({name, user: admin, useRealTeams, usePlayerNames, isSoccerStyle, isKnockout,
                    useTwoLegs, useGoalsForTieBreaker, useAwayGoalsTieBreaker}) {
        return new Promise(async (resolve, reject) => {
            const existingTournament = await TournamentModel.findOne(
                {admin, name}
            ).exec();
            if (existingTournament) return reject(106);
            const newTournament = new TournamentModel({
                name, admin, useRealTeams, usePlayerNames, isSoccerStyle, isKnockout,
                useTwoLegs, useGoalsForTieBreaker, useAwayGoalsTieBreaker,
                teams: []
            });
            newTournament.save((err, doc) => {
                if (err) return reject(err);
                const {name, _id} = doc;
                resolve({name, _id});
            })
        });
    }
// Overwrite the teams in the tournament document
exports.addTeamsLogic = function ({teamNames, teamLogos, playerNames, user: admin, tournamentId: _id}) {
    return new Promise(async (resolve, reject) => {
        try {
            const tournament = await TournamentModel.findOne({_id, admin})
                .select('teams hasLeagueFixturesGenerated currentRound')
                .exec();
            if (!tournament) return reject(100);
            if (!(teamNames instanceof Array)) return reject(110);
            if (teamLogos && !(teamLogos instanceof Array)) return reject(110);
            if (playerNames && !(playerNames instanceof Array)) return reject(110);
            if (teamNames.length > 32) return reject(111);
            let teams = [];
            for (let i = 0; i < teamNames.length; i++) {
                teams[i] = {
                    teamName: teamNames[i],
                    teamLogo: teamLogos && teamLogos[i],
                    playerName: playerNames && playerNames[i]
                }
            }
            if (tournament.hasLeagueFixturesGenerated || tournament.currentRound) return reject(105);
            tournament.teams = teams;
            await tournament.save();
            resolve(tournament);
        } catch (e) {
            reject(e);
        }
    });
}
// Delete Tournament
exports.deleteTournament = function ({tournamentId: _id, user: admin}) {
    return new Promise((resolve, reject) => {
        TournamentModel.findOneAndDelete({_id, admin})
            .select('name')
            .exec(((err, res) => {
                if (err) return reject(err);
                if (!res) return reject(100)
                resolve(res);
            }))
    });
}
/*
Clear Fixtures - return with string "All Fixtures Cleared"
*/
exports.resetTournament = function ({tournamentId: _id, user: admin}) {
    return new Promise(async (resolve, reject) => {
        try {
            const tournament = await TournamentModel.findOne({_id, admin}).exec();
            if (!tournament) return reject(100);
            if (!tournament.hasLeagueFixturesGenerated && !tournament.currentRound) return reject(109);
            tournament.hasLeagueFixturesGenerated = false;
            tournament.isComplete = false;
            tournament.currentRound = undefined;
            await FixtureModel.findOneAndDelete({tournament: _id, admin}).exec();
            await tournament.save();
            resolve('All fixtures cleared')
        } catch (e) {
            reject(e);
        }
        FixtureModel.findOneAndDelete({tournament: _id, admin})
            .exec(((err, res) => {
                if (err) return reject(err);
                resolve(`All fixtures cleared`);
            }))
    });
}
/*
Clear the current round and essentially move back to the previous round
'all previous round fixtures will remain intact'
*/
exports.resetCurrentRound = function ({tournamentId: _id, user: admin, round}) {
    return new Promise(async (resolve, reject) => {
        try {
            const fixtures = await FixtureModel.findOne({tournament: _id, admin}).exec();
            if (!fixtures) return reject(115);
            const currentRound = fixtures.currentRound;
            if (!currentRound) return reject(109);
            if (round !== currentRound) return reject(120);
            const tournament = await TournamentModel.findById(_id).exec();
            if (!tournament) return reject(100);
            const newRound = `roundOf${parseInt(currentRound.slice(7))*2}`;
            fixtures[currentRound] = [];
            fixtures.currentRound = tournament.currentRound = newRound;
            tournament.isComplete = fixtures.isComplete = false;
            await Promise.all([fixtures.save(), tournament.save()]);
            resolve(`${currentRound} fixtures have been cleared`);
        } catch (e) {
            reject(e);
        }
    })
}
/*
Retrieve a specific tournament
*/
exports.getTournament = function ({tournamentId}) {
    return new Promise((resolve, reject) => {
        TournamentModel.findById(tournamentId)
            .select('-admin')
            .exec((err, res) => {
                if (err) return reject(err);
                resolve({res});
            })
    });
}
// return all tournaments where user is admin
exports.getUserAdminTournaments = function ({user: admin}) {
    return new Promise((resolve, reject) => {
        TournamentModel.find({admin})
            .select('-admin')
            .exec((err, res) => {
                if (err) return reject(err);
                resolve(res);
            })
    });
}
