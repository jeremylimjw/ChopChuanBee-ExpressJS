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

  } else if (templateName === 'salesOrder') {
      return transporter.sendMail({
        from: process.env.EMAIL_USERNAME,
        to: email,
        subject: "Chop Chuan Bee Sales Order",
        text: `Dear ${params?.customer?.company_name}, \n\nPlease refer to the attached pdf regarding your sales order invoice.\n\nBest Regards,\nChop Chuan Bee`,
        attachments: {
          filename: 'SO.pdf',
          content: params.document,
        }
      });

  } else if (templateName === 'enquiry') {
    return transporter.sendMail({
      from: process.env.EMAIL_USERNAME,
      to: email,
      subject: `Enquiry from ${params?.name}`,
      text: 
`
Name: ${params?.name}
Email: ${params?.email}
Phone: ${params?.phone}
Enquiry: ${params?.text}
`,
    });

  } else if (templateName === 'enquiryReply') {
    return transporter.sendMail({
      from: process.env.EMAIL_USERNAME,
      to: email,
      subject: `Your Enquiry Received by Chop Chuan Bee`,
      text: 
`
Hi ${params?.name},

We have successfully received your enquiry and we strive to reach back to you within 1 week.

For your reference, the enquiry that you have submitted is shown below.

Name: ${params?.name}
Email: ${params?.email}
Phone: ${params?.phone}
Enquiry: ${params?.text}
`,
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
