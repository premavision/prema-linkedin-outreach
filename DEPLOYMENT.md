# Deployment Instructions

This project consists of two parts that need to be deployed separately:
1. **Backend (Render):** Handles logic, database, and scraping.
2. **Frontend (Vercel):** The visual interface for the user.

---

## Part 1. Backend Deployment (Render)

1. Go to [dashboard.render.com](https://dashboard.render.com) and click **New +** -> **Web Service**.
2. Connect your GitHub repository.
3. **Service Settings:**
    *   **Name:** `prema-linkedin-outreach-api`
    *   **Region:** Choose the one closest to you (e.g., Frankfurt).
    *   **Branch:** `main`
    *   **Root Directory:** Leave empty (or `.`).
    *   **Runtime:** `Node`
    *   **Build Command:**
        ```bash
        npm install --include=dev && npx playwright install chromium && npm run prisma:generate
        ```
    *   **Start Command:**
        ```bash
        npx prisma migrate deploy --schema src/infra/persistence/prisma/schema.prisma && npx tsx src/infra/http/server.ts
        ```
    *   **Instance Type:** Free (for testing).

4.  **Environment Variables:**
    Add the following keys:
    *   `NODE_VERSION`: `20.10.0`
    *   `OPENAI_API_KEY`: `sk-proj-...` (your key)
    *   `DATABASE_URL`: `file:./prod.db` *(Note: on the free tier, the database will be wiped on restart)*
    *   `SCRAPER_MODE`: `playwright`
    *   `NPM_CONFIG_PRODUCTION`: `false`

5.  Click **Create Web Service**.
6.  Wait for the deployment to finish (green "Live" checkmark).
7.  **Copy the URL** of your new service (top left, e.g., `https://prema-linkedin-outreach-api.onrender.com`).

---

## Part 2. Frontend Deployment (Vercel)

1.  Go to [vercel.com](https://vercel.com) and click **Add New...** -> **Project**.
2.  Import the same repository.
3.  **Project Settings:**
    *   **Framework Preset:** `Next.js`
    *   **Root Directory:** Click **Edit** and select the `src/ui` folder.
4.  **Build & Output Settings:**
    *   **Install Command:** Leave empty (turn off the Override switch if it's on). Vercel will automatically detect what needs to be installed.
5.  **Environment Variables:**
    Add one variable:
    *   **Key:** `NEXT_PUBLIC_API_BASE_URL`
    *   **Value:** Paste the URL of your backend from Render (from step 1.7).
        *(Important: without a trailing slash `/`)*.

6.  Click **Deploy**.

---

## Part 3. Fixing Linting Errors

For Vercel to successfully build the project, you must fix the linting errors (un-escaped quotes, `type` instead of `interface`, removing unused imports).

If you have done this and pushed the code (`git push`), Vercel will automatically start a new build.

### Summary
*   **Backend** runs on Render and listens for requests.
*   **Frontend** runs on Vercel and sends requests to Render.
*   If the database on Render resets frequently, consider switching to PostgreSQL (Render Postgres) in the future.
