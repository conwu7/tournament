// NOT USING EXPRESS ROUTER

const path = require('path');

/* Send React App */
function sendReactApp (req, res, next) {
  res.sendFile(path.join(__dirname, '../../public', 'index.html'));
}

module.exports = sendReactApp;
