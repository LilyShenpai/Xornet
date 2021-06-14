require("colors");
require("./util/printLogo");

const isSpeedtestInstalled = require("./util/isSpeedtestInstalled");
const installSpeedtest = require("./util/installSpeedtest");
const checkForUpdates = require("./util/checkForUpdates");
const connectToXornet = require("./util/connectToXornet");
const getStats = require("./util/getStats");
const getStaticData = require("./util/getStaticData");
const clearLastLine = require("./util/clearLastLine");
const speedtest = require("./util/speedtest");

process.env.REFRESH_INTERVAL = 1000;
process.env.BACKEND_URL = "wss://backend.xornet.cloud";
process.env.STARTTIME = Date.now();
process.env.PRINT_SENDING_STATS = true;

const INFO = "[INFO]".bgCyan.black;
const WARN = "[WARN]".bgYellow.black;
const CONNECTED = "[CONNECTED]".bgGreen.black;
const SPEEDTEST = "[SPEEDTEST]".bgYellow.black;

async function main() {
  console.log(INFO + ` Fetching static data...`);
  const staticData = await getStaticData();
  console.log(INFO + " System information collection finished".green);

  console.log(SPEEDTEST + ` Checking for SpeedTest installation...`);
  if (!(await isSpeedtestInstalled())) {
    console.log(SPEEDTEST + ` Speedtest not installed`);
    await installSpeedtest();
  }
  console.log(SPEEDTEST + ` Speedtest found`);

  const isThereUpdate = await checkForUpdates(staticData);
  if (isThereUpdate) return await download(isThereUpdate.link);
  const xornet = await connectToXornet(staticData);

  let statistics = {};
  setInterval(async () => {
    statistics = await getStats(staticData);
  }, process.env.REFRESH_INTERVAL);

  let emitter = null;

  xornet.on("connect", () => {
    console.log(CONNECTED + ` Connected to ${process.env.BACKEND_URL.green}`);
    console.log(INFO + ` Loading Stats...`);

    emitter = setInterval(function () {
      if (process.env.PRINT_SENDING_STATS === "true") {
        clearLastLine();
        console.log(INFO + ` Sending Stats - ${Date.now()}`.cyan);
      }
      xornet.emit("report", statistics);
    }, process.env.REFRESH_INTERVAL);
  });

  // Warns the user if the reporter disconnects from the Xornet Backend.
  // Clears the emitters interval so that the reporter does not send any data until it reconnects.
  xornet.on("disconnect", async () => {
    console.log(WARN + ` Disconnected from ${process.env.BACKEND_URL}`);
    clearInterval(emitter);
  });

  // Get a heartbeat from the backend and send a heartbeat response back with UUID.
  // Returns a response with the systems UUID which is then used later to calculate the ping.
  xornet.on("heartbeat", async (epoch) => {
    xornet.emit("heartbeatResponse", {
      uuid: process.env.TEST_UUID || staticData.system.uuid,
      epoch,
    });
  });

  // Get a event to run a speedtest
  // Returns a response with the results of the speedtest
  xornet.on("runSpeedtest", async () => xornet.emit("speedtest", await speedtest()));
}

main();
