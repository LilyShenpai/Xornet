const si = require("systeminformation");
const io = require("socket.io-client");
const axios = require("axios");
const os = require("os");
const fs = require("fs");
const ProgressBar = require("progress");
require("colors");

/**
 * Current version of Xornet Reporter
 * @type {number}
 */
const version = 0.16;
const logo = [
  "     ___           ___           ___           ___           ___           ___     \n",
  "    |\\__\\         /\\  \\         /\\  \\         /\\__\\         /\\  \\         /\\  \\    \n",
  "    |:|  |       /::\\  \\       /::\\  \\       /::|  |       /::\\  \\        \\:\\  \\   \n",
  "    |:|  |      /:/\\:\\  \\     /:/\\:\\  \\     /:|:|  |      /:/\\:\\  \\        \\:\\  \\  \n",
  "    |:|__|__   /:/  \\:\\  \\   /::\\~\\:\\  \\   /:/|:|  |__   /::\\~\\:\\  \\       /::\\  \\ \n",
  "____/::::\\__\\ /:/__/ \\:\\__\\ /:/\\:\\ \\:\\__\\ /:/ |:| /\\__\\ /:/\\:\\ \\:\\__\\     /:/\\:\\__\\\n",
  "\\::::/~~/~    \\:\\  \\ /:/  / \\/_|::\\/:/  / \\/__|:|/:/  / \\:\\~\\:\\ \\/__/    /:/  \\/__/\n",
  " ~~|:|~~|      \\:\\  /:/  /     |:|::/  /      |:/:/  /   \\:\\ \\:\\__\\     /:/  /     \n",
  "   |:|  |       \\:\\/:/  /      |:|\\/__/       |::/  /     \\:\\ \\/__/     \\/__/      \n",
  "   |:|  |        \\::/  /       |:|  |         /:/  /       \\:\\__\\                  \n",
  `    \\|__|         \\/__/         \\|__|         \\/__/         \\/__/             v${version}\n`,
];

// Joins the logo so that it has a rainbow effect.
console.log(logo.join("").rainbow);

/**
 * Start time of the Reporter.
 * @type {number}
 */
const reporterStartTime = Date.now();

/**
 * Time between collecting and sending data to the backend.
 * @type {number}
 */
const REFRESH_INTERVAL = 1000;

/**
 * Static Data
 * @type {object}
 */
let staticData = {};

/**
 * Detects the system platform and returns the extension.
 * Currently doesn't do anything as the updates don't work.
 * Working on a better updater using Electron.
 * @returns
 */
function getSystemExtension() {
  switch (os.platform()) {
    case "win32":
      return ".exe";
    case "linux":
      return ".bin";
    case "darwin":
      return "";
  }
}

async function checkAccount() {
  return new Promise(async (resolve) => {
    console.log("[INFO]".bgCyan.black + ` Checking for account linked to this machine`);
    try {
      let response = await axios.post(`https://backend.xornet.cloud/reporter`, {
        uuid: staticData.system.uuid,
      });

      console.log("[INFO]".bgCyan.black + " " + response.data.message);
      staticData.reporter = {
        linked_account: response.data.account_uuid,
      };
      resolve(console.log("[INFO]".bgCyan.black + " Authentication completed"));
    } catch (error) {
      console.log("[INFO]".bgCyan.black + " Backend server appears to be offline/unavailable");
      if (error.response.status == 403) {
        console.log("[WARN]".bgRed.black + " Go to this URL to add this machine to your account and restart the reporter " + `https://xornet.cloud/dashboard/machines?newMachine=${staticData.system.uuid}`.red);
        setTimeout(() => {
          process.exit();
        }, 60000);
      }
    }
  });
}

/**
 * Checks for an update on the github release page.
 */
async function checkForUpdates() {
  console.log("[INFO]".bgCyan.black + ` Checking for updates`);

  try {
    var update = parseFloat((await axios.get("https://api.github.com/repos/Geoxor/Xornet/releases")).data[0].tag_name.replace("v", ""));
  } catch (error) {
    if (error) {
      console.log(error);
      if (error.response.status === 403) {
        console.log("[WARN]".bgYellow.black + ` GitHub API error, skipping...`);
        return connectToXornet();
      }
      console.log("[WARN]".bgYellow.black + ` Backend server is offline, skipping update`);
      console.log("[INFO]".bgCyan.black + ` Waiting for backend to connect...`);
      console.log("[INFO]".bgCyan.black + ` UUID: ${staticData.system.uuid}`.cyan);
      return connectToXornet();
    }
  }

  if (os.platform() === "win32") {
    if (version < update.latestVersion) {
      console.log("[INFO]".bgCyan.black + ` Downloading new update v${update.latestVersion}`);
      await downloadUpdate(update.downloadLink + getSystemExtension());
      console.log("[INFO]".bgCyan.black + ` Update finished`);
    } else {
      console.log("[INFO]".bgCyan.black + ` No updates found`);
    }
  } else if (os.platform() === "linux") {
    console.log("[UPDATE MESSAGE]".bgGreen.black + ` please run this command to update manually` + `'wget https://github.com/Geoxor/Xornet/releases/download/v${update.latestVersion}/install.sh && chmod +x ./install.sh && sudo ./install.sh'`.green);
  }

  return connectToXornet();
}

/**
 * Downloads the new update to the system if available.
 * @param downloadLink {string}
 * @returns
 */
async function downloadUpdate(downloadLink) {
  const downloadPath = `./${downloadLink.split("/")[downloadLink.split("/").length - 1]}`;
  console.log(downloadPath);

  const writer = fs.createWriteStream(downloadPath);

  const { data, headers } = await axios({
    url: downloadLink,
    method: "GET",
    responseType: "stream",
  });

  const totalLength = headers["content-length"];

  const progressBar = new ProgressBar(`Downloading update [:bar] :percent :rate/bps :etas`, {
    width: 50,
    complete: "=",
    incomplete: " ",
    renderThrottle: 1,
    total: parseInt(totalLength),
  });

  data.pipe(writer);
  data.on("data", (chunk) => progressBar.tick(chunk.length));

  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

/**
 * Gets the system geolocation using the 'IPWHOIS' API.
 * We take the IP, Location, Country Code and ISP and return it as an object.
 * @returns
 */
async function getLocation() {
  console.log("[INFO]".bgCyan.black + ` Fetching geolocation...`);
  location = (await axios.get(`https://ipwhois.app/json/`)).data;
  return {
    ip: location.ip,
    location: location.country,
    countryCode: location.country_code,
    isp: location.isp,
  };
}

/**
 * Collects all the statistics from the system and returns an Object.
 * @returns {Object} with all stats for the report
 */
async function getStats() {
  /**
   * Systems Hostname
   * @type {string}
   */
  const hostname = os.hostname();

  /**
   * Operating System
   * @type {string} 'win32' | 'linux' | 'darwin'
   */
  const platform = os.platform();

  let valueObject = {
    networkStats: `(*) tx_sec, rx_sec`,
    currentLoad: "currentLoad",
  };

  /**
   * Data about Network and CPU loads.
   * @type {object}
   */
  const data = await si.get(valueObject);

  /**
   * Systems Unique Identifier
   * @type {string}
   */
  let uuid;
  if (staticData.system.uuid !== "") {
    uuid = staticData.system.uuid;
  } else {
    uuid = staticData.uuid.os;
  }

  return {
    uuid: uuid,
    isVirtual: staticData.system.virtual,
    hostname,
    platform,
    ram: {
      total: os.totalmem(),
      free: os.freemem(),
    },
    cpu: data.currentLoad.currentLoad,
    network: data.networkStats,
    reporterVersion: version,
    disks: await si.fsSize(),
    uptime: os.uptime(),
    reporterUptime: Date.now() - reporterStartTime,
    timestamp: Date.now(),
  };
}

/**
 * Connects to the Xornet Backend and sends system statistics every second.
 */
async function connectToXornet() {
  // Console logging information so that the user knows whats happening.
  console.log("[INFO]".bgCyan.black + " Fetching system information...");

  console.log("[INFO]".bgCyan.black + ` Fetching static data...`);
  staticData = await si.getStaticData();
  console.log("[INFO]".bgCyan.black + ` Static data collected`.green);

  console.log("[INFO]".bgCyan.black + ` Fetching geolocation...`);
  staticData.geolocation = await getLocation();
  console.log("[INFO]".bgCyan.black + ` Geolocation collected`.green);

  console.log("[INFO]".bgCyan.black + ` Parsing UUID...`);

  staticData.system.uuid = staticData.uuid.hardware.replace(/-/g, "") || staticData.uuid.os.replace(/-/g, "");
  console.log("[INFO]".bgCyan.black + ` Assigning system UUID to ${staticData.system.uuid.cyan}`.green);

  console.log("[INFO]".bgCyan.black + " System information collection finished".green);

  await checkAccount();

  /**
   * Xornet Backend WebSocket
   * @type {string}
   */
  const backend = "wss://backend.xornet.cloud";
  /**
   * WebSocket Connection
   * @type {object}
   */
  let socket = io.connect(backend, {
    reconnect: true,
    auth: {
      static: staticData,
      type: "reporter",
      uuid: staticData.system.uuid,
    },
  });

  /**
   * All the System Statistics
   * @type {object}
   */
  let statistics = {};
  setInterval(async () => {
    statistics = await getStats();
  }, REFRESH_INTERVAL);

  /**
   * Sends data to the Xornet Backend.
   */
  let emitter = null;

  // Informs the user that the reporter has connected to the Xornet Backend.
  // Creates a 'setInterval' which will send the data to the backend every second.
  socket.on("connect", async () => {
    console.log("[CONNECTED]".bgGreen.black + ` Connected to ${backend.green}`);

    emitter = setInterval(function () {
      console.log("[INFO]".bgCyan.black + ` Sending Stats - ${Date.now()}`.cyan);
      socket.emit("report", statistics);
    }, REFRESH_INTERVAL);
  });

  // Warns the user if the reporter disconnects from the Xornet Backend.
  // Clears the emitters interval so that the reporter does not send any data until it reconnects.
  socket.on("disconnect", async () => {
    console.log("[WARN]".bgYellow.black + ` Disconnected from ${backend}`);
    clearInterval(emitter);
  });

  // Get a heartbeat from the backend and send a heartbeat response back with UUID.
  // Returns a response with the systems UUID which is then used later to calculate the ping.
  socket.on("heartbeat", async (epoch) => {
    socket.emit("heartbeatResponse", {
      uuid: staticData.system.uuid,
      epoch,
    });
  });
}

checkForUpdates();
