const db = require("../firebase/firebaseConfig");
const { calculateHeartRate } = require("../utils/ecgUtils");


// POST /iot-data
exports.postIotData = async (req, res) => {
  try {
    let { deviceId, motherId, temperature, ecg, timestamp } = req.body;

    // ✅ Validate required fields
    if (!motherId || !deviceId || typeof temperature !== "number" || !Array.isArray(ecg)) {
      return res.status(400).json({ error: "Invalid input data" });
    }

    // ✅ Set timestamp if not provided
    timestamp = timestamp || Date.now();

    const tempTooHigh = temperature > 37.5;
    const heartRate = calculateHeartRate(ecg);
    const ecgAbnormal = heartRate < 60 || heartRate > 100;
    const alert = tempTooHigh && ecgAbnormal;

    console.log("📥 Saving IoT data to path:", `iot_data/${motherId}/${timestamp}`);

    // Save main IoT data
    await db.ref(`iot_data/${motherId}/${timestamp}`).set({
      deviceId,
      temperature,
      heartRate,
      ecg,
      alert,
    });

    // Save alert log if condition is abnormal
    if (alert) {
      await db.ref(`alerts/${motherId}/${timestamp}`).set({
        deviceId,
        temperature,
        heartRate,
        ecg,
        timestamp,
        reason: "ecg_and_temp_alert",
      });
      console.log("🚨 Alert logged under:", `alerts/${motherId}/${timestamp}`);
    }

    // Update buzzer control
    await db.ref(`buzzer_control/${deviceId}`).set({
      buzzer: alert ? "on" : "off",
      reason: alert ? "ecg_and_temp_alert" : "normal",
      timestamp,
    });

    res.status(200).json({
      status: "saved",
      alert,
      heartRate,
    });
  } catch (error) {
    console.error("❌ Error saving IoT data:", error);
    res.status(500).json({ error: "Failed to process IoT data" });
  }
};

// GET /mother/:motherId/latest
exports.getLatestData = async (req, res) => {
  const { motherId } = req.params;

  try {
    console.log("🔍 Trying to fetch data for:", motherId);
    const path = `iot_data/${motherId}`;
    const snapshot = await db.ref(path).once("value");
    const data = snapshot.val();

    console.log("📂 Firebase path:", path);
    console.log("🔥 Raw snapshot:", JSON.stringify(data, null, 2));

    if (!data) {
      console.log("⚠️ No data found for:", motherId);
      return res.status(404).json({ message: "No data found" });
    }

    const timestamps = Object.keys(data).sort().reverse();
    const latestTime = timestamps[0];
    const latestData = data[latestTime];

    console.log(`✅ Returning latest data at timestamp: ${latestTime}`);
    res.status(200).json({
      ...latestData,
      timestamp: latestTime,
    });
  } catch (error) {
    console.error("❌ Error fetching latest data:", error);
    res.status(500).json({ error: "Failed to retrieve latest reading" });
  }
};

// /mother/:motherId/history
exports.getMotherHistory = async (req, res) => {
  const { motherId } = req.params;

  try {
    const snapshot = await db.ref(`iot_data/${motherId}`).once("value");
    const data = snapshot.val();

    if (!data) {
      return res.status(404).json({ message: "No history found for this mother" });
    }

    const sortedHistory = Object.keys(data)
      .sort()
      .reduce((acc, key) => {
        acc.push({ timestamp: key, ...data[key] });
        return acc;
      }, []);

    res.status(200).json({ history: sortedHistory });
  } catch (error) {
    console.error("❌ Error fetching history:", error);
    res.status(500).json({ error: "Failed to retrieve history" });
  }
};

// GET /alerts/:motherId
exports.getAlerts = async (req, res) => {
  const { motherId } = req.params;

  try {
    console.log("🔍 Fetching alerts for:", motherId);
    const path = `alerts/${motherId}`;
    const snapshot = await db.ref(path).once("value");
    const data = snapshot.val();

    console.log("📂 Firebase path:", path);
    console.log("🔥 Raw alert data:", JSON.stringify(data, null, 2));

    if (!data) {
      console.log("⚠️ No alerts found for:", motherId);
      return res.status(404).json({ message: "No alerts found" });
    }

    const alerts = Object.entries(data).map(([timestamp, entry]) => ({
      timestamp,
      ...entry,
    }));

    // Sorted latest first
    alerts.sort((a, b) => b.timestamp - a.timestamp);

    res.status(200).json({ alerts });
  } catch (error) {
    console.error("❌ Error fetching alerts:", error);
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
};

