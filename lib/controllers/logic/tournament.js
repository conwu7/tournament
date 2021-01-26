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
exports.addTeamsLogic = function ({teams, user: admin, tournamentId: _id}) {
    return new Promise(async (resolve, reject) => {
        try {
            const tournament = await TournamentModel.findOne({_id, admin})
                .select('teams hasLeagueFixturesGenerated currentRound')
                .exec();
            if (!tournament) return reject(100);
            console.log(tournament.currentRound);
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
                resolve(res);
            }))
    });
}
// Clear Fixtures - return with string "All Fixtures Cleared"
// ***modify - clear tournament currentRound and shuffledTeams
exports.resetTournament = function ({tournamentId: _id, user: admin}) {
    return new Promise(async (resolve, reject) => {
        try {
            const tournament = await TournamentModel.findOne({_id, admin}).exec();
            if (!tournament) return reject(100);
            if (!tournament.hasLeagueFixturesGenerated && !tournament.currentRound) return reject(109);
            tournament.hasLeagueFixturesGenerated = false;
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
// return a specific tournament
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
