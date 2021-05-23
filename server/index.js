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
const express = require("express");
const morgan = require("morgan");
const axios = require("axios");
const fs = require("fs");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const port = process.env.BACKEND_PORT || 8080;
const app = express();
const pty = require('node-pty-prebuilt-multiarch');
const cors = require('cors');
const options = {
  key: fs.readFileSync("./key.pem"),
  cert: fs.readFileSync("./cert.pem")
};
const https = require("https").createServer(options, app);
const io = require("socket.io")(https, {cors: { origin: "https://xornet.cloud" }});
const parseReport = require("@/util/parseReport");


const Machine = require("@/models/Machine.js");
const Stats = require("@/models/Stats.js");

const PTYService = require("@/services/PTYService");
app.use(bodyParser.json());   
app.use(cookieParser());
app.use(morgan('dev')); // Enable HTTPs code logs
app.use(cors({
  origin: 'https://xornet.cloud',
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
let latestVersion = 0.15;

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

app.use(require("@/routes/login"));
app.use(require("@/routes/signup"));

// Temp clear out machines every 60seconds to clear 
setInterval(() => machines.clear(), 60000);

setInterval(async () => {
  io.sockets.in("client").emit("machines", Object.fromEntries(machines));
  io.sockets.in('reporter').emit('heartbeat', Date.now());
}, 1000);

// Websockets
io.on("connection", async (socket) => {
  if (socket.handshake.auth.type === "client") socket.join("client");
  if (socket.handshake.auth.type === "reporter" && socket.handshake.auth.uuid !== '') {
    await Machine.add(socket.handshake.auth.static);
    socket.join("reporter");
  }
  if (!socket.handshake.auth.type) return socket.disconnect();

  // Calculate ping and append it to the machine map
  socket.on('heartbeatResponse', heartbeat => machinesPings.set(heartbeat.uuid, Math.ceil((Date.now() - heartbeat.epoch) / 2)));

  
  
  // This should be moved into the reporters and be secured

  // let pty = new PTYService(socket);
  // socket.on("input", input => {
  //   pty.write(input);
  // });


  // Parse reports
  // Report is what is collected from the Reporter
  socket.on("report", async (report) => {
    // Add geolocation data
    report.geolocation = socket.handshake.auth.static.geolocation;
    if (report.geolocation) delete report.geolocation.ip;

    report = parseReport(report, latestVersion, machinesPings);

    if (Object.values(report).some(field => field == null)) return;

    // Add to ram
    machines.set(report.uuid, report);
    machinesStatic.set(report.uuid, socket.handshake.auth);

    // Add to database
    if (!report.rogue) await Stats.add(report);
  });
});


https.listen(port, () => console.log(`Started on port ${port.toString()}`));
