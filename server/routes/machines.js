const express = require("express");
const router = express.Router();
const Machine = require("@/models/Machine.js");
const auth = require("@/middleware/auth.js");

router.use(auth);

module.exports = router;
