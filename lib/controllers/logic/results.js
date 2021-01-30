const TournamentModel = require('../../db/models/tounament');
const FixtureModel = require('../../db/models/fixtures');

exports.addLeagueResultLogic =
    function ({tournamentId: _id, teamIndex, home, away, neutral, user: admin}) {
        return new Promise(async (resolve, reject) => {
            try {
                const fixtures = await FixtureModel.findOne({tournament: _id, admin}).exec();
                if (!fixtures) return reject(115);
                const {isKnockout, useTwoLegs, isComplete, numberOfTeams} = fixtures;
                if (teamIndex > numberOfTeams-1) return reject(126);
                if (isKnockout) return reject(107);
                if (isComplete) return reject(101);
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
    resultsArray.forEach((result, index) => {
        if (!result) return;
        if (teamIndex === index) return;
        const team = fixturesArray.leagueFixtures[teamIndex];
        const [goalsFor, goalsAgainst] = result;
        const opponent = fixturesArray.leagueFixtures[index];
        if (!team[ground][index]) team[ground][index] = {};
        const teamMatch = team[ground][index];
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
exports.addKnockoutResultLogic = function ({tournamentId: _id, results, user: admin}) {
    return new Promise(async (resolve, reject) => {
        try {
            const fixtures = await FixtureModel.findOne({tournament: _id, admin}).exec();
            if (!fixtures) return reject(115);
            let isFinal, isFinalComplete;
            const {isKnockout, useTwoLegs, useOneFinal, useAwayGoals, isComplete, currentRound} = fixtures;
            if (currentRound === 'roundOf2') isFinal = true;
            const currentFixtures = fixtures[currentRound];
            if (isComplete) return reject(101);
            if (!isKnockout) return reject(102);
            if (parseInt(currentRound.slice(7)) !== results.length) return reject(116);
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
                if (result) [homeFor, homeAgainst, tieBreakerFor, tieBreakerAgainst] = results;
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
                if (tieBreakerRequired && tieBreakerFor && tieBreakerAgainst) {
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