const formatSeconds = require("./formatSeconds")
const uuidRegex = /[a-f0-9]{32}/;
const hostnameRegex = /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/;
const whiteSpacesInStringRegex = /\s/;

function reportParser(report, latestVersion, machinesPings) {
  report = parse(report, machinesPings);

  try {
    validate(report, latestVersion);
  } catch (error) {
    report.rogue = true;
    console.log("[WARN] Got invalid Report from reporter");
    if (process.env.APP_ENV === "testing") {
      console.log(`[DEBUG] "${error.message}" ${error.stack.split("\n")[2].trim()}`);
    }
  }

  return report;
}

function parse(report, machinesPings) {
  report.rogue = false;

  if (report.ram === null || report.ram === undefined) report.ram = {};

  // Parse RAM usage & determine used
  report.ram.used = parseFloat(((report.ram.total - report.ram.free) / 1024 / 1024 / 1024).toFixed(2));
  report.ram.total = parseFloat((report.ram.total / 1024 / 1024 / 1024).toFixed(2));
  report.ram.free = parseFloat((report.ram.free / 1024 / 1024 / 1024).toFixed(2));

  // Parse CPU usage
  report.cpu = parseInt(report.cpu);

  // Remove dashes from UUID
  report.uuid = report.uuid?.replace(/-/g, "");

  report.reporterVersion = parseFloat(report.reporterVersion);

  // Parse uptime
  report.uptime = {
    pure: report.uptime,
    formatted: formatSeconds(report.uptime),
  };

  // Append Ping from ping buffer
  report.ping = machinesPings.get(report.uuid);

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
  isValidUuid(report.uuid);
  hasNoWhiteSpaces(report.uuid);

  isValidHostName(report.name);
  hasNoWhiteSpaces(report.name);

  isValidNumber(report.reporterVersion);
  versionIsValid(report.reporterVersion, latestVersion);

  isValidNumber(report.ram.used);
  isValidNumber(report.ram.total);
  isValidNumber(report.ram.free);
  isNotNegative(report.ram.used);

  isValidNumber(report.cpu);
  isNotNegative(report.cpu);

  isValidObject(report.network);
  isValidNumber(report.network.TxSec);
  isNotNegative(report.network.TxSec);
  isValidNumber(report.network.RxSec);
  isNotNegative(report.network.RxSec);

  isValidBoolean(report.isVirtual);
}

function isValidUuid(uuid) {
  if (!uuidRegex.test(uuid)) throw new Error(`"${uuid}" is not a valid UUID!`);
}

function isValidHostName(host) {
  if (!hostnameRegex.test(host)) throw new Error(`"${host}" is not a valid UUID!`);
}

function hasNoWhiteSpaces(value) {
  if (whiteSpacesInStringRegex.test(value)) throw new Error(`"${value}" has Whitespaces`);
}

function isValidNumber(value) {
  if (typeof value !== "number" || isNaN(value)) throw new Error(`"${value}" is not a Valid number`);
}

function versionIsValid(value, latestVersion) {
  if (value > latestVersion || value < Math.floor(latestVersion)) throw new Error(`"${value}" is not a valid Version`);
}

function isNotNegative(value) {
  if (value < 0) throw new Error(`"${value}" is a Negative value`);
}

function isValidBoolean(value) {
  if (typeof value !== "boolean") throw new Error(`"${value}" is not a Bool`);
}

function isValidObject(value) {
  if (typeof value !== "object") throw new Error(`"${value}" is not an Array`);
}

module.exports = reportParser;
