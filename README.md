# 🚀 LinkedIn Outreach Engine (Prema Vision)

An AI-assisted outreach engine that **scrapes profiles, generates personalized LinkedIn message drafts, and keeps humans fully in control**.  
No auto-sending, no spam bots — just safe automation patterns built on solid engineering.

This project demonstrates a modern automation stack with a clear, scalable architecture:

**Scraping → Domain Logic → LLM Drafting → Human Review → Export**

---

## 🧠 Purpose

Most outreach tools offer two extremes:

- **Manual outreach** — slow, repetitive, inconsistent  
- **Automated spam** — risky, impersonal, often harmful  

This engine introduces the **middle path**:

### ✔ Human-approved drafts  
### ✔ Data-driven personalization  
### ✔ Safe, compliant automation  
### ✔ Maintainable backend architecture

It collects profile data → generates high-quality drafts → allows human revision and approval.

---

## 🛠 Tech Stack

- **Node.js 20+**, **TypeScript**
- **Express** API
- **Playwright** scraper (plus a demo mode requiring zero browser installs)
- **Prisma + SQLite**
- **Next.js 14** (App Router) for the UI
- **LLM abstraction layer** with OpenAI + local fallback

---

## 🧱 Project Structure

```bash
src/
  config/             # environment handling
  domain/             # models, business rules
  infra/
    automation/       # scraper interface, demo scraper, Playwright scraper
    llm/              # prompts, OpenAI client, local fallback
    persistence/      # Prisma repositories + schema
    http/             # Express server & routes
  ui/                 # Next.js UI (dashboard, target detail page, export flow)
```

---

## 🧬 Architectural Overview

```
            ┌────────────────────────┐
            │      Next.js UI        │
            │ Review • Edit • Export │
            └───────────▲────────────┘
                        │ REST API
                       4000
                        │
            ┌───────────┴───────────┐
            │      Express API       │
            └──────────▲────────────┘
                        │
                Domain Logic Layer
                        │
     ┌───────────┬───────────────┬──────────────┬───────────────┐
     │ Scraper   │ LLM Engine     │ Persistence  │ Validation     │
     │ Playwright│ OpenAI/local   │ Prisma       │ Domain rules   │
```

The architecture is modular, testable, and easy to extend with new automation modules, LLMs, or workflows.

---

## ⚙️ Setup

### Install dependencies
```bash
npm install
```

### Configure environment variables
```bash
cp .env.example .env
```

### Apply database schema
```bash
npm run prisma:migrate
```

---

## 🧪 Running Locally

### Backend + UI together
```bash
npm run dev
```
- Express API on `http://localhost:4000`
- Next.js UI on `http://localhost:3000`
- **Note:** The dev script automatically generates Prisma client. Make sure you've run `npm run prisma:migrate` first.

### Backend only
```bash
npm run dev:server
```

### UI only
```bash
npm --workspace ui run dev
```

- API: `http://localhost:4000`  
- UI: `http://localhost:3000`

### Troubleshooting

**"Unable to connect to API server" error:**
1. Make sure the API server is running on port 4000:
   ```bash
   npm run dev:server
   ```
2. Check if port 4000 is already in use:
   ```bash
   lsof -i :4000
   ```
3. Ensure the database is set up:
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```
4. Verify the API server started successfully - you should see: `API server running on port 4000`

---

## 🔧 Environment Variables

| Variable | Description |
|---------|-------------|
| `DATABASE_URL` | SQLite connection string |
| `PORT` | Express port (default: 4000) |
| `SCRAPER_MODE` | `demo` or `playwright` |
| `OPENAI_API_KEY` | optional |
| `OPENAI_MODEL` | optional |
| `NEXT_PUBLIC_API_BASE_URL` | UI → API endpoint |

---

## ⭐ Features

- CSV import of targets
- Status-based pipeline:

```
NOT_VISITED → PROFILE_SCRAPED → MESSAGE_DRAFTED → APPROVED
```

- Playwright scraping with configurable mode
- LLM-powered message generation (OpenAI or local inference)
- Human-in-the-loop review & editing
- Export approved drafts as CSV
- Works fully offline in demo mode

---

## 🔐 Ethics & Safety

- No auto-sending — ever  
- Conforms to safe automation practices  
- Scraper throttling & configurable delays  
- Local database, no hidden analytics  
- Secrets only via environment variables  
- Demo mode available for safe demos and testing  

---

## 🛣 Roadmap

### Coming soon
- RAG-enhanced personalization
- Multi-variant message generation
- Relevance & personalization scoring
- CRM sync (Notion / HubSpot)
- Support for multiple AI providers (Anthropic, Gemini, Llama)
- Serverless deployment template

### Already implemented
- Scraping engine  
- LLM abstraction layer  
- Full UI flow (review/edit/export)  
- CSV import/export  
- Demo mode  

---

## 📦 Use Cases

- B2B lead generation  
- Technical recruiting  
- Founder outreach  
- Partnership development  
- Post-event follow-ups  
- Automation-assisted sales ops  

---

## 🧑‍💻 Want to build on top of it?

The engine is intentionally clean and extendable.  
If you'd like, I can generate:

- a **product landing page**
- a **pitch deck**
- a **demo script**
- a **deployment guide**
- an **architecture PDF**

Just say the word.

---

## 🧪 End-to-end Tests

- `tests/e2e/dashboard.spec.ts` drives Playwright against the combo dev stack (`npm run dev`), covering the CSV import ➜ scrape ➜ generate ➜ approve ➜ export flow and the `/targets/[id]` demo generator.
- Tests share their own SQLite file (`tmp/e2e.db`) and rely on `tests/e2e/fixtures/targets.csv` so the scenarios stay deterministic.
- Run the suite with `npm run test:e2e`; Playwright will launch the Express and Next dev servers, seed a fresh database, and keep the browser headless.
