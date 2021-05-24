const auth = require("@/middleware/auth.js");
const express = require("express");
const multer = require("multer");
const Jimp = require("jimp");
const fs = require("fs");
const upload = multer({ dest: "./temp/" });

const router = express.Router();
// router.use(auth);
router.use(upload.any());

router.get("/profile", auth, async (req, res) => {
    if (!req.user) return res.status(400).json({ error: "Not logged in!" });
    req.user.password = undefined;
    res.status(200).json(req.user);
});

router.patch("/profile", async (req, res) => {
    console.log(req.files);
    let date = Date.now();
    Jimp.read(`./temp/${req.files[0].filename}`, async (err, image) => {
        if (err) throw err;
        if (image.bitmap.width > 128) image.resize(Jimp.AUTO, 128)
        image.write(`./uploads/images/${date}-${req.files[0].originalname}`);
        fs.unlink(`./temp/${req.files[0].filename}`, () => {});
        res.status(201).json({message: "Profile updated", profile: {
            profileImage: `https://backend.xornet.cloud/images/${date}-${req.files[0].originalname}`
        }});
    });
});

module.exports = router;
