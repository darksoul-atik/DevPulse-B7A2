# DevPulse API

DevPulse is a secure and modular REST API for tracking internal technical issues and feature requests.

It is built with **Node.js**, **TypeScript**, **Express.js**, and **PostgreSQL**. The API supports JWT authentication, role-based authorization, issue filtering, and raw SQL queries without using an ORM.

## Live API

**Base URL:**
https://devpulse-b7a2-v0di.onrender.com/

> The free Render server may take some time to respond after being inactive.

## GitHub Repository

https://github.com/darksoul-atik/DevPulse-B7A2

## Features

* User signup and login
* Password hashing with bcrypt
* JWT authentication
* Contributor and maintainer roles
* Create, read, update, and delete issues
* Filter issues by type and status
* Sort issues by creation date
* Contributor ownership restrictions
* Maintainer issue management
* Raw PostgreSQL queries
* Modular Express architecture
* Centralized error handling
* Request logging
* Production build with tsup
* Deployment on Render

## Tech Stack

* Node.js 24+
* TypeScript
* Express.js
* PostgreSQL
* `pg`
* bcrypt
* JSON Web Token
* tsup
* Render

## API Endpoints

### Authentication Routes

| Method | Endpoint           | Access | Description             |
| ------ | ------------------ | ------ | ----------------------- |
| POST   | `/api/auth/signup` | Public | Register a new user     |
| POST   | `/api/auth/login`  | Public | Login and receive a JWT |

### Issue Routes

| Method | Endpoint          | Access        | Description        |
| ------ | ----------------- | ------------- | ------------------ |
| POST   | `/api/issues`     | Authenticated | Create a new issue |
| GET    | `/api/issues`     | Public        | Get all issues     |
| GET    | `/api/issues/:id` | Public        | Get a single issue |
| PATCH  | `/api/issues/:id` | Authenticated | Update an issue    |
| DELETE | `/api/issues/:id` | Maintainer    | Delete an issue    |

## Query Parameters

The `GET /api/issues` endpoint supports filtering and sorting.

```http
GET /api/issues?type=bug
GET /api/issues?status=open
GET /api/issues?sort=asc
GET /api/issues?type=feature_request&status=in_progress&sort=desc
```

Supported values:

```text
type: bug | feature_request
status: open | in_progress | resolved
sort: asc | desc
```

## Roles and Permissions

### Contributor

A contributor can:

* Create issues
* View all issues
* Update only their own issues
* Update an issue only when its status is `open`

### Maintainer

A maintainer can:

* Create issues
* View all issues
* Update any issue
* Change issue status
* Delete issues

## Authentication

Protected routes require a JWT in the request header.

```http
Authorization: Bearer YOUR_ACCESS_TOKEN
```

## Example Requests

### Signup

```http
POST /api/auth/signup
Content-Type: application/json
```

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "contributor"
}
```

### Login

```http
POST /api/auth/login
Content-Type: application/json
```

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Create an Issue

```http
POST /api/issues
Content-Type: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN
```

```json
{
  "title": "Dashboard loading problem",
  "description": "The dashboard takes too long to load.",
  "type": "bug"
}
```

### Update an Issue

```http
PATCH /api/issues/1
Content-Type: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN
```

```json
{
  "title": "Updated dashboard loading problem",
  "status": "in_progress"
}
```

## Project Structure

```text
src/
├── config/
│   └── index.ts
├── db/
│   └── index.ts
├── middlewire/
│   ├── auth.ts
│   ├── globalErrorHandler.ts
│   ├── index.d.ts
│   └── logger.ts
├── modules/
│   ├── auth____JWT/
│   │   ├── auth.controller.ts
│   │   ├── auth.route.ts
│   │   └── auth.service.ts
│   ├── issues/
│   │   ├── issue.controller.ts
│   │   ├── issue.interface.ts
│   │   ├── issue.route.ts
│   │   └── issue.service.ts
│   └── users/
│       ├── user.controller.ts
│       ├── user.interface.ts
│       ├── user.route.ts
│       └── user.service.ts
├── types/
│   └── index.ts
├── utility/
│   └── sendResponse.ts
├── app.ts
└── server.ts
```

## Local Installation

### 1. Clone the repository

```bash
git clone https://github.com/darksoul-atik/DevPulse-B7A2.git
cd DevPulse-B7A2
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create a `.env` file

```env
PORT=5000
CONNECTIONSTRING=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1d
BCRYPT_SALT_ROUNDS=10
CLIENT_URL=*
```

### 4. Start the development server

```bash
npm run dev
```

The local API will be available at:

```text
http://localhost:5000
```

## Available Scripts

| Command              | Description                  |
| -------------------- | ---------------------------- |
| `npm run dev`        | Start the development server |
| `npm run type-check` | Check TypeScript errors      |
| `npm run build`      | Create the production build  |
| `npm start`          | Start the production server  |

## Production Build

```bash
npm run build
npm start
```

## Render Deployment Configuration

```text
Build Command: npm install && npm run build
Start Command: npm start
```

Add all environment variables through the Render dashboard.

Do not upload or commit the `.env` file.

## Database

DevPulse uses PostgreSQL with the native `pg` package.

Main database tables:

* `users`
* `issues`

The project uses raw SQL queries without an ORM or query builder.

## Author

**Atik**

GitHub: https://github.com/darksoul-atik

## License

This project is licensed under the ISC License.
