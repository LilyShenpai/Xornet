const os = require("os");
const si = require("systeminformation");

/**
 * Collects all the statistics from the system and returns an Object.
 * @returns {Object} with all stats for the report
 */
module.exports = async function getStats(staticData) {
  /**
   * Systems Hostname
   * @type {string}
   */
  const hostname = os.hostname();

  /**
   * Operating System
   * @type {string} 'win32' | 'linux' | 'darwin'
   */
  const platform = os.platform();

  let valueObject = {
    networkStats: `(*) tx_sec, rx_sec`,
    currentLoad: "currentLoad",
  };

  /**
   * Data about Network and CPU loads.
   * @type {object}
   */
  const data = await si.get(valueObject);

  /**
   * Systems Unique Identifier
   * @type {string}
   */
  let uuid;
  if (staticData.system.uuid !== "") {
    uuid = staticData.system.uuid;
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
    cpu: data.currentLoad.currentLoad,
    network: data.networkStats,
    reporterVersion: require('../package.json').version,
    disks: await si.fsSize(),
    uptime: os.uptime(),
    reporterUptime: Date.now() - parseInt(process.env.STARTTIME),
    timestamp: Date.now(),
  };
}
