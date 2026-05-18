# Implementation Plan: Render Deployment

## Changes Made

### 1. Added `start` script to `package.json`
```json
"start": "node start-api.mjs"
```
This uses the existing API server that's already built (`start-api.mjs`).

### 2. Made API URL configurable in `src/api/mockApi.ts`
```ts
const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';
```
- Local dev: falls back to `/api` (Vite proxy or localhost)
- Production: uses `VITE_API_URL` env var (Render Static Site env var)

### 3. Moved `json-server` to `dependencies`
Required at runtime by `start-api.mjs`. Was in `devDependencies` which may be skipped on Render with `NODE_ENV=production`.

---

## Render Configuration

### Web Service (API Backend)

| Setting | Value |
|---------|-------|
| **Type** | Web Service |
| **Root Directory** | (project root) |
| **Environment** | Node |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Plan** | Free |

**Environment Variables:**
- `NODE_ENV`: `production`
- `SRVIO_UPLOADS_DIR`: `/tmp/uploads` *(Render's filesystem is ephemeral; use external storage for production)*

**Important Notes:**
- Free tier spins down after 15 min of inactivity
- `db.json` is seeded from `seed.js` on startup (runs automatically via `start-api.mjs`)
- The server binds to `0.0.0.0` and uses Render's `$PORT` env var automatically
- File uploads are stored in-memory/ephemeral; they will be lost on restart

---

### Static Site (Frontend SPA)

| Setting | Value |
|---------|-------|
| **Type** | Static Site |
| **Root Directory** | (project root) |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `dist` |
| **Plan** | Free |

**Environment Variables:**
- `VITE_API_URL`: `https://<your-api-service>.onrender.com` *(set to Web Service URL after deploying it)*

**SPA Rewrites (Required for React Router):**
```
Source: /*
Destination: /index.html
Type: 200 (Rewrite)
```

---

## Deployment Steps

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Add Render deployment support"
git push
```

### Step 2: Create Web Service (API)
1. Go to https://dashboard.render.com
2. New → **Web Service**
3. Connect your GitHub repo
4. Configure:
   - **Name**: `srvio-api`
   - **Region**: Choose closest to your users
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free
5. Add env var: `NODE_ENV` = `production`
6. Click **Create Web Service**
7. Wait for deployment, copy the URL (e.g., `https://srvio-api-xxxx.onrender.com`)

### Step 3: Create Static Site (Frontend)
1. Go to https://dashboard.render.com
2. New → **Static Site**
3. Connect your GitHub repo
4. Configure:
   - **Name**: `srvio`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - **Plan**: Free
5. Add env var: `VITE_API_URL` = `https://srvio-api-xxxx.onrender.com` *(from Step 2)*
6. Add SPA Rewrite rule: `/*` → `/index.html` (200)
7. Click **Create Static Site**

### Step 4: Verify
- Open the Static Site URL
- Try logging in with demo credentials
- Check that API calls work (Network tab → requests should hit your Web Service URL)

---

## Architecture

```
┌─────────────────────────────┐
│   Render Static Site        │
│   (Vite SPA - React 19)     │
│   srvio-xxxx.onrender.com   │
│                             │
│   All fetch() calls →       │
│   VITE_API_URL env var      │
└──────────┬──────────────────┘
           │ HTTPS
           ▼
┌─────────────────────────────┐
│   Render Web Service        │
│   (json-server API)         │
│   srvio-api-xxxx.onrender.com│
│                             │
│   Port: $PORT (auto)        │
│   DB: db.json (seeded)      │
│   Uploads: ephemeral /tmp   │
└─────────────────────────────┘
```

---

## Limitations (Free Tier)

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| Web Service sleeps after 15 min | First API request after sleep takes ~30s to respond | Acceptable for demo/test |
| Ephemeral filesystem | File uploads lost on restart | Use S3/Cloudinary in production |
| db.json resets on each deploy | Data persisted only in `db.json` in repo | Commit `db.json` changes or use a real DB |
| 750 hrs/month limit | If usage exceeds, service stops | Monitor dashboard |

---

## Post-Deployment Checklist

- [ ] Web Service deployed and responding at `https://srvio-api-xxxx.onrender.com`
- [ ] Static Site deployed and accessible
- [ ] `VITE_API_URL` env var set on Static Site
- [ ] SPA Rewrite rule added (`/*` → `/index.html`)
- [ ] Login with demo credentials works
- [ ] Service browsing works
- [ ] Booking creation works
- [ ] File uploads work (ephemeral on free tier)
- [ ] Admin dashboard loads stats
