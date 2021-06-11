const express = require("express");
const router = express.Router();
const Logs = require("@/models/Logs.js");
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

router.get("/datacenter/:datacenterUUID?", datacenterAuth, async (req, res) => {
  res.status(200).json(await Datacenter.findOne({_id: req.params.datacenterUUID}));
});
  
router.put("/datacenter/:datacenterUUID?/add/machine/:machineUUID?", datacenterAuth, async (req, res) => {
  const query = await Datacenter.addMachine(req.params.datacenterUUID, req.params.machineUUID);
  console.log(query)
  res.status(201).json(query);
});

router.put("/datacenter/:datacenterUUID?/add/user/:userUUID?", datacenterAuth, async (req, res) => {
  const query = await Datacenter.addUser(req.params.datacenterUUID, req.params.userUUID);
  console.log(query)
  res.status(201).json(query);
});

module.exports = router;
