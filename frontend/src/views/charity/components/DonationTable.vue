<template>
  <div class="table-container">
    <table class="donations-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Company</th>
          <th>Campaign</th>
          <th>Date</th>
          <th>Total Value</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="donation in donations" :key="donation.donationId">
          <td class="id-cell">#{{ donation.donationId }}</td>
          <td>{{ donation.DonationCompany?.name || 'N/A' }}</td>
          <td>{{ donation.Campaign?.title || 'N/A' }}</td>
          <td class="date-cell">{{ formatDate(donation.donationDate) }}</td>
          <td class="value-cell">{{ formatCurrency(donation.totalValue) }}</td>
          <td>
            <span :class="['status-badge', `status-${donation.status}`]">
              {{ getStatusLabel(donation.status) }}
            </span>
          </td>
          <td class="actions-cell">
            <button class="action-btn view" @click="$emit('view-donation', donation)" title="View Details">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
            <button v-if="donation.status === 'draft'" class="action-btn edit" @click="$emit('edit-donation', donation)" title="Edit">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
              </svg>
            </button>
            <button v-if="donation.status === 'draft'" class="action-btn submit" @click="$emit('submit-donation', donation)" title="Submit for Approval">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </button>
            <button v-if="donation.status === 'pending' && canApprove" class="action-btn approve" @click="$emit('approve-donation', donation)" title="Approve">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
            <button v-if="donation.status === 'approved'" class="action-btn distribute" @click="$emit('distribute-donation', donation)" title="Mark Distributed">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </button>
            <button v-if="donation.status !== 'cancelled'" class="action-btn cancel" @click="$emit('cancel-donation', donation)" title="Cancel">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </td>
        </tr>
        <!-- Empty State -->
        <tr v-if="donations.length === 0">
          <td colspan="7" class="empty-state">
            <div class="empty-state-content">
              <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.66 0 3-4 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4-3-9s1.34-9 3-9" />
                <path d="M12 3v18" />
              </svg>
              <h3 class="empty-state-title">No donations found</h3>
              <p class="empty-state-message">Try adjusting your search or filter criteria</p>
              <button class="empty-state-btn" @click="$emit('clear-filters')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
                Clear Filters
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Pagination -->
    <div v-if="pagination.totalPages > 1" class="pagination">
      <button class="page-btn" :disabled="pagination.currentPage === 1" @click="$emit('go-to-page', pagination.currentPage - 1)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <span>Page {{ pagination.currentPage }} of {{ pagination.totalPages }}</span>
      <button class="page-btn" :disabled="pagination.currentPage === pagination.totalPages" @click="$emit('go-to-page', pagination.currentPage + 1)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import CharityService from "@/stores/charity";

const props = defineProps({
  donations: {
    type: Array,
    default: () => []
  },
  pagination: {
    type: Object,
    default: () => ({
      totalItems: 0,
      totalPages: 1,
      currentPage: 1,
      pageSize: 10
    })
  },
  canApprove: {
    type: Boolean,
    default: false
  }
});

defineEmits([
  'view-donation',
  'edit-donation',
  'submit-donation',
  'approve-donation',
  'distribute-donation',
  'cancel-donation',
  'go-to-page',
  'clear-filters'
]);

const getStatusLabel = (status) => CharityService.getStatusLabel(status);
const formatCurrency = (value) => CharityService.formatCurrency(value);
const formatDate = (date) => CharityService.formatDate(date);
</script>

<style scoped>
.table-container {
  background: white;
  border-radius: 16px;
  overflow-x: auto;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.donations-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
}

.donations-table th,
.donations-table td {
  padding: 12px 12px;
  text-align: left;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.donations-table th {
  background: #f8fafc;
  font-weight: 600;
  font-size: 12px;
  color: #475569;
}

.donations-table td {
  font-size: 13px;
}

.id-cell {
  font-family: monospace;
  font-size: 12px;
  color: #64748b;
}

.date-cell {
  white-space: nowrap;
}

.value-cell {
  font-weight: 600;
  color: #1e293b;
}

.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.status-draft { background: #f1f5f9; color: #475569; }
.status-pending { background: #fef3c7; color: #b45309; }
.status-approved { background: #dbeafe; color: #1d4ed8; }
.status-distributed { background: #dcfce7; color: #15803d; }
.status-cancelled { background: #fee2e2; color: #b91c1c; }

.actions-cell {
  display: flex;
  gap: 6px;
}

.action-btn {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: none;
  background: none;
  color: #64748b;
  transition: all 0.2s;
}

.action-btn svg {
  width: 14px;
  height: 14px;
}

.action-btn.view { background: #10b98120; color: #10b981; }
.action-btn.edit { background: #3b82f620; color: #3b82f6; }
.action-btn.submit { background: #f59e0b20; color: #d97706; }
.action-btn.approve { background: #10b98120; color: #059669; }
.action-btn.distribute { background: #8b5cf620; color: #7c3aed; }
.action-btn.cancel { background: #ef444420; color: #dc2626; }

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 20px;
  padding: 16px;
}

.page-btn {
  padding: 8px 12px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.page-btn svg {
  width: 16px;
  height: 16px;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 20px !important;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.empty-state-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.empty-state-icon {
  width: 80px;
  height: 80px;
  color: #94a3b8;
  opacity: 0.6;
  margin-bottom: 8px;
}

.empty-state-title {
  font-size: 18px;
  font-weight: 600;
  color: #475569;
  margin: 0;
}

.empty-state-message {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

.empty-state-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 20px;
  margin-top: 8px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  color: #6a11cb;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.empty-state-btn svg {
  width: 16px;
  height: 16px;
}

.empty-state-btn:hover {
  background: #6a11cb;
  border-color: #6a11cb;
  color: white;
}

@media (max-width: 768px) {
  .donations-table {
    min-width: 650px;
  }
}
</style>