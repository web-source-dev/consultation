const express = require('express');
const router = express.Router(); // Use Router instead of express()
const nodemailer = require('nodemailer');
require('dotenv').config(); // Use dotenv to manage environment variables

const Vendor = require('../models/Vendorform');
const Buyer = require('../models/Buyerform');
const sendEmail = require('../utils/email'); // Import sendEmail function

// Endpoint to handle Vendor form submission
router.post('/vendor', async (req, res) => {
  try {
    // Check if email already exists in Vendor collection
    const existingVendor = await Vendor.findOne({ email: req.body.email });
    if (existingVendor) {
      return res.status(400).send({ message: 'This email is already registered as a vendor.' });
    }

    // Check if email already exists in Buyer collection
    const existingBuyer = await Buyer.findOne({ email: req.body.email });
    if (existingBuyer) {
      return res.status(400).send({ message: 'This email is already registered as a buyer.' });
    }

    const vendor = new Vendor(req.body);
    await vendor.save();
    // Send vendor welcome email
    const vendorEmailText = `
      <html>
        <body>
          <h2>Welcome to Reachly – Set Up Your Vendor Dashboard</h2>
          <p>Dear ${vendor.firstName} ${vendor.lastName},</p>
          <p>Thank you for signing up with Reachly! We’re thrilled you’ve chosen us to help grow your business through high-quality, ready-to-buy leads. Your decision to work with us means you’re on the right path to predictable, scalable revenue.</p>
          <p>To get started, please set up your password and access your Vendor Dashboard, where you can:</p>
          <ul>
            <li>View your matched leads and their details</li>
            <li>Track your engagement history and responses</li>
            <li>Manage your preferences and account settings</li>
          </ul>
          <p>Click below to create your password and log in:</p>
          <p><a href="https://www.reachly.ca/vendor-dashboard-2">Set Up My Vendor Dashboard</a></p>
          <p>We look forward to helping you connect with qualified buyers and drive more revenue. If you have any questions, our team is always here to help at <a href="mailto:support@reachly.ca">support@reachly.ca</a>.</p>
          <p>Welcome aboard!</p>
          <p>The Reachly Team</p>
        </body>
      </html>
    `;

    await sendEmail(vendor.email.trim(), 'Welcome to Reachly – Set Up Your Vendor Dashboard', vendorEmailText);
    await sendEmail('muhammadtayyab2928@gmail.com', 'New Vendor Registration - Admin Notification', vendorEmailText);

    // Respond to the client only after emails are sent
    res.status(201).send({ message: 'Request submitted. Please check your email for further instructions.' });
  } catch (error) {
    // If there’s any error, respond with error message
    res.status(400).send({ error: 'Error submitting vendor form', details: error.message });
  }
});

router.post('/buyer', async (req, res) => {
  try {
    // Check if email already exists in Buyer collection
    const existingBuyer = await Buyer.findOne({ email: req.body.email });
    if (existingBuyer) {
      return res.status(400).send({ message: 'This email is already registered as a buyer.' });
    }

    // Check if email already exists in Vendor collection
    const existingVendor = await Vendor.findOne({ email: req.body.email });
    if (existingVendor) {
      return res.status(400).send({ message: 'This email is already registered as a vendor.' });
    }

    const buyer = new Buyer(req.body);
    await buyer.save();
    
    const buyerEmailText = `
      <html>
        <body>
          <h2>Welcome to Reachly! Connect with Top SaaS Vendors</h2>
          <p>Dear ${buyer.firstName},</p>
          <p>Thank you for signing up with Reachly! We’re excited to connect you with top SaaS vendors who can help elevate your business. By choosing Reachly, you gain direct access to pre-vetted solutions that align with your needs.</p>
          <p>To get started, create your password and log in to your Buyer Dashboard, where you can:</p>
          <ul>
            <li>View the vendors you’ve been matched with</li>
            <li>Access their contact details and proposals</li>
            <li>Track and manage your inquiries seamlessly</li>
          </ul>
          <p>Click below to create your password and access your dashboard:</p>
          <p><a href="https://www.reachly.ca/buyer-dashboard">Set Up My Buyer Dashboard</a></p>
          <p>We’re here to make your SaaS vendor selection process easier, faster, and more effective. If you have any questions, feel free to reach out at <a href="mailto:support@reachly.ca">support@reachly.ca</a>.</p>
          <p>We can’t wait to help you find the perfect solution!</p>
          <p>The Reachly Team</p>
        </body>
      </html>
    `;
    await sendEmail('muhammadtayyab2928@gmail.com', 'New Buyer Registration - Admin Notification', buyerEmailText);
    
    await sendEmail(buyer.email, 'Welcome to Reachly! Connect with Top SaaS Vendors', buyerEmailText);
    
    // Respond to the client only after emails are sent
    res.status(201).send({ message: 'Request submitted. Please check your email for further instructions' });
  } catch (error) {
    // Handle any errors and send a detailed response
    res.status(400).send({ error: 'Error submitting buyer form', details: error.message });
  }
});


router.get('/getdata', async (req, res) => {
  try {
    const vendors = await Vendor.find({});
    const buyers = await Buyer.find({});

    const matchedVendors = [];
    const notMatchedVendors = [];
    const matchedBuyers = [];
    const notMatchedBuyers = [];

    let totalMatchedVendors = 0;
    let totalNotMatchedVendors = 0;
    let totalMatchedBuyers = 0;
    let totalNotMatchedBuyers = 0;

    // Process vendors to find matched and unmatched buyers
    vendors.forEach((vendor) => {
      const matchedVendorBuyers = [];
      buyers.forEach((buyer) => {
        const matchReasons = [];

        // Check for industryMatch
        const matchedIndustries = vendor.selectedIndustries.filter(
          (industry) => buyer.industries.includes(industry)
        );

        if (matchedIndustries.length > 0) {
          // If industryMatches, check for serviceMatch
          const matchedServices = buyer.services
            .filter((buyerService) =>
              vendor.selectedServices.includes(buyerService.service)
            )
            .map((matchedService) => matchedService.service);

          if (matchedServices.length > 0) {
            matchReasons.push(
              `industryMatch: ${matchedIndustries.join(', ')}`,
              `serviceMatch: ${matchedServices.join(', ')}`
            );

            matchedVendorBuyers.push({
              buyer,
              matchReasons,
            });
          }
        }
      });

      if (matchedVendorBuyers.length > 0) {
        matchedVendors.push({
          vendor,
          matchedBuyers: matchedVendorBuyers,
        });
        totalMatchedVendors++;
      } else {
        notMatchedVendors.push(vendor);
        totalNotMatchedVendors++;
      }
    });

    // Process buyers to find matched and unmatched vendors
    buyers.forEach((buyer) => {
      const matchedBuyerVendors = [];
      vendors.forEach((vendor) => {
        const matchReasons = [];

        // Check for industryMatch
        const matchedIndustries = vendor.selectedIndustries.filter(
          (industry) => buyer.industries.includes(industry)
        );

        if (matchedIndustries.length > 0) {
          // If industryMatches, check for serviceMatch
          const matchedServices = buyer.services
            .filter((buyerService) =>
              vendor.selectedServices.includes(buyerService.service)
            )
            .map((matchedService) => matchedService.service);

          if (matchedServices.length > 0) {
            matchReasons.push(
              `industryMatch: ${matchedIndustries.join(', ')}`,
              `serviceMatch: ${matchedServices.join(', ')}`
            );

            matchedBuyerVendors.push({
              vendor,
              matchReasons,
            });
          }
        }
      });

      if (matchedBuyerVendors.length > 0) {
        matchedBuyers.push({
          buyer,
          matchedVendors: matchedBuyerVendors,
        });
        totalMatchedBuyers++;
      } else {
        notMatchedBuyers.push(buyer);
        totalNotMatchedBuyers++;
      }
    });

    // Send the response with total match counts
    res.send({
      buyer: {
        matched: matchedBuyers,
        notMatched: notMatchedBuyers,
        totalMatches: totalMatchedBuyers,
        totalNotMatched: totalNotMatchedBuyers,
      },
      vendor: {
        matched: matchedVendors,
        notMatched: notMatchedVendors,
        totalMatches: totalMatchedVendors,
        totalNotMatched: totalNotMatchedVendors,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Error processing data', details: error });
  }
});

router.get('/vendor/:email/matches', async (req, res) => {
  const { email } = req.params;

  try {
    // Find the vendor by email
    const vendor = await Vendor.findOne({ email });

    if (!vendor) {
      return res.status(404).send({ error: 'Vendor not found' });
    }

    // Find all buyers
    const buyers = await Buyer.find({});
    const matchedBuyers = [];

    buyers.forEach((buyer) => {
      const matchReasons = [];

      // Check for industryMatch
      const matchedIndustries = vendor.selectedIndustries.filter(
        (industry) => buyer.industries.includes(industry)
      );
      if (matchedIndustries.length > 0) {
        // Check for serviceMatch
        const matchedServices = buyer.services
          .filter((buyerService) =>
            vendor.selectedServices.includes(buyerService.service)
          )
          .map((matchedService) => matchedService.service);
        if (matchedServices.length > 0) {
          matchReasons.push(`industryMatch: ${matchedIndustries.join(', ')}`);
          matchReasons.push(`serviceMatch: ${matchedServices.join(', ')}`);
        }
      }

      // Add to matched buyers if there are match reasons
      if (matchReasons.length > 0) {
        matchedBuyers.push({
          buyer,
          matchReasons,
        });
      }
    });

    // Send the matched buyers along with the vendor data
    res.send({
      vendor,
      matchedBuyers,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Error processing data', details: error });
  }
});

router.get('/buyer/:email/matches', async (req, res) => {
  const { email } = req.params;

  try {
    // Find the buyer by email
    const buyer = await Buyer.findOne({ email });

    if (!buyer) {
      return res.status(404).send({ error: 'Buyer not found' });
    }

    // Find all vendors
    const vendors = await Vendor.find({});
    const matchedVendors = [];

    vendors.forEach((vendor) => {
      const matchReasons = [];

      // Check for industryMatch
      const matchedIndustries = vendor.selectedIndustries.filter(
        (industry) => buyer.industries.includes(industry)
      );
      if (matchedIndustries.length > 0) {
        // Check for serviceMatch
        const matchedServices = buyer.services
          .filter((buyerService) =>
            vendor.selectedServices.includes(buyerService.service)
          )
          .map((matchedService) => matchedService.service);
        if (matchedServices.length > 0) {
          matchReasons.push(`industryMatch: ${matchedIndustries.join(', ')}`);
          matchReasons.push(`serviceMatch: ${matchedServices.join(', ')}`);
        }
      }

      // Add to matched vendors if there are match reasons
      if (matchReasons.length > 0) {
        matchedVendors.push({
          vendor,
          matchReasons,
        });
      }
    });

    // Send the matched vendors along with the buyer data
    res.send({
      buyer,
      matchedVendors,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Error processing data', details: error });
  }
});

// get all vendors 
router.get('/getAllVendors', async function (req, res) {
  try {
    const vendors = await Vendor.find({});
    const buyers = await Buyer.find({});
    const vendorData = vendors.map((vendor) => {
      const matchedBuyers = buyers
        .map((buyer) => {
          const matchReasons = [];

          // Check for industryMatch
          const matchedIndustries = vendor.selectedIndustries.filter(
            (industry) => buyer.industries.includes(industry)
          );
          if (matchedIndustries.length > 0) {
            // Check for serviceMatch
            const matchedServices = buyer.services
              .filter((buyerService) =>
                vendor.selectedServices.includes(buyerService.service)
              )
              .map((matchedService) => matchedService.service);
            if (matchedServices.length > 0) {
              matchReasons.push(`industryMatch: ${matchedIndustries.join(', ')}`);
              matchReasons.push(`serviceMatch: ${matchedServices.join(', ')}`);
            }
          }

          if (matchReasons.length > 0) {
            return {
              buyer,
              matchReasons,
            };
          }
          return null;
        })
        .filter((match) => match !== null);

      return {
        ...vendor.toObject(),
        totalBuyers: matchedBuyers.length,
        matchedBuyers,
      };
    });

    res.send({ msg: 'All Vendors Data', vendors: vendorData });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Error fetching vendors', details: error });
  }
});

// get all buyers 
router.get('/getAllBuyers', async function (req, res) {
  try {
    const buyers = await Buyer.find({});
    const vendors = await Vendor.find({});
    const buyerData = buyers.map((buyer) => {
      const matchedVendors = vendors
        .map((vendor) => {
          const matchReasons = [];

          // Check for industryMatch
          const matchedIndustries = vendor.selectedIndustries.filter(
            (industry) => buyer.industries.includes(industry)
          );
          if (matchedIndustries.length > 0) {
            // Check for serviceMatch
            const matchedServices = buyer.services
              .filter((buyerService) =>
                vendor.selectedServices.includes(buyerService.service)
              )
              .map((matchedService) => matchedService.service);
            if (matchedServices.length > 0) {
              matchReasons.push(`industryMatch: ${matchedIndustries.join(', ')}`);
              matchReasons.push(`serviceMatch: ${matchedServices.join(', ')}`);
            }
          }

          if (matchReasons.length > 0) {
            return {
              vendor,
              matchReasons,
            };
          }
          return null;
        })
        .filter((match) => match !== null);

      return {
        ...buyer.toObject(),
        totalVendors: matchedVendors.length,
        matchedVendors,
      };
    });

    res.send({ msg: 'All Buyers Data', buyers: buyerData });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Error fetching buyers', details: error });
  }
});
   
module.exports = router;
