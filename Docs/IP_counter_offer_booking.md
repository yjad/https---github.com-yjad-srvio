# Counter-Offer Booking & Messaging — Implementation Plan

## Goal

Enable customers and providers to **negotiate a service date/time** via a counter-offer flow, and communicate through a **booking-level messaging thread**. A customer books a service with a preferred date/time; the provider can accept, reject, or propose an alternative. Both parties can chat to reach agreement.

## Current State

| Aspect | Status | Details |
|---|---|---|
| `BookingStatus` type | ⚠️ Missing states | Has `REQUESTED → ACCEPTED → IN_PROGRESS → COMPLETED → CANCELLED`; no counter-offer or messaging |
| `Booking` interface | ⚠️ No proposal fields | No `proposedDate`, `proposedTime`, `offerNote`, `offerRound` |
| `BookingMessage` type | ❌ Missing | No booking messaging system |
| Zod schemas | ⚠️ Partial | `bookingSchema` exists; no `counterOfferSchema`, no `bookingMessageSchema` |
| Mock API | ⚠️ Partial | `createBooking`, `updateBookingStatus`, `getBookingById` exist; no counter-offer or message methods |
| DB collections | ❌ Missing | No `bookingMessages` in `db.json` / `seed.js` |
| BookingsPage | ⚠️ No counter-offer UI | Status tabs + basic actions; no propose/accept-reject-alternative UI |
| ServiceDetailPage | ✅ Booking modal works | Customer fills date, time, address, notes |

## Key Decisions

| Topic | Decision |
|---|---|
| Max negotiation rounds | **3 rounds** — after 3 counter-offers with no acceptance, auto-cancel |
| Status model | New `BookingStatus` values: `COUNTER_OFFERED` added; flow is `REQUESTED → COUNTER_OFFERED ↔ ... → ACCEPTED or CANCELLED` |
| Proposal fields | `proposedDate`, `proposedTime`, `offerNote`, `offerRound` on `Booking` — overwritten each round (history kept in `bookingMessages`) |
| Messaging | New `BookingMessage` entity — append-only chat thread per booking (no edit/delete) |
| Who can propose | Both customer and provider can counter-offer |
| Auto-cancel | When `offerRound >= 3` and status is `COUNTER_OFFERED`, auto-set to `CANCELLED` on next load |

## Booking Negotiation State Machine

```
Customer creates booking
         │
         ▼
    ┌──────────┐
    │ REQUESTED│
    └────┬─────┘
         │
    ┌────┴────────────────────────┐
    ▼                             ▼
┌──────────────┐          ┌───────────┐
│   ACCEPTED   │          │ CANCELLED │ (terminal)
└──────┬───────┘          └───────────┘
       │                     ▲
  Provider or Customer       │
  proposes alternative       │
       │                     │
       ▼                     │
┌──────────────────┐         │
│ COUNTER_OFFERED  │─────────┘ (after 3 rounds → auto-cancel)
└──────────────────┘
       │
  Accept / Counter
       │
       ▼
  (back to ACCEPTED or another COUNTER_OFFERED)
```

### Allowed Transitions

| Current Status | Next Status | Actor |
|---|---|---|
| `REQUESTED` | `ACCEPTED` | Provider |
| `REQUESTED` | `COUNTER_OFFERED` | Provider |
| `REQUESTED` | `CANCELLED` | Customer or Provider |
| `COUNTER_OFFERED` | `ACCEPTED` | Either party |
| `COUNTER_OFFERED` | `COUNTER_OFFERED` | Either party (increment round) |
| `COUNTER_OFFERED` | `CANCELLED` | Either party |

## Implementation Plan

### Step 1 — Types (`src/types/index.ts`)

- Add `'COUNTER_OFFERED'` to `BookingStatus` union
- Add fields to `Booking` interface:

```ts
export interface Booking {
  // ...existing fields...
  proposedDate?: string;       // latest proposed date
  proposedTime?: string;       // latest proposed time
  offerNote?: string;          // note attached to latest proposal
  offerRound?: number;         // 0 = original, 1-3 = counter rounds
}
```

- Add new `BookingMessage` interface:

```ts
export interface BookingMessage {
  id: number;
  bookingId: number;
  fromId: number;
  fromName: string;
  fromRole: UserRole;
  type: 'message' | 'system';   // 'system' for auto-generated (round info, cancellations)
  message: string;
  createdAt: string;
}
```

### Step 2 — Zod Schemas (`src/schemas/index.ts`)

- Add `counterOfferSchema`:

```ts
export const counterOfferSchema = z.object({
  proposedDate: z.string().min(1, 'Date is required'),
  proposedTime: z.string().min(1, 'Time is required'),
  offerNote: z.string().optional(),
});
```

- Add `bookingMessageSchema`:

```ts
export const bookingMessageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(1000),
});
```

- Export types: `CounterOfferInput`, `BookingMessageInput`

### Step 3 — DB + Seed (`db.json`, `seed.js`)

- Add to `db.json`:

```json
"bookingMessages": []
```

- Add to `seed.js` collections reset array: `'bookingMessages'`

### Step 4 — Mock API (`src/api/mockApi.ts`)

Add methods:

| Method | Signature | Notes |
|---|---|---|
| `counterOfferBooking` | `(id, data: { proposedDate, proposedTime, offerNote? }) → Booking` | Validates status is `REQUESTED` or `COUNTER_OFFERED`; increments `offerRound`; sets `proposedDate/Time/note`; status → `COUNTER_OFFERED`; adds system message |
| `acceptBooking` | `(id) → Booking` | If status is `COUNTER_OFFERED`, sets `date=proposedDate`, `time=proposedTime`; status → `ACCEPTED`; adds system message |
| `cancelBooking` | `(id, reason?) → Booking` | Status → `CANCELLED`; adds system message with reason |
| `getBookingMessages` | `(bookingId) → BookingMessage[]` | Sorted by `createdAt` ascending |
| `sendBookingMessage` | `(bookingId, data: { fromId, fromName, fromRole, message }) → BookingMessage` | Type `'message'`; append only |

Precondition checks for `counterOfferBooking`:
1. Booking `status` must be `'REQUESTED'` or `'COUNTER_OFFERED'`
2. `offerRound` must be `< 3`
3. On set: `offerRound = (offerRound || 0) + 1`; if result >= 3, auto-cancel after accept check

Precondition checks for `acceptBooking`:
1. Booking `status` must be `'REQUESTED'` or `'COUNTER_OFFERED'`
2. If `COUNTER_OFFERED`: copy `proposedDate → date`, `proposedTime → time`

### Step 5 — BookingsPage Updates (`src/pages/BookingsPage.tsx`)

#### 5a — Counter-Offer UI (provider + customer)

When booking is `REQUESTED` or `COUNTER_OFFERED`:

**Provider view sees:**
- **Accept** button (sets date/time from proposed if counter-offered, or original if requested)
- **Propose Alternative** button → opens modal with date/time/note fields
- **Reject** button → cancels booking

**Customer view sees (when `COUNTER_OFFERED`):**
- Display proposed date/time/note from provider
- **Accept** button
- **Propose Alternative** button → opens modal
- **Reject** button

When `offerRound >= 2` (one round left), show warning: "Final negotiation round — next proposal or acceptance is required."

#### 5b — Messaging Thread

- Collapsible messaging section at the bottom of each booking card (expanded when booking is active/negotiating)
- Message list (oldest first) with `fromName`, `fromRole` badge, timestamp
- System messages styled differently (centered, gray, italic)
- Text input + send button at bottom
- Messages auto-load when expanding the section (lazy load via `getBookingMessages`)

### Step 6 — i18n (`src/i18n/index.ts`)

Add EN/AR keys:

```ts
// EN
counter_offer: {
  propose_alternative: 'Propose Alternative',
  accept_proposal: 'Accept Proposal',
  reject: 'Reject',
  proposed_date: 'Proposed Date',
  proposed_time: 'Proposed Time',
  offer_note: 'Note (optional)',
  round_warning: 'Final negotiation round — next proposal or acceptance is required.',
  max_rounds_reached: 'Maximum negotiation rounds reached. Booking has been cancelled.',
  booking_accepted: 'Booking accepted!',
  booking_cancelled: 'Booking cancelled.',
  counter_offer_sent: 'Counter-offer sent.',
  original_date: 'Original Date & Time',
  proposed_by: 'Proposed by',
  messages: 'Messages',
  send_message: 'Send a message...',
  system: 'System',
}

// AR
counter_offer: {
  propose_alternative: 'اقترح بديلاً',
  accept_proposal: 'قبول العرض',
  reject: 'رفض',
  proposed_date: 'التاريخ المقترح',
  proposed_time: 'الوقت المقترح',
  offer_note: 'ملاحظة (اختياري)',
  round_warning: 'جولة التفاوض الأخيرة — يتطلب قبول أو اقتراح تاني.',
  max_rounds_reached: 'تم الوصول للحد الأقصى من جولات التفاوض. تم إلغاء الحجز.',
  booking_accepted: 'تم قبول الحجز!',
  booking_cancelled: 'تم إلغاء الحجز.',
  counter_offer_sent: 'تم إرسال العرض المضاد.',
  original_date: 'التاريخ والوقت الأصلي',
  proposed_by: 'اقترحه',
  messages: 'الرسائل',
  send_message: 'أرسل رسالة...',
  system: 'النظام',
}
```

### Step 7 — Zod Validation for Counter-Offer Modal

```ts
// In counter-offer modal
const result = counterOfferSchema.safeParse(formData);
if (!result.success) { /* set errors */ }
```

### Step 8 — Build & Verify

- `npm run build` — zero errors
- Verify: REQUESTED → counter-offer → COUNTER_OFFERED → accept → ACCEPTED
- Verify: 3 rounds → auto-cancel
- Verify: messaging thread shows all messages + system entries
- Verify: EN/AR translations for all new strings

## File Change Summary

| File | Changes |
|---|---|
| `src/types/index.ts` | +`COUNTER_OFFERED` status, +Booking proposal fields, +`BookingMessage` interface |
| `src/schemas/index.ts` | +`counterOfferSchema`, +`bookingMessageSchema` |
| `db.json` | +`bookingMessages: []` |
| `seed.js` | +`bookingMessages` in reset list |
| `src/api/mockApi.ts` | +5 methods (counterOffer, accept, cancel, getMessages, sendMessage) |
| `src/pages/BookingsPage.tsx` | +Counter-offer modal, accept/reject UI, messaging thread |
| `src/i18n/index.ts` | +EN/AR `counter_offer.*` keys |
