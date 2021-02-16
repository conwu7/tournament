const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TeamsSchema = new Schema(
    {
        teamName: {type: String, max: 30},
        teamLogo: String,
        playerName: {type: String, max: 30}
    },
    {
        _id: false
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
        useOneFinal: Boolean,
        useGoalsForTieBreaker: Boolean,
        useAwayGoals: Boolean,
        teams: [TeamsSchema],
        hasLeagueFixturesGenerated: Boolean,
        currentRound: String,
        startingRound: String,
        isComplete: Boolean
    },
    {
        timestamps: true
    }
);
module.exports = mongoose.model('Tournament', TournamentSchema);