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
  if (machines.length !== 0) return console.warn(`[MANGOLIA]: Machine with uuid '${staticData.system.uuid}' is already in the database!`);
  await new this({ _id: staticData.system.uuid, static: staticData }).save();
};

/**
 * Gets all the total ram of an array of machines
 * @param {Array} machines the array of the machines to get
 * @returns total bytes of ram
 */
schema.statics.getTotalRam = function(machines){
  // Replace the array with a new one that sums up all the ram for each machine
  machines = machines.map(machine => machine.static.memLayout.reduce((a, b) => a + b.size, 0));

  // Sum up all the ram together and return
  return machines.reduce((a, b) => a + b, 0);
};

module.exports = mongoose.model("Machine", schema);
