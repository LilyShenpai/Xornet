const os = require("os");
const si = require("systeminformation");

/**
 * Collects all the statistics from the system and returns an Object.
 * @returns {Object} with all stats for the report
 */
module.exports = async function getStats(staticData) {
  const hostname = os.hostname();
  const platform = os.platform();

  let valueObject = {
    networkStats: `(*) tx_sec, rx_sec`,
  };

  // This guy creates HUGE lag spikes on windows every second
  const data = await si.get(valueObject);

  let uuid;
  if (process.env.TEST_UUID || staticData.system.uuid !== "") {
    uuid = process.env.TEST_UUID || staticData.system.uuid;
  } else {
    uuid = staticData.uuid.os;
  }

  return {
    uuid: uuid,
    isVirtual: staticData.system.virtual,
    hostname,
    platform,
    ram: {
      total: os.totalmem(),
      free: os.freemem(),
    },
    cpu: await require("./getCpuUsage.js")(),
    network: data.networkStats,
    reporterVersion: require("../package.json").version,
    disks: await si.fsSize(),
    uptime: os.uptime(),
    reporterUptime: Date.now() - parseInt(process.env.STARTTIME),
    timestamp: Date.now(),
  };
};
