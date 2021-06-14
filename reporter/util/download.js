const ProgressBar = require("progress");
const fs = require("fs");
const axios = require("axios");
const os = require("os");

/**
 * Downloads the new update to the system if available.
 * @param downloadLink {string}
 * @returns
 */
module.exports = async function download(downloadLink, hidden) {
  const downloadPath = `./${downloadLink.split("/")[downloadLink.split("/").length - 1]}`;

  const writer = fs.createWriteStream(downloadPath);

  const { data, headers } = await axios({
    url: downloadLink,
    method: "GET",
    responseType: "stream",
  });

  const totalLength = headers["content-length"];

  const prefix = downloadPath.includes("speedtest") ? "[SPEEDTEST]".bgYellow.black : "[INFO]".bgCyan.black;

  if (!hidden) {
    const progressBar = new ProgressBar(`${prefix} Downloading [:bar] :percent :rate/bps :etas`, {
      width: 50,
      complete: "=",
      incomplete: " ",
      renderThrottle: 1,
      total: parseInt(totalLength),
    });
    data.on("data", (chunk) => progressBar.tick(chunk.length));
  }

  data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", () => {
      if (os.platform() === "linux") fs.chmodSync(downloadPath, "755");
      writer.close();
      resolve(downloadPath);
    });
    writer.on("error", reject);
  });
};
