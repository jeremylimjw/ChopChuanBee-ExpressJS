var express = require('express');
var router = express.Router();

// Add on more routes here.
router.use('/auth', require('./auth'));
router.use('/customer', require('./customer'));
router.use('/employee', require('./employee'));

module.exports = router;
