module.exports = clearLastLine = () => {
  if (process) process.stdout.moveCursor(0, -1); // up one line
  process.stdout.clearLine(1); // from cursor to end
};
