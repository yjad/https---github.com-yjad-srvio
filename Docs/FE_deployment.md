# Frontend (Static Site) Deployment to Render — Step by Step

---

## Prerequisites

- API Web Service already deployed and running on Render
- You have the API service URL (e.g. `https://srvio-api-xxxxx.onrender.com`)

---

## Step 1: Ensure `VITE_API_URL` is Used in mockApi

Before deploying, confirm `src/api/mockApi.ts` reads the API base URL from `import.meta.env.VITE_API_URL` instead of a hardcoded `localhost` value:

```ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
```

---

## Step 2: Deploy Static Site on Render

1. Go to https://dashboard.render.com → **New** → **Static Site**
2. Connect the same GitHub repo → click **Connect**
3. Configure:

| Field | Value |
|-------|-------|
| **Name** | `srvio` |
| **Branch** | `main` |
| **Root Directory** | Leave blank |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `dist` |
| **Plan** | Free |

4. Click **Advanced** → Add Environment Variable:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | URL from Step 1 (e.g. `https://srvio-api-xxxxx.onrender.com`) |

5. Click **Add Rewrite Rule**:

| Source | Destination | Type |
|--------|-------------|------|
| `/*` | `/index.html` | `Rewrite (200)` |

6. Click **Create Static Site**
7. Wait ~3 min for build + deploy

---

## Step 3: Verify

1. Open the Static Site URL (e.g. `https://srvio-xxxxx.onrender.com`)
2. Test login with demo credentials:

| Role | Email | Password |
|------|-------|----------|
| Customer | `john@email.com` | `user123` |
| Provider | `mike@email.com` | `provider123` |
| Admin | `admin@srvio.com` | `admin123` |

3. Open browser DevTools → Network tab → confirm API calls go to `srvio-api-xxxxx.onrender.com`

---

## Redeploying After Code Changes

1. Push code to `main` branch — Render auto-deploys on push
2. Or manually trigger a deploy: **Manual Deploy** → **Deploy latest commit**
3. **Important:** If you change `VITE_API_URL`, you must manually redeploy — Vite bakes env vars into the build at compile time.
