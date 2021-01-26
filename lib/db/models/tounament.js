const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TeamsSchema = new Schema(
    {
        teamName: {type: String, required: true},
        teamLogo: String,
        playerName: String
    }
);
const TournamentSchema = new Schema(
    {
        name: {type: String, maxlength: 40, required: true},
        admin: {type: Schema.ObjectId, ref: 'User', required: true},
        useRealTeams: Boolean,
        usePlayerNames: Boolean,
        isSoccerStyle: Boolean,
        isKnockout: Boolean,
        numberOfGroups: Number,
        useTwoLegs: Boolean,
        useGoalsForTieBreaker: Boolean,
        useAwayGoalsTieBreaker: Boolean,
        teams: [TeamsSchema],
        hasLeagueFixturesGenerated: Boolean,
        currentRound: String,
        isComplete: Boolean
    },
    {
        timestamps: true
    }
);
module.exports = mongoose.model('Tournament', TournamentSchema);