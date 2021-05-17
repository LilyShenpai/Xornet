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

module.exports = mongoose.model('User', schema);
