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
    // Check if email already exists
    const existingVendor = await Vendor.findOne({ email: req.body.email });
    if (existingVendor) {
      return res.status(400).send({ message: 'Email already exists' });
    }

    const vendor = new Vendor(req.body);
    await vendor.save();
    
    // **Admin Email Content**
    const adminEmailText = `New Vendor Registration:\n\nCompany Name: ${vendor.companyName}\nFirst Name: ${vendor.firstName}\nLast Name: ${vendor.lastName}\nEmail: ${vendor.email}\nPhone: ${vendor.phone}\nCompany Website: ${vendor.companyWebsite}\nMinimum Budget: ${vendor.minimumBudget}\nSelected Industries: ${vendor.selectedIndustries.join(', ')}\nSelected Services: ${vendor.selectedServices.join(', ')}\nAdditional Info: ${vendor.additionalInfo}`;

    // Send admin email
    await sendEmail('muhammadtayyab2928@gmail.com', 'New Vendor Registration - Admin Notification', adminEmailText);
    
    // Send vendor confirmation email
    const vendorEmailText = `
      Dear ${vendor.firstName},
      
      Thank you for registering as a vendor on our platform. Our team will review your details and get back to you soon.
      
      If you have any questions, feel free to contact us.
      
      Best Regards,
      Reachly.
      
      Login to Your Account: https://www.reachly.ca/vendor-dashboard-2
    `;

    await sendEmail(vendor.email.trim(), 'Thank You for Registering as a Vendor', vendorEmailText);

    res.status(201).send({ message: 'Request submitted successfully' });
  } catch (error) {
    res.status(400).send({ error: 'Error submitting vendor form', details: error.message });
  }
});

router.post('/buyer', async (req, res) => {
  try {
    const buyer = new Buyer(req.body);
    await buyer.save();
    
    // **Admin Email Content**
    const adminEmailText = `New Buyer Registration:\n\nCompany Name: ${buyer.companyName}\nFirst Name: ${buyer.firstName}\nLast Name: ${buyer.lastName}\nEmail: ${buyer.email}\nCompany Website: ${buyer.companyWebsite}\nCompany Size: ${buyer.companySize}\nIndustries: ${buyer.industries.join(', ')}\nAdditional Info: ${buyer.additionalInfo}\nServices:\n${buyer.services.map(service => `Service: ${service.service}, Timeframe: ${service.timeframe}, Budget: ${service.budget}`).join('\n')}`;
    
    // Send admin email
    await sendEmail('muhammadtayyab2928@gmail.com', 'New Buyer Registration - Admin Notification', adminEmailText);
    
    // Send buyer confirmation email
    const buyerEmailText = `
      Dear ${buyer.firstName},
      
      Thank you for submitting your request on our platform. Our team will review your details and connect you with the best vendors for your needs.
      
      If you have any questions, feel free to contact us.
      
      Best Regards,
      Reachly.
      
      Login to Your Account: https://www.reachly.ca/vendor-dashboard-2
    `;
    
    await sendEmail(buyer.email, 'Thank You for Registering as a Buyer', buyerEmailText);
    
    res.status(201).send({ message: 'Buyer form submitted successfully' });
  } catch (error) {
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
