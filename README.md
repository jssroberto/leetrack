# LeeTrack

LeeTrack turns solitary LeetCode practice into a collaborative competition platform with real-time tracking, shared challenges, and playful achievement systems.

## Tech Stack

- Backend: NestJS 11, Prisma 6, PostgreSQL 18
- Frontend: Angular 20, TailwindCSS 4
- Extension: Vanilla TypeScript
- Monorepo: PNPM workspaces

## Development Environment

All development services are containerised. You only need Docker; Node.js, PNPM, and PostgreSQL run inside the stack configured in `compose.dev.yaml`.

### Prerequisites

- Docker Engine 24+ (Docker Desktop 4.25+)
- Docker Compose V2.22+ (the file uses the `develop` sync rules)
- Optional: PNPM 10+ locally if you want to run scripts outside containers

### First Run
1. Run the package manager to install all project dependencies:

    ```bash
    pnpm install
    ```

2. Duplicate the example environment file:
   ```bash
   cp .env.example .env
   ```
3. Adjust any ports or credentials in `.env` as needed.

4. Before bringing up the containers, you must generate the Prisma client for the database.
   ```bash
    cd libs/database
    pnpm prisma:migrate
    pnpm prisma:generate
    cd ../..
    ```

5. Build and start the development stack:
   ```bash
   docker compose -f compose.dev.yaml up --build
   ```
   
6. When the logs show `api` and `web` ready messages, visit the apps:
   - API: http://localhost:3000 (or `${API_PORT}` from `.env`)
   - Web: http://localhost:4200 (or `${WEB_PORT}` from `.env`)

Compose mounts `apps/*/src` and `libs` from your host, so code edits hot-reload automatically inside the containers. The first run will install dependencies and generate Prisma clients, so expect it to take a bit longer.

### Services

- `postgres`: PostgreSQL 18 with a named volume (`leetrack-postgres-dev`) so data persists between restarts.
- `api`: NestJS server running in watch mode; depends on the healthy database before starting.
- `web`: Angular dev server exposing the app on port 4200 and forwarding API calls to the `api` container.

All services share the `leetrack-network` bridge network, so they can reference each other by container name (`postgres`, `api`, `web`).

### Day-to-Day Commands

```bash
# Start in the foreground (watch logs)
docker compose -f compose.dev.yaml up

# Start detached
docker compose -f compose.dev.yaml up -d

# Tail logs for a specific service
docker compose -f compose.dev.yaml logs -f api

# Stop containers but keep volumes
docker compose -f compose.dev.yaml down

# Reset everything, including the database volume
docker compose -f compose.dev.yaml down -v
```

To run commands inside containers:

```bash
# Example: run Prisma migrations
docker compose -f compose.dev.yaml exec api pnpm exec prisma migrate dev

# Example: install a new dependency for the API package
docker compose -f compose.dev.yaml exec api pnpm add <package-name> -D

# Example: run linting
docker compose -f compose.dev.yaml exec web pnpm lint
```

### Local PNPM Scripts (Optional)

If you prefer to run services directly on your machine (outside Docker), install Node.js 22 and PNPM 10+, then use:

```bash
pnpm install
pnpm dev            # Runs API and Web concurrently
pnpm dev:api        # NestJS backend only
pnpm dev:web        # Angular frontend only
```

This path still requires PostgreSQL running locally and a proper `.env`.

## Environment Variables

The containers load configuration from `.env`. Start with `.env.example`; key variables are:

| Variable        | Default                | Purpose                                   |
|-----------------|------------------------|-------------------------------------------|
| `POSTGRES_USER` | `leetrack`             | Database user                             |
| `POSTGRES_PASSWORD` | `password`        | Database password                         |
| `POSTGRES_DB`   | `leetrack_dev`         | Database name                             |
| `POSTGRES_PORT` | `5432`                 | Host port bound to Postgres service       |
| `DATABASE_URL`  | Uses service hostname  | Prisma connection string (points to `postgres`) |
| `API_PORT`      | `3000`                 | Host port bound to the API service        |
| `WEB_PORT`      | `4200`                 | Host port bound to the web dev server     |

Edit the `.env` file before starting the stack if you need different ports or credentials. Changes require restarting the relevant services.

## Project Structure

```
leetrack/
├── apps/
│   ├── api/              # NestJS backend
│   ├── web/              # Angular frontend
│   └── extension/        # Browser extension
├── libs/
│   ├── database/         # Prisma database layer
│   └── shared/           # Shared utilities and types
├── compose.dev.yaml      # Docker Compose dev stack
└── pnpm-workspace.yaml   # Workspace configuration
```

## Useful Tips

- Prisma client generation happens during the `api` image build. If you change the Prisma schema, rerun `docker compose -f compose.dev.yaml exec api pnpm exec prisma generate`.
- Because node modules live inside the containers, avoid running `pnpm install` on the host while the stack is up to prevent mismatched lockfiles.
- The Compose `develop` block watches each package’s `package.json` and restarts the service when dependencies change.
