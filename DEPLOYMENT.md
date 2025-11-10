# Deployment Guide (GitHub + Vercel, No Database Required)

This guide walks you through deploying the entire project while keeping the backend fully functional using the built-in mock data store (`USE_MOCK_DB=true`). You can switch to MySQL later without code changes.

---

## 1. Prerequisites

- GitHub account
- Vercel account
- Node.js 16+ installed locally

---

## 2. Prepare the Repository

```bash
git clone https://github.com/yourusername/house-of-charity.git
cd house-of-charity
npm install
npm run install-backend
```

Verify the app locally:

```bash
npm run dev
# Frontend -> http://localhost:3000
# Backend  -> http://localhost:5000/api
```

Commit and push:

```bash
git add .
git commit -m "Prepare deployment"
git push origin main
```

---

## 3. Deploy Frontend on Vercel

1. Log in to [Vercel](https://vercel.com)
2. Click **New Project → Import Git Repository**
3. Select this repository
4. Framework preset: **Create React App**
5. Build command: `npm run build`
6. Output directory: `build`
7. Environment variables:
   - `REACT_APP_API_URL=https://<your-project-name>.vercel.app/api`

Deploy the project. The React app will be hosted at `https://<your-project-name>.vercel.app`.

---

## 4. Backend via Vercel Serverless Functions

The repository already includes an Express app (`backend/app.js`) and a serverless entry (`api/index.js`). Vercel automatically deploys everything inside `/api` as serverless functions.

Configure backend environment variables in Vercel → Project → Settings → Environment Variables:

| Key            | Value                                         | Notes                                          |
|----------------|-----------------------------------------------|------------------------------------------------|
| `USE_MOCK_DB`  | `true`                                        | Enables the in-memory data store              |
| `JWT_SECRET`   | a secure random string                        | Required for authentication tokens            |
| `FRONTEND_URL` | `https://<your-project-name>.vercel.app`      | Enables proper CORS                           |
| `PORT`         | `5000` (optional)                             | Ignored in serverless, but harmless           |

Redeploy the project from Vercel after setting the variables. Your API is now reachable at `https://<your-project-name>.vercel.app/api`.

---

## 5. Optional: GitHub Pages Preview

If you also want a static preview on GitHub Pages:

1. Install helper package
   ```bash
   npm install --save-dev gh-pages
   ```
2. Add to `package.json` scripts:
   ```json
   "predeploy": "npm run build",
   "deploy": "gh-pages -d build"
   ```
3. Add homepage field:
   ```json
   "homepage": "https://<your-username>.github.io/<repo-name>"
   ```
4. Deploy:
   ```bash
   npm run deploy
   ```

Remember: GitHub Pages only hosts the static frontend. Configure `REACT_APP_API_URL` to point to the Vercel API.

---

## 6. Switching to MySQL Later

1. Create a MySQL database and run `mysql_schema.sql`
2. Update environment variables:
   - `USE_MOCK_DB=false`
   - `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
3. Redeploy the backend

No code changes required—the Express routes automatically fall back to MySQL when the flag is disabled.

---

## 7. Post-Deployment Checklist

- [ ] Visit `/health` → confirms API is running and shows current mode (mock or database)
- [ ] Login using seeded mock users (see `backend/services/mockData.js`)
- [ ] Browse NGOs, requirements, and donations to ensure mock data displays correctly
- [ ] Test creating donations/requirements (in-memory in mock mode)
- [ ] Verify CORS by loading the frontend and API from their production URLs

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Frontend cannot reach API | Confirm `REACT_APP_API_URL` and Vercel env vars |
| Backend returns 500 | Check Vercel serverless logs (Deployments → Functions) |
| JWT errors | Ensure `JWT_SECRET` is set in both local `.env` and Vercel |
| CORS errors | Set `FRONTEND_URL` to the deployed frontend origin |

---

Need help? Open an issue on GitHub or reach out via the project discussions. 