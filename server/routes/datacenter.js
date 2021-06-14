const express = require("express");
const router = express.Router();
const Logs = require("@/models/Logs.js");
const Machine = require("@/models/Machine.js");
const User = require("@/models/User.js");
const Datacenter = require("@/models/Datacenter.js");
const auth = require("@/middleware/auth.js");
const datacenterAuth = require("@/middleware/datacenterAuth.js");
const FileType = require("file-type");
const saveImage = require("@/util/saveImage.js");
const { route } = require("./profile");
const Joi = require("joi");

router.use(auth);

router.post("/datacenter/new", async (req, res) => {
  if (req.body.name.toLowerCase() === 'unassigned') return res.status(403).json({ message: "you can't call your datacenter 'unassigned'"});

  // Validate name
  const schema = Joi.object({name: Joi.string().alphanum().min(2).max(30)});
  try {
    req.body = await schema.validateAsync(req.body);  
  } catch (error) { 
    return res.status(403).json({ message: error.details[0].message});
  }
  const datacenter = await Datacenter.add(req.user.id, req.body.name);
  await req.user.addDatacenter(datacenter._id);
  res.status(201).json(datacenter);
});

router.get("/datacenter/all", async (req, res) => {
  let datacenters = [];
  req.user.is_admin ? (datacenters = await Datacenter.find()) : (datacenters = await Datacenter.find({ $or: [{ owner: req.user._id }, { members: req.user._id }] }));
  for (datacenter of datacenters) {
    datacenter.owner == req.user;
    let accumulator = [];
    for (member of datacenter.members) {
      const { username, profileImage, _id } = await User.findOne({ _id: member });
      accumulator.push({ username, profileImage, _id });
    }
    datacenter.members = accumulator;
  }
  res.status(200).json(datacenters);
});

router.get("/datacenter/:datacenterUUID?", datacenterAuth, async (req, res) => {
  const datacenter = await Datacenter.findOne({ name: req.params.datacenterUUID, owner: req.user._id });
  datacenter.owner == req.user;
  datacenter.members.map(async (member) => {
    const { username, profileImage, _id } = await User.findOne({ _id: member });
    return { username, profileImage, _id };
  });
  res.status(200).json(datacenter);
});

router.patch("/datacenter/:datacenterUUID?", datacenterAuth, async (req, res) => {
  
  if(req.files.length == 0) return res.status(403).json({ message: "no images provided"});
  const datacenter = await Datacenter.findOne({ name: req.params.datacenterUUID });

  try {
    for (file of req.files) {
      // Validate profile integrity
      switch (file.fieldname) {
        case "logo":
          // If the image is a gif then simply save it without resizing
          if (file.mimetype == "image/svg+xml") datacenter.logo = (await saveImage(file)).url;
          else return res.status(400).json({ message: "Invalid filetype, please provide an SVG/XML" });
          break;
        case "banner":
          if (file.mimetype.startsWith("image/")) datacenter.banner = (await saveImage(file)).url;
          else return res.status(400).json({ message: "Invalid filetype, please provide an Image" });
          break;
      }
    }
    await datacenter.save();
    res.status(201).json({ message: "datacenter updated", datacenter });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: error });
  }
});

router.get("/datacenter/:datacenterUUID/machine/count", datacenterAuth, async (req, res) => {
  const datacenter = await Datacenter.findOne({ name: req.params.datacenterUUID });
  res.status(200).json({count: datacenter.machines.length});
});

router.put("/datacenter/:datacenterUUID/machine/:machineUUID", datacenterAuth, async (req, res) => {

  if (!req.user.machines.includes(req.params.machineUUID)) {
    return res.status(403).json({ message: "That machine doesn't belong to you" });
  }

  if (req.params.datacenterUUID === "undefined" || req.params.machineUUID === "undefined") {
    return res.status(403).json({ message: "Undefined field" });
  }
 
  req.params.machineUUID = req.params.machineUUID.toLowerCase();

  const query = await Datacenter.addMachine(req.params.datacenterUUID, req.params.machineUUID);
  const machine = await Machine.findOne({ _id: req.params.machineUUID }).exec();
  machine.datacenter = req.params.datacenterUUID;
  await machine.save();
  res.status(201).json(query);
});

router.delete("/datacenter/:datacenterUUID/machine/:machineUUID", datacenterAuth, async (req, res) => {
  if (req.params.machineUUID === "undefined" || req.params.user === "undefined") {
    return res.status(403).json({ message: "Undefined field" });
  }

  req.params.machineUUID = req.params.machineUUID.toLowerCase();

  const query = await Datacenter.removeMachine(req.params.machineUUID, req.params.user);
  res.status(201).json(query);
});

router.put("/datacenter/:datacenterUUID/user/:userUUID", datacenterAuth, async (req, res) => {

  const user = await User.findOne({_id: req.params.userUUID});

  if (!user) {
    return res.status(403).json({ message: "That user doesn't exist in the database" });
  }

  if (req.params.datacenterUUID === "undefined" || req.params.userUUID === "undefined") {
    return res.status(403).json({ message: "Undefined field" });
  }

  req.params.userUUID = req.params.userUUID.toLowerCase();

  const query = await Datacenter.addUser(req.params.datacenterUUID, req.params.userUUID);
  res.status(201).json(query);
});

router.delete("/datacenter/:datacenterUUID/user/:userUUID", datacenterAuth, async (req, res) => {
  if (req.params.datacenterUUID === "undefined" || req.params.userUUID === "undefined") {
    return res.status(403).json({ message: "Undefined field" });
  }

  req.params.userUUID = req.params.userUUID.toLowerCase();

  const query = await Datacenter.removeUser(req.params.datacenterUUID, req.params.userUUID);
  res.status(201).json(query);
});


module.exports = router;
