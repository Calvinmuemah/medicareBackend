// utils/passwordGenerator.js
const crypto = require('crypto');
/**
 * Generates a random, secure password.
 * @param {number} length - The desired length of the password.
 * @returns {string} The generated password.
 */
function generateRandomPassword(length = 12) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
  let password = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    password += chars[bytes[i] % chars.length];
  }
  return password;
}

module.exports = { generateRandomPassword };