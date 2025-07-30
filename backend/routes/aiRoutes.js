// routes/aiRoutes.js
const express = require("express");
const router = express.Router();
const { handleRiskPrediction } = require("../controllers/aiController");

router.post("/predict", handleRiskPrediction);

module.exports = router;
