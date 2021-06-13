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
const Machine = require("@/models/Machine.js");
const FileType = require("file-type");
const saveImage = require("@/util/saveImage.js");

const schema = Joi.object({
  _id: Joi.string(),
  profileImage: Joi.object(),
  username: Joi.string(),
  profileBanner: Joi.object(),
  password: Joi.string().pattern(new RegExp("^[a-zA-Z0-9!@#$%^&*()_+$]{3,30}")),
  repeat_password: Joi.ref("password"),
  geolocation: Joi.object(),
  created_at: Joi.number(),
  points: Joi.number(),
  machines: Joi.array(),
  bio: Joi.string(),
  speedtest: Joi.object(),
  datacenters: Joi.array(),
  isDev: Joi.string(),
  is_admin: Joi.boolean(),
  socials: Joi.array(),
  badges: Joi.object(),
  email: Joi.string().email({ minDomainSegments: 2 }),
});

async function resizeSaveImage(image) {
  return new Promise(async (resolve, reject) => {
    // Get the date so we can append a unique number on the file name
    // so all the files are unique and don't conflict
    let date = Date.now();

    try {
      Jimp.read(`./temp/${image.filename}`, async (err, jimpImage) => {
        // Delete from temp
        fs.unlink(`./temp/${image.filename}`, () => {});
        if (err) throw err;

        // Resize the image to 256 if its bigger than that
        if (jimpImage.bitmap.width > 256) jimpImage.resize(Jimp.AUTO, 256);

        // Save the image
        jimpImage.write(`./uploads/images/${date}-${image.originalname}`);
        resolve({
          url: `https://backend.xornet.cloud/images/${date}-${image.originalname}`.replace(/\s/g, "%20"),
          hasAlpha: jimpImage.hasAlpha(),
        });
      });
    } catch (error) {
      reject(error);
    }
  });
}

function deleteSensitiveInformation(user) {
  if (user.password) user.password = undefined;
  if (user.geolocation?.isp) user.geolocation.isp = undefined;
  if (user.speedtest) {
    user.speedtest.interface = undefined;
    user.speedtest.isp = undefined;
    user.speedtest.isp = undefined;
  }
  return user;
}

// DELETE THIS LATER N1KO23 PLEASE FIX
// WE DONT KNOW HOW TO DO THIS
// Temporary function to append stuff to user
async function appendExtraShit(user) {
  let reducedUser = JSON.parse(JSON.stringify(user));
  reducedUser.totalRam = await user.getTotalRam();
  reducedUser.totalCores = await user.getTotalCores();
  // reducedUser.totalBandwidth = await user.getTotalBandwidth();
  return reducedUser;
}

router.get("/profile/:username", auth, async (req, res) => {
  if (req.params.username == undefined) return res.status(404);
  // If the user is the currently logged in one just send this back
  if (req.params.username == req.user.username) {
    return res.status(200).json(deleteSensitiveInformation(await appendExtraShit(req.user)));
  }

  // If they arent logged in then that means they are trying to see
  // another user's profile so we fetch it from the database
  let user = await User.findOne({ username: req.params.username });
  return res.status(200).json(deleteSensitiveInformation(await appendExtraShit(user)));
});

router.patch("/profile", auth, async (req, res) => {
  req.body.json = JSON.parse(req.body.json);

  // Delete this useless shit it doesn't add it to the database by accident
  delete req.body.json.totalRam;
  delete req.body.json.totalCores;
  // delete req.body.json.totalBandwidth;

  try {
    let profile = req.body.json;
    for (file of req.files) {
      // Check for valid mimetype
      const filetype = await FileType.fromFile(`./temp/${file.filename}`);
      if (!filetype.mime.startsWith("image")) {
        return res.status(400).json({ message: "invalid file type" });
      }

      // Validate profile integrity
      switch (file.fieldname) {
        case "image":
          // If the image is a gif then simply save it without resizing
          if (filetype.mime == "image/gif") profile.profileImage = await saveImage(file);
          else profile.profileImage = await resizeSaveImage(file);
          break;
        case "banner":
          profile.profileBanner = await saveImage(file);
          break;
      }

      // Validate profile integrity
      await schema.validateAsync(profile);
    }
    await User.update(req.user._id, profile);
    res.status(201).json({ message: "Profile updated", profile });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: error });
  }
});

const uuidRegex = /([a-f0-9]{32})|([a-f0-9]{16})/;

router.put("/profile/machine", auth, async (req, res) => {
  if (await User.findOne({machines: req.body.machine})) return res.status(403).json({ message: "this machine belongs to another user" });
  await User.addMachine(req.user._id, req.body.machine);
  if (!uuidRegex.test(req.body.machine)) return res.status(400).json({ message: "invalid uuid" });
  res.status(201).json({ message: "machine added" });
});

module.exports = router;
