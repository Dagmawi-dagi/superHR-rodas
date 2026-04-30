# Charity Module Documentation

## Overview
Manages donations from companies to beneficiaries through campaigns. Includes beneficiary grouping, transfers, campaign timeline adjustments, money deductions, and return tracking.

## Core Entities
- **Company**: Donor organizations
- **Campaign**: Fundraising campaigns (can be extended/terminated)
- **Donation**: Header record with status flow (draft→pending→approved→distributed→cancelled)
- **DonationItem**: Line items (money/goods/service). Money items have payment method and unassigned deductions.
- **BeneficiaryGroup**: Groups managed by employees
- **Beneficiary**: Recipients; belong to groups; can be transferred with reason
- **BeneficiaryTransfer**: History of group changes
- **Location**: Geographic areas
- **DonationDistribution**: Allocation of items to beneficiaries; can be returned
- **DonationDeduction**: Deductions from money items with reason and optional reassignment
- **DonationApproval**: Approval workflow
- **DonationLog**: Audit trail

## New Features (v2)
- Beneficiary grouping with manager assignment
- Beneficiary transfers between groups with reason
- Campaign extension/termination with reason
- Money item deductions with reassignment option
- Payment method tracking for money items
- Distribution returns with reason

## API Endpoints Reference

All endpoints are prefixed with `/api/charity` and require authentication unless otherwise noted.  
Role restrictions are noted where applicable.


| Model
| --------	Table	Soft‑Delete (paranoid)
| DonationCompany	donation_companies	Yes – paranoid: true, timestamps: true
| Campaign	campaigns	Yes
| BeneficiaryGroup	beneficiary_groups	Yes
| BeneficiaryLocation	beneficiary_locations	No (simple lookup, soft delete not critical)
| Beneficiary	beneficiaries	Yes
| BeneficiaryTransfer	beneficiary_transfers	No (history record)
| Donation	donations	No (status flow handles cancellation)
| DonationItem	donation_items	Yes (preserve item history)
| DonationDistribution	donation_distributions	Yes
| DonationDistributionEvidence	donation_distribution_evidences	No (files can be hard deleted if needed)
| DonationApproval	donation_approvals	No
| DonationLog	donation_logs	No
| DonationDeduction	donation_deductions	No


---

### Companies

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET    | `/companies` | List all companies (filter by type, active status) | Any |
| GET    | `/companies/:id` | Get company details | Any |
| POST   | `/companies` | Create a new company | `admin` |
| PUT    | `/companies/:id` | Update company information | `admin` |
| DELETE | `/companies/:id` | Soft delete (set inactive) | `admin` |



---

### Campaigns

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET    | `/campaigns` | List all campaigns (filter by status, category) | Any |
| GET    | `/campaigns/:id` | Get campaign details | Any |
| GET    | `/campaigns/:id/progress` | Get fundraising progress (raised vs target) | Any |
| POST   | `/campaigns` | Create a new campaign | `admin` |
| PUT    | `/campaigns/:id` | Update campaign information | `admin` |
| DELETE | `/campaigns/:id` | Cancel campaign (soft) | `admin` |
| POST   | `/campaigns/:id/extend` | Extend campaign end date (requires reason) | `admin` |
| POST   | `/campaigns/:id/terminate` | Terminate campaign early (requires reason) | `admin` |

---

### Locations

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET    | `/locations` | List all locations | Any |
| GET    | `/locations/:id` | Get location details | Any |
| POST   | `/locations` | Create a new location | `admin` |
| PUT    | `/locations/:id` | Update location | `admin` |
| DELETE | `/locations/:id` | Delete location | `admin` |

---

### Beneficiary Groups

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET    | `/beneficiary-groups` | List all active groups (includes member count and manager info) | Any |
| GET    | `/beneficiary-groups/:id` | Get group details with members | Any |
| POST   | `/beneficiary-groups` | Create a new group | `admin` |
| PUT    | `/beneficiary-groups/:id` | Update group information | `admin` |
| DELETE | `/beneficiary-groups/:id` | Soft delete (set inactive) | `admin` |
| POST   | `/beneficiary-groups/:id/assign-manager` | Assign/change group manager (employee) | `admin` |

---

### Beneficiaries

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET    | `/beneficiaries` | List all beneficiaries (filter by type, group, location) | Any |
| GET    | `/beneficiaries/:id` | Get beneficiary details | Any |
| POST   | `/beneficiaries` | Create a new beneficiary | `admin` |
| PUT    | `/beneficiaries/:id` | Update beneficiary information | `admin` |
| DELETE | `/beneficiaries/:id` | Delete beneficiary | `admin` |
| POST   | `/beneficiaries/:id/transfer` | Transfer beneficiary to another group (requires reason) | `admin` |
| GET    | `/beneficiaries/:id/transfers` | Get transfer history for a beneficiary | Any |

---

### Donations

#### Donation CRUD

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET    | `/donations` | List all donations (supports pagination, filters: status, company, campaign, date range) | Any |
| GET    | `/donations/:id` | Get full donation details (items, distributions, approvals, logs) | Any |
| POST   | `/donations` | Create a new draft donation | Any |
| PUT    | `/donations/:id` | Update draft donation (only if status = draft) | Any |
| DELETE | `/donations/:id` | Cancel donation (any status → cancelled) | Any |

#### Donation Items

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST   | `/donations/:id/items` | Add item to donation (draft only) | Any |
| PUT    | `/donations/items/:itemId` | Update item (draft only) | Any |
| DELETE | `/donations/items/:itemId` | Delete item (draft only) | Any |

#### Status Transitions (Workflow)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST   | `/donations/:id/submit` | Submit for approval (draft → pending; requires ≥1 item) | Any |
| POST   | `/donations/:id/approve` | Approve donation (pending → approved) | `admin`, `finance` |
| POST   | `/donations/:id/distribute` | Mark entire donation as distributed (approved → distributed) | Any |

#### Deductions (Money Items Only)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST   | `/donations/items/:itemId/deductions` | Add deduction with reason; optionally reassign to another beneficiary | `admin`, `finance` |
| GET    | `/donations/items/:itemId/deductions` | List deductions for a money item | Any |
| DELETE | `/donations/deductions/:deductionId` | Delete deduction (if not yet distributed) | `admin`, `finance` |

#### Distribution Management

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST   | `/donations/items/:itemId/distribute` | Distribute item quantity to one or more beneficiaries | Any |
| GET    | `/donations/distributions` | List all distributions (supports pagination, filters) | Any |
| GET    | `/donations/distributions/:distributionId` | Get distribution details | Any |
| POST   | `/donations/distributions/:distributionId/return` | Mark distribution as returned with reason | `admin`, `finance` |

#### Approval History & Audit Logs

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET    | `/donations/:id/approvals` | Get approval history for a donation | Any |
| GET    | `/donations/:id/logs` | Get audit trail for a donation | Any |

#### Statistics & Reports

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET    | `/donations/stats/summary` | Summary statistics (total value, status breakdown, value by type) | Any |
| GET    | `/donations/stats/by-campaign` | Donations grouped by campaign (count and total) | Any |
| GET    | `/donations/stats/by-company` | Donations grouped by company (count and total) | Any |

---

## Business Rules
- Money deductions reduce available amount; if reassigned, total remains same.
- Beneficiary transfers are logged with reason.
- Campaign adjustments require reason.
- Returned distributions restore item availability.


