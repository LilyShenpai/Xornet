require("colors");
require("dotenv").config();
require("module-alias/register");
const express = require("express");
const morgan = require("morgan");
const fs = require("fs");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const port = process.env.BACKEND_PORT || 8080;
const app = express();
const pty = require("node-pty-prebuilt-multiarch");
const cors = require("cors");
const options = {
  key: fs.readFileSync("./key.pem"),
  cert: fs.readFileSync("./cert.pem"),
};
const https = require("https").createServer(options, app);
const io = require("socket.io")(https, { cors: { origin: "*" } });
const parseReport = require("@/util/parseReport");
const Machine = require("@/models/Machine.js");
const User = require("@/models/User.js");
const Datacenter = require("@/models/Datacenter.js");
const Stats = require("@/models/Stats.js");
const Logs = require("@/models/Logs.js");
const authSocket = require("@/middleware/authSocket.js");
const PTYService = require("@/services/PTYService");
const whitelist = ["https://xornet.cloud", "http://localhost:8080"];
const multer = require("multer");
const upload = multer({ dest: "./temp/" });

app.use(express.static("uploads"));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(upload.any());
app.use(morgan("dev")); // Enable HTTPs code logs
app.use(
  cors({
    origin: function (origin, callback) {
      if (whitelist.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(null, true);
        // callback(new Error('Not allowed by CORS'))
      }
    },
    credentials: true,
  })
);

let machines = new Map();
let machinesPings = new Map();
let machinesStatic = new Map();

let latestVersion = "0.0.18 ";

app.get("/stats", async (req, res) => {
  let object = {
    totalMachines: machines.size,
    totalTraffic: ((await Stats.fetchDailyTraffic(86400000)).total_megabytes / 1000).toFixed(2),
    totalCores: Array.from(machinesStatic.values()).reduce((a, b) => a + b.static.cpu.cores, 0),
    totalRam: Math.ceil(Array.from(machines.values()).reduce((a, b) => a + b.ram.total, 0)),
  };

  res.json(object);
});

app.use(require("@/routes/login"));
app.use(require("@/routes/signup"));
app.use(require("@/routes/profile"));
app.use(require("@/routes/stats"));
app.use(require("@/routes/reporter"));
app.use(require("@/routes/search"));
app.use(require("@/routes/logs"));
app.use(require("@/routes/datacenter"));
app.use(require("@/routes/machines"));

// Temp clear out machines every 60seconds to clear
setInterval(() => {
  machines.clear();
}, 60000);

// Log amount of sockets connected every minute
setInterval(() => {
  console.log(`Total Websocket connections: ${io.sockets.sockets.size}`.red);
}, 10000);

// Temp run speedtest on all reporters

// Run every hour
setInterval(() => io.sockets.in("reporter").emit("runSpeedtest"), 3600000);
setTimeout(() => io.sockets.in("reporter").emit("runSpeedtest"), 10000);

// Temp clear out machines every 60seconds to clear
setInterval(async () => {
  io.sockets.in("client").emit("machines", Object.fromEntries(machines));
  io.sockets.in("reporter").emit("heartbeat", Date.now());
}, 1000);

const SPEEDTEST_BASE_REWARD = 30;
const REPORT_BASE_REWARD = 5;

async function calculateReporterUptimePoints(reporterUptime) {
  return Math.floor(reporterUptime / 86400);
}
async function calculateSpeedtestPoints() {
  return SPEEDTEST_BASE_REWARD + Math.floor(Math.random() * SPEEDTEST_BASE_REWARD);
}
async function calculateReportPoints() {
  return REPORT_BASE_REWARD + Math.floor(Math.random() * REPORT_BASE_REWARD);
}

process.on("uncaughtException", async (err, origin) => {
  await Logs.add("API", err);
  console.log(err); 
});
 
// Websockets
io.use(authSocket);

io.on("connection", async (socket) => {
  if (!socket.handshake.auth.type) return socket.disconnect();

  console.log(`[WEBSOCKET] ${socket.handshake.auth.type} connected`);

  if (socket.handshake.auth.type === "client") {
    socket.join("client");
    socket.emit("machines", Object.fromEntries(machines));
    socket.on("getMachines", () => socket.emit("machines", Object.fromEntries(machines)));

    socket.on("getPoints", (username) => {
      userToGetPointsOf = username;
    });
    let userToGetPointsOf = socket.user.username;
    const pointInterval = setInterval(async () => {
      const points = (await User.findOne({ username: userToGetPointsOf }))?.points;
      if (points) socket.emit("points", points);
    }, 1000);

    socket.on("disconnect", () => clearInterval(pointInterval));
  }
  if (socket.handshake.auth.type === "reporter" && socket.handshake.auth.uuid !== "") {
    await Machine.add(socket.handshake.auth.static);
    socket.join("reporter");

    // Calculate ping and append it to the machine map
    socket.on("heartbeatResponse", (heartbeat) => machinesPings.set(heartbeat.uuid, Math.ceil((Date.now() - heartbeat.epoch) / 2)));

    // This should be moved into the reporters and be secured
    // let pty = new PTYService(socket);
    // socket.on("input", input => {
    //   pty.write(input);
    // });

    let pausePoints = false;

    socket.on("speedtest", async (speedtest) => {
      if(!speedtest?.type) return;
      delete speedtest.type;
      const userUUID = socket.handshake.auth.static?.reporter?.linked_account;
      const user = await User.findOne({ _id: userUUID }).exec();
      await user.addPoints(await calculateSpeedtestPoints());
      user.speedtest = speedtest;
      user.save();
    });

    // Parse reports
    // Report is what is collected from the Reporter
    socket.on("report", async (report) => {
      // Return if the reporter hasn't authenticated
      if (socket.handshake.auth.static?.reporter?.linked_account == null) return;

      // Return if theres some value that is undefined
      if (Object.values(report).some((field) => field == null)) return;

      // Get the user from the database cus im an idiot so we can append the pfp / username to each report
      // & replace the uuid with it
      let user = await User.findOne({ _id: socket.handshake.auth.static.reporter.linked_account }).exec();

      let points = 0;
      points += await calculateReportPoints();
      if (report.reporterUptime) points += await calculateReporterUptimePoints(report.uptime);

      if (points != null && !pausePoints) user.addPoints(points);

      // Assign the linked account from the socket's auth to the report
      // So it goes to the frontend
      report.owner = {
        username: user?.username,
        profileImage: user?.profileImage?.url,
      };

      // Assign datacenter
      // TODO: Make this not query the DB on every report as its inneffienct
      report.datacenter = await Datacenter.findOne({ machines: socket.handshake.auth.uuid }).exec();

      // Add geolocation data
      // So it goes to the frontend
      report.geolocation = socket.handshake.auth.static.geolocation;
      if (report.geolocation) delete report.geolocation.ip;

      // Validate / parse the report
      report = parseReport(report, latestVersion, machinesPings);

      // Assign statics
      machinesStatic.set(report.uuid, socket.handshake.auth);

      // Assign report
      machines.set(report.uuid, report);

      // Add to database
      if (!report.rogue) await Stats.add(report);
    });
  }
});

io.on("disconnection", () => {
  console.log("[WEBSOCKET] Disconnected");
});

https.listen(port, () => console.log(`Started on port ${port.toString()}`));
