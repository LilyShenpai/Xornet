const express = require("express");
const router = express.Router();
const Stats = require("@/models/Stats.js");
const Machine = require("@/models/Machine.js");
const auth = require("@/middleware/auth.js");
const cleanObject = require("@/util/cleanObject.js");

router.get("/stats/daily-traffic", async (req, res) => {
  res.status(200).json(await Stats.fetchDailyTraffic(86400000));
});

router.get("/stats/network/:machine", auth, async (req, res) => {
  res.status(200).json(await Stats.fetchMachineNetwork(req.params.machine));
});

// TODO: Add the user's ID in the machine so we can auth the machines to users
// so random people wont be able to get people's details cus they kinda
// important to keep a secret you know?
router.get("/stats/machine/:machineUUID?", async (req, res) => {
  const machine = await Machine.findOne({ _id: req.params.machineUUID });
  // Delete this useless property
  // TODO: probably should make it so these don't exist in the first place
  // and add some sort of validation on the staticData
  delete machine.static.version;
  res.status(200).json(cleanObject(machine.static));
});

module.exports = router;
