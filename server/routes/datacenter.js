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


router.use(auth);

router.post("/datacenter/new", async (req, res) => {
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

router.get("/datacenter/:datacenter?", datacenterAuth, async (req, res) => {
  const datacenter = await Datacenter.findOne({ name: req.params.datacenter, owner: req.user._id });
  datacenter.owner == req.user;
  datacenter.members.map(async (member) => {
    const { username, profileImage, _id } = await User.findOne({ _id: member });
    return { username, profileImage, _id };
  });
  res.status(200).json(datacenter);
});

router.patch("/datacenter/:datacenter?", datacenterAuth, async (req, res) => {
  
  if(req.files.length == 0) return res.status(403).json({ message: "no images provided"});
  const datacenter = await Datacenter.findOne({ name: req.params.datacenter });

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

router.get("/datacenter/:datacenter/machine/count", datacenterAuth, async (req, res) => {
  const datacenter = await Datacenter.findOne({ name: req.params.datacenter });
  res.status(200).json({count: datacenter.machines.length});
});

router.put("/datacenter/:datacenter/machine/:machine", datacenterAuth, async (req, res) => {
  if (req.params.datacenter == null || req.params.machine == null) {
    return res.status(403).json({ message: "Undefined field" });
  }

  req.params.machine = req.params.machine.toLowerCase();

  const query = await Datacenter.addMachine(req.params.datacenter, req.params.machine);
  const machine = await Machine.findOne({ _id: req.params.machine }).exec();
  machine.datacenter = req.params.datacenter;
  await machine.save();
  res.status(201).json(query);
});

router.delete("/datacenter/:datacenter/machine/:machine", datacenterAuth, async (req, res) => {
  if (req.params.machine === "undefined" || req.params.user === "undefined") {
    return res.status(403).json({ message: "Undefined field" });
  }

  req.params.machine = req.params.machine.toLowerCase();

  const query = await Datacenter.removeMachine(req.params.machine, req.params.user);
  res.status(201).json(query);
});

router.put("/datacenter/:datacenter/user/:user", datacenterAuth, async (req, res) => {
  if (req.params.datacenter === "undefined" || req.params.user === "undefined") {
    return res.status(403).json({ message: "Undefined field" });
  }

  req.params.user = req.params.user.toLowerCase();

  const query = await Datacenter.addUser(req.params.datacenter, req.params.user);
  res.status(201).json(query);
});

router.delete("/datacenter/:datacenter/user/:user", datacenterAuth, async (req, res) => {
  if (req.params.datacenter === "undefined" || req.params.user === "undefined") {
    return res.status(403).json({ message: "Undefined field" });
  }

  req.params.user = req.params.user.toLowerCase();

  const query = await Datacenter.removeUser(req.params.datacenter, req.params.user);
  res.status(201).json(query);
});


module.exports = router;
