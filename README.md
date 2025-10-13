# LeeTrack

A social gamification platform that transforms solitary LeetCode practice into collaborative group learning with real-time tracking, challenges, and achievements.

## Tech Stack

- **Backend**: NestJS 11, Prisma 6, PostgreSQL 18
- **Frontend**: Angular 20, TailwindCSS 4
- **Extension**: Vanilla TypeScript
- **Monorepo**: PNPM Workspaces

## Prerequisites

- Node.js 22.x
- PNPM 10.x
- PostgreSQL 18.x

## Quick Start

```
# Install dependencies
pnpm install

# Start development servers
pnpm dev

# Or run individually
pnpm dev:api    # http://localhost:3000
pnpm dev:web    # http://localhost:4200
```

## Project Structure

```
leetrack/
├── apps/
│   ├── api/              # NestJS backend
│   ├── web/              # Angular frontend
│   └── extension/        # Browser extension
├── libs/
│   ├── database/         # Prisma database layer
│   └── shared/           # Shared types, constants, validators
```

## Available Scripts

```
pnpm dev              # Run API + Web in parallel
pnpm dev:api          # Run NestJS backend only
pnpm dev:web          # Run Angular frontend only
pnpm build:api        # Build backend
pnpm build:web        # Build frontend
```

## Environment Setup

Copy `.env.example` to `.env` and configure:

```
DATABASE_URL="postgresql://user:password@localhost:5432/leetrack"
```