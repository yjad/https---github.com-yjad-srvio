# Render Free Tier Deployment — Step by Step

---

## Step 1: Push Code to GitHub

```bash
git add package.json src/api/mockApi.ts
git commit -m "Add Render deployment support"
git push
```

---

## Step 2: Deploy Web Service (API Backend)

1. Go to https://dashboard.render.com → **New** → **Web Service**
2. Connect your GitHub repo → click **Connect**
3. Configure:

| Field | Value |
|-------|-------|
| **Name** | `srvio-api` |
| **Region** | Closest to your users |
| **Branch** | `main` |
| **Root Directory** | Leave blank |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Plan** | Free |

4. Click **Advanced** → Add Environment Variable:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |

5. Click **Create Web Service**
6. Wait ~2 min for deploy to finish
7. **Copy the service URL** (e.g. `https://srvio-api-xxxxx.onrender.com`)

---

## Step 3: Deploy Static Site (Frontend)

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
| `VITE_API_URL` | URL from Step 2 (e.g. `https://srvio-api-xxxxx.onrender.com`) |

5. Click **Add Rewrite Rule**:

| Source | Destination | Type |
|--------|-------------|------|
| `/*` | `/index.html` | `Rewrite (200)` |

6. Click **Create Static Site**
7. Wait ~3 min for build + deploy

---

## Step 4: Verify

1. Open the Static Site URL (e.g. `https://srvio-xxxxx.onrender.com`)
2. Test login with demo credentials:

| Role | Email | Password |
|------|-------|----------|
| Customer | `john@email.com` | `user123` |
| Provider | `mike@email.com` | `provider123` |
| Admin | `admin@srvio.com` | `admin123` |

3. Open browser DevTools → Network tab → confirm API calls go to `srvio-api-xxxxx.onrender.com`

---

## Important Notes

- **First request after 15 min inactivity will be slow** (~30 s) — Render spins down free services
- **db.json resets on each deploy** — commit any data changes to the repo or seed them in `seed.js`
- **File uploads are ephemeral** — lost on restart; use S3/Cloudinary for production
