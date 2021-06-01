const express = require("express");
const router = express.Router();
const Stats = require("@/models/Stats.js");

router.get("/stats/daily-traffic", async (req, res) => {
  res.json(await Stats.fetchDailyTraffic(86400000));
});

module.exports = router;
