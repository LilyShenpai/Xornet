const mongoose = require('mongoose');
const Schema = mongoose.Schema;
mongoose.connect(process.env.MONGODB_HOST, {useNewUrlParser: true, useUnifiedTopology: true});

const schema = new Schema({
    _id:        String,                        // The user's ID
    created_at: Date,                          // Date when the account is created
    username:   String,                        // Username of the user
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
 * @param {String} [id] the uuid of the user
 * @param {String} [username] the username of the user
 * @param {String} [password] the encrypted password of the user
 */
schema.statics.add = async function (id, username, password){
    const users = await User.find({ _id: id}).exec()
    if (users.length !== 0) return console.warn(`[MANGOLIA]: User with uuid '${id}' is already in the database!`);
  
    // TODO: create all the typical password salting stuff to hash passwords
    // and add middlewares on the websockets for protected routes
    await new this({_id: id, username: username, password: password}).save(); 
    console.log(`[MANGOLIA]: User with uuid '${id}' added to the database!`);
}

module.exports = mongoose.model('User', schema);
