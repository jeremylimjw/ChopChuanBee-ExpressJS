var express = require('express');
const { requireAccess } = require('../auth');
var router = express.Router();

// Test route
router.get('/', requireAccess("HR", true), async function(req, res, next) {
  res.send({ message: "200 OK"});
});

module.exports = router;
