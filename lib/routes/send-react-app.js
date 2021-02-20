// NOT USING EXPRESS ROUTER

const path = require('path');
const express = require('express');
const router = express.Router();

/* Send React App */
function sendReactApp (req, res, next) {
  res.sendFile(path.join(__dirname, '../../public', 'index.html'));
}

router.use(sendReactApp);


module.exports = {sendReactApp, reactRouter: router};
