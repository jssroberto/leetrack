# LeeTrack Browser Extension

Chrome extension that automatically tracks LeetCode submissions and syncs them with the LeeTrack platform.

## Features

- Automatic submission tracking for accepted LeetCode problems
- Offline queue support with periodic sync (5-minute intervals)
- JWT authentication with token management
- Browser notifications and popup UI
- Real-time sync status tracking

## Architecture

**Service Worker** (`background/service-worker.ts`)

- Processes submissions and syncs with API
- Manages authentication and token expiration
- Handles offline queue and periodic background sync

**Content Scripts**

- `submission-tracker.ts`: Monitors LeetCode submission responses
- `network-interceptor.ts`: Intercepts GraphQL API calls to capture submission details

**Popup UI** (`popup/popup.ts`)

- Authentication interface
- Recent submissions list (last 5)
- Sync status indicators

## Setup

### Prerequisites

- Node.js 22+
- PNPM 10+
- Running LeeTrack API (default: `http://localhost:3000`)

### Installation

From repository root:

```bash
pnpm install
pnpm build:extension
```

For development with watch mode:

```bash
pnpm dev:extension
```

Output: `apps/extension/dist/`

### Load in Chrome

1. Navigate to `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select `apps/extension/dist/`

### Configuration

Build-time environment variables (via Webpack):

```bash
# Custom API URL
LEETRACK_API_URL=https://api.leetrack.com pnpm build:extension

# Web port auto-detected from .env or defaults to 4200
```

## Usage

1. Load the extension and click the icon
2. Sign in with LeeTrack credentials (new users: click "Register")
3. Solve LeetCode problems as usual
4. Accepted submissions are automatically tracked and synced

View submissions by clicking the extension icon:

- Last 5 submissions
- Sync status: ✓ (synced) or ⏳ (queued)

## Development

### Scripts

```bash
# From apps/extension/
pnpm dev              # Watch mode
pnpm build            # Production build
pnpm build:clean      # Clean build
pnpm type-check       # Type checking
pnpm lint             # Linting

# From repository root
pnpm dev:extension    # Watch mode
pnpm build            # Build all apps
```

### Hot Reload

After `pnpm dev:extension` rebuilds:

1. Go to `chrome://extensions/`
2. Click **Reload** for LeeTrack extension
3. Refresh LeetCode pages

### Debugging

- **Service Worker**: `chrome://extensions/` → LeeTrack → "service worker"
- **Content Script**: DevTools on LeetCode page → Console → filter `[LeeTrack]`
- **Popup**: Right-click extension icon → "Inspect popup"

## Build Details

**Webpack** (`build/webpack.config.js`):

- Entry points: service worker, content scripts, popup
- Loaders: `ts-loader`, `css-loader`, `postcss-loader`
- Plugins: `DefinePlugin` (env vars), `CopyWebpackPlugin` (assets)
- Aliases: `@extension` → `src/`, `@leetrack/shared-types` → `libs/shared/types/src`

**TypeScript**: ES2020 target, strict mode, ESNext modules

**Permissions** (manifest.json):

- `storage`: Save submissions and auth tokens
- `tabs`: Open registration links
- `notifications`: Submission alerts
- `host_permissions`: Access to `leetcode.com`, `leetcode.cn`

## Troubleshooting

**Extension not capturing submissions**

- Verify signed in and on LeetCode
- Check submission is **Accepted**
- Check console logs: `[LeeTrack]` prefix

**Submissions not syncing**

- Sign out and back in
- Verify API is running
- Submissions queue offline and sync every 5 minutes

**Build errors**

- Run `pnpm install` from repo root
- Check Node.js version (22+)
- Run `pnpm build:clean`
