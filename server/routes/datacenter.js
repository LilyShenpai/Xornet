const express = require("express");
const router = express.Router();
const Logs = require("@/models/Logs.js");
const Machine = require("@/models/Machine.js");
const User = require("@/models/User.js");
const Datacenter = require("@/models/Datacenter.js");
const auth = require("@/middleware/auth.js");
const datacenterAuth = require("@/middleware/datacenterAuth.js");

router.use(auth);

router.post("/datacenter/new", async (req, res) => {
  const datacenter = await Datacenter.add(req.user.id, req.body.name);
  await req.user.addDatacenter(datacenter._id);
  res.status(201).json(datacenter);
});

router.get("/datacenter/all", async (req, res) => {
  res.status(200).json(await Datacenter.find());
});

router.get("/datacenter/:datacenterName?", datacenterAuth, async (req, res) => {
  res.status(200).json(await Datacenter.findOne({name: req.params.datacenterName}));
});

router.put("/datacenter/:datacenterUUID?/add/machine/:machineUUID?", datacenterAuth, async (req, res) => {
  const query = await Datacenter.addMachine(req.params.datacenterUUID, req.params.machineUUID);
  const machine = await Machine.findOne({_id: req.params.machineUUID}).exec();
  machine.datacenter = req.params.datacenterUUID;
  await machine.save();
  console.log(query)
  res.status(201).json(query);
});

router.put("/datacenter/:datacenterUUID?/add/user/:userUUID?", datacenterAuth, async (req, res) => {
  const query = await Datacenter.addUser(req.params.datacenterUUID, req.params.userUUID);
  console.log(query)
  res.status(201).json(query);
});

module.exports = router;
