const os = require("os");
module.exports = clearLastLine = () => {
  // Apparently this only works on windows and non-service linux instances
  // For example if you were to setup the reporter as a linux service
  // It would crash and restart everytime it'd try to clear the line
  // It does work on linux when you don't run it as a service
  // But we have to have this if here since we basically tell people
  // To install it as a service
  if (os.platform() !== "win32") return;
  if (process) process.stdout.moveCursor(0, -1); // up one line
  process.stdout.clearLine(1); // from cursor to end
};
