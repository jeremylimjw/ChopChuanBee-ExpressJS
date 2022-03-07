var express = require("express");
var router = express.Router();

// Add on more routes here.
router.use("/auth", require("./auth"));
router.use("/customer", require("./customer"));
router.use("/supplier", require("./supplier"));
router.use("/purchaseOrder", require("./purchaseOrder"));
router.use("/product", require("./product"));
router.use("/employee", require("./employee"));
router.use("/employee", require("./accessRight"));
router.use("/employee/leave", require("./leaveAccount"));
router.use("/employee/leave/application", require("./leaveApplication"));
router.use("/log", require("./log"));
router.use("/accounting", require("./accounting"));
router.use("/external", require("./external"));
router.use("/chargedUnder", require("./chargedUnder"));
router.use("/analytics", require("./analytics"));
module.exports = router;
