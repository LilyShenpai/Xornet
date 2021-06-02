const nodemailer = require("nodemailer");

module.exports = {
    async test() {
        try {
            console.log(`[SMTP]: Starting message test!`);
            let acc = await nodemailer.createTestAccount();
    
            let transport = nodemailer.createTransport({
                host: "localhost",
                port: 25,
                //secure: true,
                auth: {
                    user: acc.user,
                    pass: acc.pass,
                },
                rejectUnauthorized: false
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