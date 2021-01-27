const TournamentModel = require('../../db/models/tounament');
const FixtureModel = require('../../db/models/fixtures');

exports.addLeagueResultLogic = function ({tournamentId: _id}) {
    return new Promise(async (resolve, reject) => {

    })
}
exports.addKnockoutResultLogic = function ({tournamentId: _id, results, user: admin}) {
    return new Promise(async (resolve, reject) => {
        try {
            const fixtures = await FixtureModel.findOne({tournament: _id, admin}).exec();
            if (!fixtures) return reject(115);
            let isFinal, isFinalComplete;
            const {isKnockout, useTwoLegs, isComplete, currentRound} = fixtures;
            if (currentRound === 'roundOf2') isFinal = true;
            const currentFixtures = fixtures[currentRound];
            if (isComplete) return reject(101);
            if (!isKnockout) return reject(102);
            if (!(results instanceof Array)) return reject(114);
            if (parseInt(currentRound.slice(7)) !== results.length) return reject(116);
            results.forEach((result, index) => {
                if (index % 2 !== 0) return //even results are handling both current team and opponents
                let tieBreakerRequired = false;
                const homeTeam = currentFixtures[index];
                homeTeam.home = homeTeam.away = homeTeam.neutral = homeTeam.tieBreaker = {}; homeTeam.isWinner = undefined;
                const opponentIndex = homeTeam.opponentIndex;
                const awayTeam = currentFixtures[opponentIndex];
                if (awayTeam.isEmpty) return homeTeam.isWinner = true;
                awayTeam.home = awayTeam.away = awayTeam.neutral = awayTeam.tieBreaker = {}; awayTeam.isWinner = undefined;
                const awayResult = results[opponentIndex];
                let homeFor, homeAgainst, tieBreakerFor, tieBreakerAgainst, awayFor, awayAgainst;
                if (result) {
                    [homeFor, homeAgainst, tieBreakerFor, tieBreakerAgainst] = [result[0], result[1], result[2], result[3]];
                }
                if (awayResult) {
                    [awayFor, awayAgainst] = [awayResult[1], awayResult[0]];
                }

                if (useTwoLegs) {
                    // save scores for first leg
                    if (result) {
                        homeTeam.home = {
                            goalsFor: homeFor, goalsAgainst: homeAgainst, isComplete: true
                        }
                        awayTeam.away = {
                            goalsFor: homeAgainst, goalsAgainst: homeFor, isComplete: true
                        }
                    }
                    // save scores for second leg
                    if (awayResult) {
                        homeTeam.away = {
                            goalsFor: awayFor, goalsAgainst: awayAgainst, isComplete: true
                        }
                        awayTeam.home = {
                            goalsFor: awayAgainst, goalsAgainst: awayFor, isComplete: true
                        }
                    }
                    if (result && awayResult) {
                        const outcome = winLossTieKnockout(homeFor, homeAgainst, awayFor, awayAgainst);
                        if (outcome === 'tie') tieBreakerRequired = true;
                        else {
                            // set winner or losers
                            homeTeam.isWinner = outcome === 'win';
                            awayTeam.isWinner = outcome !== 'win';
                            isFinalComplete = isFinal;
                        }
                    }
                } else {
                    // save single leg score
                    if (result) {
                        homeTeam.neutral = {
                            goalsFor: homeFor, goalsAgainst: homeAgainst, isComplete: true
                        };
                        awayTeam.neutral = {
                            goalsFor: homeAgainst, goalsAgainst: homeFor, isComplete: true
                        };
                        const outcome = winLossTieKnockout(homeFor, homeAgainst, 0, 0);
                        if (outcome === 'tie') tieBreakerRequired = true;
                        else {
                            homeTeam.isWinner = outcome === 'win';
                            awayTeam.isWinner = outcome !== 'win';
                            isFinalComplete = isFinal;
                        }
                    }
                }
                if (tieBreakerRequired && tieBreakerFor && tieBreakerAgainst) {
                    // save tie breaker score
                    homeTeam.tieBreaker = {
                        goalsFor: tieBreakerFor, goalsAgainst: tieBreakerAgainst
                    };
                    awayTeam.tieBreaker = {
                        goalsFor: tieBreakerAgainst, goalsAgainst: tieBreakerFor
                    }
                    const outcome = winLossTieKnockout(tieBreakerFor, tieBreakerAgainst, 0, 0);
                    if (outcome === 'tie') throw 117
                    // set winner from tie breaker
                    homeTeam.isWinner = outcome === 'win';
                    awayTeam.isWinner = outcome !== 'win';
                    isFinalComplete = isFinal;
                }
            })
            if (isFinalComplete) {
                const tournament = await TournamentModel.findById(_id).exec();
                tournament.isComplete = fixtures.isComplete = isFinalComplete;
                await tournament.save();
            }
            await fixtures.save();
            resolve('Results saved');
        } catch (e) {
            reject(e);
        }
    })
}
function winLossTieKnockout (homeFor, homeAgainst, awayFor, awayAgainst) {
    const totalFor = homeFor + awayFor;
    const totalAgainst = homeAgainst + awayAgainst;
    if (totalFor === totalAgainst) return 'tie';
    if (totalFor > totalAgainst) return 'win';
    if (totalFor < totalAgainst) return 'loss';
}