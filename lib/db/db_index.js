const mongoose = require('mongoose');

mongoose.connect(
    process.env.MONGODB_URI,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true
    }
)
const db = mongoose.connection;
// avoid deprecation warning message when running
mongoose.set('useFindAndModify', false);
db.on('error', console.error.bind(console, "mongo connection error"));

module.exports = db;