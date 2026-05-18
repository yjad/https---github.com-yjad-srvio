process.env.JSON_SERVER_BODY_LIMIT = '50mb';
import { execSync } from 'child_process';
import { createServer } from 'http';
import { readFileSync, existsSync, writeFileSync, mkdirSync, unlinkSync, readdirSync, rmSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import crypto from 'crypto';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { Observer } from 'json-server/lib/adapters/observer.js';
import { NormalizedAdapter } from 'json-server/lib/adapters/normalized-adapter.js';
import { createApp } from 'json-server/lib/app.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.resolve(__dirname, 'db.json');

// ── Config ──────────────────────────────────────────────────
const UPLOADS_DIR = process.env.SRVIO_UPLOADS_DIR || path.resolve(__dirname, 'uploads');
if (!existsSync(UPLOADS_DIR)) mkdirSync(UPLOADS_DIR, { recursive: true });

// json-server v1 requires a `public` dir to exist even when static: []
const PUBLIC_DIR = path.resolve(__dirname, 'public');
if (!existsSync(PUBLIC_DIR)) mkdirSync(PUBLIC_DIR, { recursive: true });

// Run seed
try {
  execSync('node seed.js', { cwd: __dirname, stdio: 'inherit', shell: true });
} catch { }

// Handle empty file
if (existsSync(DB_PATH) && readFileSync(DB_PATH, 'utf-8').trim() === '') {
  writeFileSync(DB_PATH, '{}');
}

// Set up lowdb
const adapter = new JSONFile(DB_PATH);
const observer = new Observer(new NormalizedAdapter(adapter));
const db = new Low(observer, {});
await db.read();

// Create json-server app — handles GET, PUT, PATCH, DELETE
const jsonApp = createApp(db, { logger: false, static: [] });

// Custom HTTP server
// json-server v1's Service.create ALWAYS overwrites id with randomId(),
// ignoring any client-provided id. We handle POST ourselves so numeric
// IDs from nextId() are preserved.
const MIME_MAP = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png', '.gif': 'image/gif',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

const server = createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // ── Static file serving ─────────────────────────────
  if (req.method === 'GET' && req.url.startsWith('/uploads/')) {
    const relativePath = req.url.replace(/^\/uploads\//, '');
    const filePath = path.resolve(UPLOADS_DIR, relativePath);
    if (!filePath.startsWith(UPLOADS_DIR)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }
    if (existsSync(filePath)) {
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME_MAP[ext] || 'application/octet-stream' });
      res.end(readFileSync(filePath));
      return;
    }
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  // ── File upload endpoint ────────────────────────────
  if (req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', async () => {
      try {
        const parsed = JSON.parse(body);
        const collection = req.url?.split('?')[0].split('/').filter(Boolean)[0];

        // Upload handler
        if (collection === 'upload') {
          const { data, name, subfolder } = parsed;
          const ext = (name || 'file.jpg').split('.').pop() || 'jpg';
          const fileName = `${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${ext}`;
          const subDir = subfolder || 'attachments';
          const dir = path.join(UPLOADS_DIR, subDir);
          if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
          const filePath = path.join(dir, fileName);
          const base64Data = data.replace(/^data:.*?;base64,/, '');
          writeFileSync(filePath, base64Data, 'base64');
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ url: `/uploads/${subDir}/${fileName}` }));
          return;
        }

        // json-server collection POST
        if (!collection || !Array.isArray(db.data?.[collection])) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid collection' }));
          return;
        }

        // If no id provided, generate one matching json-server's format
        if (!parsed.id) {
          parsed.id = crypto.randomBytes(8).toString('base64url');
        }
        db.data[collection].push(parsed);
        await db.write();
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(parsed));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON body' }));
      }
    });
    return;
  }

  // ── File delete endpoint ────────────────────────────
  if (req.method === 'DELETE' && req.url === '/upload') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        const { url } = JSON.parse(body);
        if (url === '__all__') {
          // Clear entire uploads directory
          const entries = readdirSync(UPLOADS_DIR);
          for (const entry of entries) {
            rmSync(path.join(UPLOADS_DIR, entry), { recursive: true, force: true });
          }
          res.writeHead(200);
          res.end(JSON.stringify({ ok: true }));
          return;
        }
        const relativePath = url.replace(/^\/uploads\//, '');
        const filePath = path.resolve(UPLOADS_DIR, relativePath);
        if (filePath.startsWith(UPLOADS_DIR) && existsSync(filePath)) {
          unlinkSync(filePath);
          res.writeHead(200);
          res.end(JSON.stringify({ ok: true }));
          return;
        }
      } catch {
        /* ignore */
      }
      res.writeHead(204);
      res.end();
    });
    return;
  }

  // All other methods (GET, PUT, PATCH, DELETE) → json-server
  jsonApp.attach(req, res);
});

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1';

server.listen(PORT, HOST, () => {
  console.log(`\n  Srvio API running on ${HOST}:${PORT}\n  Press CTRL-C to stop\n`);
});


