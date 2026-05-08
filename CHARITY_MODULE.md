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
1. Reassign (Transfer)
  Definition: Moving a specific amount or quantity of a distribution from one beneficiary directly to another.

   * When to use: Use this when a beneficiary (Beneficiary A) was allocated more than they need, and you want to immediately give that excess to another
     beneficiary (Beneficiary B).
   * How it works:
       * You select the distribution you want to move from.
       * You choose a "To Beneficiary" and the amount.
       * The system creates a "Deduction" record linked to both beneficiaries.
   * Audit Trail:
       * Sender (Beneficiary A): Shows a negative red entry (e.g., -500.00 → Beneficiary B).
       * Receiver (Beneficiary B): Shows a positive green entry (e.g., +500.00 from Beneficiary A).

  ---

  2. Deduct (Move to Pool)
  Definition: Removing a portion of a distribution from a beneficiary and returning it to the donation item's "Unassigned Pool."

   * When to use: Use this when a beneficiary cannot use the full amount, but you haven't decided who should receive the excess yet.
   * How it works:
       * You select the distribution and provide a reason.
       * The amount is subtracted from the beneficiary's total.
       * The amount is added to the "Unassigned deduction for this period" balance at the bottom of the table.
   * Validation Rule: You cannot deduct the full remaining amount using this feature. If you need to remove the entire distribution, you must use the Return
     feature instead.
   * Audit Trail: Shows a negative red entry (e.g., -300.00) in the "Deducted" column.

  ---

  3. Return (Full Reversal)
  Definition: A permanent reversal of an entire distribution record.

   * When to use: Use this when a distribution was made in error, or if the beneficiary is completely unable to receive the items/money and the entire
     allocation needs to be cancelled.
   * How it works:
       * Click the ↩ Return button on a distribution row.
       * Provide a detailed reason for the return.
       * The distribution is marked as isReturned: true.
   * Data Impact:
       * The distribution is no longer considered "active."
       * The "Distributed (Active)" total for the donation decreases.
       * The "Returned" total for the donation increases.
       * Note: Returns are permanent and cannot be "undone" or "reassigned" once completed.
   * Audit Trail: The row status changes from "No" to "Yes" (Red) in the Returned column, with the reason visible via a hover tooltip.

  ---

  Summary Table

  ┌──────────┬────────────────┬─────────────────────┬─────────────────────────────┬────────────────────────────────────────┐
  │ Feature  │ Scope          │ Target              │ Impact on Unassigned Pool   │ Audit Visibility                       │
  ├──────────┼────────────────┼─────────────────────┼─────────────────────────────┼────────────────────────────────────────┤
  │ Reassign │ Partial Amount │ Another Beneficiary │ No change                   │ Outbound (Sender) / Inbound (Receiver) │
  │ Deduct   │ Partial Amount │ Unassigned Pool     │ Increases Pool Balance      │ Negative entry in Deducted column      │
  │ Return   │ Full Amount    │ System Reversal     │ No change (Total decreased) │ "Yes" status with Tooltip Reason       │
  └──────────┴────────────────┴─────────────────────┴─────────────────────────────┴────────────────────────────────────────┘

  This structure ensures that every cent or item moved within the system is accounted for, providing full transparency for finance and audit reports.


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

