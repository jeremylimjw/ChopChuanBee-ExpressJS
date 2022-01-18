var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  res.send({ message: "200 OK"});
});

module.exports = router;
