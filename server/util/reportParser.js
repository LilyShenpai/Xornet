const uuidRegex = /[a-f0-9]{30}/;
const hostnameRegex = /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/;
const whiteSpacesInStringRegex = /\s/;

function reportParser(report, latestVersion) {
  report = parse(report);
  report.rogue = !validate(report, latestVersion);

  return report;
}

function parse(report) {
  report.rogue = false;

  // Parse RAM usage & determine used
  report.ram.used = parseFloat(((report.ram.total - report.ram.free) / 1024 / 1024 / 1024).toFixed(2));
  report.ram.total = parseFloat((report.ram.total / 1024 / 1024 / 1024).toFixed(2));
  report.ram.free = parseFloat((report.ram.free / 1024 / 1024 / 1024).toFixed(2));

  // Parse CPU usage
  report.cpu = parseInt(report.cpu);

  // Remove dashes from UUID
  report.uuid = report.uuid.replace(/-/g, "");

  report.reporterVersion = parseFloat(report.reporterVersion).toFixed(2);

  if (!Array.isArray(report.network)) return report;

  // Clear out null interfaces
  report.network = report.network.filter((iFace) => iFace.tx_sec !== null && iFace.rx_sec !== null);

  // Get total network interfaces
  const totalInterfaces = report.network.length;

  // Combine all bandwidth together
  const txSec = (report.network.reduce((a, b) => a + b.tx_sec, 0) * 8) / 1000 / 1000;
  const rxSec = (report.network.reduce((a, b) => a + b.rx_sec, 0) * 8) / 1000 / 1000;

  // Replace whats there with proper data
  report.network = {
    totalInterfaces,
    TxSec: parseFloat(txSec.toFixed(2)),
    RxSec: parseFloat(rxSec.toFixed(2)),
  };

  return report;
}

function validate(report, latestVersion) {
  // TODO: Refactor this function, its super horrible to debug
  if (!uuidRegex.test(report.uuid) || whiteSpacesInStringRegex.test(report.uuid)) return false;
  if (!hostnameRegex.test(report.name) || whiteSpacesInStringRegex.test(report.name)) return false;
  if (isNaN(report.reporterVersion) || report.reporterVersion > latestVersion + 1) return false;
  if (isNaN(report.ram.used) || report.ram.used < 0) return false;
  if (isNaN(report.ram.total) || report.ram.total < 0) return false;
  if (isNaN(report.ram.free) || report.ram.free < 0) return false;
  if (isNaN(report.cpu) || report.cpu < 0) return false;
  if (isNaN(report.network.TxSec) || report.network.TxSec < 0) return false;
  if (isNaN(report.network.RxSec) || report.network.RxSec < 0) return false;
  if (typeof report.isVirtual !== "boolean") return false;
  if (report.platform.length < 2 || report.platform.length > 10) return false;

  return true;
}

module.exports = reportParser;
