<template>
  <div class="table-container">
    <table class="adj-table">
      <thead>
        <tr>
          <th>Item ID</th>
          <th>Interval ID</th>
          <th>Type</th>
          <th>Beneficiary</th>
          <th>Item Type</th>
          <th>Value / Quantity</th>
          <th>Requester</th>
          <th>Date</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="adj in adjustments" :key="adj.adjustmentId">
          <td style="font-size: 11px; font-weight: 600; color: #64748b;">#{{ adj.donationItemId }}</td>
          <td style="font-size: 11px; font-weight: 600; color: #64748b;">{{ adj.intervalId ? '#' + adj.intervalId : '—' }}</td>
          <td>
            <span :class="['type-badge', adj.type]">
              {{ charityService.getAdjustmentTypeLabel(adj.type) }}
            </span>
          </td>
          <td class="ben-cell">
            <div class="name-wrapper">
              <span class="ben-name">{{ adj.beneficiary?.name || '—' }}</span>
              <span v-if="adj.toBeneficiary" class="reassign-tag">→ {{ adj.toBeneficiary.name }}</span>
            </div>
          </td>
          <td>
            <span style="text-transform: capitalize; font-size: 13px;">{{ adj.itemType }}</span>
          </td>
          <td class="amount-cell">
            <span v-if="adj.itemType === 'money'">
              {{ charityService.formatCurrency(adj.value) }}
            </span>
            <span v-else>
              {{ adj.quantity }} <small style="color: #94a3b8; font-weight: normal;">units</small>
            </span>
          </td>
          <td>{{ adj.requester ? `${adj.requester.firstName} ${adj.requester.lastName}` : '—' }}</td>
          <td class="date-cell">{{ charityService.formatDate(adj.createdAt) }}</td>
          <td>
            <span :class="['status-badge', `status-${adj.status}`]">
              {{ charityService.getStatusLabel(adj.status) }}
            </span>
          </td>
          <td class="actions-cell">
            <button class="action-btn view" @click="$emit('view', adj)" title="View Details">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
            <template v-if="adj.status === 'pending' && canReview">
              <button class="action-btn approve" @click="$emit('review', adj, 'approved')" title="Approve">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
              </button>
              <button class="action-btn reject" @click="$emit('review', adj, 'rejected')" title="Reject">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="9" x2="18" y2="18"/></svg>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </template>
          </td>
        </tr>
        <tr v-if="adjustments.length === 0">
          <td colspan="7" class="empty-row">No adjustment requests found.</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import charityService from '@/stores/charity';

defineProps({
  adjustments: { type: Array, default: () => [] },
  canReview: { type: Boolean, default: false }
});
defineEmits(['view', 'review']);
</script>

<style scoped>
.table-container { background: white; border-radius: 16px; overflow-x: auto; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.adj-table { width: 100%; border-collapse: collapse; min-width: 800px; }
.adj-table th, .adj-table td { padding: 14px; text-align: left; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
.adj-table th { background: #f8fafc; font-weight: 600; font-size: 12px; color: #475569; text-transform: uppercase; }

.type-badge { padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: white; }
.type-badge.deduct { background: #ef4444; }
.type-badge.increase { background: #10b981; }
.type-badge.reassign { background: #f59e0b; }
.type-badge.return { background: #6366f1; }

.name-wrapper { display: flex; flex-direction: column; gap: 2px; }
.ben-name { font-weight: 600; color: #1e293b; }
.reassign-tag { font-size: 11px; color: #64748b; font-style: italic; }

.amount-cell { font-weight: 700; color: #1e293b; }
.date-cell { font-size: 13px; color: #64748b; }

.status-badge { padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
.status-badge.status-pending { background: #fef3c7; color: #92400e; }
.status-badge.status-approved { background: #dcfce7; color: #166534; }
.status-badge.status-rejected { background: #fee2e2; color: #991b1b; }

.actions-cell { display: flex; gap: 6px; }
.action-btn { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; border: none; background: #f1f5f9; color: #64748b; transition: all 0.2s; }
.action-btn svg { width: 14px; height: 14px; }
.action-btn.view:hover { background: #e0f2fe; color: #3b82f6; }
.action-btn.approve { color: #10b981; }
.action-btn.approve:hover { background: #dcfce7; }
.action-btn.reject { color: #ef4444; }
.action-btn.reject:hover { background: #fee2e2; }

.empty-row { text-align: center; padding: 40px !important; color: #94a3b8; font-style: italic; }
</style>
