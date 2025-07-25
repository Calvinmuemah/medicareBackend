// --- Service for Sending SMS/Email Reminders ---
const nodemailer = require('nodemailer');
const africastalking = require('africastalking')({
  apiKey: process.env.AFRICAS_TALKING_API_KEY,
  username: process.env.AFRICAS_TALKING_USERNAME,
});

// --- Email ---
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendEmail = async (email, subject, body) => {
  try {
    const options = {
      from: `"MHAAS" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      text: body,
    };

    await transporter.sendMail(options);
    console.log(`[Email Service] Sent to ${email}: ${subject}`);
    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    console.error(`[Email Service] Error:`, error.message);
    return { success: false, message: 'Failed to send email', error: error.message };
  }
};

// --- SMS ---
exports.sendSMS = async (phoneNumber, message) => {
  try {
    const sms = africastalking.SMS;
    await sms.send({
      to: [phoneNumber],
      message,
      from: 'MHAAS',
    });

    console.log(`[SMS Service] Sent to ${phoneNumber}: "${message}"`);
    return { success: true, message: 'SMS sent successfully' };
  } catch (error) {
    console.error(`[SMS Service] Error:`, error.message);
    return { success: false, message: 'Failed to send SMS', error: error.message };
  }
};
