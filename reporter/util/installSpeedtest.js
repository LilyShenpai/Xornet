const download = require("../util/download");

module.exports = async function installSpeedtest() {
  // Install speedtest
  let platform = require("os").platform();
  let arch = require("os").arch();

  switch (platform) {
    case "win32":
      platform = "win64";
      console.log("[SPEEDTEST]".bgYellow.black + ` Downloading speedtest binaries for Windows - ${platform} - ${arch}`);
      await download("https://backend.xornet.cloud/speedtest/speedtest.exe");
      break;
    case "linux":
      logger.test(["linDL", `- ${platform} - ${arch}`]);
        if (arch == "x64") {
            await download("https://backend.xornet.cloud/speedtest/speedtest-linux-x86_64");
        } else {
            await download("https://backend.xornet.cloud/speedtest/speedtest-linux-arm");
        }
      break;
    case "darwin":
      console.log("[SPEEDTEST]".bgYellow.black + ` Downloading speedtest binaries for MacOS - ${platform} - ${arch}`);
      await download("https://backend.xornet.cloud/speedtest/speedtest-macos");
      break;
  }

  console.log("[SPEEDTEST]".bgYellow.black + ` Download finished`);
};
