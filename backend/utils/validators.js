// utils/validators.js

exports.isValidEmail = (email) => {
    const re = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    return re.test(String(email).toLowerCase());
  };
  
  exports.isValidPassword = (password) => {
    return password && password.length >= 6;
  };
  
  exports.isObjectId = (id) => {
    return /^[0-9a-fA-F]{24}$/.test(id);
  };
  