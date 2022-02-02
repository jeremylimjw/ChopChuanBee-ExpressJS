var express = require("express");
var router = express.Router();

// Add on more routes here.
router.use("/auth", require("./auth"));
router.use("/customer", require("./customer"));
router.use("/supplier", require("./supplier"));
router.use("/product", require("./product"));
router.use("/leave", require("./leave"));
router.use("/employee", require("./employee"));
router.use("/employee", require("./accessRight"));

module.exports = router;
