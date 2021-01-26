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
Generate new league fixtures
*/
exports.generateLeagueFixturesLogic = function ({tournamentId: _id, user: admin}) {
    return new Promise(async (resolve, reject) => {
        try {
            const tournament = await TournamentModel.findOne({_id, admin}).exec();
            if (!tournament) return reject(100);
            const {isKnockout, useTwoLegs, teams, isComplete, hasLeagueFixturesGenerated} = tournament;
            if (isComplete) return reject(101);
            if (isKnockout) return reject(107);
            if (teams.length < 4) return reject(103);
            if (hasLeagueFixturesGenerated) return reject(108);
            const shuffledTeams = newShuffledArray(teams);
            const fixtures = generateLeagueFixtures(shuffledTeams, useTwoLegs);
            const fixturesDocument = new FixtureModel({
                tournament: _id,
                admin,
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
            const {isKnockout, useTwoLegs, teams, isComplete} = tournament;
            let {currentRound} = tournament;
            if (isComplete) return reject(101);
            if (!isKnockout) return reject(102);
            if (teams.length < 4) return reject(103)
            let fixturesDocument, fixtures;

            if (currentRound) {
                return reject('i see you');
                // fixtures = await FixtureModel.findOne({tournament: id}).exec();
                // // ***modify - continue here
            }
            if (!currentRound) {
                const shuffledTeams = newShuffledArray(teams);
                tournament.teams = shuffledTeams;
                currentRound = generateStartingRound(shuffledTeams.length);
                if (!currentRound) return reject(104);
                fixtures = generateNewKnockoutFixtures(shuffledTeams, currentRound, useTwoLegs);
                fixturesDocument = new FixtureModel({
                    tournament: _id,
                    admin,
                    numberOfTeams: teams.length,
                    [currentRound]: fixtures
                });
            }
            tournament.currentRound = currentRound;
            await Promise.all([fixturesDocument.save(), tournament.save()]);
            resolve(currentRound);
        } catch (e) {
            reject(e);
        }
    });
}
/*
Generate Knockout fixtures -------noFixturesYet, currentRound, teams, useTwoLegs
*/
function generateNewKnockoutFixtures (teams, currentRound, useTwoLegs) {
    let newFixtureArray = [];
    // teams will be identified by their team index
    // team index will be referencing the shuffled team prop of Tournament documents
    let teamsSet = teams.map((value, index)=>index);
    // if current round is 32, we now need a round with only 16 teams
    const newRound = parseInt(currentRound.slice(7));
    const fixtureArraySortOrderIndices = generateEmptyTeamsSetIndex(newRound);
    // for each spot on the new round, add teams
    fixtureArraySortOrderIndices.forEach(spot => {
        // teamSet is depleted, add empty teams
        if (teamsSet.length < 1) return newFixtureArray[spot] = {
            isEmpty: true,
            teamIndex: 999
        }
        const teamIndex = teamsSet[0];
        newFixtureArray[spot] = {
            teamIndex: teamIndex,
            // 0 always faces 1, 2 always faces 3 etc
            opponentIndex: spot % 2 === 0 ? spot + 1 : spot - 1,
            home: useTwoLegs ? {} : undefined,
            away: useTwoLegs ? {} : undefined,
            neutral: useTwoLegs ? undefined : {}
        }
        teamsSet.shift();
    })
    return newFixtureArray;
}
/*
Generate League fixtures array using a teams array. useTwoLegs will using home and away properties, otherwise neutral
*/
function generateLeagueFixtures (teams, useTwoLegs) {
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
// get knockout winners from fixture array
// function generateRoundWinners (fixtureArray, currentRound) {
//     let roundWinners = [];
//     const nextRound = parseInt(currentRound.slice(7)) / 2;
//     // simple using goals for, for now
//     fixtureArray.forEach(team => {
//         if (team.isEmpty) return
//         // if (typeof team.home === 'undefined' || typeof )
//         if ((team.home.goalsFor + team.away.goalsFor) > (team.home.goalsAgainst + team.home.goalsAgainst)) {
//             roundWinners.push({teamIndex: team.teamIndex})
//         }
//     });
// }
/*
return a shuffled array. do not mutate original
*/
function newShuffledArray (arr) {
    let shuffledArray = Array.from(arr);
    for (let i = shuffledArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
    }
    return shuffledArray;
}
/*
generate array of count n with empty teams in an optimized knockout drawing order
order ensures max number of teams qualify to the next round when all slots are not filled by players
e.g. n = 4 should return [0,2,1,3]
When in use, player in 0 faces 1, 2 faces 3, etc.
argument should be 2, 4, 8, 16 or 32
*/
function generateEmptyTeamsSetIndex (numEmptyTeamsNeeded) {
    if (numEmptyTeamsNeeded % 2 !== 0) throw new Error('Number of teams needed for next round is invalid');
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