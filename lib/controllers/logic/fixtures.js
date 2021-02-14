const TournamentModel = require('../../db/models/tounament');
const FixtureModel = require('../../db/models/fixtures');

/*
* Get fixtures for a given tournament
* */
exports.getFixturesLogic = function ({tournamentId: _id}) {
    return new Promise(async (resolve, reject) => {
        FixtureModel.findOne({tournament: _id})
            .select('-admin')
            .exec(((err, res) => {
                if (err) return reject(err)
                if (!res) return reject(109);
                resolve(res);
            }))
    })
}
/*
Generate league table data from league fixtures array
*/
exports.getLeagueTableDataLogic = function ({tournamentId: _id}) {
    return new Promise(async (resolve, reject) => {
        try {
            const tournament = await TournamentModel.findById(_id).exec();
            if (!tournament) return reject(100);
            const {isKnockout, hasLeagueFixturesGenerated, teams, useTwoLegs} = tournament;
            if (isKnockout) return reject(107);
            if (!hasLeagueFixturesGenerated) return reject(109);
            const fixtures = await FixtureModel.findOne({tournament: _id}).exec();
            if (!fixtures || !fixtures.leagueFixtures) return reject(127);
            const leagueTableData = generateLeagueTableData(fixtures.leagueFixtures, teams, useTwoLegs);
            sortLeagueTableData(leagueTableData);
            resolve(leagueTableData);
        } catch (e) {
            reject(e);
        }
    })
}
/*
Generate new league fixtures
*/
exports.generateLeagueFixturesLogic = function ({tournamentId: _id, user: admin}) {
    return new Promise(async (resolve, reject) => {
        try {
            const tournament = await TournamentModel.findOne({_id, admin}).exec();
            if (!tournament) return reject(100);
            const {isKnockout, useTwoLegs, teams, useGoalsForTieBreaker, isComplete,
                hasLeagueFixturesGenerated} = tournament;
            if (isComplete) return reject(101);
            if (isKnockout) return reject(107);
            if (teams.length < 4) return reject(103);
            if (hasLeagueFixturesGenerated) return reject(108);
            const shuffledTeams = generateShuffledArray(teams);
            const fixtures = generateLeagueFixturesArray(shuffledTeams, useTwoLegs);
            const fixturesDocument = new FixtureModel({
                tournament: _id,
                admin, useTwoLegs, isKnockout, useGoalsForTieBreaker,
                numberOfTeams: shuffledTeams.length,
                leagueFixtures: fixtures
            })
            tournament.teams = shuffledTeams;
            tournament.hasLeagueFixturesGenerated = true;
            await Promise.all([fixturesDocument.save(), tournament.save()]);
            resolve('League fixtures generated');
        } catch (e) {
            reject(e);
        }
    });
}
/*
Generate new knockout Fixtures
return name of next round created
*/
exports.generateKnockoutFixturesLogic = function ({tournamentId: _id, user: admin}) {
    return new Promise(async (resolve, reject) => {
        try {
            const tournament = await TournamentModel.findOne({_id, admin}).exec();
            if (!tournament) return reject(100);
            const {isKnockout, useTwoLegs, useOneFinal, useAwayGoals, teams, isComplete} = tournament;
            let {currentRound} = tournament;
            let newRound;
            if (isComplete) return reject(101);
            if (!isKnockout) return reject(102);
            if (teams.length < 4) return reject(103)
            if (!everyTeamHasAName(teams)) return reject()
            let fixturesDocument, newRoundFixtures;
            if (currentRound) {
                fixturesDocument = await FixtureModel.findOne({tournament: _id, admin}).exec();
                if (!fixturesDocument) return reject(118);
                const shuffledRoundWinners = generateShuffledArray(generateRoundWinners(fixturesDocument[currentRound]));
                newRound = `roundOf${parseInt(currentRound.slice(7))/2}`;
                if (newRound.slice(7) === "2" && useOneFinal) {
                    newRoundFixtures = generateKnockoutFixturesArray(shuffledRoundWinners, newRound, false);
                } else {
                    newRoundFixtures = generateKnockoutFixturesArray(shuffledRoundWinners, newRound, useTwoLegs);
                }
                Object.assign(fixturesDocument, {currentRound: newRound, [newRound]: newRoundFixtures});
            }
            else {
                const shuffledTeams = generateShuffledArray(teams);
                tournament.teams = shuffledTeams;
                newRound = generateStartingRound(shuffledTeams.length);
                if (!newRound) return reject(104);
                let teamsWithIndex = shuffledTeams.map((value, index)=> ( {teamIndex: index} ));
                newRoundFixtures = generateKnockoutFixturesArray(teamsWithIndex, newRound, useTwoLegs);
                fixturesDocument = new FixtureModel({
                    tournament: _id,
                    admin, useTwoLegs, isKnockout, useAwayGoals, useOneFinal,
                    numberOfTeams: shuffledTeams.length,
                    currentRound: newRound,
                    [newRound]: newRoundFixtures
                });
            }
            tournament.currentRound = newRound;
            await Promise.all([fixturesDocument.save(), tournament.save()]);
            resolve(newRound);
        } catch (e) {
            reject(e);
        }
    });
}
/*
Generate league table data from fixtures array
*/
function generateLeagueTableData (leagueFixturesArray, teams, useTwoLegs) {
    const leagueTableData = [];
    leagueFixturesArray.forEach((team, index) => {
        const teamData = {
            teamDetails: teams[index],
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            goalDifference: 0,
            points: 0
        };
        if (useTwoLegs) {
            populateTeamStats(teamData, team.home);
            populateTeamStats(teamData, team.away);
        } else {
            populateTeamStats(teamData, team.neutral);
        }
        leagueTableData.push(teamData);
    })
    return leagueTableData;
}
/*
 Increment a teams league stats with provided fixtures data
 pass a team argument : should contain current stats - wins, losses, etc
 pass a fixtures array : with goalsFor, goalsAgainst, isWin etc
*/
function populateTeamStats (team, fixturesArray) {
    fixturesArray.forEach(fixture => {
        if (!fixture) return;
        if (fixture.isSameTeam) return;
        const {isWin, isDraw, isLoss, goalsFor, goalsAgainst} = fixture;
        team.played += isWin || isDraw || isLoss;
        team.won += isWin;
        team.drawn += isDraw;
        team.lost += isLoss
        team.goalsFor += goalsFor;
        team.goalsAgainst += goalsAgainst;
        team.goalDifference += goalsFor - goalsAgainst;
        team.points += isWin ? 3 : isDraw ? 1 : 0;
    })
}
/*
Generate Knockout fixtures ------ currentRound, teams, useTwoLegs
*/
function generateKnockoutFixturesArray (teams, newRound, useTwoLegs) {
    let newFixtureArray = [];
    let teamSet = Array.from(teams);
    // if current round is 32, we now need a round with only 16 teams
    const newRoundNumber = parseInt(newRound.slice(7));
    const fixtureArraySortOrderIndices = generateEmptyTeamsSetIndex(newRoundNumber);
    // for each spot on the new round, add teams
    fixtureArraySortOrderIndices.forEach(spot => {
        // teamSet is depleted, add empty teams
        if (teamSet.length < 1) return newFixtureArray[spot] = {
            isEmpty: true,
            teamIndex: 999
        }
        newFixtureArray[spot] = Object.assign(teamSet[0], {
            opponentIndex: spot % 2 === 0 ? spot + 1 : spot - 1,
            home: useTwoLegs ? {} : undefined,
            away: useTwoLegs ? {} : undefined,
            neutral: useTwoLegs ? undefined : {},
            isWinner: undefined
        })
        teamSet.shift();
    })
    return newFixtureArray;
}
/*
Generate League fixtures array using a teams array. useTwoLegs will using home and away properties, otherwise neutral
*/
function generateLeagueFixturesArray (teams, useTwoLegs) {
    let newFixtureArray = [];
    teams.forEach((team, index) => {
        const matchesArray = Array(teams.length).fill(null);
        matchesArray[index] = {isSameTeam: true}
        newFixtureArray[index] = {
            home: useTwoLegs ? matchesArray : undefined,
            away: useTwoLegs ? matchesArray : undefined,
            neutral: useTwoLegs ? undefined : matchesArray
        }
    })
    return newFixtureArray;
}
/*
get knockout winners from fixture array
*/
function generateRoundWinners (fixtureArray) {
    let roundWinners = [];
    // simple using goals for, for now
    fixtureArray.forEach(team => {
        if (team.isEmpty) return
        if (typeof team.isWinner === 'undefined') throw 119;
        if (team.isWinner) roundWinners.push({teamIndex: team.teamIndex});
    });
    return roundWinners;
}
/*
return a shuffled array. do not mutate original
*/
function generateShuffledArray (arr) {
    let shuffledArray = Array.from(arr);
    for (let i = shuffledArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
    }
    return shuffledArray;
}
/*
return true if every team in teams array has a non empty teamName
*/
function everyTeamHasAName (teams) {
    return teams.every(team => !!team.teamName)
}
/*
generate array of count n with empty teams in an optimized knockout drawing order
order ensures max number of teams qualify to the next round when all slots are not filled by players
e.g. n = 4 should return [0,2,1,3]
When in use, player in 0 faces 1, 2 faces 3, etc.
argument should be 2, 4, 8, 16 or 32
*/
function generateEmptyTeamsSetIndex (numEmptyTeamsNeeded) {
    if (numEmptyTeamsNeeded % 2 !== 0) throw 121;
    let a = 0, b = numEmptyTeamsNeeded-1;
    let aIndex = 0, bIndex = numEmptyTeamsNeeded-1;
    let newTeamSet = [];
    while (a <= numEmptyTeamsNeeded && b >= 1) {
        newTeamSet[aIndex] = a;
        newTeamSet[bIndex] = b;
        a += 2; b -= 2;
        aIndex++; bIndex--;
    }
    return newTeamSet;
}
/*
generate round starting point for tournaments with no existing rounds/fixtures
*/
function generateStartingRound (numberOfTeams) {
    const parsedNumber = parseInt(numberOfTeams);
    if (parsedNumber <= 2) return "roundOf2";
    if (parsedNumber <= 4) return "roundOf4";
    if (parsedNumber <= 8) return "roundOf8";
    if (parsedNumber <= 16) return "roundOf16";
    if (parsedNumber <= 32) return "roundOf32";
    return false;
}
/*
sort league table data by highest points, then goal difference, then goals for
 */
function sortLeagueTableData (tableData) {
    tableData.sort((a, b) => {
        const aPoints = a.points;
        const bPoints = b.points;
        if (aPoints === bPoints) {
            if (a.goalDifference > b.goalDifference) return -1
            else if (a.goalsFor < b.goalsFor) return 1
            if (a.goalsFor > b.goalsFor) return -1
            else if (a.goalsFor < b.goalsFor) return 1
            return 0
        }
        if (aPoints > bPoints) return -1
        else if (aPoints < bPoints) return 1;
    })
}