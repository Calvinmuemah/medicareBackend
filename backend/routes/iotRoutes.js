const express = require("express");
const router = express.Router();
const {
  postIotData,
  getLatestData,
  getMotherHistory,
  getAlerts,
} = require("../controllers/iotController");

router.post("/iot-data", postIotData);
router.get("/mother/:motherId/latest", getLatestData);
router.get("/mother/:motherId/history", getMotherHistory);
router.get("/alerts/:motherId", getAlerts);

module.exports = router;
