const TournamentModel = require('../../db/models/tounament');
const FixtureModel = require('../../db/models/fixtures');

exports.addLeagueResultLogic =
    function ({tournamentId: _id, teamIndex, home, away, neutral, previousResults, user: admin}) {
        return new Promise(async (resolve, reject) => {
            try {
                const fixtures = await FixtureModel.findOne({tournament: _id, admin}).exec();
                if (!fixtures) return reject(115);
                const {isKnockout, useTwoLegs, isComplete, numberOfTeams} = fixtures;
                if (teamIndex > numberOfTeams-1) return reject(126);
                if (isKnockout) return reject(107);
                if (isComplete) return reject(101);
                if (!previousLeagueResultsAreCurrent(numberOfTeams, previousResults, fixtures.leagueFixtures[teamIndex])) {
                    return reject(130);
                }
                if (useTwoLegs) {
                    if (!home || !away) return reject(125);
                    if (home.length !== away.length) return reject(123);
                    if (home.length !== numberOfTeams) return reject(122);
                    saveMatches(teamIndex, home, fixtures, 'home', 'away');
                    saveMatches(teamIndex, away, fixtures, 'away', 'home');
                } else {
                    if (!neutral) return reject(124);
                    if (neutral.length !== numberOfTeams) return reject(122);
                    saveMatches(teamIndex, neutral, fixtures, 'neutral', 'neutral');
                }
                // necessary since the leagueMatches contained mixed elements
                // save() doesn't apply changes to db if item in array is changed to null
                fixtures.markModified('leagueFixtures');
                await fixtures.save();
                resolve('League results saved');
            } catch (e) {
                reject(e);
            }
        })
    }
/*For Leagues*/
function saveMatches (teamIndex, resultsArray, fixturesArray, ground, opponentGround) {
    // each team is an object of home, away or neutral
    // each home/away/neutral properties contains an array results where the -
    // - index of each item represents opponent's team
    // so teamX.home = [[2,1], [3,1]]; means that -
    // - X beat team 0, 2-1 at home and beat team 1, 3-1 at home.
    resultsArray.forEach((result, opponentIndex) => {
        if (teamIndex === opponentIndex) return;
        const team = fixturesArray.leagueFixtures[teamIndex];
        const opponent = fixturesArray.leagueFixtures[opponentIndex];
        // clear previously saved results if new result is null
        if (!result) {
            team[ground][opponentIndex] = null;
            opponent[opponentGround][teamIndex] = null;
            return
        }
        let [goalsFor, goalsAgainst] = result;
        goalsFor = parseInt(goalsFor);
        goalsAgainst = parseInt(goalsAgainst);
        if (!team[ground][opponentIndex]) team[ground][opponentIndex] = {};
        const teamMatch = team[ground][opponentIndex];
        if (!opponent[opponentGround][teamIndex]) opponent[opponentGround][teamIndex] = {};
        const opponentMatch = opponent[opponentGround][teamIndex];
        Object.assign(teamMatch, {
            goalsFor: goalsFor,
            goalsAgainst: goalsAgainst,
            isWin: goalsFor > goalsAgainst,
            isDraw: goalsFor === goalsAgainst,
            isLoss: goalsFor < goalsAgainst,
            isComplete: true,
        });
        // notice the reversals - opponent's goalsFor would be the current teams goalsAgainst
        Object.assign(opponentMatch, {
            goalsFor: goalsAgainst,
            goalsAgainst: goalsFor,
            isWin: teamMatch.isLoss,
            isDraw: teamMatch.isDraw,
            isLoss: teamMatch.isWin,
            isComplete: true,
        })
    })
}
exports.addKnockoutResultLogic = function ({tournamentId: _id, results, previousResults, user: admin}) {
    return new Promise(async (resolve, reject) => {
        try {
            const fixtures = await FixtureModel.findOne({tournament: _id, admin}).exec();
            if (!fixtures) return reject(115);
            let isFinal, isFinalComplete;
            const {isKnockout, useTwoLegs, useOneFinal, useAwayGoals, isComplete, currentRound} = fixtures;
            if (currentRound === 'roundOf2') isFinal = true;
            const currentFixtures = fixtures[currentRound];
            // if (isComplete) return reject(101);
            if (!isKnockout) return reject(102);
            if (parseInt(currentRound.slice(7)) !== results.length) return reject(116);
            if (!previousKnockoutResultsAreCurrent(previousResults, currentFixtures)) return reject(130);
            results.forEach((result, index) => {
                if (index % 2 !== 0) return //even results are handling both current team and opponents
                let tieBreakerRequired = false;
                const homeTeam = currentFixtures[index];
                clearExistingResults(homeTeam);
                const opponentIndex = homeTeam.opponentIndex;
                const awayTeam = currentFixtures[opponentIndex];
                if (awayTeam.isEmpty) return homeTeam.isWinner = true;
                clearExistingResults(awayTeam);
                const awayResult = results[opponentIndex];
                let homeFor, homeAgainst, tieBreakerFor, tieBreakerAgainst, awayFor, awayAgainst;
                if (result) [homeFor, homeAgainst, tieBreakerFor, tieBreakerAgainst] = result;
                if (awayResult) [awayAgainst, awayFor] = awayResult;
                if (!useTwoLegs || (isFinal && useOneFinal)) {
                    // save single leg score
                    if (result) {
                        setTeamAndOpponentResults(homeTeam, awayTeam, homeFor, homeAgainst, 'neutral');
                        const outcome = getMatchOutcome(homeFor, homeAgainst, 0, 0);
                        if (outcome === 'tie') tieBreakerRequired = true;
                        else {
                            setWinnerAndLoser(homeTeam, awayTeam, outcome);
                            isFinalComplete = isFinal;
                        }
                    }
                } else {
                    // save scores for first leg
                    if (result) {
                        setTeamAndOpponentResults(homeTeam, awayTeam, homeFor, homeAgainst, 'home');
                    }
                    // save scores for second leg
                    if (awayResult) {
                        setTeamAndOpponentResults(homeTeam, awayTeam, awayFor, awayAgainst, 'away');
                    }
                    if (result && awayResult) {
                        const outcome = getMatchOutcome(homeFor, homeAgainst, awayFor, awayAgainst, useAwayGoals);
                        if (outcome === 'tie') tieBreakerRequired = true;
                        else {
                            setWinnerAndLoser(homeTeam, awayTeam, outcome);
                            isFinalComplete = isFinal;
                        }
                    }
                }
                homeTeam.tieBreaker = tieBreakerRequired ? {} : undefined;
                awayTeam.tieBreaker = tieBreakerRequired ? {} : undefined;
                if (tieBreakerRequired && !isNaN(tieBreakerFor) && !isNaN(tieBreakerAgainst)) {
                    // save tie breaker score
                    setTeamAndOpponentResults(homeTeam, awayTeam, tieBreakerFor, tieBreakerAgainst, 'tieBreaker');
                    const outcome = getMatchOutcome(tieBreakerFor, tieBreakerAgainst, 0, 0);
                    if (outcome === 'tie') throw 117
                    setWinnerAndLoser(homeTeam, awayTeam, outcome);
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
/*
* Check if a team has won a round
* if using only one leg, pass 0 to 3rd and 4th arguments
* Away goals - if total goals are square, team wins if they scored more away than they conceded at home
* */
function getMatchOutcome (homeFor, homeAgainst, awayFor, awayAgainst, useAwayGoals) {
    const totalFor = homeFor + awayFor;
    const totalAgainst = homeAgainst + awayAgainst;
    if (totalFor > totalAgainst) return 'win';
    if (totalFor < totalAgainst) return 'loss';
    if (totalFor === totalAgainst) {
        if (useAwayGoals && awayFor > homeAgainst) return 'win'
        if (useAwayGoals && awayFor < homeAgainst) return 'loss'
        return 'tie';
    }
}
/*Applies to knockout teams*/
function clearExistingResults (team) {
    if (team.home) team.home = {};
    if (team.away) team.away = {};
    if (team.neutral) team.neutral = {};
    if (team.tieBreaker) team.tieBreaker = {};
    team.isWinner = undefined;
}
function setWinnerAndLoser(homeTeam, awayTeam, outcome) {
    homeTeam.isWinner = outcome === 'win';
    awayTeam.isWinner = outcome !== 'win';
}
function setTeamAndOpponentResults (
    team, opponentTeam, teamGoalsFor, teamGoalsAgainst, teamGround
) {
    let opponentGround;
    switch (teamGround) {
        case 'home' : {opponentGround = 'away'; break}
        case 'away' : {opponentGround = 'home'; break}
        default : {opponentGround = teamGround}
    }
    team[teamGround] = {
        goalsFor: teamGoalsFor,
        goalsAgainst: teamGoalsAgainst,
        isComplete: true
    }
    opponentTeam[opponentGround] = {
        goalsFor: teamGoalsAgainst,
        goalsAgainst: teamGoalsFor,
        isComplete: true
    }
}
/*
Compare previous results to what's currently on the database.
Used to make sure user was updating/overwriting the most up to date results
 */
function previousKnockoutResultsAreCurrent (previousResults, dbResults) {
    let resultsMatch = true;
    for (let i=0; i<dbResults.length; i++) {
        // xx.home/away/neutral objects are set at fixture generation.
        // Adding results only affect the properties of the object.
        if (dbResults[i].home && !hasSameResults(dbResults[i].home, previousResults[i].home)) {
            resultsMatch = false;
            break
        }
        if (dbResults[i].away && !hasSameResults(dbResults[i].away, previousResults[i].away)) {
            resultsMatch = false;
            break
        }
        if (dbResults[i].neutral && !hasSameResults(dbResults[i].neutral, previousResults[i].neutral)) {
            resultsMatch = false;
            break
        }
    }
    return resultsMatch;
}
function previousLeagueResultsAreCurrent (numberOfTeams, previousResults, dbResults) {
    let resultsMatch = true;
    for (let i=0; i<numberOfTeams; i++) {
        if (dbResults.home.length !==0 && !hasSameResults(dbResults.home[i], previousResults.home[i])) {
            resultsMatch = false;
            break
        }
        if (dbResults.away.length !==0 && !hasSameResults(dbResults.away[i], previousResults.away[i])) {
            resultsMatch = false;
            break
        }
        if (dbResults.neutral.length !==0 && !hasSameResults(dbResults.neutral[i], previousResults.neutral[i])) {
            resultsMatch = false;
            break
        }
    }
    return resultsMatch;
}
/*
Compare home, away or neutral matches object.
Check that goalsFor and goalsAgainst match each supplied result array.
 */
function hasSameResults (first, second) {
    // handle league null objects
    if (!first) {
        return !second;
    }
    // if first doesn't have goalsFor/goalsAgainst but second does, return false
    if (isNaN(parseInt(first.goalsFor))) {
        return isNaN(second.goalsFor);
    }
    if (isNaN(parseInt(first.goalsAgainst))) {
        return isNaN(parseInt(second.goalsAgainst));
    }
    // if results are present, return true if values are the same
    return (first.goalsFor === second.goalsFor && first.goalsAgainst === second.goalsAgainst);
}