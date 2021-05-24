const jwt = require("jsonwebtoken");
const User = require("@/models/User.js");

let auth = (req, res, next) => {
    console.log(process.env.SECRET);
    console.log(req.cookies.token);
    jwt.verify(req.cookies.token, process.env.SECRET, async (error, payload) => {
        console.log(error);
        if (error) return res.status(401).json({ message: "You must be logged in to view your user info idiot 🖕🖕🖕", error});
        req.user = (await User.find({ _id: payload.uuid }).exec())[0];
        next();
    });
};

module.exports = auth;