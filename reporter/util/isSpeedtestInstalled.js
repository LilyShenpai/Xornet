const fs = require("fs");

module.exports = async function isSpeedtestInstalled() {
  console.log("[SPEEDTEST]".bgYellow.black + ` Checking for SpeedTest installation...`);

  return new Promise(async (resolve, reject) => {
    const files = await fs.promises.readdir("./");
    for (file of files) {
      if (file.startsWith("speedtest")) {
        console.log("[SPEEDTEST]".bgYellow.black + ` Speedtest found`);
        return resolve(true);
      }
    }
    console.log("[SPEEDTEST]".bgYellow.black + ` Speedtest not installed`);
    resolve(false);
  });
}