const colors = require("colors/safe");
const locale = require("os-locale");
const fs = require("fs");
const localeTable = (() => {
  const systemLocale = locale.sync();
  let rawJson = fs.readFileSync(`lang/${systemLocale}.json`);

  // If UNIX asks for default locale then pass them england is my city
  if (systemLocale === "C") {
    rawJson = fs.readFileSync('lang/en-US.json');
  }

  return JSON.parse(rawJson);
})();

// [ Optional Primary Shell, when displaying more than 1 thing, use this.

//     [ Optional Msg shell, when using color/style option(s), use this.

//         "", Contains text to be translated, on translation fail, will fallback and return the key itself (this is to enable using data)

//         [   Option Style shell, when using more than one color/style option, use this.

//             "" Style options, refer to https://www.npmjs.com/package/colors for color/style options
//         ]
//     ]
// ]

/**
 * This class is handling logs and localizations
 *
 * When using the logger, simply use const logger = require('logger');
 * and then to log (example type, an info message) just type logger.info(your message here)
 * consult the localization master (en-US) to make sure your message exists
 * msg type will automatically be used so if it's an info message, you needn't just through infoMsg
 * to get your localized message, as log.info is already there, just type your final keyword for
 * your localized message
 *
 * @return Nothing, all data is sent to console.log
 * @author Faunsce
 * @example
 * logger.info("fetch");
 * logger.info(["fetch", "data"]);
 * logger.info(["fetch", [123, "cyan"]]);
 * logger.info([["fetch", "green"], "data"])
 * logger.info(["fetch", [process.env.BACKEND_URL, "green"], ["load", ["yellow", "underline", "bgCyan"]]]);
 * Will output https://i.imgur.com/AB1hia8.png
 */

class Logger {
  /**
   *
   * @param {Array} msg
   * @param {Array} style
   */
  stylize(msg, style) {
    if (Array.isArray(style)) {
      for (let i = 0; i < style.length; i++) {
        msg = colors[style[i]](msg);
      }
    } else {
      msg = colors[style](msg);
    }
    return msg;
  }

  getTableValue(primaryKey, msg, isArray = false) {
    // Determine is item is localizable message or data (msg on pass, data on fail)
    // Translate
    let secondaryKey = isArray ? msg[0] : msg;
    let tableValue = localeTable[primaryKey][secondaryKey];

    // Check translation, replace with key if not in localeTable (This means its data)
    return tableValue != undefined ? tableValue : secondaryKey;
  }

  processList(primaryKey, items) {
    // Used to translate keys into their correnspending json value, or return the key itself (for Displaying Data), upon failure to find a value for the key
    let processedText = new String();
    items.forEach((element) => {
      // Check if element is array
      let isArray = Array.isArray(element);
      let tableValue = this.getTableValue(primaryKey, element, isArray);

      // Stylize
      processedText += isArray ? this.stylize(tableValue, element[1]) : tableValue;

      // Append now translated and stylized text to message
      processedText += " ";
    });

    return processedText;
  }

  info(items) {
    // General Info Messages
    const prefix = this.stylize(localeTable.msgIden.info, ["bgGrey", "black"]);
    console.log(prefix, Array.isArray(items) ? this.processList("infoMsg", items) : this.getTableValue("infoMsg", items));
  }

  warn(items) {
    // Warning Messages
    const prefix = this.stylize(localeTable.msgIden.warn, ["bgYellow", "black"]);
    console.log(prefix, Array.isArray(items) ? this.processList("warnMsg", items) : this.getTableValue("warnMsg", items));
  }

  error(items) {
    // Fatal Error Messages
    const prefix = this.stylize(localeTable.msgIden.err, ["bgRed", "black"]);
    console.log(prefix, Array.isArray(items) ? this.processList("errMsg", items) : this.getTableValue("errMsg", items));
  }

  test(items) {
    // Speedtest Messages
    const prefix = this.stylize(localeTable.msgIden.test, ["bgBlue", "black"]);
    console.log(prefix, Array.isArray(items) ? this.processList("testMsg", items) : this.getTableValue("testMsg", items));
  }

  net(items) {
    // Networking Messages
    const prefix = this.stylize(localeTable.msgIden.net, ["bgCyan", "black"]);
    console.log(prefix, Array.isArray(items) ? this.processList("netMsg", items) : this.getTableValue("netMsg", items));
  }

  testLogger() {
    this.info("fetch");
    this.info(["fetch", "data"]);
    this.info(["fetch", [123, "cyan"]]);
    this.info([["fetch", "green"], "data"]);
    this.info(["fetch", [process.env.BACKEND_URL, "green"], ["load", ["yellow", "underline", "bgCyan"]]]);
  }
}

module.exports = new Logger();
