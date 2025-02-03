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
    console.log('Consultation form submitted successfully:', newConsultation);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: ['muhammadtayyab2928@gmail.com', `${email}`], // Send to two users
      subject: 'New Consultation Form Submission',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
          <header style="background-color: #4CAF50; padding: 10px; text-align: center; border-bottom: 1px solid #ddd;">
            <h1 style="color: #fff;">Consultation Booking Confirmation</h1>
          </header>
          <main style="padding: 20px; border-radius: 10px;">
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Phone:</strong> ${phone}</p>
            <p><strong>Message:</strong> ${message}</p>
            <p><strong>Date:</strong> ${date}</p>
            <p><strong>Time:</strong> ${time}</p>
          </main>
          <footer style="background-color: #f7f7f7; padding: 10px; text-align: center; border-top: 1px solid #ddd;">
            <p style="font-size: 0.9em; color: #777;">Thank you for booking a consultation with us. We will get back to you shortly.</p>
            <p style="font-size: 0.9em; color: #777;">This is an automated message. Please do not reply.</p>
          </footer>
        </div>
      `, // Professional email design with header, footer, and content box
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
        return res.status(500).json({ message: 'Error sending email.' });
      } else {
        console.log('Email sent:', info.response);
        return res.status(201).json({ message: 'Consultation form submitted and email sent successfully!', newConsultation });
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
