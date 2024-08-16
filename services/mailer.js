const nodemailer = require("nodemailer");

const transporter = new nodemailer.createTransport({
  service: process.env.SMTP_SERVICE,
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

transporter.verify(function (error, success) {
  if (error) {
    console.log("Email server is not working");
  } else {
    console.log("Email server connected....");
  }
});

const sendEmail = async ({ to, subject, htmlMessage }) => {
  const info = await transporter.sendMail({
    from: `"XYZ hotel mgmt" <${process.env.SMTP_EMAIL}>`, //sender address
    to, //list of receivers
    subject, //subject f line
    html: htmlMessage,
  });

  return info;
};

module.exports = { sendEmail };
