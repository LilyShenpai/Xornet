const os = require("os");
const si = require("systeminformation");

/**
 * Fetches the tick and idle times from all of the cpu cores
 * @returns {Object} contains the average idle and tick times of the cpu
 */
function cpuAverage() {
  var totalIdle = 0,
    totalTick = 0;
  var cpus = os.cpus();
  for (var i = 0, len = cpus.length; i < len; i++) {
    var cpu = cpus[i];
    for (type in cpu.times) {
      totalTick += cpu.times[type];
    }
    totalIdle += cpu.times.idle;
  }
  return { idle: totalIdle / cpus.length, total: totalTick / cpus.length };
}

/**
 * Fetches the current cpu usage of the system
 * @returns The cpu usage in rounded percentage (0 - 100)
 * @author Niko Huuskonen
 */
module.exports = async function getCpuUsage() {
  switch (os.platform()) {
    case "win32":
      // Gets 2 measurement points of cpu tick times and calculates the cpu usage % from them
      let sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      var startMeasure = cpuAverage();
      await sleep(200);
      var endMeasure = cpuAverage();
      var idleDifference = endMeasure.idle - startMeasure.idle;
      var totalDifference = endMeasure.total - startMeasure.total;
      return 100 - ~~((100 * idleDifference) / totalDifference);
    default:
      // Gets the cpu usage using systeminformation
      return (await si.currentLoad()).currentLoad;
  }
};
