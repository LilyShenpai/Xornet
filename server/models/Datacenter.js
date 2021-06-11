const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { v4: uuidv4 } = require("uuid");
mongoose.connect(process.env.MONGODB_HOST, { useNewUrlParser: true, useUnifiedTopology: true });

const machineUUIDRegex = /([a-f0-9]{32})|([a-f0-9]{16})/;
const userUUIDRegex = /\b[0-9a-f]{8}\b-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-\b[0-9a-f]{12}\b/;

const schema = new Schema(
  {
    _id: { type: String, required: true },
    machines: { type: Array, default: [] },
    owner: { type: String, required: true },
    name: { type: String, default: "My cool datacenter"},
    members: { type: Array, required: false, default: []},
    created_at: { type: Number, required: true },
  },
  {
    versionKey: false,
  }
);

schema.statics.add = async function (owner, name) {
  return await new this({ _id: uuidv4(), owner, name, created_at: Date.now()}).save();
};

schema.statics.addMachine = async function (datacenterUUID, machineUUID) {
  if (!machineUUID || !machineUUIDRegex.test(machineUUID)) return;
  const datacenter = await this.findOne({_id: datacenterUUID}).exec();
  if (!datacenter.machines.includes(machineUUID)) datacenter.machines.push(machineUUID);
  await datacenter.save();
  return datacenter
};

schema.statics.addUser = async function (datacenterUUID, userUUID) {
  if (!userUUID || !userUUIDRegex.test(userUUID)) return;
  const datacenter = await this.findOne({_id: datacenterUUID}).exec();
  if (!datacenter.members.includes(userUUID)) datacenter.members.push(userUUID);
  await datacenter.save();
  return datacenter
};

module.exports = mongoose.model("Datacenter", schema);
