const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
    mongoose.connect(process.env.DATABASE_URI, {
     useNewUrlParser: true,
     useUnifiedTopology: true,
   });
const app = express();
app.use(cors());

app.use(bodyParser.json());

const api = require('./routes/api');
const lead = require('./routes/leadapi');

app.use('/api', api);
app.use('/lead', lead);
app.listen(5000, () => {
  console.log('Server is running on port 5000');
});
