// express generator defaults
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

// other middleware required
const compression = require('compression');
const helmet = require('helmet');
const cors = require('cors');

const initializeAuth = require('./lib/auth/authentication');
const {errorHandler, noPageHandler} = require('./lib/helpers/route-errors');

// Routes
const sendReactApp = require('./lib/routes/send-react-app');
const apiRouter = require('./lib/routes/api');

// Initialize app
const app = express();

// env configuration if not in Production or Testing
if (app.get('env') === 'development') require('dotenv').config();

// Initialize db connection
const db = require('./lib/db/db_index');

// Initialize session and authentication
initializeAuth(app, db);

// Cors setup
const corsOptions = {
    origin: 'https://conwu7.github.io',
    optionsSuccessStatus: 200
}
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));

// Initialize pre-routing middleware
app.use(compression());
app.use(helmet());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// routing
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api', apiRouter);
app.use('/', sendReactApp);

// 404 handler
app.use(noPageHandler);

// error handler
app.use(errorHandler);

// export to bin/www
module.exports = app;
