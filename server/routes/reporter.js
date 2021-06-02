const express = require("express");
const router = express.Router();
const User = require("@/models/User.js");

router.post("/reporter", async (req, res) => {
  console.log(req.body);

  const user = await User.findOne({ machines: req.body.uuid });
  if (user) {
    res.status(200).json({ message: "Reporter linked to an account", account_uuid: user._id });
  } else {
    res.status(403).json({ message: "Reporter not linked to any accounts" });
  }
});

module.exports = router; 