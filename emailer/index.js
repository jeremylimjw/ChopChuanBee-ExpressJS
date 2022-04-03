const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

function sendEmailTo(email, templateName, params) {
  if (templateName === 'purchaseOrder') {
    return transporter.sendMail({
      from: process.env.EMAIL_USERNAME,
      to: email,
      subject: "Chop Chuan Bee Purchase Order",
      text: `Dear ${params?.supplier?.company_name}, \n\nPlease refer to the attached pdf regarding our purchase order request.\n\nBest Regards,\nChop Chuan Bee`,
      attachments: {
        filename: 'PO.pdf',
        content: params.document,
      }
    });

  } else {
    return transporter.sendMail({
      from: process.env.EMAIL_USERNAME,
      to: email,
      subject: params.subject,
      html: require(`./templates/${templateName}`)(params),
    });
  }

}

module.exports = { sendEmailTo }
