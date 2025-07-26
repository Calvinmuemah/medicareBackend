// server.js
const app = require("./app");
const { connectDB, configureCloudinary } = require("./config");
const { scheduleReminders } = require("./utils/schedule");
const { scheduleHealthTips } = require("./services/tip.service");
// Connect to DB
connectDB();
// Cloudinary config
configureCloudinary();
// Start CRON jobs or schedulers
scheduleReminders();
scheduleHealthTips();
const PORT = process.env.PORT 
const server = app.listen(PORT, () =>
  console.log(`Server running in  ${PORT}`)
);
// Graceful shutdown on unhandled promise rejection
process.on("unhandledRejection", (err, promise) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});
