const mongoose = require("mongoose");
const Schema = mongoose.Schema;
mongoose.connect(process.env.MONGODB_HOST, { useNewUrlParser: true, useUnifiedTopology: true });
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");
const saltRounds = parseInt(process.env.SALTROUNDS);

const schema = new Schema(
  {
    _id: { type: String, required: true }, // The user's ID
    created_at: { type: Number, required: true, default: Date.now() }, // Epoch when the account is created
    username: { type: String, required: true }, // Username of the user
    email: { type: String, required: true }, // Email of the user
    password: { type: String, required: true }, // Encrypted password of the user
    geolocation: { type: Object, required: true }, // user's geolocation
    profileImage: { type: Object }, // object containing the link and alpha to the pfp of the user
    profileBanner: { type: Object }, // Link to the banner of the user
    socials: { type: Array }, // the users socials
    isDev: { type: String }, // if the user is a Xornet dev
    badges: { type: Object }, // the users badges
    points: { type: Number, default: 0 }, // User's earned points
    is_admin: { type: Boolean, default: false }, // Is user administrator or not
    machines: { type: Array, default: null }, // The array that contains the UUID's of the machines the user has
  },
  {
    versionKey: false, // You should be aware of the outcome after set to false
  }
);

/**
 * Attempts to create a user and save them to the database
 * @param {Object} [form] Object containing user details from the frontend form
 */
schema.statics.add = async function (form) {
  // Check if Username exists in DB
  const usernameQuery = await this.find({ username: form.username }).exec();
  if (usernameQuery.length !== 0) {
    console.warn(`[MANGOLIA]: User '${form.username}' is already in the database!`);
    throw { message: `User '${form.username}' is already in the database!` };
  }

  // Check if email exists in DB
  const emailQuery = await this.find({ email: form.email }).exec();
  if (emailQuery.length !== 0) {
    console.warn(`[MANGOLIA]: User with email '${form.username}' is already in the database!`);
    throw { message: `User with email '${form.username}' is already in the database!` };
  }

  // Encrypt password
  form.password = await bcrypt.hash(form.password, saltRounds);

  // Add user to DB
  await new this({ _id: uuidv4(), ...form }).save();
  console.log(`[MANGOLIA]: User '${form.username}' added to the database!`);
  return { message: `User '${form.username}' added to the database!` };
};

/**
 * Attempts to update existing user and save the new data to the database
 * @param {String} [_id] the uuid of the user
 * @param {Object} [newProfile] newProfile object containing the new settings of the user
 */
schema.statics.update = async function (_id, newProfile) {
  return new Promise(async (resolve) => {
    const user = await this.findOne({ _id }).exec();

    if (newProfile.username) user.username = newProfile.username;
    if (newProfile.email) user.email = newProfile.email;
    if (newProfile.password) user.password = await bcrypt.hash(newProfile.password, saltRounds);
    if (newProfile.profileImage) user.profileImage = newProfile.profileImage;
    if (newProfile.geolocation) user.geolocation = newProfile.geolocation;

    resolve(user.save());
  });
};

/**
 * Simply adds a machine to the user's database
 * @param {String} [_id] the uuid of the user
 * @param {String} [machineUUID] the uuid of the machine to add to the user
 */
schema.statics.addMachine = async function (_id, machineUUID) {
  return new Promise(async (resolve) => {
    const user = await this.findOne({ _id }).exec();
    if (machineUUID != null) {
      if (!user.machines.includes(machineUUID)) user.machines.push(machineUUID);
      resolve(user.save());
    } else reject();
  });
};

let User = mongoose.model("User", schema);

module.exports = User;
