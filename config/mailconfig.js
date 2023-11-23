

const nodemailer = require('nodemailer')
const hb = require('nodemailer-express-handlebars')

const MailSender = async ({sendTo, subject, template, code, fullname, message}) => {
    const transporter = nodemailer.createTransport({
        host: MAIL_HOST,
        // host: "smtp.gmail.com",
        port: process.env.MAIL_PORT,
        secure: process.env.MAIL_SECURE, // true for 465, false for other ports
        auth: {
            user: process.env.MAIL_USER, // generated ethereal user
            pass: process.env.MAIL_PASSWORD, // generated ethereal password
        },
    })

    const handleBarOptions = {
        viewEngine: {
            extName: ".handlebars",
            partialsDir: path.resolve('../views'),
            defaultLayout: false
        },
        viewPath: path.resolve('./views'),
        extName: '.handlebars'
    }

    transporter.use('compile', hb(handleBarOptions))


    const mailOptions = {
        from: 'support@jogglecryp.com',
        to: sendTo,
        subject: subject,
        template: template,
        context: {
            code: code,
            fullname: fullname,
            message: message
        }
    }

    await transporter.sendMail(mailOptions)
}
module.exports = MailSender