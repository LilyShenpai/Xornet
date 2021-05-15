require('dotenv').config()
const { v4: uuidv4 } = require('uuid');
const express = require("express");
const morgan = require("morgan");
const axios = require("axios");
const port = process.env.PORT || 8080;
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, { cors: { origin: "*" } });
const reportParser = require("./util/reportParser");
app.use(morgan(':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"')); // Enable HTTP code logs

let machines = new Map();
let latestVersion = null;

app.get("/updates", async (req, res) => {
  let latestVersion;
  try {
    const { data } = await axios.get(
      "https://api.github.com/repos/Geoxor/Xornet/releases"
    );
    latestVersion = parseFloat(data[0].tag_name.replace("v", ""));
  } catch (error) {
    latestVersion = 0.11;
  }

  res.json({
      latestVersion,
      downloadLink: `https://github.com/Geoxor/Xornet/releases/download/v${latestVersion}/xornet-reporter-v${latestVersion}`,
  });
});

setInterval(() => {
  machines.clear();
}, 60000);

setInterval(async () => {
  io.sockets.in("client").emit("machines", Object.fromEntries(machines));
}, 1000);

function formatSeconds(seconds) {
  if(!seconds) return undefined;
  seconds = Number(seconds);
  const d = Math.floor(seconds / 86400);
  const h = Math.floor(seconds & 86400 / 3600);
  const m = Math.floor(seconds % 3600 / 60);
  const s = Math.floor(seconds % 3600 % 60);

  return `${d}d ${h}h ${m}m ${s}s`
}

// Websockets
io.on("connection", async (socket) => {
  if (socket.handshake.auth.type === "client") socket.join("client");
  if (socket.handshake.auth.type === "reporter") {
    await addMachineToDB(socket.handshake.auth.static);
    socket.join("reporter");
  }
  if (!socket.handshake.auth.type) return socket.disconnect();

  console.log({
    type: socket.handshake.auth.type,
    uuid: socket.handshake.auth.uuid,
    // name: socket.handshake.auth.static.os.hostname,
  });

  socket.on("report", async (report) => {
    // Add geolocation data
    report.geolocation = socket.handshake.auth.static.geolocation;
    if (report.geolocation) delete report.geolocation.ip;

    report = reportParser(report, latestVersion);

    console.log(report);

    // if the report is invalid theres no point of saving it, cuz why would we want invalid data?
    if (!report.rogue) {
      machines.set(report.uuid, report);
      await addStatsToDB(report);
    }
  });
});

/**      USER DATABASE HANDLING       */
const User = require("./models/User.js");

/**
 * Attempts to create a user and save them to the database
 * @param {String} [id] the uuid of the user
 * @param {String} [username] the username of the user
 * @param {String} [password] the encrypted password of the user
 */
async function addUserToDB(id, username, password){
  const users = await User.find({ _id: id}).exec()
  if (users.length !== 0) return console.warn(`[MANGOLIA]: User with uuid '${id}' is already in the database!`);
  await new User({_id: id, username: username, password: password}).save(); 
  console.log(`[MANGOLIA]: User with uuid '${id}' added to the database!`);
}

/**      MACHINE DATABASE HANDLING       */
const Machine = require("./models/Machine.js");

/**
 * Attempts to create a machine and save them to the database
 * @param {Object} [staticData] contains the staticData data of the machine
 */
async function addMachineToDB(staticData){
  const machines = await Machine.find({ _id: staticData.system.uuid}).exec()
  if(machines.length !== 0) return console.warn(`[MANGOLIA]: Machine with uuid '${staticData.system.uuid}' is already in the database!`);
  await new Machine({_id: staticData.system.uuid, static: staticData}).save();
}

/**      STATS DATABASE HANDLING       */
const Stats = require("./models/Stats.js");

/**
 * Creates a stats report and saves it to database
 * @param {Object} [report] contains the stats of the machine
 */
async function addStatsToDB(report){
  const timestamp = new Date().getTime();
  await new Stats({_id: uuidv4(), machine_id: report.uuid, timestamp: timestamp, ram: report.ram, cpu: report.cpu, network: report.network, disks: report.disks}).save();
  // console.log(`[MANGOLIA]: System with uuid '${report.uuid}' reported stats and they are added to database`);
}

http.listen(port, () => console.log(`Started on port ${port.toString()}`));
