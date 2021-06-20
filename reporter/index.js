require("colors");
require("./util/printLogo");
const isSpeedtestInstalled = require("./util/isSpeedtestInstalled");
const installSpeedtest = require("./util/installSpeedtest");
const connectToXornet = require("./util/connectToXornet");
const getStats = require("./util/getStats");
const getStaticData = require("./util/getStaticData");
const clearLastLine = require("./util/clearLastLine");
const speedtest = require("./util/speedtest");
const logger = require("./util/logger");

process.env.REFRESH_INTERVAL = 1000;
process.env.BACKEND_URL = "wss://backend.xornet.cloud";
process.env.STARTTIME = Date.now();
process.env.PRINT_SENDING_STATS = true;

async function main() {
  logger.info([["fetch"]]);
  const staticData = await getStaticData();
  logger.info([["sysInf", "green"]]);

  logger.test([["instChk"]]);
  if (!(await isSpeedtestInstalled())) {
    logger.test([["noTest"]]);
    await installSpeedtest();
  }
  logger.test([["isTest"]]);

  const xornet = await connectToXornet(staticData);

  let statistics = {};
  setInterval(async () => {
    statistics = await getStats(staticData);
  }, process.env.REFRESH_INTERVAL);

  let emitter = null;

  xornet.on("connect", () => {
    logger.net([["con"], [process.env.BACKEND_URL, "green"]]);
    logger.info([["load"]]);

    emitter = setInterval(function () {
      if (process.env.PRINT_SENDING_STATS === "true") {
        clearLastLine();
        logger.info([["send", "cyan"], [Date.now(), "cyan"]]);
      }
      xornet.emit("report", statistics);
    }, process.env.REFRESH_INTERVAL);
  });

  // Warns the user if the reporter disconnects from the Xornet Backend.
  // Clears the emitters interval so that the reporter does not send any data until it reconnects.
  xornet.on("disconnect", async () => {
    logger.net([["dis"], [process.env.BACKEND_URL, "red"]]);
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
