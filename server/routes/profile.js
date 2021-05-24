const auth = require("@/middleware/auth.js");
const express = require("express");
const router = express.Router();
router.use(auth);

router.get("/profile", async (req, res) => {
    if (!req.user) return res.status(400).json({ error: "Not logged in!" });
    req.user.password = undefined;
    res.status(200).json(req.user);
});

module.exports = router;
