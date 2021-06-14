/**
 * Detects the system platform and returns the extension.
 * Currently doesn't do anything as the updates don't work.
 * Working on a better updater using Electron.
 * @returns
 */
const os = require("os");

module.exports = function getSystemExtension() {
  switch (os.platform()) {
    case "win32":
      return ".exe";
    case "linux":
      return ".bin";
    case "darwin":
      return ".dmg";
  }
};
