const jwt = require("jsonwebtoken");
const User = require("@/models/User.js");

let auth = (req, res, next) => {

    jwt.verify(req.cookies.token, process.env.SECRET, async (error, payload) => {
        if (error) {
            console.log(error);
            res.status(401).json({ message: "You must be logged in to view your user info idiot 🖕🖕🖕", error});
            return
        }
        req.user = (await User.findOne({ _id: payload.uuid }).exec());
        next();
    });
};

module.exports = auth;