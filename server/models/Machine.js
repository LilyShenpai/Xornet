const mongoose = require("mongoose");
const Schema = mongoose.Schema;
mongoose.connect(process.env.MONGODB_HOST, { useNewUrlParser: true, useUnifiedTopology: true });

const schema = new Schema(
  {
    _id: String, // String is shorthand for {type: String}
    static: { type: Object, default: null },
  },
  {
    versionKey: false, // You should be aware of the outcome after set to false
  }
);

/**
 * Attempts to create a machine and save them to the database
 * @param {Object} [staticData] contains the staticData data of the machine
 */
schema.statics.add = async function (staticData) {
  const machines = await this.find({ _id: staticData.system.uuid }).exec();
  if (machines.length !== 0) {
    // console.warn(`[MANGOLIA]: Machine with uuid '${staticData.system.uuid}' is already in the database!`);
    return
  }
  await new this({ _id: staticData.system.uuid, static: staticData }).save();
};

module.exports = mongoose.model("Machine", schema);
