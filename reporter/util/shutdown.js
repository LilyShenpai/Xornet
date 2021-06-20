// Require child_process
var exec = require('child_process').exec;
const ReporterSettings = require("../util/settings");

// Create shutdown function
module.exports = function shutdown(){
  return new Promise(resolve => {
    if (ReporterSettings.allowShutdown) {
      switch (process.platform) {
        case 'win32':
          var shutdownCommand = 'shutdown /s'
          break;
        case 'linux':
        case 'darwin':
          var shutdownCommand = 'sudo shutdown'
          break;
      }

      exec(shutdownCommand, (error, stdout, stderr) => resolve(stdout));
    }
    else resolve();
  });
}
