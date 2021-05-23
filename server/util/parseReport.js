const formatSeconds = require("./formatSeconds")
const uuidRegex = /[a-f0-9]{32}/;
const hostnameRegex = /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/;
const whiteSpacesInStringRegex = /\s/;
const windowsFileSystems = ["FAT", "FAT32", "NTFS", "exFAT", "UDF"];
const linuxFileSystems = ["ext2", "ext3", "ext4", "XFS", "JFS", "btrfs", "vfat"];
const macosFileSystems = ["HFS", "APFS"];

/**
 * @param report {Object} A raw report from a reporter
 * @param latestVersion {number} the latest version of Xornet
 * @param machinesPings {Map} the machinesPings Map
 * @returns {Object} A validated and parsed report
 */
function parseReport(report, latestVersion, machinesPings) {
  report = parse(report, machinesPings);

  try {
    validate(report, latestVersion);
  } catch (error) {
    report.rogue = true;
      // if(report.uuid == 'a2c3174dbcdf4196b02b232cf4a49b14') console.log(`[DEBUG] "${error.message}" ${error.stack.split("\n")[2].trim()}`);
      console.log("[WARN] Got invalid Report from reporter"); 
    if (process.env.APP_ENV === "testing") {
      console.log(`[DEBUG] "${error.message}" ${error.stack.split("\n")[2].trim()}`);
    }
  }

  return report;
}

/**
 * @param report a raw import
 * @param machinesPings The machinesPings map that has all the pings
 * @returns {Object} The parsed report
 */
function parse(report, machinesPings) {

  if (!report.network || report.network.length == 0) report.network = [];

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
    formatted: {
      ...formatSeconds(report.uptime)
    }
  };

  // Append Ping from ping buffer. The first report has an Empty UUID so we set the ping to 0 to make the report valid
  report.ping = machinesPings.get(report.uuid) ?? 0;

  // Make sure we only have know platforms or unknown
  if (
    report.platform !== "linux" &&
    report.platform !== "win32" &&
    report.platform !== "darwin"
  ) {
    report.platform = "unknown";
  }


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

  // Parse disks
  report.disks = report.disks?.map(disk => {
    disk.size = parseFloat((disk.size / 1024 / 1024 / 1024).toFixed(2));
    disk.used = parseFloat((disk.used / 1024 / 1024 / 1024).toFixed(2));
    disk.available = parseFloat((disk.available / 1024 / 1024 / 1024).toFixed(2));
    return disk;
  })

  return report;
}

/**
 * @param report {Object} A parsed report
 * @param latestVersion {number} the latest version of Xornet Reporter
 * @throws Error when theres an Invalid value in the parsed report
 */
function validate(report, latestVersion) {
  // Validate UUIDs
  isValidUuid(report.uuid);
  hasNoWhiteSpaces(report.uuid);

  // Validate hostname
  isNotEmpty(report.hostname)
  isValidHostName(report.hostname);
  hasNoWhiteSpaces(report.hostname);

  // Validate reporterVersion
  isValidNumber(report.reporterVersion);
  versionIsValid(report.reporterVersion, latestVersion);
  
  // Validate ram
  isValidNumber(report.ram.used);
  isValidNumber(report.ram.total);
  isValidNumber(report.ram.free);
  isNotNegative(report.ram.used);

  // Validate CPUs
  isValidNumber(report.cpu);
  isNotNegative(report.cpu);

  // Validate netowkr
  isValidObject(report.network);
  isValidNumber(report.network.TxSec);
  isNotNegative(report.network.TxSec);
  isValidNumber(report.network.RxSec);
  isNotNegative(report.network.RxSec);

  // Validate ping
  isValidNumber(report.ping);

  // Validate uptime
  isValidNumber(report.uptime.pure);

  // Validate timestamp
  isValidNumber(report.timestamp)

  isValidBoolean(report.isVirtual);
  // Validate disks
  isValidObject(report.disks);
  isValidDisksArray(report.disks, report.platform);
}

// Validators
function isValidUuid(uuid) {
  if (!uuidRegex.test(uuid)) throw new Error(`"${uuid}" is not a valid UUID!`);
}

function isValidHostName(host) {
  if (!hostnameRegex.test(host)) throw new Error(`"${host}" is not a valid UUID!`);
}

function versionIsValid(currentVersion, latestVersion) {
  if (currentVersion > latestVersion + 0.01 || currentVersion < 0) throw new Error(`"${currentVersion}" is not a valid Version`);
}

function isValidFS(fs, platform){
  isNotEmpty(fs);

  let windowsRegex = /[A-Z]:$/g;
  let linuxRegex = /^\/dev\/\w*/g;

  switch (platform) {
    case "win32":
      if(!windowsRegex.test(fs)) throw new Error(`"${fs}" is not a valid drive letter`);
      break;
    case "linux":
    case "darwin":
      if(!linuxRegex.test(fs)) throw new Error(`"${fs}" is not a valid linux folder`);
  }
}

function isValidFileSystemType(fileSystemType, platform){
  isNotEmpty(fileSystemType);

  switch (platform) {
    case "win32":
      if(!windowsFileSystems.includes(fileSystemType)) throw new Error(`"${fileSystemType}" is not a valid file system`);
      break;
    case "linux":
      if(!linuxFileSystems.includes(fileSystemType)) throw new Error(`"${fileSystemType}" is not a valid file system`);
      break;
    case "darwin":
      if(!macosFileSystems.includes(fileSystemType)) throw new Error(`"${fileSystemType}" is not a valid file system`);
      break;
  }
}

function isValidMount(mount, fs, platform){
  isNotEmpty(mount);

  switch (platform) {
    case "win32":
      if(mount !== fs) throw new Error(`"${mount}" is not a valid mount`);
      break;
    case "linux":
    case "darwin":
      if(!mount.startsWith("/")) throw new Error(`"${mount}" is not a valid mount`);
      break;
  }
}

function isValidDisksArray(disk, platform) {
  if (!disk.forEach) throw new Error("Disks disk is not an Array");
  
  disk.forEach(disk => {
    isValidFS(disk.fs, platform);
    isValidFileSystemType(disk.type, platform);

    isValidNumber(disk.size);
    isNotNegative(disk.size);

    isValidNumber(disk.used);
    isNotNegative(disk.used);

    isValidNumber(disk.available);
    isNotNegative(disk.available);

    isValidNumber(disk.use);
    isNotNegative(disk.use);

    isValidMount(disk.mount, disk.fs, platform);
  });
}

// Abstract Validators
function hasNoWhiteSpaces(value) {
  if (whiteSpacesInStringRegex.test(value)) throw new Error(`"${value}" has Whitespaces`);
}

function isValidNumber(value) {
  if (typeof value !== "number" || isNaN(value)) throw new Error(`"${value}" is not a Valid number`);
}

function isNotNegative(value) {
  if (value < 0) throw new Error(`"${value}" is a Negative value`);
}

function isValidBoolean(value) {
  if (typeof value !== "boolean") throw new Error(`"${value}" is not a Bool`);
}

function isValidObject(value) {
  if (typeof value !== "object") throw new Error(`"${value}" is not an Object`);
}

function isNotEmpty(value) {
  if (value === null || value === undefined || value === "" || value.length === 0) throw new Error(`"${value}" is Empty`);
}

module.exports = parseReport;
