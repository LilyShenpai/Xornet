const jwt = require("jsonwebtoken");
const User = require("@/models/User.js");

let auth = (req, res, next) => {
    jwt.verify(req.cookies.token, process.env.SECRET, async (error, payload) => {
        if (error) return res.status(401).json({ message: "You must be logged in to view your user info idiot 🖕🖕🖕", error});
        req.user = (await User.find({ _id: payload.uuid }))[0];
        next();
    });
};

module.exports = auth;