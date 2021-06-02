const nodemailer = require("nodemailer");

module.exports = {
    async test() {
        try {
            console.log(`[SMTP]: Starting message test!`);
    
            let transport = nodemailer.createTransport({
                host: "localhost",
                port: 465,
                secure: true,
                //ignoreTLS: true,
                auth: {
                    user: "kekw@xornet.cloud",
                    pass: "yay",
                },
                tls: {
                    // do not fail on invalid certs
                    rejectUnauthorized: false
                }
            });
            let msg = await transport.sendMail({
                from:'"Le test" <kekw@xornet.cloud>',
                to: "niko.huuskonen.00@gmail.com",
                subject: "kekw",
                text: "we do a little trolling",
                html: "<b>Hello world?</b>",
            });
    
            console.log(`[SMTP]: Test message sent!`);
            console.log(msg);
        } catch (error) {
            console.error(`[SMTP]: Error during message test: ${error}`);
        }
    }
}