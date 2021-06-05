const si = require("systeminformation");
const io = require("socket.io-client");
const getLocation = require("../util/getLocation");
const checkAccount = require("../util/checkAccount");

/**
 * Connects to the Xornet Backend and sends system statistics every second.
 */
module.exports = async function connectToXornet(staticData) {
  return new Promise(async (resolve, reject) => {
    // Console logging information so that the user knows whats happening.

    console.log("[INFO]".bgCyan.black + ` Fetching geolocation...`);
    staticData.geolocation = await getLocation();
    console.log("[INFO]".bgCyan.black + ` Geolocation collected`.green);

    console.log("[INFO]".bgCyan.black + ` Parsing UUID...`);

    staticData.system.uuid = staticData.uuid.hardware.replace(/-/g, "") || staticData.uuid.os.replace(/-/g, "");
    console.log("[INFO]".bgCyan.black + ` Assigning system UUID to ${staticData.system.uuid.cyan}`.green);

    console.log("[INFO]".bgCyan.black + " System information collection finished".green);

    await checkAccount(staticData);

    let socket = io.connect(process.env.BACKEND_URL, {
      reconnect: true,
      auth: {
        static: staticData,
        type: "reporter",
        uuid: staticData.system.uuid,
      },
    });

    socket.on("connect", async () => resolve(socket));
  });
}