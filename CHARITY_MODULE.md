# Charity Module - SuperHR

## Overview
The Charity Module is a comprehensive system designed to manage the lifecycle of donations, campaigns, and beneficiary support within the SuperHR platform. It handles everything from initial donation pledges by companies to the final distribution of goods, money, or services to verified beneficiaries.

## Key Components

### 1. Management
- **Donation Companies:** Manage partner organizations, sister companies, and main donors.
- **Campaigns:** Create and track specific charity drives (e.g., "Emergency Relief", "Education Support"). Campaigns have targets, timelines, and statuses.
- **Beneficiaries:** Register individuals or organizations in need. Beneficiaries are categorized into **Groups** and assigned to **Locations**.

### 2. Donation Lifecycle
1. **Draft:** A donation is created and items (Money, Goods, or Services) are added.
2. **Pending:** The donation is submitted for internal review.
3. **Approved:** Authorized personnel (Finance/Admin) approve the donation, making it ready for distribution.
4. **Distributed:** Items are physically or financially delivered to beneficiaries.
5. **Cancelled:** The donation is terminated.

### 3. Features

#### Flexible Distribution
- **One-time Distribution:** Assign a specific quantity of an item to one or more beneficiaries.
- **Recurring Support:** Items (like monthly financial aid) can be scheduled across multiple intervals (daily, weekly, monthly). Each interval is tracked and distributed separately.

#### Flexible Adjustments (Post-Approval)
- **Reassignment:** authorized users can move assigned quantities from one beneficiary to another *after* approval but *before* final distribution.
- **Deductions:** Free up assigned quantities back to the item's pool if a beneficiary no longer needs them.
- **Returns:** Mark items as "Returned" if the beneficiary cannot accept them, with mandatory reasons and a full audit trail.

#### Accountability & Evidence
- **Multi-level Approvals:** Formal status transitions with comments.
- **Evidence Management:** Upload photos, receipts, or documents as proof of distribution for every item or recurring interval.
- **Audit Logs:** Every action (creation, update, reassignment, approval) is logged with metadata and the performing user.

## Workflow Summary
1. **Setup:** Create a Campaign and ensure Beneficiaries are registered.
2. **Pledge:** Register a Donation from a Company.
3. **Itemize:** Add specific items (e.g., 100 bags of rice) and assign them to Beneficiaries.
4. **Approve:** Finance reviews and approves the Donation.
5. **Adjust (Optional):** Use the **Reassign / Deduct** tool (⇄) if distribution plans change.
6. **Distribute:** Upload evidence and mark items/intervals as "Distributed".

## Technical Integration
- **Backend:** Node.js/Express with Sequelize ORM.
- **Frontend:** Vue 3 with Pinia for state management.
- **Audit System:** Integrated `donation_logs` table for full transparency.
