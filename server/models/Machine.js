const mongoose = require('mongoose');
const Schema = mongoose.Schema;
mongoose.connect(process.env.MONGODB_HOST, {useNewUrlParser: true, useUnifiedTopology: true});

const schema = new Schema({
    _id:        String, // String is shorthand for {type: String}
    machine_id: String,
    static:     {type: Object, default: null},
}, {
    versionKey: false // You should be aware of the outcome after set to false
});

module.exports = mongoose.model('Machine', schema);
