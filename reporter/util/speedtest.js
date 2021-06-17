const { execSync, spawn, fork } = require("child_process");
const fs = require("fs");
const isSpeedtestInstalled = require("../util/isSpeedtestInstalled");
const installSpeedtest = require("../util/installSpeedtest");
const { osInfo } = require("systeminformation");
const os = require('os');
const SPEEDTEST = "[SPEEDTEST]".bgYellow.black;

module.exports = async function speedtest() {
  // Disable speedtests on liinux because when the reporter
  // Runs as a service it crashes from permissions
  return new Promise(async (resolve, reject) => {
    console.log(SPEEDTEST + ` Checking for SpeedTest installation...`);
    if (!(await isSpeedtestInstalled())) {
      console.log(SPEEDTEST + ` Speedtest not installed`);
      await installSpeedtest();
    }
    console.log(SPEEDTEST + ` Speedtest found`);
    console.log(SPEEDTEST + ` Performing speedtest...`);
    process.env.PRINT_SENDING_STATS = false;

    let result = {};
    let args = ["-f", "json", "-p", "-P", "16", '--accept-license', '--accept-gdpr'];

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

          if (progress.type == "download" || progress.type == "upload") {
            clearLastLine();
            console.log(
              SPEEDTEST +
                ` Performing: ${progress.type.yellow}` +
                ` Progress: ${(progress[progress.type].progress * 100).toFixed(2).toString().yellow}%` +
                ` Speed: ${(progress[progress.type].bandwidth / 100000).toFixed(2).toString().yellow}Mbps`
            );
          } else {
            clearLastLine();
            console.log(SPEEDTEST + ` Performing: ${progress.type.yellow}` + ` Progress: ${(progress[progress.type]?.progress * 100).toFixed(2).toString().yellow}%` + ` Ping: ${progress.ping.jitter.toFixed(2).toString().yellow}ms`);
          }
        });

        netsh_output.stderr.on("data", (err) => {
          console.log(err.message);
          reject(err.message);
          process.env.PRINT_SENDING_STATS = true;
        });

        netsh_output.on("exit", () => {
          clearLastLine();
          console.log(
            SPEEDTEST +
              ` Speedtest complete - Download: ${(result.download?.bandwidth / 100000).toFixed(2).toString().yellow}Mbps` +
              ` Upload: ${(result.upload?.bandwidth / 100000).toFixed(2).toString().yellow}Mbps` +
              ` Ping: ${result.ping?.latency.toFixed(2).toString().yellow}ms`
          );
          console.log("[INFO]".bgCyan.black + ` Loading Stats...`);
          process.env.PRINT_SENDING_STATS = true;
          resolve(result);
        });
      }
    }
  });
};
