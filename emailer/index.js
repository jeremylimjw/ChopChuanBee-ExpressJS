const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

function sendEmailTo(email, templateName, params) {
  return transporter.sendMail({
    from: process.env.EMAIL_USERNAME,
    to: email,
    subject: params.subject,
    html: require(`./templates/${templateName}`)(params),
  });

}

module.exports = { sendEmailTo }
