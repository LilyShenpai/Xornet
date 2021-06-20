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
const cors = require("cors");
const options = {
  key: fs.readFileSync("./key.pem"),
  cert: fs.readFileSync("./cert.pem"),
};
const https = require("https").createServer(options, app);
const io = require("socket.io")(https, { cors: { origin: "*" } });
module.exports = io;
require("@/services/sockets");

const Stats = require("@/models/Stats.js");
const Logs = require("@/models/Logs.js");

const pty = require("node-pty-prebuilt-multiarch");
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

// app.get("/stats", async (req, res) => {
//   let object = {
//     totalMachines: machines.size,
//     totalTraffic: ((await Stats.fetchDailyTraffic(86400000)).total_megabytes / 1000).toFixed(2),
//     totalCores: Array.from(machinesStatic.values()).reduce((a, b) => a + b.static.cpu.cores, 0),
//     totalRam: Math.ceil(Array.from(machines.values()).reduce((a, b) => a + b.ram.total, 0)),
//   };
//   res.json(object);
// });

app.use(require("@/routes/login"));
app.use(require("@/routes/signup"));
app.use(require("@/routes/profile"));
app.use(require("@/routes/stats"));
app.use(require("@/routes/reporter"));
app.use(require("@/routes/search"));
app.use(require("@/routes/logs"));
app.use(require("@/routes/datacenter"));
app.use(require("@/routes/machines"));

process.on("uncaughtException", async (err, origin) => {
  await Logs.add("API", err);
  console.log(err);
});

https.listen(port, () => console.log(`Started on port ${port.toString()}`));
