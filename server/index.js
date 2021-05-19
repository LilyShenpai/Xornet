// We will have 3 types of user types
// Masteradmin
// Admins - Who own a datacenter
// Users who use VMs/servers from a datacenter

// Master admins will be able to see everything on Xornet
// Admins will be able to see all their machines that have in their datacenter

// Datacenter Model that assigns machines to a datacenter so we can determine which account owns what computers

// Add machine to the datacenter / xornet through the website
// Create add machine, add datacenter, add admins, wizards in the frontend

require('dotenv').config();
require('module-alias/register');
const { v4: uuidv4 } = require('uuid');
const express = require("express");
const morgan = require("morgan");
const axios = require("axios");
const port = process.env.BACKEND_PORT || 8080;
const app = express();
const cors = require('cors')
const http = require("http").createServer(app);
const io = require("socket.io")(http, { 
  cors: { origin: "http://xornet.cloud" },
});
const parseReport = require("@/util/parseReport");
app.use(morgan('dev')); // Enable HTTP code logs
app.use(cors({
  origin: 'http://xornet.cloud',
}))
/**
 * All machines connected to Xornet
 */
let machines = new Map();
let machinesPings = new Map();
let machinesStatic = new Map();

/**
 * Latest version of Reporter
 * @type {number}
 */
let latestVersion = 0.14;

app.get("/updates", async (req, res) => {
  let latestVersion;
  try {
    const { data } = await axios.get(
      "https://api.github.com/repos/Geoxor/Xornet/releases"
    );
    latestVersion = parseFloat(data[0].tag_name.replace("v", ""));
  } catch (error) {}

  res.json({
    latestVersion,
    downloadLink: `https://github.com/Geoxor/Xornet/releases/download/v${latestVersion}/xornet-reporter-v${latestVersion}`,
  });
});
app.get('/stats', async (req, res) => {

  let object = {
    totalMachines: machines.size,
    totalTraffic: ((await Stats.fetchDailyTraffic(86400000)).total_megabytes / 1000).toFixed(2),
    totalCores: Array.from(machinesStatic.values()).reduce((a, b) => a + b.static.cpu.cores, 0),
    totalRam: Math.ceil(Array.from(machines.values()).reduce((a, b) => a + b.ram.total, 0)),
  };

  res.json(object);
});
app.get("/daily-traffic", async (req, res) => {
  res.json(await Stats.fetchDailyTraffic(86400000));
});


function getTotalTraffic(){
  return 500;
}

setInterval(() => {
  machines.clear();
}, 60000);

setInterval(async () => {
  io.sockets.in("client").emit("machines", Object.fromEntries(machines));
  io.sockets.in('reporter').emit('heartbeat', Date.now());
}, 1000);

io.engine.on("connection_error", err => {
  console.log(err.req);
  console.log(err.code);
  console.log(err.message);
  console.log(err.content);
});

// Websockets
io.on("connection", async (socket) => {
  if (socket.handshake.auth.type === "client") socket.join("client");
  if (socket.handshake.auth.type === "reporter" && socket.handshake.auth.uuid !== '') {
    await addMachineToDB(socket.handshake.auth.static);
    socket.join("reporter");
  }
  if (!socket.handshake.auth.type) return socket.disconnect();

  // Calculate ping and append it to the machine map
  socket.on('heartbeatResponse', heartbeat => machinesPings.set(heartbeat.uuid, Math.ceil((Date.now() - heartbeat.epoch) / 2)));

  // Parse reports
  // Report is what is collected from the Reporter
  socket.on("report", async (report) => {
    // Add geolocation data
    report.geolocation = socket.handshake.auth.static.geolocation;
    if (report.geolocation) delete report.geolocation.ip;

    report = parseReport(report, latestVersion, machinesPings);

    // Add to ram
    machines.set(report.uuid, report);
    machinesStatic.set(report.uuid, socket.handshake.auth);

    // Add to database
    if (!report.rogue) await addStatsToDB(report);
  });
});

/**      USER DATABASE HANDLING       */
const User = require("@/models/User.js");

/**
 * Attempts to create a user and save them to the database
 * @param {String} [id] the uuid of the user
 * @param {String} [username] the username of the user
 * @param {String} [password] the encrypted password of the user
 */
async function addUserToDB(id, username, password){
  const users = await User.find({ _id: id}).exec()
  if (users.length !== 0) return console.warn(`[MANGOLIA]: User with uuid '${id}' is already in the database!`);

  // TODO: create all the typical password salting stuff to hash passwords
  // and add middlewares on the websockets for protected routes
  await new User({_id: id, username: username, password: password}).save(); 
  console.log(`[MANGOLIA]: User with uuid '${id}' added to the database!`);
}

/**      MACHINE DATABASE HANDLING       */
const Machine = require("@/models/Machine.js");

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
const Stats = require("@/models/Stats.js");

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
