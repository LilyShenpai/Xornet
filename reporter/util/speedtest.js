const { execSync, spawn, fork } = require("child_process");
const fs = require("fs");
const isSpeedtestInstalled = require("../util/isSpeedtestInstalled");
const installSpeedtest = require("../util/installSpeedtest");
const { osInfo } = require("systeminformation");
const os = require('os');
const logger = require('../util/logger');

module.exports = async function speedtest() {
  // Disable speedtests on liinux because when the reporter
  // Runs as a service it crashes from permissions
  if (os.platform() !== 'win32') return;

  return new Promise(async (resolve, reject) => {
    logger.test([["instChk"]]);
    if (!(await isSpeedtestInstalled())) {
      logger.test([["noTest"]]);
      await installSpeedtest();
    }
    logger.test([["isTest"]]);
    logger.test([["runTest"]]);
    process.env.PRINT_SENDING_STATS = false;

    let result = {};
    let args = ["-f", "json", "-p", "-P", "16"];

    const files = await fs.promises.readdir("./");
    for (file of files) {
      if (file.startsWith("speedtest")) {
        let netsh_output = spawn(`./${file}`, args, {
          windowsHide: true,
        });

        netsh_output.stdout.on("data", (progress) => {
          if (!progress || progress.toString() == "" || !progress.toString()) return;

          try {
            progress = JSON.parse(progress.toString());
          } catch (error) {}

          if (progress.type == "result") return (result = progress);

          if (progress.type !== "ping" && progress.type !== "download" && progress.type !== "upload") return;
          if (!progress.download?.bytes && !progress.upload?.bytes) return;
          // TODO : Find a way to have "active text" be localizeable
          if (progress.type == "download" || progress.type == "upload") {
            clearLastLine();
            logger.test([
                ["perf"], [progress.type, "yellow"],
                ["prog"], [(progress[progress.type].progress * 100).toFixed(2), "yellow"], ["%"],
                ["spd"],  [(progress[progress.type].bandwidth / 100000).toFixed(2),"yellow"],["Mbps"],
            ]);
          } else {
            clearLastLine();
            logger.test([
              ["perf"], [progress.type, "yellow"],
              ["prog"], [(progress[progress.type].progress * 100).toFixed(2), "yellow"], ["%"],
              ["ping"], [progress.ping.jitter.toFixed(2), "yellow"], ["ms"]
            ]);
          }
        });

        netsh_output.stderr.on("data", (err) => {
          logger.error("", err.message);
          reject(err.message);
          process.env.PRINT_SENDING_STATS = true;
        });

        netsh_output.on("exit", () => {
          clearLastLine();
          logger.test([
              ["testDone"], ["dnL"], [(result.download?.bandwidth / 100000).toFixed(2), "yellow"], ["Mbps"],
              ["upL"], [(result.upload?.bandwidth / 100000).toFixed(2), "yellow"], ["Mbps"],
              ["ping"], [result.ping.latency.toFixed(2), "yellow"], ["ms"]
          ]);
          logger.info([["load"]]);
          process.env.PRINT_SENDING_STATS = true;
          resolve(result);
        });
      }
    }
  });
};
