const HealthTip = require('../models/HealthTip');
const Patient = require('../models/Patient');
const notificationService = require('./notification.service');
const logService = require('./log.service');
const cron = require('node-cron');

const scheduleHealthTips = () => {
  cron.schedule('0 0 * * *', async () => {
    console.log('[Scheduler] Checking for health tips to send...');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      const patients = await Patient.find().populate('user', 'name email phoneNumber');

      for (const patient of patients) {
        if (!patient.edd) continue;

        const msPerWeek = 7 * 24 * 60 * 60 * 1000;
        const weeksPregnant = Math.floor((patient.edd.getTime() - today.getTime()) / msPerWeek);
        const currentWeek = 40 - weeksPregnant;

        if (currentWeek > 0 && currentWeek <= 42) {
          const tips = await HealthTip.find({ relevantWeek: currentWeek });

          for (const tip of tips) {
            const message = `MHAAS Tip (Week ${currentWeek}): ${tip.title} - ${tip.content}`;
            const phone = patient.phoneNumber || '2547XXXXXXX';

            await notificationService.sendSMS(phone, message);

            await logService.logActivity(
              'system',
              'system',
              `Sent tip "${tip.title}" to ${patient.user.name}`,
              'HealthTip',
              tip._id
            );
          }
        }
      }
    } catch (error) {
      console.error('[Scheduler] Error:', error.message);
      await logService.logActivity(
        'system_error',
        'system',
        `Failed to send tips: ${error.message}`,
        'SystemError'
      );
    }
  });

  console.log('✔️ Health tip scheduler started (runs daily @ midnight).');
};

module.exports = { scheduleHealthTips };
