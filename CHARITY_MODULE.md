# Charity Module — SuperHR (v2)

> **Version 2 — simplified, single-migration design**
> All legacy tables (campaigns, donation companies, beneficiary groups, locations,
> distribution evidences, donation logs) have been removed. Everything lives in
> 6 tables, 5 controllers, 5 route files.

---

## Table of Contents

1. [Overview](#overview)
2. [Roles & Permissions](#roles--permissions)
3. [Database Schema](#database-schema)
4. [API Reference](#api-reference)
   - [Teams](#teams--apicharity teams)
   - [Beneficiaries](#beneficiaries--apicharity beneficiaries)
   - [Donations](#donations--apicharity donations)
   - [Requests & Approvals](#requests--approvals--apicharity requests)
   - [Settings](#settings--apicharity settings)
5. [Workflows](#workflows)
6. [JSON Field Shapes](#json-field-shapes)
7. [File Structure](#file-structure)

---

## Overview

The Charity Module manages the full lifecycle of team-based charitable donations
inside SuperHR — from team setup and beneficiary registration through itemised
donations, admin approval, delivery tracking, and adjustment requests.

**Core philosophy (v2):**
- One migration file, zero patch migrations
- Recurring schedules live inside a single JSONB column — no separate interval table
- Every action requiring admin sign-off flows through one approval table (`charity_request_approve`)
- A donation item always knows if it has an in-flight adjustment via `on_adjustment`

---

## Roles & Permissions

| Role | What they can do |
|---|---|
| `admin` | Everything |
| `charity_admin` | Full charity access — approve/reject requests, manage all data |
| `charity_teamleader` | Manage their own team's beneficiaries and donations, submit requests |

**Scope rules:**
- `charity_teamleader` automatically sees only their own team's data on list endpoints
- Creating a beneficiary or team as a `charity_teamleader` always generates a `NewBeneficiary` / `NewCharityTeam` approval request
- `charity_admin` creates directly with no approval step needed

---

## Database Schema

### `charity_teams`
| Column | Type | Notes |
|---|---|---|
| `team_id` | INTEGER PK | |
| `name` | VARCHAR(150) | |
| `description` | TEXT | |
| `head_employee_id` | FK → employees | Team leader |
| `vice_employee_id` | FK → employees | Deputy |
| `members` | JSONB | `[employee_id, ...]` |
| `is_active` | BOOLEAN | `false` cascades to all beneficiaries |
| `created_by` | FK → users | |

### `charity_beneficiaries`
| Column | Type | Notes |
|---|---|---|
| `beneficiary_id` | INTEGER PK | |
| `name` | VARCHAR(200) | Top-level for SQL filtering |
| `type` | ENUM | `individual` \| `organization` |
| `full_info` | JSONB | `{ location: {region,city,woreda}, contact: {phone,email}, ... }` |
| `team_id` | FK → charity_teams | |
| `is_active` | BOOLEAN | |
| `created_by` | FK → users | |

### `charity_donation`
| Column | Type | Notes |
|---|---|---|
| `donation_id` | INTEGER PK | |
| `team_id` | FK → charity_teams | |
| `total_value_in_birr` | DECIMAL(15,2) | Auto-recalculated from items |
| `status` | ENUM | `draft` → `pending` → `approved` \| `cancelled` |
| `description` | TEXT | |
| `donation_delivery_date` | DATEONLY | Global target delivery date for all items |
| `created_by` | FK → users | |

### `charity_donation_item`
| Column | Type | Notes |
|---|---|---|
| `donation_item_id` | INTEGER PK | |
| `donation_id` | FK → charity_donation | Cascades on delete |
| `beneficiary_id` | FK → charity_beneficiaries | Restricted delete |
| `type` | ENUM | `money` \| `goods` \| `service` |
| `description` | VARCHAR(255) | e.g. "Rice bags", "School uniform" |
| `quantity` | DECIMAL(10,2) | One-time only (null for recurring) |
| `unit_value_in_birr` | DECIMAL(15,2) | `quantity × unit = total` |
| `total_value_in_birr` | DECIMAL(15,2) | Maintained by app |
| `payment_method` | ENUM | `bank` \| `cash` |
| `is_recurring` | JSONB | `null` = one-time, see [JSON shapes](#json-field-shapes) |
| `is_returned` | JSONB | `null` \| `{ reason: "..." }` |
| `is_delivered` | BOOLEAN | |
| `bank_receipts` | JSONB | `["https://.../receipt1.pdf", ...]` |
| `on_adjustment` | JSONB | `null` \| `{ adjustment_id, status }` — in-flight request tracker |
| `created_by` | FK → users | |

### `charity_request_approve`
Single table for every action that needs `charity_admin` sign-off.

| Column | Type | Notes |
|---|---|---|
| `request_id` | INTEGER PK | |
| `user_id` | FK → users | Admin this request is routed to |
| `action` | ENUM | See table below |
| `requested_by` | FK → users | Who submitted |
| `status` | ENUM | `draft` \| `pending` \| `approved` \| `rejected` \| `commented` |
| `approved_by` | FK → users | |
| `rejected_by` | FK → users | |
| `reviewed_at` | TIMESTAMP | When the admin acted |
| `comments` | JSONB | `[{ user_id, text, created_at }, ...]` |
| `metadata` | JSONB | Context — see action table below |

**Action → metadata mapping:**

| Action | `metadata` keys populated |
|---|---|
| `NewBeneficiary` | `beneficiary_id` |
| `NewCharityTeam` | `charity_team_id` |
| `TransferBeneficiary` | `beneficiary_id`, `from_team_id`, `charity_team_id`, `reason` |
| `Deduct` | `donation_item_id`, `recurring_interval_id?`, `reason` |
| `Increase` | `donation_item_id`, `recurring_interval_id?`, `reason` |
| `Transfer` | `donation_item_id`, `recurring_interval_id?`, `reason` |
| `Return` | `donation_item_id`, `reason` |

### `charity_settings`
| Column | Type | Notes |
|---|---|---|
| `setting_id` | INTEGER PK | |
| `setting_key` | VARCHAR(50) UNIQUE | Default `'main'` |
| `companies` | JSONB | `[{ name, full_info: { phone, email, address } }, ...]` |
| `config` | JSONB | Spare bucket for future global config |
| `updated_by` | FK → users | |

---

## API Reference

### Teams — `/api/charity/teams`

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/` | all | List teams. Teamleader sees only their team. Supports `?search`, `?isActive`, `?page`, `?size` |
| GET | `/:id` | all | Single team with head, vice, active beneficiaries |
| GET | `/:id/beneficiaries` | all | Paginated beneficiary list for a team. Supports `?search`, `?type`, `?isActive` |
| POST | `/` | all | Create team. Teamleader → also creates `NewCharityTeam` approval request |
| PUT | `/:id` | admin, charity_admin | Update name / description / head / vice / members |
| DELETE | `/:id` | admin, charity_admin | `is_active: false` **and cascades to all team's beneficiaries** |
| POST | `/:id/transfer-beneficiary` | all | Submit `TransferBeneficiary` approval request |
| GET | `/stats/summary` | admin, charity_admin | `{ total, active, inactive }` |

---

### Beneficiaries — `/api/charity/beneficiaries`

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/` | all | List. Teamleader auto-scoped to their team. Supports `?search`, `?type`, `?isActive`, `?teamId` |
| GET | `/:id` | all | Single beneficiary with team info |
| POST | `/` | all | Create. Admin → direct. Teamleader → creates `NewBeneficiary` request |
| PUT | `/:id` | admin, charity_admin | Update name / type / fullInfo / teamId |
| DELETE | `/:id` | admin, charity_admin | `is_active: false` (soft deactivate) |
| GET | `/stats/summary` | all | `{ total, active, inactive, individuals, organizations }` |

---

### Donations — `/api/charity/donations`

#### Donation header

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/` | all | List. Teamleader sees only their team. Supports `?status`, `?teamId`, `?fromDate`, `?toDate` |
| GET | `/:id` | all | Full detail — header + all items |
| POST | `/` | all | Create donation (status: `draft`). Teamleader auto-assigned to their team |
| PUT | `/:id` | all | Edit description / donationDeliveryDate. **Draft only** |
| POST | `/:id/submit` | all | `draft → pending`. Requires ≥1 item |
| POST | `/:id/approve` | admin, charity_admin | `pending → approved` |
| POST | `/:id/cancel` | admin, charity_admin | Any status → `cancelled` |
| GET | `/stats/summary` | all | `{ total, totalValue, statusBreakdown }` |

#### Donation items

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/:id/items` | all | List items for a donation. Teamleader access-checked against their team. Supports `?type`, `?isDelivered` |
| POST | `/:id/items` | all | Add item. **Draft only**. Recurring schedule passed as `isRecurring` JSON |
| PUT | `/items/:itemId` | all | Edit item (description, quantity, unitValue, recurring). **Draft only** |
| DELETE | `/items/:itemId` | all | Soft-delete (paranoid). **Draft only**. Recalculates donation total |
| POST | `/items/:itemId/deliver` | all | Set `is_delivered: true`. Donation must be **approved** |
| POST | `/items/:itemId/return` | all | Set `is_returned: { reason }`. Clears `is_delivered` |
| POST | `/items/:itemId/receipts` | all | Upload bank receipt files (multipart). Appends to `bank_receipts` array |

---

### Requests & Approvals — `/api/charity/requests`

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/` | all | List requests. Teamleader sees only their own. Supports `?status`, `?action` |
| GET | `/:id` | all | Single request with user details |
| POST | `/adjustment` | all | Submit `Deduct`/`Increase`/`Transfer`/`Return` request. Sets `on_adjustment` on the item |
| POST | `/:id/approve` | admin, charity_admin | Approve. Executes side-effects (transfer, clears `on_adjustment`) |
| POST | `/:id/reject` | admin, charity_admin | Reject. Clears `on_adjustment`. Optional `{ reason }` added as comment |
| POST | `/:id/comment` | admin, charity_admin | Add comment. Sets status to `commented` without closing |
| GET | `/stats/summary` | all | `{ statusBreakdown, actionBreakdown }` |

---

### Settings — `/api/charity/settings`

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/` | admin, charity_admin | Get `main` settings row. Auto-creates if missing |
| PUT | `/` | admin, charity_admin | Replace full `companies` list and/or `config` |
| POST | `/companies` | admin, charity_admin | Append a company `{ name, fullInfo }` |
| PUT | `/companies/:index` | admin, charity_admin | Update company by 0-based index |
| DELETE | `/companies/:index` | admin, charity_admin | Remove company by 0-based index |

---

## Workflows

### 1. Setup
```
charity_admin creates teams (teams have head/vice/members)
charity_admin (or teamleader+approval) registers beneficiaries and assigns to teams
charity_admin updates settings with partner companies
```

### 2. Donation lifecycle
```
charity_teamleader  → POST /donations                 (status: draft)
charity_teamleader  → POST /donations/:id/items       (add items per beneficiary)
charity_teamleader  → POST /donations/:id/submit      (status: draft → pending)
charity_admin       → POST /donations/:id/approve     (status: pending → approved)
charity_teamleader  → POST /donations/items/:id/deliver
```

### 3. Adjustment request (post-submit)
```
charity_teamleader  → POST /requests/adjustment       { action: "Deduct"|"Increase"|"Transfer"|"Return", donationItemId, reason }
                       ↳ item.on_adjustment = { adjustment_id, status: "pending" }
charity_admin       → POST /requests/:id/approve | /reject | /comment
                       ↳ on approve/reject: item.on_adjustment is cleared to null
```

### 4. Beneficiary transfer
```
any role           → POST /teams/:id/transfer-beneficiary  { beneficiaryId, targetTeamId, reason }
                      ↳ creates TransferBeneficiary request
charity_admin      → POST /requests/:id/approve
                      ↳ beneficiary.team_id updated to targetTeamId automatically
```

### 5. Team deactivation
```
charity_admin  → DELETE /teams/:id
                 ↳ team.is_active = false
                 ↳ ALL team's beneficiaries.is_active = false (cascade in one query)
```

---

## JSON Field Shapes

### `is_recurring` (on `charity_donation_item`)
```json
{
  "recurring_type":  "monthly",
  "recurring_count": 3,
  "recurrings": [
    {
      "recurring_id":        1,
      "quantity":            10.00,
      "unit_value_in_birr":  500.00,
      "total_value_in_birr": 5000.00,
      "payment_method":      "bank",
      "is_delivered":        false,
      "is_returned":         null
    },
    {
      "recurring_id":  2,
      "quantity":      10.00,
      "unit_value_in_birr": 500.00,
      "total_value_in_birr": 5000.00,
      "payment_method": "cash",
      "is_delivered":  true,
      "is_returned":   null
    }
  ]
}
```
`null` = one-time item (use top-level `quantity`, `unit_value_in_birr`, `total_value_in_birr`).

`recurring_id` is 1-based and maps to "month 1 / week 1 / day 1" — the frontend derives the
label from `recurring_type`.

### `is_returned` (on `charity_donation_item`)
```json
null                           // not returned
{ "reason": "beneficiary relocated" }  // returned
```

### `on_adjustment` (on `charity_donation_item`)
```json
null                                                    // no in-flight request
{ "adjustment_id": 42, "status": "pending" }           // waiting for admin
{ "adjustment_id": 42, "status": "commented" }         // admin commented, still open
```
Cleared automatically to `null` when the linked request is approved or rejected.

### `bank_receipts` (on `charity_donation_item`)
```json
[
  "/uploads/documents/charityEvidences/1777515554912-charityEvidences.jpg",
  "/uploads/documents/charityEvidences/1777651245185-charityEvidences.pdf"
]
```

### `comments` (on `charity_request_approve`)
```json
[
  { "user_id": 3, "text": "Please clarify the quantity.", "created_at": "2026-05-19T10:00:00.000Z" },
  { "user_id": 7, "text": "Updated — was a typo.",        "created_at": "2026-05-19T11:30:00.000Z" }
]
```

### `full_info` (on `charity_beneficiaries`)
```json
{
  "location": { "region": "Addis Ababa", "city": "Bole", "woreda": "03" },
  "contact":  { "phone": "+251911000001", "email": "ben@example.com" },
  "notes":    "Elderly widow, requires monthly support"
}
```

### `companies` (on `charity_settings`)
```json
[
  {
    "name":      "Ethio Telecom",
    "full_info": { "type": "main", "phone": "+251115517777", "email": "csr@ethiotelecom.et", "address": "Churchill Ave, Addis Ababa" }
  },
  {
    "name":      "Commercial Bank of Ethiopia",
    "full_info": { "type": "partner", "phone": "+251115511271", "email": "csr@combanketh.et" }
  }
]
```

---

## File Structure

```
backend/
├── migrations/
│   └── 18-setup-charity-module.js          ← single migration for all 6 tables
│
├── models/charity/
│   ├── CharityTeam.js
│   ├── CharityBeneficiary.js
│   ├── CharityDonation.js
│   ├── CharityDonationItem.js              ← includes onAdjustment field
│   ├── CharityRequestApprove.js
│   └── CharitySetting.js
│
├── controllers/charity/
│   ├── charityTeamController.js
│   ├── charityBeneficiaryController.js
│   ├── charityDonationController.js        ← items are sub-resources here
│   ├── charityRequestController.js         ← all approval actions + adjustment submission
│   └── charitySettingController.js
│
├── routes/charity/
│   ├── teamRoutes.js
│   ├── beneficiaryRoutes.js
│   ├── donationRoutes.js
│   ├── requestRoutes.js
│   └── settingRoutes.js
│
└── seeders/
    └── 20260519000000-charity-roles-seeder.js   ← charity_admin + charity_teamleader

frontend/src/views/charity/
├── views/
│   ├── beneficiaries.vue
│   ├── beneficiaries_create.vue
│   ├── donations.vue
│   ├── donation_create.vue
│   ├── donation_details.vue
│   ├── teams.vue
│   └── team.vue
└── components/
    └── common/
        ├── ListTable.vue     ← flexible: columns prop, named cell slots, pagination, selection
        ├── FilterBar.vue     ← search + status select + #filters slot + #actions slot
        ├── StatsCards.vue    ← data-driven or fully slotted
        └── USAGE.md
```

---

## Running the module fresh

```bash
# Full reset
npx sequelize-cli db:migrate:undo:all
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all

# Credentials (seeded users)
# charity.admin@superhr.et   → password: Charity@1234  (role: charity_admin)
# team.lead1@superhr.et      → password: Charity@1234  (role: charity_teamleader)
# team.lead2@superhr.et      → password: Charity@1234  (role: charity_teamleader)
```
