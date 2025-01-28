const mongoose = require('mongoose');

// Connect to MongoDB
const googleSheetSchema = new mongoose.Schema({
    name:String,
    email: String,
    phone: String,
    message: String,
    date: String,
    time: String,
    apikey: String,
    platform:String
},{ timestamps: true })

module.exports = mongoose.model('GoogleSheet', googleSheetSchema);