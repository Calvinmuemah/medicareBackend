// app.js
const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const errorHandler = require('./middlewares/error.middleware');

// Load environment variables
dotenv.config({ path: './.env' });

// Route files
const auth = require('./routes/auth.routes');
const hospitals = require('./routes/hospital.routes');
const users = require('./routes/user.routes');
const staff = require('./routes/staff.routes');
const patients = require('./routes/patient.routes');
const appointments = require('./routes/appointment.routes');
const reminders = require('./routes/reminder.routes');
const visits = require('./routes/visit.routes');
const healthTips = require('./routes/healthTip.routes');
const submissions = require('./routes/submission.routes');
const logs = require('./routes/logs.routes');

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Mount routes
app.use('/api/v1/auth', auth);
app.use('/api/v1/hospitals', hospitals);
app.use('/api/v1/users', users);
app.use('/api/v1/staff', staff);
app.use('/api/v1/patients', patients);
app.use('/api/v1/appointments', appointments);
app.use('/api/v1/reminders', reminders);
app.use('/api/v1/visits', visits);
app.use('/api/v1/healthtips', healthTips);
app.use('/api/v1/submissions', submissions);
app.use('/api/v1/logs', logs);

// Error Handler
app.use(errorHandler);

module.exports = app;
