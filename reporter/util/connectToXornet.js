const io = require("socket.io-client");
const checkAccount = require("../util/checkAccount");

/**
 * Connects to the Xornet Backend and sends system statistics every second.
 */
module.exports = async function connectToXornet(staticData, mute) {
  return new Promise(async (resolve, reject) => {
    await checkAccount(staticData, mute);

    let socket = io.connect(process.env.BACKEND_URL, {
      reconnect: true,
      auth: {
        static: staticData,
        type: "reporter",
        uuid: process.env.TEST_UUID || staticData.system.uuid,
      },
    });

    resolve(socket);
  });
};
