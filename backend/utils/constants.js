// utils/constants.js

exports.USER_ROLES = {
    SUPER_ADMIN: 'superadmin',
    HOSPITAL_ADMIN: 'hospitaladmin',
    STAFF: 'staff',
    PATIENT: 'patient',
  };
  
  exports.APPOINTMENT_TYPES = [
    'Antenatal Checkup',
    'Postnatal Checkup',
    'Vaccination',
    'Consultation',
    'Other',
  ];
  
  exports.APPOINTMENT_STATUSES = [
    'Scheduled',
    'Completed',
    'Cancelled',
    'Rescheduled',
  ];
  
  exports.VISIT_TYPES = [
    'Antenatal',
    'Postnatal',
    'Delivery',
    'Emergency',
    'Other',
  ];
  
  exports.REMINDER_TYPES = [
    'Appointment',
    'Health Tip',
    'Medication',
    'Other',
  ];
  
  exports.SUBMISSION_TYPES = ['audio', 'text'];
  
  exports.BLOOD_GROUPS = [
    'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-',
  ];
  
  exports.STAFF_SPECIALTIES = [
    'General Practitioner',
    'Obstetrician',
    'Nurse',
    'Midwife',
    'Other',
  ];
  