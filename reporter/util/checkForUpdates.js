/**
 * Checks for an update on the github release page.
 */
const axios = require("axios");
const os = require("os");

module.exports = async function checkForUpdates(staticData) {
  return new Promise(async (resolve) => {
    console.log("[INFO]".bgCyan.black + ` Checking for updates`);
    try {
      var update = parseFloat((await axios.get("https://api.github.com/repos/Geoxor/Xornet/releases")).data[0].tag_name.replace("v", ""));
    } catch (error) {
      if (error) {
        // console.log(error);
        if (error.response.status === 403) {
          console.log("[WARN]".bgYellow.black + ` GitHub API error, skipping...`);
          return resolve(false);
        }
        console.log("[WARN]".bgYellow.black + ` Backend server is offline, skipping update`);
        console.log("[INFO]".bgCyan.black + ` Waiting for backend to connect...`);
        console.log("[INFO]".bgCyan.black + ` UUID: ${process.env.TEST_UUID || staticData.system.uuid}`.cyan);
        return resolve(false);
      }
    }

    if (os.platform() === "win32") {
      if (require("../package.json").version < update.latestVersion) {
        console.log("[INFO]".bgCyan.black + ` Downloading new update v${update.latestVersion}`);
        resolve({ link: update.downloadLink });
        console.log("[INFO]".bgCyan.black + ` Update finished`);
      } else {
        console.log("[INFO]".bgCyan.black + ` No updates found`);
      }
    } else if (os.platform() === "linux") {
      console.log("[UPDATE MESSAGE]".bgGreen.black + ` please run this command to update manually` + `'wget https://github.com/Geoxor/Xornet/releases/download/v${update.latestVersion}/install.sh && chmod +x ./install.sh && sudo ./install.sh'`.green);
    }
    resolve(false);
  });
};
