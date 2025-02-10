const axios = require('axios');
require('dotenv').config(); // Use dotenv to manage environment variables

const sendEmail = async (to, subject, html) => {
  const data = {
    sender: { email: process.env.SENDINBLUE_SENDER_EMAIL },
    to: [{ email: to }],
    subject: subject,
    htmlContent: html,
  };

  try {
    const response = await axios.post('https://api.sendinblue.com/v3/smtp/email', data, {
      headers: {
        'api-key': process.env.SENDINBLUE_API_KEY,
        'Content-Type': 'application/json',
      },
    });
    console.log('response',response);

    return response.data;
  } catch (error) {
    throw new Error(error.response.data.message);
  }
};

module.exports = sendEmail;
