# Hospital Management System API

This document provides a comprehensive overview of the Hospital Management System API, detailing its various endpoints, their functionalities, and the required access levels.

## Table of Contents

* [Introduction](#introduction)
* [Base URL](#base-url)
* [Authentication](#authentication)
* [Hospitals & Hospital Administration](#hospitals--hospital-administration)
* [User Management](#user-management)
* [Staff Management](#staff-management)
* [Patient Management](#patient-management)
* [Appointment Management](#appointment-management)
* [Reminder Management](#reminder-management)
* [Visit Management](#visit-management)
* [Health Tip Management](#health-tip-management)
* [Patient Submissions](#patient-submissions)
* [Logs & Auditing](#logs--auditing)

---

## Introduction

The Hospital Management System API provides a robust and secure set of endpoints for managing various aspects of a hospital's operations, including patient records, staff management, appointments, health tips, and administrative functions. It is designed to facilitate seamless data flow and communication within the hospital ecosystem.

---

## Base URL

All API endpoints are prefixed with `/api/v1`.

For example, to access the login endpoint, the full URL would be `[YOUR_API_BASE_URL]/api/v1/auth/login`.

---

## Authentication

Authentication is handled via tokens. Most endpoints require a valid token to be included in the request headers (e.g., `Authorization: Bearer [token]`).

| Method | Endpoint                    | Description                               | Access        |
| :----- | :-------------------------- | :---------------------------------------- | :------------ |
| `POST` | `/api/v1/auth/register`     | Register a new user.                      | Public        |
| `POST` | `/api/v1/auth/login`        | Log in a user and receive an authentication token. | Public        |
| `GET`  | `/api/v1/auth/me`           | Retrieve details of the currently authenticated user. | Authenticated |
| `GET`  | `/api/v1/auth/logout`       | Invalidate the current user's session/token. | Authenticated |

---

## Hospitals & Hospital Administration

Endpoints for managing hospitals and hospital administrators.

| Method | Endpoint                        | Description                                     | Access               |
| :----- | :------------------------------ | :---------------------------------------------- | :------------------- |
| `POST` | `/api/v1/hospitals`             | Onboard a new hospital into the system.         | `SUPER_ADMIN`        |
| `POST` | `/api/v1/hospitals/:hospitalId/admin` | Add a new hospital administrator to a specific hospital. | `SUPER_ADMIN`        |
| `DELETE` | `/api/v1/hospitals/:id`         | Delete a hospital from the system.              | `SUPER_ADMIN`        |
| `GET`  | `/api/v1/hospitals`             | Retrieve a list of all hospitals.               | `SUPER_ADMIN`, `HOSPITAL_ADMIN` |
| `GET`  | `/api/v1/hospitals/:id`         | Retrieve details of a specific hospital by ID.  | `SUPER_ADMIN`, `HOSPITAL_ADMIN` |
| `PUT`  | `/api/v1/hospitals/:id`         | Update details of a specific hospital by ID.    | `SUPER_ADMIN`, `HOSPITAL_ADMIN` |

---

## User Management

General endpoints for managing user accounts across different roles.

| Method | Endpoint                | Description                                     | Access                                  |
| :----- | :---------------------- | :---------------------------------------------- | :-------------------------------------- |
| `GET`  | `/api/v1/users`         | Retrieve a list of all users in the system.     | `SUPER_ADMIN`                           |
| `GET`  | `/api/v1/users/:id`     | Retrieve details of a specific user by ID.      | `SUPER_ADMIN`, `HOSPITAL_ADMIN`, `STAFF`, `PATIENT` |
| `PUT`  | `/api/v1/users/:id`     | Update details of a specific user by ID.        | `SUPER_ADMIN`, `HOSPITAL_ADMIN`, `STAFF` |
| `DELETE` | `/api/v1/users/:id`     | Delete a user from the system by ID.            | `SUPER_ADMIN`, `HOSPITAL_ADMIN`         |

---

## Staff Management

Endpoints for managing hospital staff.

| Method | Endpoint                          | Description                                     | Access                  |
| :----- | :-------------------------------- | :---------------------------------------------- | :---------------------- |
| `POST` | `/api/v1/hospitals/:hospitalId/staff` | Add a new staff member to a specific hospital.  | `HOSPITAL_ADMIN`        |
| `GET`  | `/api/v1/hospitals/:hospitalId/staff` | Retrieve all staff members belonging to a specific hospital. | `SUPER_ADMIN`, `HOSPITAL_ADMIN`, `STAFF` |
| `GET`  | `/api/v1/staff/:id`               | Retrieve details of a specific staff member by ID. | `SUPER_ADMIN`, `HOSPITAL_ADMIN`, `STAFF` |
| `PUT`  | `/api/v1/staff/:id`               | Update details of a specific staff member by ID. | `HOSPITAL_ADMIN`, `STAFF` |
| `DELETE` | `/api/v1/staff/:id`               | Delete a staff member from the system by ID.    | `HOSPITAL_ADMIN`        |

---

## Patient Management

Endpoints for managing patient records.

| Method | Endpoint                                | Description                                     | Access                                  |
| :----- | :-------------------------------------- | :---------------------------------------------- | :-------------------------------------- |
| `POST` | `/api/v1/patients`                      | Register a new patient in the system.           | `STAFF`                                 |
| `GET`  | `/api/v1/patients/hospitals/:hospitalId/patients` | Retrieve all patients associated with a specific hospital. | `SUPER_ADMIN`, `HOSPITAL_ADMIN`, `STAFF` |
| `GET`  | `/api/v1/patients/:id`                  | Retrieve details of a specific patient by ID.   | `SUPER_ADMIN`, `HOSPITAL_ADMIN`, `STAFF`, `PATIENT` |
| `PUT`  | `/api/v1/patients/:id`                  | Update details of a specific patient by ID.     | `HOSPITAL_ADMIN`, `STAFF`               |
| `DELETE` | `/api/v1/patients/:id`                  | Delete a specific patient from the system by ID. | `HOSPITAL_ADMIN`                        |

---

## Appointment Management

Endpoints for scheduling and managing patient appointments.

| Method | Endpoint                      | Description                                     | Access                                  |
| :----- | :---------------------------- | :---------------------------------------------- | :-------------------------------------- |
| `POST` | `/api/v1/appointments`        | Create a new appointment.                       | `STAFF`                                 |
| `GET`  | `/api/v1/appointments`        | Retrieve a list of all appointments.            | `SUPER_ADMIN`, `HOSPITAL_ADMIN`, `STAFF`, `PATIENT` |
| `GET`  | `/api/v1/appointments/:id`    | Retrieve details of a specific appointment by ID. | `SUPER_ADMIN`, `HOSPITAL_ADMIN`, `STAFF`, `PATIENT` |
| `PUT`  | `/api/v1/appointments/:id`    | Update details of a specific appointment by ID. | `HOSPITAL_ADMIN`, `STAFF`               |
| `DELETE` | `/api/v1/appointments/:id`    | Delete a specific appointment by ID.            | `HOSPITAL_ADMIN`, `STAFF`               |

---

## Reminder Management

Endpoints for creating and managing reminders for patients or staff.

| Method | Endpoint                    | Description                                 | Access                                  |
| :----- | :-------------------------- | :------------------------------------------ | :-------------------------------------- |
| `POST` | `/api/v1/reminders`         | Create a new reminder.                      | `STAFF`                                 |
| `GET`  | `/api/v1/reminders`         | Retrieve a list of all reminders.           | `SUPER_ADMIN`, `HOSPITAL_ADMIN`, `STAFF`, `PATIENT` |
| `GET`  | `/api/v1/reminders/:id`     | Retrieve details of a specific reminder by ID. | `SUPER_ADMIN`, `HOSPITAL_ADMIN`, `STAFF`, `PATIENT` |
| `PUT`  | `/api/v1/reminders/:id`     | Update details of a specific reminder by ID. | `HOSPITAL_ADMIN`, `STAFF`               |
| `DELETE` | `/api/v1/reminders/:id`     | Delete a specific reminder by ID.           | `HOSPITAL_ADMIN`, `STAFF`               |

---

## Visit Management

Endpoints for tracking patient visits.

| Method | Endpoint                        | Description                                     | Access                                  |
| :----- | :------------------------------ | :---------------------------------------------- | :-------------------------------------- |
| `POST` | `/api/v1/visits/patients/:patientId/visits` | Create a new visit record for a specific patient. | `STAFF`                                 |
| `GET`  | `/api/v1/visits/patients/:patientId/visits` | Retrieve all visit records for a specific patient. | `SUPER_ADMIN`, `HOSPITAL_ADMIN`, `STAFF`, `PATIENT` |
| `GET`  | `/api/v1/visits/:id`            | Retrieve details of a specific visit record by ID. | `SUPER_ADMIN`, `HOSPITAL_ADMIN`, `STAFF`, `PATIENT` |
| `PUT`  | `/api/v1/visits/:id`            | Update details of a specific visit record by ID. | `HOSPITAL_ADMIN`, `STAFF`               |
| `DELETE` | `/api/v1/visits/:id`            | Delete a specific visit record by ID.           | `HOSPITAL_ADMIN`, `STAFF`               |

---

## Health Tip Management

Endpoints for managing health-related tips and advice.

| Method | Endpoint                      | Description                                     | Access                                  |
| :----- | :---------------------------- | :---------------------------------------------- | :-------------------------------------- |
| `POST` | `/api/v1/healthtips`          | Create a new health tip.                        | `SUPER_ADMIN`, `HOSPITAL_ADMIN`, `STAFF` |
| `GET`  | `/api/v1/healthtips`          | Retrieve a list of all health tips.             | Authenticated                           |
| `GET`  | `/api/v1/healthtips/:id`      | Retrieve details of a specific health tip by ID. | Authenticated                           |
| `PUT`  | `/api/v1/healthtips/:id`      | Update details of a specific health tip by ID.  | `SUPER_ADMIN`, `HOSPITAL_ADMIN`, `STAFF` |
| `DELETE` | `/api/v1/healthtips/:id`      | Delete a specific health tip by ID.             | `SUPER_ADMIN`, `HOSPITAL_ADMIN`, `STAFF` |

---

## Patient Submissions

Endpoints for patients to submit information and for staff/admins to manage these submissions.

| Method | Endpoint                                | Description                                     | Access                                  |
| :----- | :-------------------------------------- | :---------------------------------------------- | :-------------------------------------- |
| `POST` | `/api/v1/submissions/me/submit`         | Allow an authenticated patient to create a new submission. | `PATIENT`                               |
| `GET`  | `/api/v1/submissions/me/submissions`    | Retrieve all submissions made by the authenticated patient. | `PATIENT`                               |
| `GET`  | `/api/v1/submissions/hospitals/:hospitalId/submissions` | Retrieve all submissions for a specific hospital. | `SUPER_ADMIN`, `HOSPITAL_ADMIN`, `STAFF` |
| `GET`  | `/api/v1/submissions/:id`               | Retrieve details of a specific submission by ID. | `SUPER_ADMIN`, `HOSPITAL_ADMIN`, `STAFF`, `PATIENT` |
| `PUT`  | `/api/v1/submissions/:id`               | Update notes or status for a specific submission by ID. | `HOSPITAL_ADMIN`, `STAFF`               |
| `DELETE` | `/api/v1/submissions/:id`               | Delete a specific submission by ID.             | `HOSPITAL_ADMIN`, `STAFF`               |

---

## Logs & Auditing

Endpoints for accessing system and user activity logs.

| Method | Endpoint                  | Description                                 | Access               |
| :----- | :------------------------ | :------------------------------------------ | :------------------- |
| `GET`  | `/api/v1/logs`            | Retrieve global system logs.                | `SUPER_ADMIN`        |
| `GET`  | `/api/v1/logs/users/:userId` | Retrieve activity logs for a specific user by ID. | `SUPER_ADMIN`, `HOSPITAL_ADMIN` |