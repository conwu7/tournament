const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FavoritesSchema = new Schema(
    {
        user: {type: Schema.ObjectId, ref: 'User', required: true},
        tournaments: [{type: Schema.ObjectId, ref: 'Tournament'}]
    },
    {
        timestamps: true
    }
);
module.exports = mongoose.model('Favorites', FavoritesSchema, 'favorites');