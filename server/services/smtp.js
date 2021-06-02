const nodemailer = require("nodemailer");

module.exports = {
    async test() {
        try {
            let acc = await nodemailer.createTestAccount();
    
            let transport = nodemailer.createTransport({
                host: "xornet.cloud",
                port: 465,
                secure: true,
                auth: {
                    user: acc.user,
                    pass: acc.pass,
                },
            });
            let msg = await transport.sendMail({
                from:'"Le test" <test@xornet.cloud>',
                to: "huuskonen.niko@hotmail.fi",
                subject: "kekw",
                text: "we do a little trolling",
            });
    
            console.log(`[SMTP]: Test message sent!`);
            console.log(`[SMTP]: Test message url: ${nodemailer.getTestMessageUrl(info)}`);
        } catch (error) {
            console.error(`[SMTP]: Error during message test: ${error}`);
        }
    }
}