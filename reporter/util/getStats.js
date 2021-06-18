const os = require("os");
const si = require("systeminformation");

/**
 * Fetches the tick and idle times from all of the cpu cores
 * @returns {Object} contains the average idle and tick times of the cpu
 */
function cpuAverage() {
  var totalIdle = 0, totalTick = 0;
  var cpus = os.cpus();
  for(var i = 0, len = cpus.length; i < len; i++) {
    var cpu = cpus[i];
    for(type in cpu.times) {
      totalTick += cpu.times[type];
   }     
    totalIdle += cpu.times.idle;
  }
  return { idle: totalIdle / cpus.length,  total: totalTick / cpus.length };
}

/**
 * @author Niko Huuskonen
 * @param {Object} start Contains the first measurement point tick and idle times
 * @param {Object} end Contains the second measurement point tick and idle times
 * @returns The cpu usage in rounded percentage (0 - 100)
 */
function calculateCpuUsage(start, end) {
  var idleDifference = end.idle - start.idle;
  var totalDifference = end.total - start.total;
  return 100 - ~~(100 * idleDifference / totalDifference);
}

/**
 * Collects all the statistics from the system and returns an Object.
 * @returns {Object} with all stats for the report
 */
module.exports = async function getStats(staticData) {

  /**
   * Gets the first measurement point for cpu usage
   * @type {object}
   */
  var startMeasure = cpuAverage();

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
    //currentLoad: "currentLoad cpus",
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
  if (process.env.TEST_UUID || staticData.system.uuid !== "") {
    uuid = process.env.TEST_UUID || staticData.system.uuid;
  } else {
    uuid = staticData.uuid.os;
  }

  /**
   * Gets the second measurement point for cpu usage
   * @type {object}
   */
  var endMeasure = cpuAverage(); 

  /**
   * The current cpu usage
   * @type {number}
   */
  const cpuUsage = calculateCpuUsage(startMeasure, endMeasure);

  return {
    uuid: uuid,
    isVirtual: staticData.system.virtual,
    hostname,
    platform,
    ram: {
      total: os.totalmem(),
      free: os.freemem(),
    },
    cpu: cpuUsage,
    network: data.networkStats,
    reporterVersion: require("../package.json").version,
    disks: await si.fsSize(),
    uptime: os.uptime(),
    reporterUptime: Date.now() - parseInt(process.env.STARTTIME),
    timestamp: Date.now(),
  };
};
