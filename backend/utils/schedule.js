// utils/schedule.js

const cron = require('node-cron');
const Reminder = require('../models/Reminder');
const notificationService = require('../services/notification.service');
const logService = require('../services/log.service');
const User = require('../models/User');

const scheduleReminders = () => {
  cron.schedule('*/14 * * * *', async () => {
    console.log(' Running scheduled reminder check...');

    try {
      const remindersToSend = await Reminder.find({
        scheduledTime: { $lte: new Date() },
        sent: false,
      }).populate({
        path: 'patient',
        populate: {
          path: 'user',
          select: 'name email',
        },
      });

      for (const reminder of remindersToSend) {
        const patientUser = reminder.patient?.user;

        if (!patientUser) continue;

        console.log(` Sending reminder to ${patientUser.name}: ${reminder.message}`);

        await notificationService.sendSMS(
          '2547XXXXXXXX', // Replace with dynamic phone if available
          `MHAAS Reminder for ${patientUser.name}: ${reminder.message}`
        );

        reminder.sent = true;
        reminder.sentAt = new Date();
        await reminder.save();

        await logService.logActivity(
          reminder.createdBy,
          'system',
          `Sent reminder to ${patientUser.name}`,
          'Reminder',
          reminder._id
        );
      }
    } catch (err) {
      console.error(' Reminder Cron Error:', err);
      await logService.logActivity(
        'system_error',
        'system',
        `Failed to send reminders: ${err.message}`,
        'SystemError'
      );
    }
  });

  console.log(' Reminder scheduler initialized.');
};

module.exports = { scheduleReminders };
