const nodemailer = require('nodemailer');
require('dotenv').config(); // Use dotenv to manage environment variables

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Use environment variables for sensitive information
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = (to, subject, html) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    html, // Use html instead of text
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        reject(error);  // Reject the promise on error
      } else {
        resolve(info);  // Resolve the promise with the info object on success
      }
    });
  });
};

module.exports = sendEmail;


