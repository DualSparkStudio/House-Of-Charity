# Supabase Setup Guide for House of Charity

This guide walks you through configuring Supabase as the primary database for the House of Charity project.

---

## 1. Create a Supabase Project

1. Visit [supabase.com](https://supabase.com) and sign in (or create an account).
2. Click **New Project**.
3. Choose your organization and set:
   - **Name**: `house-of-charity`
   - **Database Password**: a strong password
   - **Region**: closest to your users
4. Click **Create new project** and wait for provisioning to complete.

---

## 2. Gather API Credentials

In the Supabase dashboard, open **Settings → API** and copy:
- **Project URL**
- **Service role secret** (used by the backend)
- **Anon public key** (optional, only needed for direct client access)

Keep the service role key private — never expose it to the frontend or commit it to source control.

---

## 3. Configure Environment Variables

### Backend (`backend/config.env`)

```env
# Toggle data sources
USE_MOCK_DB=false
USE_SUPABASE=true

# Supabase credentials
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret
# Optional fallback (if you prefer to use the anon key)
SUPABASE_ANON_KEY=your-anon-key

# JWT settings
JWT_SECRET=your_jwt_secret_key_change_this_in_production
JWT_EXPIRE=7d
```

### Frontend (`.env` at repo root)

```env
REACT_APP_API_URL=http://localhost:5000/api
```

The React app talks only to the Express backend, so no Supabase keys are required on the client.

---

## 4. Install Backend Dependencies

```bash
cd backend
npm install
```

This pulls in `@supabase/supabase-js` along with the existing packages.

---

## 5. Apply the Supabase Schema

1. Open the Supabase dashboard and go to **SQL Editor**.
2. Paste the contents of `supabase_schema.sql` (in the project root).
3. Click **Run**.

The script sets up:
- `donors` and `ngos` tables (separate entities with shared profile fields)
- `donor_ngo_links` many-to-many table for donor ↔ NGO connections
- `donations` table supporting monetary and in-kind contributions
- `requirements` table for NGO requests
- A shared trigger to keep `updated_at` timestamps current

---

## 6. Optional: Supabase Auth Settings

If you plan to use Supabase Auth features:
1. Navigate to **Authentication → Settings**.
2. Set the **Site URL** (e.g., `http://localhost:3000` for development).
3. Add any additional redirect URLs you expect to use.

> The current backend stores bcrypt hashes in the `donors`/`ngos` tables and issues JWTs directly, so Supabase Auth is optional.

---

## 7. Run the App Locally

```bash
# Backend (Supabase mode)
cd backend
npm run dev

# Frontend (separate terminal)
npm start
```

Register a donor and an NGO, connect them, create a donation, and post a requirement. Verify data in the Supabase dashboard (`donors`, `ngos`, `donor_ngo_links`, `donations`, `requirements`).

---

## 8. Schema Highlights

- **donors**: profile information, bcrypt password hash, verification flag.
- **ngos**: NGO mission statement, awards, branding, verification status.
- **donor_ngo_links**: tracks donor ↔ NGO relationships (`interested`, `active`, `inactive`, `blocked`).
- **donations**: monetary and in-kind donations with quantity, payment metadata, anonymity, delivery scheduling.
- **requirements**: NGO requests (category, priority, quantity, deadlines).

---

## 9. Row Level Security (RLS)

RLS policies are not included in `supabase_schema.sql`.  
Because the backend uses the service role key, it bypasses RLS and enforces permissions itself.  
If you later expose Supabase directly to the frontend, add appropriate RLS policies to secure access.

---

## 10. Deployment Notes

- When deploying the backend (e.g., to Railway or Render), replicate the environment variables from step 3.
- Keep the service role secret in server environments only.
- The schema can be customized by editing `supabase_schema.sql` before applying migrations.

---

## Troubleshooting

| Issue | Fix |
| --- | --- |
| `Supabase client not initialised` | Check that `USE_SUPABASE=true` and both `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set. |
| Schema errors (`relation already exists`) | Tables may already exist; drop them manually or run only missing sections. |
| Backend still using MySQL | Ensure `USE_SUPABASE=true`, restart the backend, and remove conflicting toggles (`USE_POSTGRES`). |
| Invalid JWT errors | Verify `JWT_SECRET` is consistent between server restarts. |

For advanced usage (indexes, views, CRON jobs), extend `supabase_schema.sql` or use Supabase Functions.

