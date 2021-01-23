const express = require('express');
const controller = require('../../controllers/users');
const {onlySignedInUsers} = require('../../helpers/middleware');

const router = express.Router();

/* GET users listing. */
router.post('/login', controller.login);
router.post('/logout', onlySignedInUsers, controller.logout);
router.post('/signup', controller.createUser);
router.get('/currentUser', controller.getUserDetails);

module.exports = router;
