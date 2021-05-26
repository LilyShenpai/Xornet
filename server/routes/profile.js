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
  _id:              Joi.string(),
  username:         Joi.string().alphanum().min(3).max(30),
  profileImage:     Joi.string(),
  password:         Joi.string().pattern(new RegExp("^[a-zA-Z0-9!@#$%^&*()_+$]{3,30}")),
  repeatPassword:   Joi.ref("password"),
  email:            Joi.string().email({ minDomainSegments: 2 })
});

async function saveImage(image){
    return new Promise(async (resolve, reject)=> {
        let date = Date.now();
        try {
            Jimp.read(`./temp/${image.filename}`, async (err, jimpImage) => {
                fs.unlink(`./temp/${image.filename}`, () => {});
                if (err) throw err;
                if (jimpImage.bitmap.width > 128) jimpImage.resize(Jimp.AUTO, 128)
                jimpImage.write(`./uploads/images/${date}-${image.originalname}`);
                resolve(`https://backend.xornet.cloud/images/${date}-${image.originalname}`);
            });
        } catch (error) {
            reject(error);
        }
    });
};

router.use(upload.any());

router.get("/profile", auth, async (req, res) => {
    req.user.password = undefined;
    req.user.machines = undefined;
    res.status(200).json(req.user);
});

router.patch("/profile", auth, async (req, res) => {
    req.body.json = JSON.parse(req.body.json);
    try {
        let profile = req.body.json;
        if(req.files[0]) profile.profileImage = await saveImage(req.files[0]),
        await schema.validateAsync(profile);
        await User.update(req.user._id, profile);
        res.status(201).json({message: "Profile updated", profile });
    } catch (error) {
        console.log(error);
        res.status(400).json({error: error});
    }
});

module.exports = router;