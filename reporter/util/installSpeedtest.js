const download = require("../util/download");
const logger = require("./logger");

module.exports = async function installSpeedtest() {
  // Install speedtest
  let platform = require("os").platform();
  let arch = require("os").arch();

  switch (platform) {
    case "win32":
      platform = "win64";
      logger.test(["windDL", `${platform} - ${arch}`]);
      await download("https://backend.xornet.cloud/speedtest/speedtest.exe");
      break;
    case "linux":
      logger.test(["linDL", `- ${platform} - ${arch}`]);
      arch == "x64" ? await download("https://backend.xornet.cloud/speedtest/speedtest-linux-x86_64") : await download("https://backend.xornet.cloud/speedtest/speedtest-linux-arm");
      break;
    case "darwin":
      logger.test(["osxDL", `- ${platform} - ${arch}`]);
      await download("https://backend.xornet.cloud/speedtest/speedtest-macos");
      break;
  }

  logger.test("dlFin");
};
