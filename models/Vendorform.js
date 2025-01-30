const mongoose = require('mongoose');

const VendorSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  companyWebsite: { type: String, required: true },
  minimumBudget: { type: Number, required: true },
  selectedIndustries: { type: [String], required: true },
  selectedServices: { type: [String], required: true },
  additionalInfo: { type: String },
  agreeToTerms: { type: Boolean, required: true }
}, {
  timestamps: true,
});

module.exports = mongoose.model('Vendor', VendorSchema);
