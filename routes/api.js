const express = require('express');
const router = express.Router(); // Use Router instead of express()
const Database = require('../models/GoogleSheet');
const nodemailer = require('nodemailer');
require('dotenv').config(); // Use dotenv to manage environment variables

// Create an array of random values with names
const Platform = [
  { name: 'google', value: "21654665456454545454758784545" },
  { name: 'microsoft', value: "12345678901234567890123456789" },
  { name: 'apple', value: "32145678901234567890123456789" },
  { name: 'amazon', value: "45678901234567890123456789012" },
  { name: 'netflix', value: "56789012345678901234567890123" },
];

router.post('/consultation/form/:apikey', async (req, res) => {
  const { name, email, phone, message, date, time } = req.body;
  try {
    const platform = Platform.find((p) => p.value === req.params.apikey);
    if (!platform) {
    return res.status(400).json({ message: 'Invalid API key.' });
    }

    const newConsultation = new Database({
    name,
    email,
    phone,
    message,
    date,
    time,
    platform: platform.name,
    apikey: platform.value
    });
    await newConsultation.save();
    res.status(201).json({ message: 'Consultation form submitted successfully!' });
    console.log('Consultation form submitted successfully:', newConsultation);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // Use environment variables for sensitive information
        pass: process.env.EMAIL_PASS,
      },
    });
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'muhammadtayyab2928@gmail.com',
      subject: 'New Consultation Form Submission',
      text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nMessage: ${message}\nDate: ${date}\nTime: ${time}`,
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
        return res.status(500).json({ message: 'Error sending email.' });
      } else {
        console.log('Email sent:', info.response);
      }
    });
    } catch (error) {
    console.error('Error saving consultation form:', error);
    res.status(500).json({ message: 'Error saving consultation form.' });
    }
});

router.get('/consultations/:apikey', async (req, res) => {
  try {
    const platform = Platform.find((p) => p.value === req.params.apikey);
    if (!platform) {
      return res.status(400).json({ message: 'Invalid API key.' });
    }

    // Fetch data with `lean()` to get plain objects
    const consultations = await Database.find({ apikey: req.params.apikey }).lean();
    if (!consultations || consultations.length === 0) {
      return res.status(404).json({ message: 'No consultations found.' });
    }

    // Remove sensitive fields before sending the response
    const filteredConsultations = consultations.map(({ apikey, platform, ...rest }) => rest);

    console.log('Filtered Consultations:', filteredConsultations);
    res.json(filteredConsultations);

  } catch (error) {
    console.error('Error retrieving consultations:', error);
    res.status(500).json({ message: 'Error retrieving consultations.' });
  }
});

module.exports = router;