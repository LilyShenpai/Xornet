const auth = require("@/middleware/auth.js");
const express = require("express");
const multer = require("multer");
const Jimp = require("jimp");
const fs = require("fs");
const path = require("path");
const upload = multer({ dest: "./temp/" });
const router = express.Router();
const Joi = require("joi");
const User = require("@/models/User.js");

const schema = Joi.object({
  _id: Joi.string(),
  username: Joi.string().alphanum().min(3).max(30),
  profileImage: Joi.object(),
  password: Joi.string().pattern(new RegExp("^[a-zA-Z0-9!@#$%^&*()_+$]{3,30}")),
  repeatPassword: Joi.ref("password"),
  geolocation: Joi.object(),
  email: Joi.string().email({ minDomainSegments: 2 }),
});

async function saveImage(image) {
  return new Promise(async (resolve, reject) => {
    let date = Date.now();
    try {
      Jimp.read(`./temp/${image.filename}`, async (err, jimpImage) => {
        fs.unlink(`./temp/${image.filename}`, () => {});
        if (err) throw err;
        if (jimpImage.bitmap.width > 256) jimpImage.resize(Jimp.AUTO, 256);
        jimpImage.write(`./uploads/images/${date}-${image.originalname}`);
        resolve({
          url: `https://backend.xornet.cloud/images/${date}-${image.originalname}`,
          hasAlpha: jimpImage.hasAlpha(),
        });
      });
    } catch (error) {
      reject(error);
    }
  });
}

router.use(upload.any());

router.get("/profile/:username", auth, async (req, res) => {
  // If the user is the currently logged in one just send this back
  if (req.params.username == req.user.username){
    if(req.user.password) req.user.password = undefined;
    if(req.user.machines) req.user.machines = undefined;
    if(req.user.geolocation?.isp) req.user.geolocation.isp = undefined;
    return res.status(200).json(req.user);
  }

  // If they arent logged in then that means they are trying to see
  // another user's profile so we fetch it from the database
  const user = await User.findOne({username: req.params.username});
  if(user.password) user.password = undefined;
  if(user.machines) user.machines = undefined;
  if(user.geolocation?.isp) user.geolocation.isp = undefined;
  return res.status(200).json(user);
});

router.patch("/profile", auth, async (req, res) => {
  req.body.json = JSON.parse(req.body.json);
  try {
    let profile = req.body.json;
    if (req.files[0]) (profile.profileImage = await saveImage(req.files[0])), await schema.validateAsync(profile);
    await User.update(req.user._id, profile);
    res.status(201).json({ message: "Profile updated", profile });
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: error });
  }
});

const uuidRegex = /[a-f0-9]{32}/;

router.put("/profile/machine", auth, async (req, res) => {
  await User.addMachine(req.user._id, req.body.machine);
  if (!uuidRegex.test(req.body.machine)) return res.status(400).json({ message: "invalid uuid" });
  res.status(201).json({ message: "machine added" });
});

module.exports = router;
