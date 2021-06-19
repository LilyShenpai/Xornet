const express = require("express");
const router = express.Router();
const User = require("@/models/User.js");
const auth = require("@/middleware/auth.js");
const uuidRegex = /\b[0-9a-f]{8}\b-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-\b[0-9a-f]{12}\b/;

// This accepts either a username or a user's UUID
router.get("/search/user/:user", auth, async (req, res) => {
  if (req.params.user == '*') return res.status(200).json(await User.find());
  else if (uuidRegex.test(req.params.user.toLowerCase())) {
    res.status(200).json(await User.find({ _id: { $regex: req.params.user.toLowerCase(), $options: "i" } }));
  }
  res.status(200).json(await User.find({ username: { $regex: req.params.user, $options: "i" } }));
});

module.exports = router;
