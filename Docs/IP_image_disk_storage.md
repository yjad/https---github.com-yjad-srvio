# Image Storage — Implementation Plan

## Goal

Replace inline base64 strings and external URLs with clean **path references**. Images are stored as a separate collection in json-server, keeping service/comment objects clean. Path format: `images/services/<uuid>.jpg`.

## Current State

| Storage Type | Examples | Problems |
|---|---|---|
| External URLs | `https://images.unsplash.com/...` | Broken if URL changes or goes offline; no upload control |
| Base64 inline | `data:image/jpeg;base64,/9j/4AA...` (service IDs 13, 26) | Bloat in `db.json` (up to ~100KB per image); mixed with service data |
| External placeholders | `https://placehold.co/...` (seed.js) | Placeholder only, not real images |

Three image types exist:
- **`Service.image`** — main service photo (stored as URL or base64 string)
- **`User.avatar`** — user profile photo (always empty `''`, never rendered)
- **`Service.providerAvatar`** — provider photo on service (always empty `''`, never rendered)
- **`ServiceComment.attachments[]`** — comment file attachments (stored as base64 data URLs)

## Proposed Architecture (Prototype-Friendly)

No dedicated server needed. Store image blobs as a **separate collection** in `db.json`. Images are referenced by clean path strings.

```
┌─────────────────────┐       ┌──────────────────────────┐
│   Service.image     │──────→│  imageBlobs collection   │
│   "images/services/ │       │  {                       │
│    abc-123.jpg"     │       │    id: "abc-123.jpg",    │
│                     │       │    data: "base64...",    │
│                     │       │    type: "services"      │
│                     │       │  }                       │
└─────────────────────┘       └──────────────────────────┘
```

### How it works

1. User uploads a file via `ImageUpload` (canvas resize → base64 — already works)
2. `mockApi.saveImage(data, type)` stores it in `imageBlobs` collection and returns a unique path
3. `mockApi.getImagePath(path)` returns the base64 data for rendering
4. All display components use a helper that resolves path → blob → `<img>`

### What stays the same

- `ImageUpload` component — still does canvas resize + base64 generation
- `ServiceImage` component — still renders an `<img>`
- `ServiceCommentThread` — still shows attachment thumbnails
- `Service.image`, `User.avatar`, `ServiceComment.attachments` — still `string` / `string[]`

### What changes

#### `db.json`

Add new top-level collection:

```json
"imageBlobs": [
  {
    "id": "services_abc123.jpg",
    "data": "/9j/4AAQSkZJRg...",
    "type": "services",
    "createdAt": "2026-05-15"
  }
]
```

#### `seed.js`

Add empty `imageBlobs: []` to default seed data.

#### `src/api/mockApi.ts`

Add methods:

```typescript
// Store a base64 image and return its path reference
async saveImage(data: string, type: 'services' | 'avatars' | 'attachments'): Promise<string> {
  const ext = data.startsWith('data:image/png') ? 'png' : 'jpg';
  const id = `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  await api(`/imageBlobs`, {
    method: 'POST',
    body: JSON.stringify({ id, data, type, createdAt: new Date().toISOString() }),
  });
  return `images/${type}/${id}`;
}

// Resolve a path reference back to base64 data
async getImageBlob(path: string): Promise<string | null> {
  const filename = path.split('/').pop();
  try {
    const blob = await api<{ data: string }>(`/imageBlobs/${filename}`);
    return blob.data;
  } catch { return null; }
}

// Delete an image blob
async deleteImage(path: string): Promise<void> {
  const filename = path.split('/').pop();
  await fetch(`${BASE}/imageBlobs/${filename}`, { method: 'DELETE' }).catch(() => {});
}
```

#### `src/components/shared.tsx` — `ImageUpload`

After canvas generates base64, call `mockApi.saveImage(dataUrl, 'services')` and pass the returned path to `onChange`. The component interface stays identical.

#### `src/components/shared.tsx` — `ServiceImage`

Add a resolver step: if `image` starts with `"images/"`, fetch from `imageBlobs` and use the base64. If it's already a URL or data URL, use as-is.

```tsx
const [resolved, setResolved] = useState(image);
useEffect(() => {
  if (image?.startsWith('images/')) {
    mockApi.getImageBlob(image).then(data => {
      if (data) setResolved(data);
    });
  } else {
    setResolved(image);
  }
}, [image]);
```

#### `src/types/index.ts`

No changes needed.

#### Migration (One-Time in BrowseDBPage)

Add a "Migrate Images" button that:
1. Scans all services for `data:image/...` base64 strings
2. Calls `mockApi.saveImage(data, 'services')` for each
3. Calls `mockApi.updateService(id, { image: returnedPath })` to replace
4. Shows progress

### Files Summary

| File | Change |
|---|---|
| `db.json` | Add `imageBlobs: []` collection |
| `seed.js` | Add `imageBlobs: []` to default seed |
| `src/api/mockApi.ts` | Add `saveImage`, `getImageBlob`, `deleteImage` |
| `src/components/shared.tsx` | `ImageUpload` → save via mockApi; `ServiceImage` → resolve path to blob |
| `src/components/ServiceCommentThread.tsx` | Attachments → save via mockApi |
| `src/types/index.ts` | No changes |
| `image-config.json` | **[DISCARDED]** — not needed |
| `image-server.js` | **[DISCARDED]** — not needed |
| `run.bat` | No changes |
| `vite.config.ts` | No changes |

### Future Path to Real Disk Storage

When moving to a real backend (Spring Boot or Node), the migration path is:

1. Server reads `imageBlobs` collection
2. Writes each blob to disk as `<storagePath>/<id>`
3. Drops the `imageBlobs` collection
4. Path references (`images/services/abc.jpg`) stay the same — only the resolution changes from `imageBlobs` lookup to static file serving
