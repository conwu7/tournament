const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;
const UserSchema = new Schema(
    {
        email: {type: String, required: true, unique: true},
        username: {type: String, required: true, unique: true},
        hash: {type: String, required: true},
    },
    {
        timestamps: true
    }
);

// unique validator for email and username
UserSchema.plugin(uniqueValidator, {message: 'is already taken'});

module.exports = mongoose.model('User', UserSchema);