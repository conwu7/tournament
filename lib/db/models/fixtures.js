const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const KnockoutMatchSchema = new Schema(
    {
        goalsFor: Number,
        goalsAgainst: Number,
        isComplete: Boolean
    },
    {
        _id: false
    }
)
/*
is sameTeam - the index is the same as the team index
*/
const NeutralMatchSchema = new Schema(
    {
        goalsFor: Number,
        goalsAgainst: Number,
        isWin: Boolean,
        isDraw: Boolean,
        isLoss: Boolean,
        isComplete: Boolean,
        isSameTeam: Boolean
    },
    {
        _id: false
    }
)
/*
home, away and neutral arrays contain a teams fixtures.
the index of those arrays correspond to the opponent's team index.
*/
const LeagueTeamsSchema = new Schema(
    {
        home: [NeutralMatchSchema],
        away: [NeutralMatchSchema],
        neutral: [NeutralMatchSchema],
    },
    {
        _id: false
    }
)
const KnockoutTeamsSchema = new Schema(
    {
        teamIndex: {type: Number, required: true},
        isEmpty: Boolean,
        opponentIndex: Number,
        home: KnockoutMatchSchema,
        away: KnockoutMatchSchema,
        neutral: NeutralMatchSchema,
        tieBreaker: NeutralMatchSchema,
        isWinner: Boolean
    },
    {
        _id: false
    }
)
const FixtureSchema = new Schema(
    {
        tournament: {type: Schema.ObjectId, ref: 'Tournament', required: true},
        admin: {type: Schema.ObjectId, ref: 'User', required: true},
        numberOfTeams: Number,
        useTwoLegs: Boolean,
        useOneFinal: Boolean,
        useAwayGoals: Boolean,
        isKnockout: Boolean,
        currentRound: String,
        startingRound: String,
        leagueFixtures: [LeagueTeamsSchema],
        roundOf32: [KnockoutTeamsSchema],
        roundOf16: [KnockoutTeamsSchema],
        roundOf8: [KnockoutTeamsSchema],
        roundOf4: [KnockoutTeamsSchema],
        roundOf2: [KnockoutTeamsSchema],
        winner: {
            teamName: String,
            teamIndex: Number
        },
        isComplete: Boolean
    },
    {
        timestamps: true
    }
);
module.exports = mongoose.model('Fixture', FixtureSchema);