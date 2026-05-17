# Seed Backup & Replace — Implementation Plan

## Goal

When clicking **Replace Seed** in the BrowseDB page:
1. The current `seed.js` (in the project root) is backed up to `backup/seed-{timestamp}.js`
2. A new `seed.js` is written with the current json-server data snapshot

## Problem

The BrowseDB page is a browser SPA. Browsers cannot write files to arbitrary filesystem directories. Two approaches exist.

---

## Option A — Browser Downloads (Current, simple)

**How it works now (already implemented):**
- Click "Replace Seed" → browser downloads two files to the user's download folder:
  - `seed-backup-2026-05-15T10-30-00.js` (old snapshot)
  - `seed-2026-05-15T10-30-00.js` (new snapshot)
- The user **manually moves** the new `seed-{ts}.js` to the project root, renames to `seed.js`, and manually moves the backup to `backup/`

**Pros:**
- Zero server-side changes
- Zero new files or scripts
- Already works today

**Cons:**
- Manual file management (drag files, rename, create backup folder)
- Easy to forget or misplace files

---

## Option B — Seed Server (Automated, more complex)

### Architecture

Add a small Node.js HTTP server (`seed-server.js`, ~50 lines, no npm deps) that:
- Listens on port 3002
- `POST /backup-seed` → copies `seed.js` → `backup/seed-{timestamp}.js`
- `POST /write-seed` → writes provided content → `seed.js`

### New File: `seed-server.js`

```js
import http from 'http';
import fs from 'fs';
import path from 'path';
// ~50 lines total
// Listens on port 3002
// Handles backup-seed and write-seed POST endpoints
// CORS headers for localhost:5173
```

### Modified File: `run.bat`

Add one line after json-server starts:
```bat
echo Starting seed server (port 3002)...
start "srvio-seed" cmd /c "title srvio-seed & node seed-server.js"
```

Add cleanup for the new port:
```bat
taskkill /f /fi "WindowTitle eq srvio-seed" >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3002 " ^| findstr "LISTENING"') do (
    taskkill /f /pid %%a >nul 2>&1
)
```

### Modified File: `src/pages/BrowseDBPage.tsx`

Replace the "Replace Seed" onClick:

```
1. fetch http://localhost:3002/backup-seed         → backs up old seed.js on disk
2. POST http://localhost:3002/write-seed            → writes new seed.js on disk
   body: { content: generatedSeedScript }
3. Show success/error toast via useUIStore
```

Remove the `downloadSeedFile` helper entirely (no more browser downloads for seed).

### Pros:
- Fully automated — one click backs up AND replaces
- Backup lands in the correct folder automatically
- Toast notification confirms success

### Cons:
- New dependency: `seed-server.js` must be running
- `run.bat` needs another line (one more process to manage)
- Bypasses Vite proxy (direct `localhost:3002` call, needs CORS)
- If the server isn't running, the button fails with an error toast

---

## Option C — json-server Route (middle ground)

### Approach

json-server v1 has no middleware support, BUT it has a `--static` flag that serves a directory. We could:

1. Serve the project root as static via `--static .` added to the json-server command
2. But this only serves files for reading, not writing

**Verdict:** Doesn't solve the write problem. Discarded.

---

## Files Summary

### Option A (downloads — already implemented)

| File | Status | Change |
|------|--------|--------|
| `src/pages/BrowseDBPage.tsx` | ✅ Done | Added `initialSnapshotRef` + `downloadSeedFile()` helper; backup + new seed both download with timestamps |

**No other files touched.**

### Option B (seed server — proposed)

| File | Status | Change |
|------|--------|--------|
| `seed-server.js` | **[NEW]** | HTTP server for backup + write operations |
| `run.bat` | Modify | Start + stop seed-server alongside json-server and Vite |
| `src/pages/BrowseDBPage.tsx` | Modify | Replace download with API calls to seed server |

---

## Recommendation

If the manual drag-and-drag/rename process is acceptable, **Option A** is already implemented and working. The user gets two timestamped files in their download folder and handles placement manually.

If fully automated one-click is required, **Option B** adds ~50 lines of server code and one extra process in `run.bat`.
