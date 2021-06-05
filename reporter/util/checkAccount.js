const axios = require("axios");

module.exports = async function checkAccount(staticData) {
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
