// utils/ecgUtils.js

function calculateHeartRate(ecgArray) {
  // ✅ Simulate estimation from waveform
  // Normally you'd detect peaks and compute R-R intervals
  // For now, return a fake heart rate between 85–105 BPM

  const baseHR = 90;
  const variance = Math.floor(Math.random() * 15); // 0–14

  return baseHR + variance;
}

module.exports = { calculateHeartRate };
