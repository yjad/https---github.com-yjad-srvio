# isVerified Default Value — Fix by Role

## 1. Problem

In `mockApi.ts:83`, the `register()` function sets `isVerified: false` for **all** newly registered users regardless of role. This is incorrect:

- **CUSTOMER** and **CUSTOMER_SERVICE** roles should be `isVerified: true` by default (no verification needed)
- **PROVIDER** role should remain `isVerified: false` (requires admin verification)

The seed data in `db.json` already reflects this intent: all CUSTOMER seed users have `isVerified: true`, while PROVIDER users have a mix (some `true`, some `false`).

## 2. Change

### `src/api/mockApi.ts` — `register()` function (~line 83)

Replace:
```ts
isVerified: false,
```

With:
```ts
isVerified: input.role === 'PROVIDER' ? false : true,
```

## 3. Files Affected

| File | Change |
|------|--------|
| `src/api/mockApi.ts` | Change one line in `register()` |

## 4. Verification

```bash
npm run build     # zero errors
```

### Manual test

1. Register a new CUSTOMER → `isVerified` should be `true`
2. Register a new PROVIDER → `isVerified` should be `false`
3. Verify admin dashboard shows correct status badges
