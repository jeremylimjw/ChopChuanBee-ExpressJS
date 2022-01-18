var express = require('express');
var router = express.Router();

// Add on more routes here.
router.use('/users', require('./users'));

module.exports = router;
