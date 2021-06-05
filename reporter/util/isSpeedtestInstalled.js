const fs = require("fs");

module.exports = async function isSpeedtestInstalled() {
  return new Promise(async (resolve, reject) => {
    const files = await fs.promises.readdir("./");
    for (file of files) {
      if (file.startsWith("speedtest")) {
        return resolve(true);
      }
    }
    resolve(false);
  });
}