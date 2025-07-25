// config/index.js
const connectDB = require('./db');
const { configureCloudinary } = require('./cloudinary');
module.exports = {
  connectDB,
  configureCloudinary,
};
