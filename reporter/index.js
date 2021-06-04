const si = require("systeminformation");
const io = require("socket.io-client");
const axios = require("axios");
const os = require("os");
const fs = require("fs");
const ProgressBar = require("progress");
const { execSync, spawn, fork } = require('child_process');
require("colors");

/**
 * Current version of Xornet Reporter
 * @type {number}
 */
const version = 0.17;
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

let printSendingStats = true;

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

  await installSpeedtest();

  console.log("[INFO]".bgCyan.black + ` Checking for updates`);

  try {
    var update = parseFloat((await axios.get("https://api.github.com/repos/Geoxor/Xornet/releases")).data[0].tag_name.replace("v", ""));
  } catch (error) {
    if (error) {
      // console.log(error);
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
      await download(update.downloadLink + getSystemExtension());
      console.log("[INFO]".bgCyan.black + ` Update finished`);
    } else {
      console.log("[INFO]".bgCyan.black + ` No updates found`);
    }
  } else if (os.platform() === "linux") {
    console.log("[UPDATE MESSAGE]".bgGreen.black + ` please run this command to update manually` + `'wget https://github.com/Geoxor/Xornet/releases/download/v${update.latestVersion}/install.sh && chmod +x ./install.sh && sudo ./install.sh'`.green);
  }

  return connectToXornet();
}

const clearLastLine = () => {
  process.stdout.moveCursor(0, -1) // up one line
  process.stdout.clearLine(1) // from cursor to end
}

async function checkSpeedtestInstallation() {
  return new Promise(async (resolve, reject) => {
    const files = await fs.promises.readdir('./');
    for (file of files){
      if (file.startsWith('speedtest')){
        resolve()
      };
    }
    reject();
  });
}

async function installSpeedtest(){
  console.log("[SPEEDTEST]".bgYellow.black + ` Checking for SpeedTest installation...`);
  try {
    await checkSpeedtestInstallation();
    console.log("[SPEEDTEST]".bgYellow.black + ` Speedtest found`);
    return
  } catch (error) {
    console.log("[SPEEDTEST]".bgYellow.black + ` Speedtest not installed`);

    // Install speedtest

    let platform = require("os").platform();
    let arch = require("os").arch();

    switch (platform) {
      case 'win32':
        platform = 'win64';
        console.log("[SPEEDTEST]".bgYellow.black + ` Downloading speedtest binaries for Windows - ${platform} - ${arch}`);
        await download('https://backend.xornet.cloud/speedtest/speedtest.exe');
        break;
      case 'linux':
        switch (arch) {
          case 'x64':
            console.log("[SPEEDTEST]".bgYellow.black + ` Downloading speedtest binaries for Linux - ${platform} - ${arch}`);
            await download('https://backend.xornet.cloud/speedtest/speedtest-linux-x86_64');
            break;
          case 'arm':
          case 'arm64':
            console.log("[SPEEDTEST]".bgYellow.black + ` Downloading speedtest binaries for Linux - ${platform} - ${arch}`);
            await download('https://backend.xornet.cloud/speedtest/speedtest-linux-arm');
        }
      case 'darwin':
        console.log("[SPEEDTEST]".bgYellow.black + ` Downloading speedtest binaries for MacOS - ${platform} - ${arch}`);
        await download('https://backend.xornet.cloud/speedtest/speedtest-macos');
        break;
    }

    console.log("[SPEEDTEST]".bgYellow.black + ` Download finished`);
  }
}

async function speedtest(){
  return new Promise(async (resolve, reject) => {
    console.log("[SPEEDTEST]".bgYellow.black + ` Performing speedtest...`);
    printSendingStats = false;

    let result = {};
    let args = ['-f', 'json', "-p", "-P", "16"];

    // fs.readdir('./', (err, files) => {
    //   for (file of files){
    //     if (file.startsWith('speedtest')){

    //     };
    //   }
    //   reject();
    // });

    const files = await fs.promises.readdir('./');
    for(file of files){
      if (file.startsWith('speedtest')){
        let netsh_output = spawn(file, args, {
          windowsHide: true,
        });

        netsh_output.stdout.on('data', (progress) => {
          if(!progress || progress.toString() == '' || !progress.toString()) return;

          try {
            progress = JSON.parse(progress.toString());
          } catch (error) {}

          if (progress.type == 'result') return result = progress;
          
          if (progress.type !== 'ping' && progress.type !== 'download' && progress.type !== 'upload') return;
          if (!progress.download?.bytes && !progress.upload?.bytes) return;

          if (progress.type == 'download' || progress.type == 'upload'){
            clearLastLine();
            console.log("[SPEEDTEST]".bgYellow.black + 
              ` Performing: ${progress.type.yellow}` +
              ` Progress: ${((progress[progress.type].progress * 100).toFixed(2)).toString().yellow}%` +  
              ` Speed: ${((progress[progress.type].bandwidth / 100000).toFixed(2)).toString().yellow}Mbps`
            );
          } else {
            clearLastLine();
            console.log("[SPEEDTEST]".bgYellow.black + 
              ` Performing: ${progress.type.yellow}` + 
              ` Progress: ${((progress[progress.type].progress * 100).toFixed(2)).toString().yellow}%` + 
              ` Ping: ${((progress.ping.jitter).toFixed(2)).toString().yellow}ms`
            );
          }
        });

        netsh_output.stderr.on('data', (err) => {
          console.log(err.message);
          reject(err.message);
          printSendingStats = true;
        });

        netsh_output.on('exit', () => {
          clearLastLine();
          console.log("[SPEEDTEST]".bgYellow.black + 
            ` Speedtest complete - Download: ${((result.download.bandwidth / 100000).toFixed(2)).toString().yellow}Mbps` + 
            ` Upload: ${((result.upload.bandwidth / 100000).toFixed(2)).toString().yellow}Mbps` + 
            ` Ping: ${((result.ping.latency).toFixed(2)).toString().yellow}ms`
          );
          printSendingStats = true;
          resolve(result);
        })
      }
    }
  });
}

/**
 * Downloads the new update to the system if available.
 * @param downloadLink {string}
 * @returns
 */
async function download(downloadLink) {
  const downloadPath = `./${downloadLink.split("/")[downloadLink.split("/").length - 1]}`;

  const writer = fs.createWriteStream(downloadPath);

  const { data, headers } = await axios({
    url: downloadLink,
    method: "GET",
    responseType: "stream",
  });

  const totalLength = headers["content-length"];

  const prefix = downloadPath.includes('speedtest') ? "[SPEEDTEST]".bgYellow.black : "[INFO]".bgCyan.black;

  const progressBar = new ProgressBar(`${prefix} Downloading [:bar] :percent :rate/bps :etas`, {
    width: 50,
    complete: "=",
    incomplete: " ",
    renderThrottle: 1,
    total: parseInt(totalLength),
  });

  data.pipe(writer);
  data.on("data", (chunk) => progressBar.tick(chunk.length));

  return new Promise((resolve, reject) => {
    writer.on("finish", () => {
      if (os.platform() === 'linux') fs.chmodSync(downloadPath, '755');
      resolve();
    });
    writer.on("error", reject);
  });
}

/**
 * Gets the system geolocation using the 'IPWHOIS' API.
 * We take the IP, Location, Country Code and ISP and return it as an object.
 * @returns
 */
async function getLocation() {
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
  // await installSpeedTest();

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
    console.log("[INFO]".bgCyan.black + ` Loading Stats...`);

    emitter = setInterval(function () {
      if(printSendingStats) {
        clearLastLine();
        console.log("[INFO]".bgCyan.black + ` Sending Stats - ${Date.now()}`.cyan);
      }
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

  // Get a event to run a speedtest
  // Returns a response with the results of the speedtest
  socket.on("runSpeedtest", async () => socket.emit("speedtest", await speedtest()));
}

checkForUpdates();
