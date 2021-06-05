const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const express = require("express");
const User = require("@/models/User.js");

const router = express.Router();

// Functions
async function createToken(user, res) {
  const payload = {
    uuid: user._id,
    username: user.username,
  };

  jwt.sign(payload, process.env.SECRET, { expiresIn: "30d" }, (err, token) => {
    if (err) {
      console.log(err);
      res.status(500).json({ message: err });
    }

    res.status(200).cookie("token", token).json({
      message: "Logged in",
      token: token,
    });
  });
}

router.post("/login", async (req, res) => {
  // Parse body
  const user = await User.findOne({ username: req.body.username }).exec();

  // If there is no user with those credentials return this
  if (!user) return res.status(400).json({ error: "User not found ｡･ﾟﾟ*(>д<)*ﾟﾟ･｡" });

  // This is for backwards compatibility
  if (!user.geolocation) await User.update(user._id, { geolocation: req.body.geolocation });

  // Try matching
  try {
    const match = await bcrypt.compare(req.body.password, user.password);
    console.log(match);
    if (match) {
      createToken(user, res);
    } else throw "Password mismatch error"; // If password doesn't match throw error
  } catch (error) {
    console.log(error);
    if (error) res.status(400).json({ error: "Invalid Credentials ｡･ﾟﾟ*(>д<)*ﾟﾟ･｡" });
  }
});

module.exports = router;
