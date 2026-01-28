# PureLiefde

Private messaging PWA for couples.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS + Framer Motion
- **Backend**: Hono + Cloudflare Workers + Drizzle ORM
- **Database**: Neon PostgreSQL
- **Storage**: Cloudflare R2
- **Real-time**: WebSocket via Durable Objects

## Project Structure

```
pureliefde/
├── apps/
│   ├── web/          # React PWA frontend
│   └── api/          # Hono API backend
├── packages/
│   └── shared/       # Shared types and constants
└── package.json      # Monorepo root
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- Neon account (for PostgreSQL)
- Cloudflare account (for Workers and R2)

### Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   cp apps/api/.dev.vars.example apps/api/.dev.vars
   # Fill in your values
   ```

3. Set up the database:
   ```bash
   pnpm db:push
   ```

4. Start development servers:
   ```bash
   # Terminal 1: API
   pnpm dev:api

   # Terminal 2: Web
   pnpm dev
   ```

5. Open http://localhost:5173

## Deployment

### Frontend (Cloudflare Pages)

```bash
cd apps/web
pnpm build
# Deploy via Cloudflare Pages dashboard or wrangler
```

### Backend (Cloudflare Workers)

```bash
cd apps/api
wrangler secret put DATABASE_URL
wrangler secret put JWT_SECRET
wrangler secret put R2_PUBLIC_URL
pnpm deploy
```

## Features

- Real-time messaging via WebSocket
- Typing indicators
- Read receipts
- Love emoji picker
- Sticker packs
- Photo/video sharing
- Voice messages
- Date counter (days together)
- PWA with offline support
- Push notifications

## License

Private - Not for public use
