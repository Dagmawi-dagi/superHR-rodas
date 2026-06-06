# Charity Management Module (v2)

This module provides a comprehensive system for managing charity operations, distribution teams, beneficiaries, and payment delivery tracking within the SuperHR-Rodas platform.

---

## 🛠 Architecture & Data Model

The module is built on a relational database (PostgreSQL) using **Sequelize ORM**. It leverages **JSONB** fields for flexibility in tracking complex histories like deliveries and adjustments.

### Core Models

1.  **`CharityTeam`**: Represents a distribution unit.
    *   **Fields**: `name`, `description`, `head` (Employee), `vice` (Employee), `members` (Array of Employee IDs), `isActive`.
    *   **Logic**: Teams can be managed by Admins. Team Leaders (Head/Vice) have scoped access to their assigned team's beneficiaries.

2.  **`CharityBeneficiary`**: The recipients of charity support.
    *   **Fields**: `fullname`, `fullInfo` (JSONB for location/contact), `monthlyAllocation`, `paymentMethod` (Cash/Bank), `bankInfo` (JSONB: `{account_no, bank}`), `isSpecialCase` (Dynamic select based on settings), `isActive`.
    *   **Tracking**: 
        *   `deliveries` (JSONB Array): Tracks history of payments per distribution cycle.
        *   `adjustments` (JSONB Array): Tracks increases/deductions to the monthly allocation with reasons.

3.  **`CharitySetting`**: Global configuration for the charity module.
    *   **Fields**: `distributionRelease` (JSONB Array of cycles), `defaults` (Standard monthly amount and payment method).
    *   **Distribution Cycle**: Defines "Releases" with a specific date and payment period (e.g., 30 days).

4.  **`CharityLog`**: Audit trail for all charity-related actions.
    *   **Tracking**: Every Create, Update, Delete, Transfer, Delivery, and Adjustment is logged with user attribution and detailed data snapshots.

---

## 🚀 Key Features

### 1. Scoped Role-Based Access Control (RBAC)
*   **Admins / Charity Admins**: Global visibility. Can create teams, delete beneficiaries, and manage global settings/distribution cycles.
*   **Charity Team Leaders**: Scoped visibility. They only see beneficiaries assigned to their team. They can register new beneficiaries (automatically assigned to their team), record deliveries, and apply adjustments.

### 2. Distribution Cycle Management
*   Payments are organized into **Distribution Releases**.
*   A release cannot be marked as "Completed" until **100% of active beneficiaries** have a delivery record.
*   Releases linked to existing deliveries cannot be deleted to maintain financial integrity.

### 3. Bulk Operations
*   **Bulk Delivery**: Record payments for multiple beneficiaries at once for a specific release.
*   **Bulk Adjustment**: Apply a flat increase or deduction (e.g., "Holiday Bonus") to a group of beneficiaries.
*   **Bulk Update**: Change status, payment method, or team for multiple beneficiaries simultaneously.

### 4. Interactive Dashboard & Reporting
*   **KPIs**: Total beneficiaries, active distribution progress (%), and global monthly commitment.
*   **Activity Feed**: A real-time audit trail with:
    *   **Load More**: Paginated history retrieval.
    *   **Detailed Tooltips**: Hover over any activity to see exactly what data was changed (formatted for clarity).
*   **Reporting**:
    *   **Master Excel Export**: A professional multi-table report generated from the Dashboard. It requires selecting a **Distribution Release** and produces an `.xlsx` file with:
        *   **Beneficiaries Summary**: Complete list of active recipients.
        *   **Teams Summary**: Operational overview of all distribution units.
        *   **Bank Summary**: Specialized sheet with Amharic headers, bank-specific group analysis, and individual breakdowns for **Special Case** beneficiaries. Includes automated total calculations.
        *   **Cash Summary**: Focused list for manual cash distribution.

---

## 🛣 API Endpoints

### Dashboard
*   `GET /api/charity/dashboard/stats`: KPI metrics and recent activity summary.
*   `GET /api/charity/dashboard/logs`: Paginated full audit trail.

### Teams
*   `GET /api/charity/teams`: List teams (filtered by search/status).
*   `POST /api/charity/teams`: Create new team (Admin only).
*   `PUT /api/charity/teams/:id`: Update team members or status.

### Beneficiaries
*   `GET /api/charity/beneficiaries`: List beneficiaries (scoped by role).
*   `POST /api/charity/beneficiaries`: Register new beneficiary.
*   `POST /api/charity/beneficiaries/:id/delivery`: Record a payment.
*   `POST /api/charity/beneficiaries/:id/adjustment`: Apply allocation change.
*   `POST /api/charity/beneficiaries/:id/transfer`: Move beneficiary to another team.
*   `POST /api/charity/beneficiaries/bulk/delivery`: Bulk payment recording.

### Settings
*   `GET /api/charity/settings`: Retrieve global config and distribution cycles.
*   `PUT /api/charity/settings`: Manage releases and default values (Admin only).

---

## 💻 Frontend Implementation

*   **Store**: `frontend/src/stores/charity.ts` provides a centralized service for all API communication.
*   **Views**:
    *   `CharityDashboard.vue`: Central hub for stats and audit logs.
    *   `beneficiaries.vue`: Management list with bulk actions and filtering.
    *   `settings.vue`: Interface for managing distribution cycles and defaults.

---

*Last updated: June 2026*
