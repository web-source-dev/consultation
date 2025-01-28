const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema({
  service: { type: String, required: true },
  timeframe: { type: String, required: true },
  budget: { type: String, required: true }
});

const BuyerSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  companyWebsite: { type: String, required: true },
  companySize: { type: String, required: true },
  industry: { type: String, required: true },
  additionalInfo: { type: String },
  services: { type: [ServiceSchema], required: true }
},{
    timestamps: true,
});

module.exports = mongoose.model('Buyer', BuyerSchema);
