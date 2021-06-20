const fs = require('fs');

class Settings {
  constructor(){

    const dir = fs.readdirSync("./");
    dir.includes("settings.json") ? this.settings = require("../settings.json") : this.createNewSettings();
  }

  createNewSettings(){
    this.settings = {
      language: "en-US",
      doSpeedtests: true,
      verbose: true,
      language: 'auto',
    }
    this.save();
  }

  save(){
    fs.writeFileSync('settings.json', JSON.stringify(this));
  }
}

module.exports = new Settings;