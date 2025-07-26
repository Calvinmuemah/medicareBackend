 config/
│   ├── db.js                  # MongoDB connection setup
│   ├── cloudinary.js          # Cloudinary config (for uploads, currently a placeholder)
│   └── index.js               # Centralizes all configuration exports
│
├── controllers/
│   ├── auth.controller.js     # Handles user registration and login
│   ├── hospital.controller.js # Manages hospital and hospital admin creation
│   ├── user.controller.js     # General user management (e.g., view all users)
│   ├── staff.controller.js    # Manages hospital staff (doctors, nurses)
│   ├── patient.controller.js  # Handles patient registration, visits, appointments
│   ├── appointment.controller.js # Manages appointments
│   ├── reminder.controller.js # Manages sending reminders
│   ├── visit.controller.js    # Manages patient visits
│   ├── healthTip.controller.js # Manages health tips
│   └── submission.controller.js # Handles patient audio/text submissions
│   └── logs.controller.js     # Manages activity logs
│
├── models/
│   ├── User.js                # Mongoose schema for all user roles (Super Admin, Hospital Admin, Staff, Patient)
│   ├── Hospital.js            # Mongoose schema for hospitals
│   ├── Patient.js             # Mongoose schema for patients
│   ├── Appointment.js         # Mongoose schema for appointments
│   ├── Visit.js               # Mongoose schema for visits
│   ├── Reminder.js            # Mongoose schema for reminders
│   ├── HealthTip.js           # Mongoose schema for health tips
│   ├── Log.js                 # Mongoose schema for activity logs
│   └── Submission.js          # Mongoose schema for patient audio/text submissions
│
├── routes/
│   ├── auth.routes.js         # Routes for authentication (register, login)
│   ├── hospital.routes.js     # Routes for hospital and hospital admin management
│   ├── user.routes.js         # General user routes
│   ├── staff.routes.js        # Routes for staff management
│   ├── patient.routes.js      # Routes for patient management
│   ├── appointment.routes.js  # Routes for appointment management
│   ├── reminder.routes.js     # Routes for reminder management
│   ├── visit.routes.js        # Routes for visit management
│   ├── healthTip.routes.js    # Routes for health tip management
│   ├── submission.routes.js   # Routes for patient submissions
│   └── logs.routes.js         # Routes for activity logs
│
├── middlewares/
│   ├── auth.middleware.js     # Middleware for JWT authentication
│   ├── role.middleware.js     # Middleware for role-based access control (RBAC)
│   ├── error.middleware.js    # Centralized error handling middleware
│   └── validate.middleware.js # Placeholder for input validation middleware
│
├── services/
│   ├── notification.service.js # Service for sending SMS/Email reminders (placeholder)
│   ├── tip.service.js         # Service for managing and scheduling health tips (placeholder)
│   └── log.service.js         # Service for logging user activities
│
├── utils/
│   ├── token.js               # Utility for JWT token generation and verification
│   ├── validators.js          # Utility for basic input validation
│   ├── constants.js           # Defines application-wide constants (e.g., user roles)
│   └── schedule.js            # Utility for scheduling automated tasks (e.g., reminders)
│
├── .env                       # Environment variables
├── .gitignore                 # Files/directories to ignore in Git
├── app.js                     # Main Express application setup
├── server.js                  # Entry point to start the server and connect to DB
├── package.json               # Project dependencies and scripts
└── README.md                  # Project documentation


TEST DATA FOR SIMULATIONS  AND POST MAN OR THUNDER CLINET 
Register a Super Admin:
POST /api/v1/auth/register
{
    "name": "Juma",
    "email": "juma@gmail.com",
    "password": "juma123456789",
    "role": "superadmin"
}
Onboard a Hospital (as Super Admin):
_id of the created hospital.Note The ID 
POST /api/v1/hospitals
{
    "name": "Central Maternity Clinic",
    "address": "123 Main St, Nairobi",
    "phone": "0712345678",
    "email": "central@gmail.com",
    "description": "A leading maternity clinic for patients ."
}
Add a Hospital Admin (as Super Admin):
POST /api/v1/hospitals/HOSPITAL_ID_FROM_STEP_4/admin
{
    "name": "kasera",
    "email": "omar@gmail.com",
    "password": "kasera123456789"
}

Login as Hospital Admin:
POST /api/v1/auth/login
{
    "email": "omar@gmail.com.com",
    "password": "kasera123456789"
}

Add Staff (as Hospital Admin):
POST /api/v1/hospitals/HOSPITAL_ID_FROM_STEP_4/staff
{
    "name": "Dr. calvo",
    "email": "calvo@gmail.com",
    "password": "calvo123456789",
    "specialty": "Obstetrician"
}
Login as Staff:
POST /api/v1/auth/login
{
    "email": "calvo@gmail.com",
    "password": "calvo123456789"
}
Register Patient (as Staff):
POST /api/v1/patients
{
    "name": "Mary Patient",
    "email": "mary@gmail.com",
    "password": "mary123456789",
    "dateOfBirth": "1990-05-15",
    "edd": "2025-12-25",
    "emergencyContactName": "John Doe",
    "emergencyContactPhone": "0722112233",
    "bloodGroup": "O+"
}
Create Appointment (as Staff):
POST /api/v1/appointments
{
    "patientId": "PATIENT_ID_FROM_STEP_9",
    "date": "2025-08-01T10:00:00Z",
    "type": "Antenatal Checkup",
    "notes": "First antenatal visit."
}