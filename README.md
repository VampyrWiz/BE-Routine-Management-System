# IOE Pulchowk Campus Routine Management System

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19.1.0-61DAFB?style=flat&logo=react&logoColor=white)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Express.js](https://img.shields.io/badge/Express.js-5.1.0-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com/)
[![License](https://img.shields.io/badge/License-IOE%20Internal-blue?style=flat)](LICENSE)

The IOE Pulchowk Campus Routine Management System is described, in this document, as a comprehensive academic schedule management application built for the Institute of Engineering, Pulchowk Campus. Intelligent scheduling, automated conflict detection, and real-time synchronization across all connected clients are provided by the system.

This project was originally developed by **Manish** and handed over to the **080 BATCH of BCT** at **IOE Pulchowk Campus**. The repository is now maintained at:
[https://github.com/VampyrWiz/BE-Routine-Management-System](https://github.com/VampyrWiz/BE-Routine-Management-System)

If you want to access the old original project, visit: [https://github.com/manishh101/BE-routine](https://github.com/manishh101/BE-routine)

## Table of Contents

The following sections are included in this document:

- [IOE Pulchowk Campus Routine Management System](#ioe-pulchowk-campus-routine-management-system)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [System Roles and Access Control](#system-roles-and-access-control)
  - [Features](#features)
    - [Academic Management](#academic-management)
    - [Intelligent Scheduling](#intelligent-scheduling)
    - [Resource Management](#resource-management)
    - [Analytics and Reporting](#analytics-and-reporting)
    - [Administrative Tools](#administrative-tools)
    - [User Experience](#user-experience)
  - [Technology Stack](#technology-stack)
  - [System Architecture](#system-architecture)
  - [Installation and Setup](#installation-and-setup)
  - [Project Structure](#project-structure)
  - [Backend API](#backend-api)
  - [Frontend Application](#frontend-application)
  - [Database Design](#database-design)
  - [Authentication and Authorization](#authentication-and-authorization)
  - [Development](#development)
  - [Testing](#testing)
  - [Deployment](#deployment)
  - [Documentation](#documentation)
  - [Contributing](#contributing)
  - [Support](#support)
  - [License](#license)

## Overview

A modern, full-stack web application, designed to streamline academic schedule management for engineering programs, is provided by this system. Intelligent conflict detection, real-time synchronization, and comprehensive workload analytics are made available for the creation and management of routines. Smart scheduling is supported through advanced conflict detection, by which the double-booking of teachers and rooms is prevented. A mobile-first, responsive interface is offered, and it is designed to function consistently across desktop, tablet, and mobile devices. Instant updates are propagated across all components through the use of React Query, and secure access is enforced through JWT-based authentication combined with role-based authorization. A reporting and analytics dashboard is provided for teaching-load review, and the system as a whole has been purpose-built to accommodate the multi-program, multi-semester structure maintained by IOE.

## System Roles and Access Control

Three roles are recognised by the system: HoD (Head of Department), DHoD (Deputy Head of Department), and Teacher. It is by these three roles, rather than by a single administrator account, that access to the system is now governed.

Full privileges are granted to the HoD role. Every management operation supported by the system, including the creation, modification, and deletion of routines, subjects, teachers, rooms, programs, and departments, is made available to a user holding this role. Approval authority is also reserved exclusively for the HoD, so that any action requiring formal sign-off, such as the approval of elective choices or the approval of a teaching load that exceeds the standard weekly limit, may be completed only by a user holding the HoD role.

Every privilege granted to the HoD is also granted to the DHoD, with the sole exception of approval rights. A routine may be created, edited, and managed by a DHoD in the same manner as by an HoD, and every administrative page and management endpoint is made accessible to the DHoD. Whenever an action is classified as an approval action, however, it is declined for the DHoD, and the request is redirected toward the HoD for sign-off.

Access is restricted, for the Teacher role, to the viewing of the teacher's own schedule once login has been completed. A standard teaching load of fifteen hours per week is allotted to each teacher by the system. Whenever a class assignment would raise a teacher's scheduled load beyond that fifteen-hour standard, or beyond an individually configured limit, the assignment is declined unless it is being made by a user holding the HoD role; a DHoD attempting the same assignment is informed that approval from the HoD is required. This workload safeguard is enforced centrally, in the backend, at the point where a class is assigned to a routine slot, so that it cannot be bypassed from the client.

## Features

### Academic Management

Support is provided for every IOE department, including Computer, Electronics, and Civil, among others. Programs such as BCE, BEI, and BAG are managed across an eight-semester structure, and a comprehensive subject catalogue, inclusive of credit-hour tracking, is maintained. Academic sessions are planned on a year-wise basis and are integrated with the system calendar.

### Intelligent Scheduling

An Excel-like interface is provided for the creation of routines, and real-time conflict detection is applied so that the double-booking of teachers or rooms is prevented. Multi-period classes spanning several time slots are supported, lab groups are scheduled with automatic alternating-week logic, and an advanced elective system is made available for the seventh and eighth semesters.

### Resource Management

Complete faculty profiles are maintained, together with workload tracking, and lecture halls, laboratories, and auditoriums are scheduled through a dedicated room-management module. Daily time periods are configured flexibly, and the availability of every resource is monitored in real time.

### Analytics and Reporting

Teaching-hour calculations are generated automatically as part of teacher workload analysis, and room-utilisation reports are produced so that space usage may be optimised. Comprehensive collision detection is applied across the schedule, and professional reports may be exported in Excel or PDF format.

### Administrative Tools

Role-based access control, governed by the HoD, DHoD, and Teacher roles described above, is applied throughout the system. A reusable template system is provided for routines, bulk data may be imported or exported through Excel, and system performance is tracked through built-in monitoring and health checks.

### User Experience

A responsive design, optimised for desktop, tablet, and mobile use, is provided throughout the interface. A progressive web application experience is supported within the browser, and the interface has been built with accessibility considerations in mind.

## Technology Stack

Node.js, at version 18 or above, is used as the runtime environment for the backend, and the web application framework is provided by Express.js 5.1.0. MongoDB Atlas is used as the cloud database, and Mongoose 8.16.0 is used for object modelling against that database. Authentication tokens are issued using JWT, API documentation is generated through Swagger, and the backend test suite is run using Jest.

React 19.1.0 is used as the frontend UI library, and the build tool and development server are provided by Vite 6.3.5. The component library used throughout the interface is Ant Design 5.26.1, data fetching and caching are handled by React Query 5.80.7, and client-side routing is provided by React Router 7.6.2. State management is handled by Zustand 5.0.5, and Tailwind CSS 4.1.10 is used as the utility-first styling framework.

Git is used for version control, Docker is used for containerisation, and Ubuntu 24.04 LTS is used as the reference development environment. Visual Studio Code is recommended as the development editor, and code quality is maintained through ESLint and Prettier.

## System Architecture

An MVC architecture pattern is followed by the backend. The application entry point is provided by `server.js`, database schemas are defined under `models/`, business logic is implemented within `controllers/`, and API endpoints are defined under `routes/`. Authentication and validation concerns are handled within `middleware/`, external integrations are implemented under `services/`, helper functions are placed under `utils/`, test suites are maintained under `tests/`, and database seeding utilities are kept under `scripts/`.

A component-based structure is followed by the frontend. Route-level components are placed under `src/pages/`, reusable interface components are placed under `src/components/`, application state is managed within `src/contexts/`, custom hooks are defined under `src/hooks/`, API client logic is placed under `src/services/`, and styling is maintained under `src/styles/` together with helper functions under `src/utils/`.

Seventeen database models are defined in total. Core entities are represented by User, Department, Teacher, Program, and Subject; scheduling entities are represented by RoutineSlot, TimeSlot, Room, and AcademicSession; advanced functionality is represented by LabGroup, ElectiveGroup, and AcademicCalendar; analytical views are represented by TeacherScheduleView and RoomSlotOccupancy; and template functionality is represented by RoutineTemplate and SectionElectiveChoice.

## Installation and Setup

Node.js 18 or above, together with npm, a MongoDB Atlas account or a local MongoDB instance, and Git, is required before installation is attempted.

The repository is cloned, and the working directory is changed, as follows.

```bash
git clone https://github.com/VampyrWiz/BE-Routine-Management-System.git
cd BE-Routine-Management-System
```

An environment file is then created from the provided template, and the values shown below are updated to match the target environment.

```bash
cp .env.example .env

MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
FRONTEND_URL=http://localhost:7105
PORT=7102
```

The backend is installed and started as follows.

```bash
cd backend
npm install
npm run seed   # optional, for initial data
npm run dev
```

The frontend is installed and started, from a separate terminal, as follows.

```bash
cd frontend
npm install
npm run dev
```

Once both servers have been started, the frontend is made available at `http://localhost:7105`, the backend API is made available at `http://localhost:7102`, interactive API documentation is made available at `http://localhost:7102/api-docs`, and a health-check endpoint is made available at `http://localhost:7102/api/health`. An HoD account should be seeded, or created directly in the database, before first use, since general registration is not exposed to unauthenticated users.

## Project Structure

The root of the repository contains this README file, the root `package.json`, the environment file, a Docker Compose configuration, the `backend/` directory containing the Node.js and Express API, the `frontend/` directory containing the React application, the `md/` directory containing supplementary documentation, and the `excelroutine/` directory containing Excel templates.

Within the backend, the application entry point is provided by `server.js`, and the Express application itself is configured within `app.js`. Database and authentication configuration is kept under `config/`, business logic is implemented across eighteen controller files under `controllers/`, authentication and validation middleware is kept under `middleware/`, and seventeen Mongoose schemas are defined under `models/`. Sixteen route files defining the API surface are kept under `routes/`, external service integrations are kept under `services/`, shared helper functions, including the teacher workload utility described above, are kept under `utils/`, and the Jest test suite is kept under `tests/`.

Within the frontend, the HTML template is provided by `index.html` and the Vite build configuration is provided by `vite.config.js`. The application entry point is provided by `src/main.jsx`, and the root component is provided by `src/App.jsx`. Route-level pages, including the dashboard, the login page, the public routine views, and the management pages reserved for the HoD and DHoD roles, are kept under `src/pages/`. Reusable components, including the layout wrapper, the routine grid, and the class-assignment modal, are kept under `src/components/`, and application state, custom hooks, API services, and styling are kept under `src/contexts/`, `src/hooks/`, `src/services/`, and `src/styles/` respectively.

## Backend API

Every endpoint described in this section is served beneath the base URL `http://localhost:7102/api`.

Authentication is handled through the following endpoints.

```http
POST   /auth/login              # Login for HoD, DHoD, and Teacher accounts
POST   /auth/logout             # User logout
GET    /auth/profile            # Retrieve the current user's profile
PUT    /auth/profile            # Update the current user's profile
```

Core academic entities are managed through a consistent set of endpoints, illustrated here for departments and repeated, in equivalent form, for teachers, programs, subjects, and rooms.

```http
GET    /departments             # List all departments
POST   /departments             # Create a department
GET    /departments/:id         # Retrieve a department
PUT    /departments/:id         # Update a department
DELETE /departments/:id         # Delete a department
```

Scheduling is handled through the following endpoints, among which the class-assignment endpoints are the point at which the fifteen-hour weekly workload check described above is enforced.

```http
GET    /routines/:programCode                                # Retrieve program routines
GET    /routines/section/:programCode/:semester/:section     # Retrieve a section routine
POST   /routines/:programCode/:semester/:section/assign      # Assign a class
DELETE /routines/:programCode/:semester/:section/clear       # Clear a class
POST   /routines/assign-class-spanned                        # Assign a multi-period class
GET    /routines/teachers/:teacherId/availability             # Check teacher availability
GET    /routines/rooms/:roomId/availability                   # Check room availability
```

Analytics are exposed through the following endpoints.

```http
GET    /analytics/teacher-workload        # Teacher workload reports
GET    /analytics/room-utilization        # Room usage statistics
GET    /analytics/schedule-conflicts      # Conflict analysis
```

System status is exposed through the following endpoints.

```http
GET    /health                           # Health check
GET    /api-docs                         # Swagger documentation
```

## Frontend Application

Pages that require no authentication include the dashboard, the public program-routine view, the public teacher-routine view, and the public subject catalogue. Pages that require HoD or DHoD authentication include the routine manager, teacher management, room management, program management, subject management, time-slot management, department management, academic-calendar management, lab-group management, elective management, conflict detection, user management, and the analytics dashboard. A teacher account, once authenticated, is directed toward a personal routine view rather than toward these management pages.

The routine grid component provides an Excel-like interface for schedule creation, together with real-time validation, support for multi-period classes, and colour-coded visual indicators for class type and conflict status. The class-assignment modal filters the list of available teachers and rooms in real time, supports cross-section elective scheduling, and surfaces conflict warnings, including the weekly-workload warning described above, as soon as they arise. The overall layout has been built with a mobile-first approach, incorporating a collapsible sidebar and touch-friendly interaction throughout.

## Database Design

The User model stores name, email, password, role, department, status, and last-login information, with the role field now restricted to `hod`, `dhod`, and `teacher`. The Department model stores name, code, description, head-of-department name, contact information, and location. The Program model stores program name, code, department, total semesters, and description, and the Subject model stores subject name, code, credit hours, type, semester, program, and prerequisites. The Teacher model stores name, email, phone, department, designation, expertise, and availability, together with a configurable maximum weekly teaching-hour limit that defaults to fifteen hours.

The Room model stores room number, building, floor, capacity, type, features, and availability, and the TimeSlot model stores slot index, start time, end time, duration, type, and active status. The RoutineSlot model stores day index, slot index, semester, section, class type, program, subject, teachers, room, and academic year, together with additional fields used for elective scheduling. The AcademicSession model stores year, active status, start date, end date, and description.

The LabGroup model stores group name, program, semester, section, subject, students, week type, and schedule pattern, and the ElectiveGroup model stores group name, program, semesters, subjects, maximum student count, enrolment deadline, and active status. The SectionElectiveChoice model stores section, program, semester, elective group, student composition, and approval status, with approval of this status now reserved for the HoD role. The TeacherScheduleView model stores teacher, academic year, weekly schedule, and total hours, the RoutineTemplate model stores template name, type, program, semester, routine data, and creator, and the AcademicCalendar model stores academic year, events, important dates, and exam schedule.

Compound indexes are applied to optimise routine queries, full-text search indexes are applied to names and descriptions, and sparse indexes are applied where fields are optional.

## Authentication and Authorization

A JWT-based authentication scheme is used throughout the system. Once a user has logged in, a signed token is issued, and that token carries the user's identifier, email, role, and department, together with issued-at and expiry timestamps. The role carried within the token is now one of `hod`, `dhod`, or `teacher`, and every protected route is evaluated against that role.

Full read and write access to every resource in the system, together with approval rights, is granted to the HoD role. The same read and write access is granted to the DHoD role, with approval actions withheld. Access to the teacher's own schedule is granted to the Teacher role, and a teacher is prevented from viewing or modifying the schedules of other teachers or sections.

Passwords are hashed using bcrypt with salt rounds applied, JWTs are issued with a thirty-day lifecycle, cross-origin requests are restricted through CORS configuration, API requests are throttled through rate limiting, and every incoming request is sanitised through input validation. Protection against injection-style attacks is additionally provided through the use of the Mongoose ODM.

## Development

The backend is developed using the following commands: `npm run dev` for a hot-reloading development server, `npm start` for production mode, `npm test` and `npm run test:watch` for the Jest test suite, `npm run test:api` for API-level testing, and `npm run seed` for database seeding.

The frontend is developed using the following commands: `npm run dev` for a development server with hot module replacement, `npm run build` for a production build, `npm run preview` for previewing that build, and `npm run lint` for linting.

Code quality is maintained through an ESLint configuration extending `react-app` and `react-app/jest`, and through a Prettier configuration specifying single quotes, ES5 trailing commas, two-space indentation, semicolons, and a print width of one hundred characters. A conventional branching strategy is followed during feature development, in which a feature branch is created, changes are committed using conventional commit messages, and the branch is pushed for review before a pull request is opened.

## Testing

The backend test suite is run using Jest, through the commands `npm test`, `npm run test:watch`, and `npm run test:coverage`. Unit tests are applied to model validation, controller logic, utility functions, and authentication behaviour, including the weekly-workload evaluation described above. Integration tests are applied to complete API request and response cycles, to database operations, and to the authentication flow. End-to-end tests are applied to complete user workflows, to schedule creation and management by HoD and DHoD accounts, and to cross-component data consistency. Tests are written ahead of implementation wherever practicable, external dependencies are mocked so that units may be tested in isolation, and a coverage target above ninety percent is maintained.

## Deployment

A production deployment is expected to run on an Ubuntu 24.04 LTS server with Node.js 18 or above, a MongoDB Atlas instance or self-hosted MongoDB, an Nginx reverse proxy, the PM2 process manager, and an SSL certificate, for which Let's Encrypt is recommended.

The server is prepared as follows.

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2
sudo apt install nginx -y
sudo apt install certbot python3-certbot-nginx -y
```

The application is then deployed as follows.

```bash
git clone https://github.com/VampyrWiz/BE-Routine-Management-System.git
cd BE-Routine-Management-System

cd backend
npm install --production
cp .env.example .env
# production environment variables are configured at this point

cd ../frontend
npm install
npm run build
sudo cp -r dist/* /var/www/html/
```

The backend is started and persisted under PM2 as follows.

```bash
cd backend
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

An Nginx site configuration equivalent to the following is used to route traffic between the built frontend and the backend API.

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:7102;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

An SSL certificate is then obtained and scheduled for renewal as follows.

```bash
sudo certbot --nginx -d your-domain.com
sudo crontab -e
# 0 12 * * * /usr/bin/certbot renew --quiet
```

Application status is monitored through PM2 using `pm2 status`, `pm2 logs`, `pm2 monit`, and `pm2 restart all`, and the health of the deployed application may be confirmed at any time through the `GET /api/health` endpoint.

## Documentation

Interactive API documentation is made available through Swagger UI at `http://localhost:7102/api-docs`. Supplementary system documentation is maintained under `/backend/BACKEND_SYSTEM_DOCUMENTATION.md`, `/backend/API_QUICK_REFERENCE.md`, `/md/datamodelnew.md`, `/md/ELECTIVE_MANAGEMENT_SYSTEM_COMPLETE.md`, and `/md/architecture.md`.

## Contributing

The repository is forked and cloned before any change is made, after which a dedicated branch is created for the change under consideration, following a `feature/`, `bugfix/`, or `docs/` naming convention as appropriate. Code is written in accordance with the ESLint and Prettier configurations described above, commit messages are written using the conventional commit format, and test coverage is maintained throughout the change. A pull request is opened once the change is complete, and it is expected that peer review will be completed, that every test will pass, that relevant documentation will be updated, and that no regression in performance will be introduced, before the change is merged. Respectful and professional communication is expected of every contributor throughout this process.

## Support

System documentation is maintained under the `/md` directory, and interactive API documentation is made available through Swagger. Issues and feature requests are tracked through the GitHub issue tracker maintained for this repository, and further assistance may be requested from the IOE technical team responsible for the system.

## License

This project has been developed for the internal use of IOE Pulchowk Campus. All rights are reserved.

---

**IOE Pulchowk Campus Routine Management System**
