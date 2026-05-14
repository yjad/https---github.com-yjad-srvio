# 💳 Payment Specifications

# Service Hub Marketplace Platform

## MVP Scope — Tax-Ready Architecture with Deferred Advanced Implementation

Version: 2.0
Status: MVP Approved Architecture
Payment Provider: [Stripe](https://stripe.com?utm_source=chatgpt.com) Connect Express

---

# 1. Objective

This document defines the payment architecture, financial workflows, payout handling, dispute handling, and tax-ready financial structure for the Service Hub platform MVP.

The system is designed to:

* securely process customer payments,
* support provider payouts,
* collect platform commissions,
* maintain financial traceability,
* support future tax compliance expansion,
* support future accounting and reconciliation systems.

The MVP intentionally postpones:

* advanced tax automation,
* multi-country tax compliance,
* internal wallet systems,
* double-entry accounting,
* advanced fraud systems,
* automated tax filings.

---

# 2. Architectural Principles

The payment system MUST follow these principles:

| Principle                   | Description                         |
| --------------------------- | ----------------------------------- |
| PCI-safe                    | No raw card storage                 |
| Immutable financial records | Transactions are never deleted      |
| Tax-aware                   | Tax structures exist from MVP       |
| Audit-ready                 | All financial actions are logged    |
| Provider-separated payouts  | Marketplace payout model            |
| Webhook-driven              | Stripe as source of payment truth   |
| Expandable                  | Ready for post-MVP finance features |

---

# 3. Payment Infrastructure

## Payment Provider

Use:

* Stripe Connect Express

Reason:

* marketplace support,
* provider onboarding,
* payout handling,
* lower compliance burden,
* built-in KYC handling.

---

# 4. Marketplace Financial Model

## Marketplace Structure

The platform acts as:

* marketplace/intermediary.

Providers act as:

* independent service sellers.

The platform:

* facilitates booking and payment,
* deducts commission,
* schedules provider payouts.

---

# 5. Payment Workflow Overview

| Step | Action                            |
| ---- | --------------------------------- |
| 1    | Customer creates booking          |
| 2    | Provider accepts booking          |
| 3    | Customer pays reservation fee     |
| 4    | Booking becomes confirmed         |
| 5    | Provider completes service        |
| 6    | Customer pays remaining balance   |
| 7    | Platform deducts commission       |
| 8    | Provider payout scheduled         |
| 9    | Payout transferred through Stripe |

---

# 6. Financial Rules

## 6.1 Currency Handling

MVP supports:

* single currency only.

All monetary values MUST be stored in:

* minor units.

Example:

```ts id="e7l4y2"
amount = 12550 // = 125.50
currency = "CAD"
```

Floating point values MUST NOT be used.

---

## 6.2 Financial Immutability

Financial records:

* MUST NEVER be deleted,
* MUST be timestamped,
* MUST preserve audit history.

---

# 7. Booking Lifecycle

## Booking Status

| Status      |
| ----------- |
| REQUESTED   |
| ACCEPTED    |
| IN_PROGRESS |
| COMPLETED   |
| CANCELLED   |

---

# 8. Payment Lifecycle

## Payment Status

| Status          |
| --------------- |
| UNPAID          |
| PARTIALLY_PAID  |
| PAYMENT_PENDING |
| FULLY_PAID      |
| REFUNDED        |
| FAILED          |
| DISPUTED        |

---

# 9. Payout Lifecycle

## Payout Status

| Status     |
| ---------- |
| PENDING    |
| PROCESSING |
| PAID       |
| FAILED     |

---

# 10. Reservation Payment Flow

## Reservation Percentage

Configurable system parameter:

```text id="ihc1eo"
reservation_percentage
```

Recommended default:

* 20%

---

## Reservation Workflow

| Step | Action                        |
| ---- | ----------------------------- |
| 1    | Provider accepts booking      |
| 2    | Stripe Payment Intent created |
| 3    | Customer pays reservation fee |
| 4    | Booking confirmed             |

---

# 11. Final Settlement Flow

| Step | Action                               |
| ---- | ------------------------------------ |
| 1    | Provider marks service completed     |
| 2    | Customer receives settlement request |
| 3    | Customer pays remaining balance      |
| 4    | Platform deducts fees                |
| 5    | Provider payout scheduled            |

---

# 12. Commission Model

## Platform Commission Formula

```text id="7n8pff"
Provider Payout =
Customer Paid Amount
- Platform Commission
- Stripe Processing Fees
- Applicable Penalties
```

---

## Configurable Financial Parameters

| Parameter                        |
| -------------------------------- |
| reservation_percentage           |
| platform_commission_percentage   |
| payout_delay_days                |
| customer_free_cancellation_hours |
| vendor_free_cancellation_hours   |
| customer_late_cancellation_fee   |
| vendor_late_cancellation_fee     |

---

# 13. Cancellation Rules

## 13.1 Customer Cancellation

### Free Cancellation

Allowed during:

```text id="0h1p0t"
customer_free_cancellation_hours
```

Result:

* full reservation refund.

---

## Late Cancellation

Penalty:

* fixed amount OR percentage.

Penalty source:

* reservation payment.

---

# 13.2 Provider Cancellation

### Free Provider Cancellation

Allowed during:

```text id="ayw8z5"
vendor_free_cancellation_hours
```

---

## Late Provider Cancellation

Penalty handling:

* deducted from future payouts.

---

# 14. Dispute Management

## MVP Scope

MVP supports:

* manual internal dispute handling only.

MVP excludes:

* automated arbitration,
* evidence management,
* external dispute integrations.

---

## Dispute States

| State             |
| ----------------- |
| OPEN              |
| UNDER_REVIEW      |
| RESOLVED_PROVIDER |
| RESOLVED_CUSTOMER |
| CLOSED            |

---

# 15. CUSTOMER_SERVICE Role

## Permissions

| Capability           |
| -------------------- |
| View bookings        |
| View users           |
| View payments        |
| View payouts         |
| Add dispute comments |
| Resolve disputes     |
| Issue refunds        |
| Access audit logs    |

---

# 16. Stripe Integration Requirements

## Backend Stack

* Spring Boot
* stripe-java SDK

---

## Frontend Stack

* React 19
* Stripe Elements
* @stripe/react-stripe-js

---

# 17. Required Stripe Features

| Feature                |
| ---------------------- |
| Payment Intents        |
| Stripe Connect Express |
| Webhooks               |
| Transfers              |
| Payout APIs            |

---

# 18. Required Webhooks

| Webhook Event                 |
| ----------------------------- |
| payment_intent.succeeded      |
| payment_intent.payment_failed |
| charge.refunded               |
| payout.paid                   |
| payout.failed                 |

---

# 19. Webhook Security

## Mandatory Requirements

### Signature Verification

All Stripe webhook signatures MUST be validated.

---

### Idempotency

Webhook events MUST NOT be processed more than once.

Required storage:

| Field           |
| --------------- |
| stripe_event_id |
| processed_at    |

---

# 20. Payment Transaction Storage

## payment_transaction

| Field                    | Type      |
| ------------------------ | --------- |
| id                       | UUID      |
| booking_id               | UUID      |
| stripe_payment_intent_id | String    |
| transaction_type         | Enum      |
| amount                   | Integer   |
| currency                 | String    |
| status                   | Enum      |
| created_at               | Timestamp |

---

## Transaction Types

| Type          |
| ------------- |
| RESERVATION   |
| FINAL_PAYMENT |
| REFUND        |
| PENALTY       |

---

# 21. Tax Architecture & Compliance

## 21.1 Tax Strategy

The platform is designed with:

* tax-ready architecture,
* deferred advanced tax implementation.

The MVP supports:

* tax-aware pricing,
* tax metadata storage,
* future tax expansion.

The MVP does NOT support:

* automated tax remittance,
* automated tax filing,
* marketplace facilitator tax handling,
* automated CRA reporting.

---

# 21.2 Canadian Tax Support

The architecture MUST support future implementation of:

| Tax Type |
| -------- |
| GST      |
| HST      |
| PST      |
| QST      |

---

# 21.3 Marketplace Tax Model

For MVP:

* providers are independent sellers,
* providers are responsible for service taxes,
* platform is responsible for taxes on platform commissions and fees.

Legal agreements MUST explicitly state:

* providers are responsible for their tax obligations.

---

# 21.4 Tax-Aware Pricing Model

The system MUST separate:

* subtotal,
* taxes,
* commissions,
* fees.

---

## Required Pricing Fields

| Field            |
| ---------------- |
| subtotal_amount  |
| tax_amount       |
| tax_type         |
| tax_rate         |
| province_code    |
| platform_fee     |
| platform_fee_tax |
| total_amount     |

---

# 21.5 Provider Tax Profile

## provider_tax_profile

| Field                 |
| --------------------- |
| provider_id           |
| legal_business_name   |
| gst_hst_number        |
| qst_number            |
| tax_registered        |
| province              |
| small_supplier_exempt |

---

# 21.6 Province-Based Tax Support

Architecture MUST support:

* province-based taxation,
* customer province detection,
* configurable tax rules.

---

# 21.7 Future Tax Engine Integration

Post-MVP phases MAY integrate:

* [Stripe Tax](https://stripe.com/tax?utm_source=chatgpt.com)
  OR
* external tax providers.

Future features:

* automatic tax calculation,
* tax threshold tracking,
* tax invoices,
* tax reports.

---

# 21.8 Invoice Requirements (Future)

Future invoices SHOULD support:

| Requirement               |
| ------------------------- |
| Invoice ID                |
| Tax breakdown             |
| Provider legal name       |
| Provider tax registration |
| Customer billing details  |
| Booking reference         |
| Timestamp                 |

---

# 21.9 Refund Tax Handling

Future refund workflows MUST support:

* tax-adjusted refunds,
* partial tax refunds,
* tax audit tracking.

---

# 22. Audit Logging

All financial actions MUST be logged.

## Logged Events

| Event             |
| ----------------- |
| Payment succeeded |
| Payment failed    |
| Refund issued     |
| Booking cancelled |
| Dispute opened    |
| Dispute resolved  |
| Payout sent       |
| Payout failed     |

---

# 23. Provider Earnings Dashboard

Providers can view:

| Feature              |
| -------------------- |
| Pending earnings     |
| Paid earnings        |
| Reservation payments |
| Penalties            |
| Transaction history  |

---

# 24. Admin Financial Dashboard

## Required Metrics

| Metric              |
| ------------------- |
| Platform revenue    |
| Total payouts       |
| Pending payouts     |
| Refund totals       |
| Penalty totals      |
| Reservation revenue |

---

# 25. Payout Strategy

## Delayed Payouts

Recommended payout delay:

```text id="5t1c5x"
3–7 days after service completion
```

Purpose:

* reduce fraud,
* allow dispute handling,
* support refund safety.

---

# 26. Refund Handling

## Refund Types

| Type           |
| -------------- |
| Full Refund    |
| Partial Refund |
| Penalty Refund |

Refunds MUST:

* create transaction records,
* update payment status,
* preserve audit history.

---

# 27. Security & Compliance

## PCI Compliance

The platform MUST:

* use Stripe Elements,
* avoid storing raw card data,
* avoid storing CVV or PAN data.

---

## Authentication Requirements

Admin and CS panels MUST support:

* JWT authentication,
* role-based authorization.

---

# 28. MVP Exclusions

The following are intentionally excluded from MVP:

| Excluded Feature       |
| ---------------------- |
| Internal wallet system |
| Multi-currency         |
| Crypto payments        |
| Subscription billing   |
| Automated tax filing   |
| CRA reporting          |
| Double-entry ledger    |
| AI fraud detection     |
| Advanced chargebacks   |
| Accounting exports     |

---

# 29. Recommended Post-MVP Enhancements

| Enhancement              |
| ------------------------ |
| Double-entry ledger      |
| Stripe Tax integration   |
| Automated reconciliation |
| Chargeback workflows     |
| Tax invoice generation   |
| Multi-country taxation   |
| Financial exports        |
| Fraud scoring            |
| Reserve balances         |
| Provider tax reporting   |

---

# 30. Recommended Service Architecture

| Service              | Responsibility     |
| -------------------- | ------------------ |
| Booking Service      | Booking lifecycle  |
| Payment Service      | Stripe integration |
| Notification Service | Email/SMS          |
| Admin Service        | Finance & disputes |

---

# 31. Success Criteria

The MVP payment system is considered successful when it can:

* process reservation payments reliably,
* support provider payouts safely,
* maintain financial traceability,
* support manual dispute resolution,
* preserve auditability,
* support future tax expansion,
* prevent duplicate webhook processing,
* provide transparent earnings visibility.

---

# 32. Recommended MVP Operational Strategy

Recommended launch sequence:

1. Single province launch
2. Tax-registered providers only
3. Manual accounting reconciliation
4. Stripe Tax integration after validation phase

This minimizes:

* compliance complexity,
* operational risk,
* implementation cost.

---

End of Document
