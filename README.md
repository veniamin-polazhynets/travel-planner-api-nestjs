# 🌍 Travel Planner API (NestJS)

[![Node.js](https://img.shields.io/badge/Node.js-22.x-green?logo=node.js)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-12.x-red?logo=nestjs)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6-blue?logo=prisma)](https://www.prisma.io/)
[![Redis](https://img.shields.io/badge/Redis-7-red?logo=redis)](https://redis.io/)
[![Swagger UI](https://img.shields.io/badge/Swagger_UI-5.x-green?logo=swagger)](http://swagger.io/)
[![Tests](https://img.shields.io/badge/Tests-191%20Passed-brightgreen?logo=vitest)](https://vitest.dev/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-blue?logo=docker)](https://www.docker.com/)
[![CI](https://img.shields.io/github/actions/workflow/status/veniamin-polazhynets/travel-planner-api-nestjs/ci.yml?branch=main&label=CI&logo=githubactions)](https://github.com/veniamin-polazhynets/travel-planner-api-nestjs/actions/workflows/ci.yml)

A REST API built with **Node.js**, **TypeScript**, **NestJS**, **PostgreSQL**, and **Redis**. Designed to help users plan their trips, track travel expenses and analyze their budgets. Implements NestJS modular architecture, secure authentication/authorization with RBAC, and caching via Redis. The project demonstrates its reliability through automatic Swagger UI documentation, 191 passed E2E tests, GitHub Actions CI workflow, and production-ready Docker containerization.

## Tech Stack

- **Runtime:** Node.js
- **Language:** TypeScript
- **Framework:** NestJS
- **Database:** PostgreSQL
- **ORM:** Prisma ORM
- **Caching:** Redis (ioredis)
- **Authentication:** JWT, Passport.js, Argon2
- **Validation:** class-validator, class-transformer
- **Documentation:** Swagger UI
- **Testing:** Vitest, Supertest
- **DevOps:** Docker, Docker Compose, GitHub Actions

## Features

- JWT authentication with httpOnly Refresh Cookie, short-lived Access Tokens, Argon2 password hashing, and session invalidation via tokenVersion.
- RBAC for user management endpoints, including protection against admin self-deletion or accidental role changes.
- Strict DTO validation with mass assignment protection, resource ownership checks, and rate limiting (`@nestjs/throttler`).
- Full CRUD for trips and expenses, user profile management, and a budget summary endpoint with PostgreSQL aggregations.
- Universal pagination with metadata, search, filtering, sorting by date/budget.
- Redis caching for user sessions and expense summaries with automatic cache invalidation.
- Centralized exception filter for Prisma errors.
- 191 E2E tests covering core business logic and edge cases (Vitest & Supertest).
- Auto-generated Swagger UI and a health check endpoint.
- Docker & Docker Compose containerization, GitHub Actions CI workflow, and automated deployment on Render.

## Live Demo & Documentation

Interactive Swagger UI documentation is deployed and available online:
**[Live Swagger Documentation](https://travel-planner-api-nestjs.onrender.com/api-docs)**

> **Note:** Hosted on the Render free tier. If the service has been inactive, the first request may take ~30–40 seconds to spin up from sleep mode.

You can use these pre-seeded credentials in the Live Swagger (or locally after running `yarn db:seed`):

- **Admin:** `admin@travelplanner.com` / `Admin123`
- **Traveller:** `traveller@travelplanner.com` / `Password123`

## API Endpoints

> **Note:** Endpoints marked as _(auth required)_ require a valid Access Token in the `Authorization: Bearer <token>` header.

### Auth

- `POST /auth/register` - Register a new user
- `POST /auth/login` - Log in and receive tokens
- `POST /auth/refresh` - Refresh access token via cookie
- `POST /auth/logout` _(auth required)_ - Invalidate session and clear cookie

### Users _(auth required; also role `ADMIN` is needed)_

- `GET /users` - Get paginated list of users
- `GET /users/:userId` - Get user profile
- `PATCH /users/:userId` - Update user profile
- `DELETE /users/:userId` - Delete user account

### Profile _(auth required)_

- `GET /profile` - Get current user profile
- `PATCH /profile` - Update current user profile
- `DELETE /profile` - Delete current user account

### Trips _(auth required)_

- `POST /trips` - Create a new trip
- `GET /trips` - Get paginated list of trips (supports search, filters, sorting)
- `GET /trips/:tripId` - Get trip by id
- `PATCH /trips/:tripId` - Update trip
- `DELETE /trips/:tripId` - Delete trip

### Expenses _(auth required)_

- `POST /trips/:tripId/expenses` - Add expense to trip
- `GET /trips/:tripId/expenses` - Get paginated list of expenses (supports filters, sorting)
- `GET /trips/:tripId/expenses/summary` - Get a specific trip expenses summary and analytics
- `GET /trips/:tripId/expenses/:expenseId` - Get expense by ID
- `PATCH /trips/:tripId/expenses/:expenseId` - Update expense
- `DELETE /trips/:tripId/expenses/:expenseId` - Delete expense

### Health

- `GET /health` - Check status of database and Redis

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/veniamin-polazhynets/travel-planner-api-nestjs.git
cd travel-planner-api-nestjs
```

### 2. Environment Configuration

Create a `.env` file in the project root:

```env
NODE_ENV=development
PORT=8000

DATABASE_URL=postgresql://tp_admin:tp_password@localhost:5432/travel_planner

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_ACCESS_TOKEN_SECRET=your-access-token-secret-key
JWT_REFRESH_TOKEN_SECRET=your-refresh-token-secret-key

CLIENT_URL=http://localhost:5000
```

For e2e tests, create a `.env.test` file:

```env
NODE_ENV=test
PORT=8001

DATABASE_URL=postgresql://tp_admin:tp_password@localhost:5432/travel_planner_test

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=1

JWT_ACCESS_TOKEN_SECRET=your-access-token-secret-key
JWT_REFRESH_TOKEN_SECRET=your-refresh-token-secret-key

CLIENT_URL=http://localhost:5000
```

### 3. Install Dependencies

If you want to run tests or develop locally, install the packages:

```bash
yarn install
```

### 4. Prepare Databases (PostgreSQL and Redis)

You should run these commands to set up databases and seed the first admin, user, trips, and expenses:

```bash
docker compose up -d
yarn db:migrate
yarn db:seed
```

### 5. Run the App

```bash
yarn start:dev
```

The API will be available at `http://localhost:8000`, and Swagger documentation at `http://localhost:8000/api-docs`.

### 6. Run Tests

Before testing, set up the test database (make sure the travel_planner_test database exists in PostgreSQL):

```bash
yarn db:migrate:test
```

Then you can run E2E tests:

```bash
yarn test:e2e
```
