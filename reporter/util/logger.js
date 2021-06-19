const colors = require('colors/safe');
const fs = require('fs');
const locale = require('os-locale');
const localeTable = (() => {
  const systemLocale = locale.sync();
  const rawJson = fs.readFileSync("./localizations/" + systemLocale + ".json");
  return JSON.parse(rawJson);
})();

// Used to log information to the console
class Logger {
    stylize(msg, style) {
        if (style === "") style = new Array("white");
        for (let i = 0; i < style.length; i++) {
            msg = colors[style[i]](msg)
        }
      return msg;
    }
    info(msg, data = "", style = "") { // General Info Messages
        const prefix = this.stylize(localeTable.msgIden.info, ["bgGrey", "black"]);
        console.log(
            prefix,
            (msg == "") ? msg : this.stylize(localeTable.infoMsg[msg], style), // Fallback to allow manual coloring on hyper complex msgs's
            data

       )
    }
    warn(msg, data = "", style = "") { // Warning Messages
        const prefix = this.stylize(localeTable.msgIden.warn, ["bgYellow", "black"]);
        console.log(
            prefix,
            (msg == "") ? msg : this.stylize(localeTable.warnMsg[msg], style),
            data
        )
    }
    error(msg, data = "", style = "") { // Fatal Error Messages
        const prefix = this.stylize(localeTable.msgIden.err, ["bgRed", "black"]);
        console.log(
            prefix,
            (msg == "") ? msg : this.stylize(localeTable.errMsg[msg], style),
            data            
        )
    }
    test(msg, data = "", style = "") { // Speedtest Messages
        const prefix = this.stylize(localeTable.msgIden.test, ["bgBlue", "black"]);
        console.log(
            prefix,
            (msg == "") ? msg : this.stylize(localeTable.testMsg[msg], style),
            data            
        )
    }
    con(msg, data = "", style = "") { // Connectivity Messages
        const prefix = this.stylize(localeTable.msgIden.con, ["bgCyan", "black"]);
        console.log(
            prefix,
            (msg == "") ? msg : this.stylize(localeTable.conMsg[msg], style),
            data 
        )
    }
}

// Ez export pog
module.exports = new Logger();


// When using the logger, simply use const logger = require('logger'); 
// and then to log (example type, an info message) just type logger.info(your message here)
// consult the localization master (en-US) to make sure your message exists
// msg type will automatically be used so if it's an info message, you needn't just through infoMsg
// to get your localized message, as log.info is already there, just type your final keyword for
// your localized message