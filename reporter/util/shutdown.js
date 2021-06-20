// Require child_process
var exec = require('child_process').exec;
const ReporterSettings = require("../util/settings");

// Create shutdown function
module.exports = function shutdown(){
  return new Promise(resolve => {
    if (ReporterSettings.allowShutdown) exec('shutdown /s', (error, stdout, stderr) => resolve(stdout));
    resolve();
  });
}
