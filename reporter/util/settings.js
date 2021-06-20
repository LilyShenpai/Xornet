const fs = require("fs");

class Settings {
  constructor() {
    const dir = fs.readdirSync("./");
    dir.includes("settings.json") ? (this.settings = require("../settings.json")) : this.createNewSettings();
  }

  createNewSettings() {
    this.settings = {
      language: "auto",
      speedtests: true,
      verbose: true,
      allowRestart: false,
      allowShutdown: false,
    };
    this.save();
  }

  save() {
    fs.writeFileSync("settings.json", JSON.stringify(this.settings));
  }
}

const { settings } = new Settings();

module.exports = settings;
