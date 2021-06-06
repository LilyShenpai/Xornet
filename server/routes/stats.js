const express = require("express");
const router = express.Router();
const Stats = require("@/models/Stats.js");
const auth = require("@/middleware/auth.js");

router.get("/stats/network/:machine", auth, async (req, res) => {
  res.status(200).json(await Stats.fetchMachineNetwork(req.params.machine));
});

router.get("/stats/daily-traffic", async (req, res) => {
  res.status(200).json(await Stats.fetchDailyTraffic(86400000));
});

module.exports = router;
