
# --- Maternal Health Appointment and Alert System (MHAAS) ---

## Project Overview

The Maternal Health Appointment and Alert System (MHAAS) is a web-based application designed to support rural clinics in Kenya by improving the management of maternal health appointments, sending automated reminders, and providing essential health tips to expectant mothers. This system aims to address challenges such as missed antenatal visits, late deliveries, and reliance on outdated paper records.

## Features

The system supports multiple user roles, each with specific responsibilities:

* **🛡️ Super Admin:**
    * Onboard new hospitals into the system.
    * Add a dedicated Hospital Admin for each onboarded hospital.
    * View activity logs across the entire system.
    * View all users registered in the system (Super Admins, Hospital Admins, Staff, Patients).

* **🏥 Hospital Admin:**
    * Manage and onboard staff members (doctors, nurses) for their specific hospital.
    * View and manage patient records associated with their hospital.
    * Oversee and manage all appointments and reminders within their hospital.

* **👨‍⚕️ Staff (Doctors/Nurses):**
    * Register new patients into the system.
    * Create and manage visits for individual patients.
    * Set and update appointment schedules for patients.
    * Send timely reminders to patients regarding appointments or health tips.

* **🤰 Patient:**
    * View their personal appointment schedules and visit history.
    * Submit health records (e.g., audio notes, text updates) to their assigned staff.
    * Receive automated reminders for appointments and health-related alerts.
    * Access and read basic maternal health tips relevant to their pregnancy stage.

## Technologies Used

* **Backend:** Node.js, Express.js
* **Database:** MongoDB (with Mongoose ODM)
* **Authentication:** JSON Web Tokens (JWT)
* **Password Hashing:** bcryptjs
* **Environment Variables:** dotenv
* **Task Scheduling:** node-cron (for automated reminders/tips)
* **File Uploads (Optional/Placeholder):** Cloudinary (integration points provided, but not fully implemented)
* **SMS/Email Notifications (Optional/Placeholder):** Twilio or Africa's Talking (integration points provided)

## Setup Instructions

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd MHAAS
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Create a `.env` file:**
    Create a file named `.env` in the root directory of the project and add the following environment variables. **Remember to replace placeholder values with your actual secrets.**


4.  **Start the server:**
    ```bash
    npm start
    # Or for development with hot-reloading:
    npm run dev
    ```

## API Endpoints (Examples)

Here are some example API endpoints that the system will expose:

### Authentication
* `POST /api/v1/auth/register` - Register a new user (Super Admin, Hospital Admin, Staff, Patient)
* `POST /api/v1/auth/login` - Log in a user

### Super Admin Actions
* `POST /api/v1/hospitals` - Onboard a new hospital
* `POST /api/v1/hospitals/:hospitalId/admin` - Add a hospital admin to a specific hospital
* `GET /api/v1/users` - View all users in the system (Super Admin only)
* `GET /api/v1/logs` - View system activity logs (Super Admin only)

### Hospital Admin Actions
* `POST /api/v1/hospitals/:hospitalId/staff` - Add a staff member to a specific hospital
* `GET /api/v1/hospitals/:hospitalId/patients` - View patients for their hospital
* `GET /api/v1/hospitals/:hospitalId/appointments` - View appointments for their hospital

### Staff Actions
* `POST /api/v1/patients` - Register a new patient
* `POST /api/v1/patients/:patientId/visits` - Create a new visit for a patient
* `POST /api/v1/appointments` - Create a new appointment
* `POST /api/v1/reminders` - Send a reminder to a patient

### Patient Actions
* `GET /api/v1/me/appointments` - Patient views their appointments
* `GET /api/v1/me/visits` - Patient views their visit schedule
* `POST /api/v1/me/submit` - Patient submits an audio/text record
* `GET /api/v1/me/healthtips` - Patient views health tips

## Folder Structure

Refer to the `MHAAS Project Structure Overview` document for a detailed breakdown of the folder structure.

## Contributing

Feel free to fork the repository, make improvements, and submit pull requests.

## License

This project is licensed under the ISC License.
