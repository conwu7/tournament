const TournamentModel = require('../../db/models/tounament');
const FixtureModel = require('../../db/models/fixtures');
const FavoritesModel = require('../../db/models/favorites');

/*
create tournament and return the name
*/
exports.createTournamentLogic =
    function ({name, user: admin, useRealTeams, usePlayerNames, isSoccerStyle, isKnockout,
                  useTwoLegs, useOneFinal, useGoalsForTieBreaker, useAwayGoals}) {
        return new Promise(async (resolve, reject) => {
            try {
                const existingTournament = await TournamentModel.findOne(
                    {admin, name}
                ).exec();
                if (existingTournament) return reject(106);
                const newTournament = new TournamentModel({
                    name, admin, useRealTeams, usePlayerNames, isSoccerStyle, isKnockout,
                    useTwoLegs, useOneFinal, useGoalsForTieBreaker, useAwayGoals,
                    teams: []
                });
                const {newName, _id} = await newTournament.save();
                resolve({name: newName, _id});
            } catch (e) {
                reject(e)
            }
        });
    }
/*
Update a tournament
*/
exports.updateTournamentLogic =
    function ({tournamentId: _id, name, user: admin, useRealTeams, usePlayerNames, isSoccerStyle, isKnockout,
                  useTwoLegs, useOneFinal, useGoalsForTieBreaker, useAwayGoals}) {
        return new Promise(async (resolve, reject) => {
            try {
                const tournament = await TournamentModel.findOne({_id, admin}).exec();
                if (!tournament) return reject(100);
                let message;
                Object.assign(tournament, {
                    name
                })
                if (!tournament.hasFixturesGenerated && !tournament.currentRound) {
                    Object.assign(tournament, {
                        useRealTeams, usePlayerNames, isSoccerStyle, isKnockout,
                        useTwoLegs, useOneFinal, useGoalsForTieBreaker, useAwayGoals,
                    });
                    message = 'Changes made to the tournament have been saved'
                }
                await tournament.save();
                resolve(message || "Name updated. Unable to save other changes as tournament has fixtures generated");
            } catch (e) {
                reject(e);
            }
        });
    }
/*
Overwrite the teams in the tournament document
*/
exports.addTeamsLogic = function ({teamNames, teamLogos, playerNames, user: admin, tournamentId: _id}) {
    return new Promise(async (resolve, reject) => {
        try {
            const tournament = await TournamentModel.findOne({_id, admin})
                .select('teams hasLeagueFixturesGenerated currentRound')
                .exec();
            if (!tournament) return reject(100);
            if (teamNames.length > 32) return reject(111);
            let teams = [];
            for (let i = 0; i < teamNames.length; i++) {
                teams[i] = {
                    teamName: teamNames[i],
                    teamLogo: teamLogos && teamLogos[i],
                    playerName: playerNames && playerNames[i]
                }
            }
            if (tournament.hasLeagueFixturesGenerated || tournament.currentRound) {
                tournament.teams.forEach((team, index) => {
                    team.teamLogo = teams[index].teamLogo;
                    team.playerName = teams[index].playerName;
                })
            } else tournament.teams = teams;
            await tournament.save();
            resolve(tournament);
        } catch (e) {
            reject(e);
        }
    });
}
/*
Delete Tournament
*/
exports.deleteTournament = function ({tournamentId: _id, user: admin}) {
    return new Promise((resolve, reject) => {
        FixtureModel.findOneAndDelete({tournament: _id, admin})
            .exec(((err, res) => {
                if (err) return reject(err);
            }));
        TournamentModel.findOneAndDelete({_id, admin})
            .select('name')
            .exec(((err, res) => {
                if (err) return reject(err);
                if (!res) return reject(100)
                resolve(res);
            }));
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
            tournament.isComplete = fixtures.isComplete = false;
            // if current round is the starting round, simply delete fixtures document
            if (round === tournament.startingRound) {
                tournament.currentRound = "";
                await Promise.all([fixtures.deleteOne(), tournament.save()]);
            } else {
                const newRound = `roundOf${parseInt(currentRound.slice(7))*2}`;
                fixtures[currentRound] = [];
                fixtures.currentRound = tournament.currentRound = newRound;
                await Promise.all([fixtures.save(), tournament.save()]);
            }
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
            .populate('admin', 'username -_id')
            .exec((err, res) => {
                if (err) return reject(err);
                resolve(res);
            })
    });
}
/*
Add tournament to favorites
 */
exports.addToFavoritesLogic = function ({tournamentId, user}) {
    return new Promise(async (resolve, reject) => {
        try {
            const favDocument = await FavoritesModel.findOne({user}).exec();
            if (!favDocument) {
                const newFavDocument = new FavoritesModel({
                    user,
                    tournaments: [tournamentId]
                });
                await newFavDocument.save();
            } else {
                favDocument.tournaments = [...(new Set(favDocument.tournaments).add(tournamentId))];
                await favDocument.save();
            }
            resolve();
        } catch (e) {
            reject(e);
        }
    })
}
/*
Remove tournament from favorites
 */
exports.removeFromFavoritesLogic = function ({tournamentId, user}) {
    return new Promise(async (resolve, reject) => {
        try {
            const favDocument = await FavoritesModel.findOne({user}).exec();
            if (!favDocument) return reject(129);
            favDocument.tournaments = favDocument.tournaments.filter(tournament => {
                return tournament.toString() !== tournamentId
            });
            await favDocument.save();
            resolve();
        } catch (e) {
            reject(e);
        }
    })
}
/*
Return true if tournament is in favorites list
 */
exports.isTournamentAFavorite = function ({tournamentId, user}) {
    return new Promise(async (resolve, reject) => {
        try {
            const favDocument = await FavoritesModel.findOne({user}).exec();
            if (!favDocument) return resolve(false);
            resolve(favDocument.tournaments.includes(tournamentId));
        } catch (e) {
            reject(e);
        }
    })
}
/*
Retrieve both favorites and tournaments where user is admin
 */
exports.getMyTournaments = function ({user}) {
    return new Promise(async (resolve, reject) => {
        try {
            const admin = await TournamentModel.find({admin: user})
                .populate('admin', 'username -_id')
                .exec();
            const favorites = await FavoritesModel.findOne({user})
                .populate({path: 'tournaments', populate: {path: 'admin', select: 'username -_id'}})
                .exec();
            resolve({admin: admin ? admin : [], favorites: favorites ? favorites.tournaments : []});
        } catch (e) {
            reject(e);
        }
    });
}
/*
Search for tournaments by name
 */
exports.searchForTournaments = function ({searchString}) {
    return new Promise(((resolve, reject) => {
        const regex = new RegExp(searchString, 'gi');
        TournamentModel
            .find({name: regex})
            .populate('admin', 'username -_id')
            .exec((err, results) => {
                if (err) return reject(err);
                resolve(results)
            })
    }))
}
/*
Get recently created tournaments
 */
exports.exploreTournaments = function () {
    return new Promise(((resolve, reject) => {
        TournamentModel
            .find()
            .sort('-createdAt')
            .limit(6)
            .populate('admin', 'username -_id')
            .exec((err, results) => {
                if (err) return reject(err);
                resolve(results)
            })
    }))
}
/*
Retrieve all tournaments where user is admin
*/
exports.getUserAdminTournaments = function ({user: admin}) {
    return new Promise((resolve, reject) => {
        TournamentModel.find({admin})
            .populate('admin', 'username -_id')
            .exec((err, res) => {
                if (err) return reject(err);
                resolve(res);
            })
    });
}
