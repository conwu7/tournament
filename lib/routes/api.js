// api routes
const usersRouter = require('./api-dir/users');

// other middleware
const {apiRouterInvalidRequestHandler, apiRouterErrorHandler} = require('../helpers/route-errors');

// initialize app and router
const express = require('express');
const router = express.Router();

/* ALL API ROUTES SHOULD FLOW THROUGH HERE */
router.use('/users', usersRouter);

// invalid routes
router.use(apiRouterInvalidRequestHandler);

// error handler
router.use(apiRouterErrorHandler);

module.exports = router;