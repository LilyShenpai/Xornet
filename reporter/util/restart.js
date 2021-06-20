// Require child_process
var exec = require('child_process').exec;
const ReporterSettings = require("../util/settings");

// Create restart function
module.exports = function shutdown(){
  return new Promise(resolve => {
    if (ReporterSettings.allowRestart) exec('shutdown /r', (error, stdout, stderr) => resolve(stdout));
    resolve();
  });
}
