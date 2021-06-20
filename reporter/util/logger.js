const colors = require('colors/safe');
const fs = require('fs');
const locale = require('os-locale');
const localeTable = (() => {
  const systemLocale = locale.sync();
  const rawJson = fs.readFileSync("./localizations/" + systemLocale + ".json");
  return JSON.parse(rawJson);
})();


// DOCUMENTATION 
/*

[ Optional Primary Shell, when displaying more than 1 thing, use this.

    [ Optional Msg shell, when using color/style option(s), use this.
        
        "", Contains text to be translated, on translation fail, will fallback and return the key itself (this is to enable using data)

        [   Option Style shell, when using more than one color/style option, use this.

            "" Style options, refer to https://www.npmjs.com/package/colors for color/style options
        ]  
    ]
]

// EXAMPLE
logger.info(
  [ 
    "send",
    [123, "bgCyan"],
    ["load", ["bgRed", "white", "underline"]],
  ]
);
Will output https://i.imgur.com/sg59cn0.png
// EXAMPLE

*/
// DOCUMENTATION

class Logger {
    stylize(msg, style) {
        if (Array.isArray(style)) {
            for (let i = 0; i < style.length; i++) {
                msg = colors[style[i]](msg)
            }
        } else {
            msg = colors[style](msg);
        }
      return msg;
    }

    processList(primaryKey, items) { // Used to translate keys into their correnspending json value, or return the key itself (for Displaying Data), upon failure to find a value for the key
        let processedText = new String();
        items.forEach((element) => {
            // Check if element is array
            let isArray = Array.isArray(element);

            // Translate
            let secondaryKey = (isArray) ? element[0] : element;
            let tableValue = localeTable[primaryKey][secondaryKey];

            // Check translation, replace with key if not in localeTable (This means its data)
            tableValue = (tableValue != undefined) ? tableValue : secondaryKey;

            // Stylize
            processedText += (isArray) ? this.stylize(tableValue, element[1]) : tableValue;

            // Append now translated and stylized text to message
            processedText += " ";
        });

        return processedText;
    }

    info(items) { // General Info Messages
        const prefix = this.stylize(localeTable.msgIden.info, ["bgGrey", "black"]);
        console.log(
            prefix,
            (Array.isArray(items)) ? this.processList("infoMsg", items) : items
       )
    }

    warn(items) { // Warning Messages
        const prefix = this.stylize(localeTable.msgIden.warn, ["bgYellow", "black"]);
        console.log(
            prefix,
            this.processList("warnMsg", items)
        )
    }

    error(items) { // Fatal Error Messages
        const prefix = this.stylize(localeTable.msgIden.err, ["bgRed", "black"]);
        console.log(
            prefix,
            this.processList("errMsg", items)           
        )
    }

    test(items) { // Speedtest Messages
        const prefix = this.stylize(localeTable.msgIden.test, ["bgBlue", "black"]);
        console.log(
            prefix,
            this.processList("testMsg", items)            
        )
    }
    
    con(items) { // Connectivity Messages
        const prefix = this.stylize(localeTable.msgIden.con, ["bgCyan", "black"]);
        console.log(
            prefix,
            this.processList("conMsg", items) 
        )
    }
}

/**
 * @param {Array} items an array of all your msgs/data and their optional style option(s)
 * 
 * @return Nothing, all data is sent to console.log
 */
module.exports = new Logger();


// When using the logger, simply use const logger = require('logger'); 
// and then to log (example type, an info message) just type logger.info(your message here)
// consult the localization master (en-US) to make sure your message exists
// msg type will automatically be used so if it's an info message, you needn't just through infoMsg
// to get your localized message, as log.info is already there, just type your final keyword for
// your localized message