const express = require("express");
const router = express.Router();
const User = require("@/models/User.js");

const TEST_UUID = '00000000000000000000000000000000';

router.post("/reporter", async (req, res) => {
  if (req.body.uuid == TEST_UUID) {
    res.status(200).json({ message: "Test reporter accepted" });
  }

  const user = await User.findOne({ machines: req.body.uuid });
  if (user) {
    res.status(200).json({ message: "Reporter linked to an account", account_uuid: user._id });
  } else {
    res.status(403).json({ message: "Reporter not linked to any accounts" });
  }
});

module.exports = router;
