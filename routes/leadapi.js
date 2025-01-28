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
    const vendor = new Vendor(req.body);
    await vendor.save();
    
    // Send email notification
    const emailText = `Company Name: ${vendor.companyName}\nFirst Name: ${vendor.firstName}\nLast Name: ${vendor.lastName}\nEmail: ${vendor.email}\nPhone: ${vendor.phone}\nCompany Website: ${vendor.companyWebsite}\nMinimum Budget: ${vendor.minimumBudget}\nSelected Industries: ${vendor.selectedIndustries.join(', ')}\nSelected Services: ${vendor.selectedServices.join(', ')}\nAdditional Info: ${vendor.additionalInfo}`;
    sendEmail('muhammadtayyab2928@gmail.com', 'New Vendor Form Submission', emailText);

    res.status(201).send({ message: 'Vendor form submitted successfully' });
  } catch (error) {
    res.status(400).send({ error: 'Error submitting vendor form', details: error });
  }
});
router.post('/buyer', async (req, res) => {
  try {
    const buyer = new Buyer(req.body);
    await buyer.save();
    
    // Send email notification
    const emailText = `Company Name: ${buyer.companyName}\nFirst Name: ${buyer.firstName}\nLast Name: ${buyer.lastName}\nEmail: ${buyer.email}\nCompany Website: ${buyer.companyWebsite}\nCompany Size: ${buyer.companySize}\nIndustry: ${buyer.industry}\nAdditional Info: ${buyer.additionalInfo}\nServices: ${buyer.services.map(service => `Service: ${service.service}, Timeframe: ${service.timeframe}, Budget: ${service.budget}`).join('\n')}`;
    sendEmail('muhammadtayyab2928@gmail.com', 'New Buyer Form Submission', emailText);

    res.status(201).send({ message: 'Buyer form submitted successfully' });
  } catch (error) {
    res.status(400).send({ error: 'Error submitting buyer form', details: error });
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

        // Check for industry match
        const matchedIndustries = vendor.selectedIndustries.filter(
          (industry) => industry === buyer.industry
        );

        if (matchedIndustries.length > 0) {
          // If industry matches, check for service match
          const matchedServices = buyer.services
            .filter((buyerService) =>
              vendor.selectedServices.includes(buyerService.service)
            )
            .map((matchedService) => matchedService.service);

          if (matchedServices.length > 0) {
            matchReasons.push(
              `Industry match: ${matchedIndustries.join(', ')}`,
              `Service match: ${matchedServices.join(', ')}`
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

        // Check for industry match
        const matchedIndustries = vendor.selectedIndustries.filter(
          (industry) => industry === buyer.industry
        );

        if (matchedIndustries.length > 0) {
          // If industry matches, check for service match
          const matchedServices = buyer.services
            .filter((buyerService) =>
              vendor.selectedServices.includes(buyerService.service)
            )
            .map((matchedService) => matchedService.service);

          if (matchedServices.length > 0) {
            matchReasons.push(
              `Industry match: ${matchedIndustries.join(', ')}`,
              `Service match: ${matchedServices.join(', ')}`
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

router.get('/vendor/:id/matches', async (req, res) => {
  const { id } = req.params;

  try {
    // Find the vendor by ID
    const vendor = await Vendor.findById(id);

    if (!vendor) {
      return res.status(404).send({ error: 'Vendor not found' });
    }

    // Find all buyers
    const buyers = await Buyer.find({});
    const matchedBuyers = [];

    buyers.forEach((buyer) => {
      const matchReasons = [];

      // Check for industry match
      const industryMatch = vendor.selectedIndustries.includes(buyer.industry);
      if (industryMatch) {
        matchReasons.push('Industry match');
      }

      // Check for service match
      const serviceMatch = buyer.services.some((buyerService) =>
        vendor.selectedServices.includes(buyerService.service)
      );
      if (serviceMatch) {
        matchReasons.push('Service match');
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
router.get('/buyer/:id/matches', async (req, res) => {
  const { id } = req.params;

  try {
    // Find the buyer by ID
    const buyer = await Buyer.findById(id);

    if (!buyer) {
      return res.status(404).send({ error: 'Buyer not found' });
    }

    // Find all vendors
    const vendors = await Vendor.find({});
    const matchedVendors = [];

    vendors.forEach((vendor) => {
      const matchReasons = [];

      // Check for industry match
      const industryMatch = vendor.selectedIndustries.includes(buyer.industry);
      if (industryMatch) {
        matchReasons.push('Industry match');
      }

      // Check for service match
      const serviceMatch = buyer.services.some((buyerService) =>
        vendor.selectedServices.includes(buyerService.service)
      );
      if (serviceMatch) {
        matchReasons.push('Service match');
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
module.exports = router;