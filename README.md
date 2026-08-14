# BE Routine Management System

The BE Routine Management System is a web-based application designed to streamline the creation, management, and oversight of academic routines for bachelor-level engineering programs. It provides a centralized platform where department heads, deputy heads, and faculty members can collaborate on scheduling while respecting predefined teaching hour limits and approval workflows.

The system supports three distinct roles with graduated permissions. A Head of Department holds full administrative privileges, including the ability to create and manage teacher accounts, define subjects and programs, build and approve routine schedules, and respond to faculty requests for increased teaching hours. A Deputy Head of Department may perform all of the same operations except for approvals, which are reserved for the Head of Department alone. Teachers may log in to view their assigned routines and submit requests for approval when their allocated weekly teaching load of fifteen hours requires an increase. Any increase beyond this limit must be approved by the Head of Department.

The application is organized around several functional modules. The Teacher Database stores faculty information including name, contact details, designation, department affiliation, subject assignments, and role. The Subject Database contains every course offered across the eight engineering programs, complete with lecture, tutorial, and practical hour breakdowns, credit values, and examination scheme details. Subjects are tagged with the programs that offer them, allowing a single subject entity to serve multiple programs where the curriculum overlaps. The Program Database defines the mapping between each program code and its parent department, along with the program duration. The Department Database stores department codes and full names. The Routine module enables authorized users to schedule classes by day, time slot, program, subject, teacher, section, and semester, with the approval status tracked per entry. The Approvals module allows teachers to request additional hours and allows the Head of Department to review, approve, or reject those requests with remarks.

The system includes full curriculum data for all eight engineering programs offered across six departments. The programs are Bachelor in Civil Engineering, Bachelor in Architecture, Bachelor in Electrical Engineering, Bachelor in Electronics Communication and Information Engineering, Bachelor in Computer Engineering, Bachelor in Mechanical Engineering, Bachelor in Aerospace Engineering, and Bachelor in Chemical Engineering. These programs belong to the Department of Architecture, the Department of Civil Engineering, the Department of Electrical Engineering, the Department of Mechanical and Aerospace Engineering, the Department of Electronics and Computer Engineering, and the Department of Applied Science and Chemical Engineering respectively. The seed data includes complete subject listings for every semester of each program, reflecting the official curriculum structure.

The frontend is built with React and styled with the Gruvbox color scheme, which offers both a dark theme and a light theme toggleable from the topbar. The backend is built with Node.js and Express, using MongoDB for data persistence. The entire application runs inside Docker containers orchestrated by Docker Compose, with separate services for the database, the API server, and the frontend web server.

## Prerequisites

The system requires Docker and Docker Compose to be installed on the host machine. No additional dependencies need to be installed manually, as all language runtimes and libraries are containerized.

## Getting Started

Begin by cloning the repository to your local machine. From the project root directory, execute the start script to build the Docker images, launch the containers, and seed the database with initial data.

```
./start.sh
```

Alternatively, the same process can be performed manually by running the following commands in sequence.

```
docker-compose up -d --build
docker-compose run --rm seed
```

Once the containers are running, the frontend is accessible at http://localhost and the backend API is accessible at http://localhost:5000.

## Default Credentials

The seeding process creates three test accounts for each of the six departments, for a total of eighteen teachers. Each account follows the same naming convention and uses the department code as part of the email address. The password for every account is the role name followed by the digits one two three.

For the Department of Electronics and Computer Engineering, the accounts are hod@doece.edu.np with password hod123, dhod@doece.edu.np with password dhod123, and teacher@doece.edu.np with password teacher123. The same pattern applies to all other departments by substituting the appropriate department code in the email address.

## Technology Stack

The backend runtime is Node.js version eighteen running the Express framework. Data persistence is handled by MongoDB version six with Mongoose as the object data modeling layer. Authentication is implemented using JSON Web Tokens with passwords hashed by bcrypt. The frontend is built with React version eighteen using Vite as the build tool and React Router for client-side navigation. HTTP requests from the frontend are managed by the Axios library. The frontend web server is Nginx, which also proxies API requests to the backend service. Containerization uses Docker with Docker Compose orchestrating three services: a MongoDB container, a backend container, and a frontend container.

## Project Structure

The backend source code resides in the .backend directory. The server entry point is server.js. Application configuration is loaded from a dotenv file. The src directory contains subdirectories for configuration, database models, API routes, middleware, and seed data. The models define Mongoose schemas for teachers, subjects, programs, departments, routines, and approvals. The routes expose RESTful endpoints for authentication, teacher management, subject management, program management, department management, routine scheduling, and approval processing. The middleware handles JWT verification and role-based access control.

The frontend source code resides in the .frontend directory. The React application is structured into pages, components, context providers, and API utilities. Each page handles a specific section of the application including login, dashboard, teacher management, subject browsing, program listing, department listing, routine scheduling, and approval workflows. Reusable components include the sidebar navigation, the page layout with topbar, and a protected route wrapper that enforces authentication and role requirements. Global styles implement the Gruvbox theme with both dark and light variants.
