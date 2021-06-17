const express = require("express");
const router = express.Router();
const Logs = require("@/models/Logs.js");
const Machine = require("@/models/Machine.js");
const User = require("@/models/User.js");
const auth = require("@/middleware/auth.js");
const datacenterAuth = require("@/middleware/datacenterAuth.js");
const FileType = require("file-type");
const saveImage = require("@/util/saveImage.js");
const { route } = require("./profile");
const Joi = require("joi");

router.use(auth);

// TODO: Add the user's ID in the machine so we can auth the machines to users
// so random people wont be able to get people's details cus they kinda
// important to keep a secret you know?
router.get("/machines/:machineUUID?", async (req, res) => {
  const machine = await Machine.findOne({ _id: req.params.machineUUID });
  res.status(200).json(machine.static);
});

module.exports = router;
