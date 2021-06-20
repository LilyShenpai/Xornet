const express = require("express");
const router = express.Router();
const Logs = require("@/models/Logs.js");
const auth = require("@/middleware/auth.js");

// This accepts either a username or a user's UUID
router.get("/logs/:machineuuid?", auth, async (req, res) => {
  res.status(200).json(await Logs.find().sort("-timestamp").limit(50));
});

module.exports = router;
