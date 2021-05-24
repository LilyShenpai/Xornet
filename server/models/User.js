const mongoose = require('mongoose');
const Schema = mongoose.Schema;
mongoose.connect(process.env.MONGODB_HOST, {useNewUrlParser: true, useUnifiedTopology: true});
const { v4: uuidv4 } = require('uuid');
const bcrypt = require("bcrypt");
const saltRounds = parseInt(process.env.SALTROUNDS);

const schema = new Schema({
    _id:        String,                        // The user's ID
    created_at: Date,                          // Date when the account is created
    username:   String,                        // Username of the user
    email:      String,                        // Email of the user
    password:   String,                        // Encrypted password of the user
    pfp:        String,                        // Link to the pfp of the user
    points:     Number,                        // User's earned points
    is_admin:   Boolean,                       // Is user administrator or not
    machines:   { type: Array, default: null } // The array that contains the UUID's of the machines the user has
}, {
    versionKey: false // You should be aware of the outcome after set to false
});

/**
 * Attempts to create a user and save them to the database
 * @param {String} [username] the username of the user
 * @param {String} [email] the email of the user
 * @param {String} [password] the encrypted password of the user
 */
schema.statics.add = async function (username, email, password){

    // Check if Username exists in DB
    const usernameQuery = await User.find({ username }).exec()
    if (usernameQuery.length !== 0) {
        console.warn(`[MANGOLIA]: User '${username}' is already in the database!`);
        throw {message: `User '${username}' is already in the database!`};
    };

    // Check if email exists in DB
    const emailQuery = await User.find({ email }).exec()
    if (emailQuery.length !== 0) {
        console.warn(`[MANGOLIA]: User with email '${email}' is already in the database!`);
        throw {message: `User with email '${email}' is already in the database!`};
    };

    // Encrypt password
    const hash = await bcrypt.hash(password, saltRounds);

    // Add user to DB
    await new this({_id: uuidv4(), username: username, email: email, password: hash}).save();
    console.log(`[MANGOLIA]: User '${username}' added to the database!`);
    return { message: `User '${username}' added to the database!`};
}

let User = mongoose.model('User', schema);

module.exports = User;
