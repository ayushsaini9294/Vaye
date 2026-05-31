# Vaye - Social Media Platform

A Twitter-like social media platform built as a monorepo with TanStack Start, React 19, gRPC, StyleX, and SQLite.

> NOTE: Task details are documented in TASK.md
> **New Developer?** Learn how to build this [from scratch here](./BUILD_FROM_SCRATCH.md).

## Architecture

Vaye is a full-stack monorepo application with:

- **User App** (`apps/client-user`) - Consumer-facing social media application
- **Admin App** (`apps/client-admin`) - Administrative dashboard for content moderation
- **API Server** (`apps/api`) - gRPC-based backend service

## Quick Start

```bash
# Install dependencies
pnpm install

# Generate protocol buffers
pnpm run proto:generate

# Setup database
pnpm run db:generate
pnpm run db:migrate
pnpm run db:seed

# Start all services (API + User App + Admin App)
pnpm run dev
```

### Service URLs

| Service | URL | Description |
|---------|-----|-------------|
| User App | http://localhost:3000 | Main social media interface |
| API Server | http://localhost:3001 | gRPC API (health check at /health) |





## Features

### User Application

#### Core Features
- **Authentication** - Email/password registration, login, session management
- **Posts (Vayes)** - Create, edit (within 5 min), delete text posts (max 280 chars)
- **Comments** - Add/delete comments, nested threads (1 level deep)
- **Likes** - Like/unlike posts and comments
- **User Profiles** - View profiles, edit own profile (name, bio, avatar)
- **Follow System** - Follow/unfollow users, follower/following counts
- **Direct Messaging (Chat)** - Premium Twitter/X-style chat sidebar, grouped message bubbles, smart rounded corners, read receipts, and modern auto-focus text inputs
- **Moveable Shortcuts Trigger** - Draggable keyboard shortcuts button with pointer-based collision controls that preserves viewport accessibility and prevents input occlusion

#### Feed & Discovery
- **Home Feed** - Posts from followed users
- **Explore Feed** - All recent posts
- **Search** - Find posts by content, users by name/username

#### Engagement Features
- **Bookmarks** - Save posts for later, dedicated bookmarks page
- **Notifications** - Alerts for likes, comments, follows, and mentions
- **Mentions** - @username linking in posts and comments

### Admin Application

- **Live Moderation Dashboard** - View all platform statistics, recent posts, audit logs, and reports
- **User Management** - Direct gRPC-connected controls to modify user roles, ban/unban violators, and view dynamic user audit histories



## Project Structure

```
vaye/
├── apps/
│   ├── api/                    # gRPC API server
│   │   ├── src/
│   │   │   ├── grpc/           # gRPC handlers and server
│   │   │   ├── services/       # Business logic services
│   │   │   └── db/             # Database connection and seed
│   │   └── package.json
│   │
│   ├── client-user/            # User-facing TanStack Start app
│   │   ├── src/
│   │   │   ├── components/     # React components
│   │   │   ├── routes/         # File-based routing
│   │   │   ├── server/         # Server functions
│   │   │   └── tokens.stylex.ts # Design tokens
│   │   ├── tests/
│   │   │   ├── unit/           # Vitest unit tests
│   │   │   └── e2e/            # Playwright E2E tests
│   │   └── package.json
│   │
│   └── client-admin/           # Admin TanStack Start app
│       ├── src/
│       │   ├── components/     # Admin UI components
│       │   ├── routes/         # Admin routes
│       │   └── server/         # Admin server functions
│       ├── tests/
│       │   ├── unit/           # Vitest unit tests
│       │   └── e2e/            # Playwright E2E tests
│       └── package.json
│
├── packages/
│   ├── db-schema/              # Drizzle ORM schema definitions
│   ├── proto/                  # Protocol buffer definitions
│   ├── grpc-client/            # gRPC client library
│   ├── ui/                     # Shared UI components (StyleX)
│   └── shared-types/           # Shared TypeScript types
│
├── db/
│   └── migrations/             # Database migrations
│
├── tooling/
│   └── typescript/             # Shared TypeScript config
│
└── package.json                # Root monorepo config
```

## Available Scripts

### Root Level (Turborepo)

```bash
pnpm run dev              # Start all services
pnpm run dev:user         # Start only user app
pnpm run dev:admin        # Start only admin app
pnpm run dev:api          # Start only API server

pnpm run build            # Build all packages
pnpm run typecheck        # Type check all packages
pnpm run lint             # Lint all packages
pnpm run lint:fix         # Fix linting issues

pnpm run test             # Run all tests
pnpm run test:unit        # Run unit tests
pnpm run test:e2e         # Run E2E tests

pnpm run db:generate      # Generate database migrations
pnpm run db:migrate       # Run database migrations
pnpm run db:seed          # Seed database with test data

pnpm run proto:generate   # Generate TypeScript from proto files
pnpm run clean            # Clean all build artifacts
```

### Per-App Scripts

Each app (`apps/client-user`, `apps/client-admin`, `apps/api`) has:

```bash
pnpm run dev              # Start development server
pnpm run build            # Build for production
pnpm run typecheck        # Type check
pnpm run test             # Run tests
pnpm run test:unit        # Run unit tests only
pnpm run test:e2e         # Run E2E tests only (client apps)
```

## Tech Stack

| Category | Technology |
|----------|------------|
| **Monorepo** | Turborepo + pnpm workspaces |
| **Framework** | TanStack Start (React 19) |
| **Language** | TypeScript (strict mode) |
| **Styling** | StyleX |
| **API** | gRPC with Protocol Buffers |
| **Database** | SQLite with Drizzle ORM |
| **Linting** | Biome |
| **Testing** | Vitest (unit) + Playwright (E2E) |
| **Package Manager** | pnpm |

## Database Schema

### Core Tables
- `users` - User accounts and profiles
- `posts` - User posts/vayes
- `comments` - Post comments
- `likes` - Post and comment likes
- `follows` - User follow relationships

### Feature Tables
- `bookmarks` - Saved posts
- `notifications` - User notifications
- `reports` - Content reports
- `audit_logs` - Admin action logs

## Development

### Adding a New Feature

1. **Database**: Add schema in `packages/db-schema/src/schema.ts`
2. **Proto**: Define gRPC service in `packages/proto/protos/`
3. **API**: Implement service in `apps/api/src/services/`
4. **Handler**: Add gRPC handler in `apps/api/src/grpc/handlers/`
5. **Client**: Update `packages/grpc-client/src/client.ts`
6. **Server Functions**: Add in `apps/client-*/src/server/functions/`
7. **Components**: Create UI in `apps/client-*/src/components/`
8. **Routes**: Add pages in `apps/client-*/src/routes/`
9. **Tests**: Add unit tests and E2E tests

### Running Tests

```bash
# Run all tests
pnpm run test

# Run specific app tests
cd apps/client-user && pnpm run test:e2e

# Run with UI mode
cd apps/client-user && pnpm exec playwright test --ui
```

### Reset Environment

```bash
# Clean everything and start fresh
pnpm run clean
rm -f vaye.db vaye.db-shm vaye.db-wal
pnpm install
pnpm run proto:generate
pnpm run db:generate
pnpm run db:migrate
pnpm run db:seed
```

## API Services

The API uses gRPC with the following services:

- `AuthService` - Authentication (login, register, validate session)
- `UsersService` - User management and profiles
- `PostsService` - Post CRUD operations
- `CommentsService` - Comment operations
- `LikesService` - Like/unlike functionality
- `FollowsService` - Follow/unfollow users
- `BookmarksService` - Bookmark management
- `NotificationsService` - Notification handling
- `SearchService` - Search posts and users
- `AdminService` - Admin-only operations

Proto definitions are in `packages/proto/protos/`.

## 🚀 Deployment Guide

Vaye is fully prepared for production deployment. The most robust way to deploy the entire monorepo stack (gRPC API, Client User App, Client Admin App) is via **Docker Compose**.

### 1. Prerequisites
- **Docker** and **Docker Compose** installed on your server (VPS, EC2, DigitalOcean, etc.).
- A domain name (optional but recommended for HTTPS).

### 2. Environment Setup
Create a `.env` file in the root directory and configure your secure secrets:
```bash
# Secure 32+ character secrets (MUST change in production)
SESSION_SECRET=your-secure-random-secret-key-32-chars
GRPC_JWT_SECRET=your-secure-random-jwt-secret-key
```

### 3. Deploy with Docker Compose
The provided `docker-compose.yml` orchestrates all three apps automatically. To build and start the entire stack in detached mode:
```bash
docker-compose up -d --build
```

The services will be exposed internally on:
- **User App**: http://localhost:3000
- **Admin App**: http://localhost:3002
- **API Server**: http://localhost:3001 (gRPC on 50051)

### 4. Database Persistence
The SQLite database is safely stored in a persistent Docker volume named `vaye-data`. To back up your data, you simply back up this volume. Your database will survive container restarts and rebuilds.

### 5. Production Checklist & Reverse Proxy
- [ ] Change all default secrets in `.env`.
- [ ] Ensure ports 3000, 3001, 3002, and 50051 are properly firewalled from the public internet.
- [ ] Set `NODE_ENV=production` in your environment (handled by Docker Compose).
- [ ] Use a reverse proxy like **Nginx** or **Caddy** to securely expose the client apps and handle SSL (HTTPS):
  - Point `vaye.yourdomain.com` -> `localhost:3000` (User App)
  - Point `admin.vaye.yourdomain.com` -> `localhost:3002` (Admin App)
