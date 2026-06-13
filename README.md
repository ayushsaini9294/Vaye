# Vaye - Social Media Platform

A Twitter-like social media platform built as a monorepo with TanStack Start, React 19, StyleX, and SQLite (Serverless/Turso).

> NOTE: Task details are documented in TASK.md
> **New Developer?** Learn how to build this [from scratch here](./BUILD_FROM_SCRATCH.md).

## Architecture

Vaye is a full-stack monorepo application using a modern Serverless setup:

- **User App** (`apps/client-user`) - Consumer-facing social media application (Direct DB connection)
- **Admin App** (`apps/client-admin`) - Administrative dashboard for content moderation
- **Shared DB Schema** (`packages/db-schema`) - Shared Drizzle ORM schemas and connections

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

# Start development environment
pnpm run dev
```

### Service URLs

| Service | URL | Description |
|---------|-----|-------------|
| User App | http://localhost:3000 | Main social media interface |
| Admin App | http://localhost:3002 | Admin dashboard |





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
| **Database** | SQLite with Drizzle ORM (Turso/LibSQL compatible) |
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

## 🚀 Deployment Guide

Vaye is fully prepared for free serverless production deployment on platforms like Vercel, combined with a Turso or Neon database.

### 1. Prerequisites
- A **Vercel** account (or similar serverless provider).
- A **Turso** account for free serverless SQLite.

### 2. Database Setup (Turso)
1. Create a database on Turso.
2. Get the database URL and Auth Token.

### 3. Vercel Deployment
1. Import your GitHub repository into Vercel.
2. Set the root directory to `apps/client-user` (or deploy them as separate projects).
3. Configure the following Environment Variables in Vercel:
```bash
# Secure 32+ character secrets
SESSION_SECRET=your-secure-random-secret-key-32-chars

# Turso DB Configuration
DATABASE_URL=libsql://your-database-name.turso.io
DATABASE_AUTH_TOKEN=your-turso-auth-token
```
4. Deploy! Because the app now uses direct DB queries instead of a separate background API server, it runs perfectly within Vercel's serverless functions.
