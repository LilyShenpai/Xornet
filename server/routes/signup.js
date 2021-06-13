const express = require("express");
const Joi = require("joi");
const User = require("@/models/User.js");
const router = express.Router();

const schema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  password: Joi.string().pattern(new RegExp("^[a-zA-Z0-9!@#$%^&*()_+$]{3,30}")).required(),
  repeatPassword: Joi.ref("password"),
  email: Joi.string().email({ minDomainSegments: 2 }).required(),
  geolocation: Joi.object().required(),
});

router.post("/signup", async (req, res) => {
  // Validate the form
  try {
    var form = await schema.validateAsync(req.body);
  } catch (error) {
    return res.status(400).json({message: error.details[0].message});
  }

  // Encrypt Passwords
  try {
    var response = await User.add(form);
  } catch (error) {
    return res.status(400).json({message: error});
  }

  return res.status(201).json(response);
});

module.exports = router;
