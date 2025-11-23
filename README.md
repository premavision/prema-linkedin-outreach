# LinkedIn Outreach Engine (Prema Vision)

A small but realistic prototype that helps humans draft personalized LinkedIn outreach. It keeps humans in control (no auto-sending) while demonstrating safe automation patterns using Playwright and LLMs.

## Tech stack
- Node.js 20+, TypeScript
- Express API
- Playwright-based scraper (with demo mode)
- Prisma + SQLite for local persistence
- Next.js 14 app router for the minimal UI
- LLM abstraction with OpenAI example and local fallback

## Project structure
- `src/config` – environment handling
- `src/domain` – models and services
- `src/infra/automation` – scraper interface, demo scraper, Playwright scraper
- `src/infra/llm` – LLM interfaces, prompts, OpenAI + local client
- `src/infra/persistence` – Prisma schema, repositories
- `src/infra/http` – Express server and routes
- `src/ui` – Next.js UI (dashboard, target detail, export page)

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and set values (OpenAI key optional for local drafts):
   ```bash
   cp .env.example .env
   ```
3. Apply the Prisma schema (SQLite):
   ```bash
   npm run prisma:migrate
   ```

## Running locally
- Start backend and UI together:
  ```bash
  npm run dev
  ```
  - Express API on `http://localhost:4000`
  - Next.js UI on `http://localhost:3000`
- Start backend only:
  ```bash
  npm run dev:server
  ```
- UI only:
  ```bash
  npm --workspace ui run dev
  ```

## Environment
Key variables (see `.env.example`):
- `DATABASE_URL` – SQLite path (default `file:./dev.db`)
- `PORT` – API port (default 4000)
- `SCRAPER_MODE` – `demo` uses canned data; `playwright` launches Chromium
- `OPENAI_API_KEY` / `OPENAI_MODEL` – optional for real LLM drafts
- `NEXT_PUBLIC_API_BASE_URL` – UI -> API base URL

## Features
- CSV import for targets (name, LinkedIn URL, role, company)
- Target list with statuses (NOT_VISITED → PROFILE_SCRAPED → MESSAGE_DRAFTED → APPROVED)
- Profile scraping via Playwright scraper or demo data
- LLM-backed outreach draft generation (local fallback available)
- Human-in-the-loop review: view/edit drafts, set status, export approved messages as CSV

## Ethics & safety
- The system **never auto-sends** messages; it only prepares drafts for human review.
- Playwright scraping is configurable and should respect rate limits and LinkedIn ToS.
- Secrets/keys are read from the environment; never hard-code credentials.
- Demo mode lets you showcase the UI/flows without touching real profiles.
