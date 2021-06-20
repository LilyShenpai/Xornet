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

[ Primary Shell, put everything in here. Don't be silly, wrap your willy

    [ Msg shell, contains a message or data and optionally, a color
        
        "", Non-optional, contains text to be translated, on translation fail, will fallback and return the key itself (this is to enable using data)

        [   Option Style shell, Only use if doing multiple styles

            "" Style options, refer to https://www.npmjs.com/package/colors for color/style options
        ]  
    ]
]

// EXAMPLE
logger.info(
  [ 
    ["send"],
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
        if (typeof style == array) {
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
        items.forEach(element => {
            let temp = localeTable[primaryKey][element[0]];
            let msg = (temp != undefined) ? temp : element[0];
            if (element.length == 1) {
                processedText += msg;
            } else {
                processedText += (this.stylize(msg,element[1]));
            }
        });
        return processedText;
    }

    info(items) { // General Info Messages
        const prefix = this.stylize(localeTable.msgIden.info, ["bgGrey", "black"]);
        console.log(
            prefix,
            this.processList("infoMsg", items)
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

// Ez export pog
module.exports 
module.exports = new Logger();


// When using the logger, simply use const logger = require('logger'); 
// and then to log (example type, an info message) just type logger.info(your message here)
// consult the localization master (en-US) to make sure your message exists
// msg type will automatically be used so if it's an info message, you needn't just through infoMsg
// to get your localized message, as log.info is already there, just type your final keyword for
// your localized message