# WZH Moments — Backend API

Event management platform backend built with Node.js, Express, MongoDB, and Socket.IO.

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (ES Modules) |
| Framework | Express.js |
| Database | MongoDB + Mongoose |
| Real-time | Socket.IO |
| Auth | JWT + bcryptjs |
| Security | Helmet, express-mongo-sanitize, express-rate-limit |

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in your MongoDB URI and JWT secret.

### 3. Start development server

```bash
npm run dev
```

The server starts on `http://localhost:5000` by default.

### Production

```bash
npm start
```

## API

Base URL: `http://localhost:5000/api`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Server health check |

## Project Structure

```
src/
├── config/        # Database connection
├── controllers/   # MVC business logic handlers
├── middleware/    # Auth, validation, error handling
├── models/        # Mongoose schemas
├── routes/        # Express route definitions
├── services/      # Socket.IO, notifications, shared services
├── utils/         # Helper functions and constants
└── server.js      # Application entry point
```
