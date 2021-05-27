const express = require('express');
const router = express.Router();
const Stats = require("@/models/Stats.js");

router.get('/stats', async (req, res) => {

    let object = {
      totalMachines: machines.size,
      totalTraffic: ((await Stats.fetchDailyTraffic(86400000)).total_megabytes / 1000).toFixed(2),
      totalCores: Array.from(machinesStatic.values()).reduce((a, b) => a + b.static.cpu.cores, 0),
      totalRam: Math.ceil(Array.from(machines.values()).reduce((a, b) => a + b.ram.total, 0)),
    };
  
    res.json(object);
});
  
router.get("/stats/daily-traffic", async (req, res) => {
    res.json(await Stats.fetchDailyTraffic(86400000));
});

module.exports = router