const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { v4: uuidv4 } = require("uuid");
mongoose.connect(process.env.MONGODB_HOST, { useNewUrlParser: true, useUnifiedTopology: true });

const schema = new Schema(
  {
    _id: { type: String, required: true },
    machines: { type: [String], default: [] },
    owner: { type: String, required: true },
    name: { type: String },
    members: { type: Array, required: false, default: [] },
    logo: { type: String, required: false, default: null },
    banner: { type: String, required: false, default: null },
    created_at: { type: Number, required: true },
  },
  {
    versionKey: false,
  }
);

schema.statics.add = async function (owner, name) {
  return await new this({ _id: uuidv4(), owner, name, created_at: Date.now() }).save();
};

schema.statics.addMachine = async function (datacenterUUID, machineUUID) {
  if (!datacenterUUID && !machineUUID) return;
  const datacenter = await this.findOne({ name: datacenterUUID }).exec();
  if (!datacenter.machines.includes(machineUUID)) datacenter.machines.push(machineUUID);
  await datacenter.save();
  return datacenter;
};

schema.statics.removeMachine = async function (datacenterUUID, machineUUID) {
  if (!datacenterUUID && !machineUUID) return;
  const datacenter = await this.findOne({ name: datacenterUUID }).exec();
  if (datacenter.machines.includes(userUUID)) datacenter.machines.splice(datacenter.machines.indexOf(machineUUID), 1);
  await datacenter.save();
  return datacenter;
};

schema.statics.addUser = async function (datacenterUUID, userUUID) {
  if (!datacenterUUID && !userUUID) return;
  const datacenter = await this.findOne({ name: datacenterUUID }).exec();
  if (!datacenter.members.includes(userUUID)) datacenter.members.push(userUUID);
  await datacenter.save();
  return datacenter;
};

schema.statics.removeUser = async function (datacenterUUID, userUUID) {
  if (!datacenterUUID && !userUUID) return;
  const datacenter = await this.findOne({ name: datacenterUUID }).exec();
  if (datacenter.members.includes(userUUID)) datacenter.members.splice(datacenter.members.indexOf(userUUID), 1);
  await datacenter.save();
  return datacenter;
};

module.exports = mongoose.model("Datacenter", schema);
