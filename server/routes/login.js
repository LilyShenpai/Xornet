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
      res.status(200)
         .cookie("token", token)
         .json({
            message: "Logged in",
            token: token,
          });
    });
}

router.post("/login", async (req, res) => {
    // Parse body
    const user = (await User.find({ username: req.body.username }).exec())[0];

    console.log(req.body.username, user);

    try {  // Try matching
      const match = await bcrypt.compare(req.body.password, user.password);
      if (match) createToken(user, res);
      else throw "error"; // If password doesn't match throw error
    } catch (error) {
      console.log(error);
      if (error) res.status(400).json({ error: "Invalid Credentials ｡･ﾟﾟ*(>д<)*ﾟﾟ･｡" });
    }
});

module.exports = router;
