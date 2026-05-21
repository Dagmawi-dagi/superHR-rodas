<template>
  <div class="donation-detail-page">
    <div class="page-header">
      <div class="header-left">
        <router-link to="/charity/donations" class="back-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
        </router-link>
        <div>
          <h1 class="page-title">Donation #{{ donationId }}</h1>
          <p class="page-subtitle">Detailed view of contribution items and distribution status</p>
        </div>
      </div>
      <div class="header-actions">
        <button v-if="donationStatus === 'draft'" class="btn-primary" @click="submitDonation">Submit Approval</button>
        <button v-if="donationStatus === 'pending'" class="btn-primary success" @click="approveDonation">Approve</button>
      </div>
    </div>

    <!-- Summary Stats -->
    <StatsCards :cards="donationSummaryCards" />

    <!-- Main Content Grid -->
    <div class="detail-grid">
      <!-- Left: Items List -->
      <div class="items-section">
        <div class="section-card">
          <div class="section-header">
            <h3 class="section-title">Donation Items</h3>
            <button v-if="donationStatus === 'draft'" class="btn-secondary" @click="addItem">+ Add Item</button>
          </div>
          
          <ListTable
            :columns="itemColumns"
            :rows="dummyItems"
            row-key="donationItemId"
            :loading="loading"
          >
            <template #cell-beneficiary="{ row }">
              <div class="ben-cell">
                <span class="ben-name">{{ row.beneficiary?.name }}</span>
                <span class="ben-info">{{ row.beneficiary?.type }}</span>
              </div>
            </template>

            <template #cell-totalValueInBirr="{ value }">
              <span class="amount-text">{{ formatCurrency(value) }}</span>
            </template>

            <template #actions="{ row }">
              <div class="table-actions">
                <button v-if="donationStatus === 'approved' && !row.isDelivered" class="action-btn distribute" title="Mark Delivered" @click="distributeItem(row)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 7H4m16 5H4m16 5H4"/></svg>
                </button>
                <button v-if="donationStatus === 'draft'" class="action-btn" title="Edit" @click="editItem(row)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
              </div>
            </template>
          </ListTable>
        </div>
      </div>

      <!-- Right: Side Info -->
      <div class="side-section">
        <div class="info-card">
          <h4 class="info-title">Donation Info</h4>
          <div class="info-list">
            <div class="info-item">
              <span class="info-label">Target Team</span>
              <span class="info-value">Addis Hope Team</span>
            </div>
            <div class="info-item">
              <span class="info-label">Delivery Date</span>
              <span class="info-value">Mar 25, 2024</span>
            </div>
            <div class="info-item">
              <span class="info-label">Status</span>
              <span class="info-value" :class="donationStatus">{{ donationStatus.toUpperCase() }}</span>
            </div>
          </div>
        </div>

        <div class="info-card notes">
          <h4 class="info-title">Description</h4>
          <p class="notes-text">
            Bulk rice and oil distribution for Arada families. Essential supplies for the month.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import StatsCards from './components/common/StatsCards.vue'
import ListTable from './components/common/ListTable.vue'
import type { CharityDonationItem } from '@/stores/charity'

const route = useRoute()
const donationId = computed(() => route.params.id)
const donationStatus = ref('approved')
const loading = ref(false)

const dummyItems: CharityDonationItem[] = [
  {
    donationItemId: 101,
    donationId: 1,
    beneficiaryId: 1,
    type: 'money',
    description: 'Monthly food allowance',
    totalValueInBirr: 5000,
    paymentMethod: 'bank',
    isDelivered: true,
    bankReceipts: [],
    beneficiary: { name: 'Tsegaye Gebremedhin', type: 'individual' } as any
  },
  {
    donationItemId: 102,
    donationId: 1,
    beneficiaryId: 2,
    type: 'goods',
    description: 'Winter Blanket (Large)',
    quantity: 10,
    unitValueInBirr: 120,
    totalValueInBirr: 1200,
    paymentMethod: 'cash',
    isDelivered: false,
    bankReceipts: [],
    beneficiary: { name: 'Mekanisa Orphanage', type: 'organization' } as any
  }
]

const itemColumns = [
  { key: 'beneficiary', label: 'Beneficiary' },
  { key: 'type', label: 'Item Type', format: 'badge' },
  { key: 'description', label: 'Description' },
  { key: 'totalValueInBirr', label: 'Total Value' },
  { key: 'isDelivered', label: 'Delivered', format: 'boolean' }
]

const donationSummaryCards = computed(() => [
  { key: 'total', label: 'Total Value', value: 6200, format: 'currency', color: '#6a11cb' },
  { key: 'items', label: 'Total Items', value: dummyItems.length, color: '#3b82f6' },
  { key: 'status', label: 'Current Status', value: donationStatus.value.toUpperCase(), color: '#10b981' }
])

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB' }).format(val)
}

const submitDonation = () => { donationStatus.value = 'pending'; alert('Submitted for approval') }
const approveDonation = () => { donationStatus.value = 'approved'; alert('Donation approved') }
const addItem = () => { alert('Add item modal') }
const editItem = (item: any) => { alert(`Editing item ${item.donationItemId}`) }
const distributeItem = (item: any) => { item.isDelivered = true; alert(`Item ${item.donationItemId} marked as delivered`) }
</script>

<style scoped>
.donation-detail-page { padding: 24px; background: #f8fafc; min-height: 100vh; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.header-left { display: flex; align-items: center; gap: 16px; }
.back-btn {
  display: flex; align-items: center; justify-content: center;
  width: 40px; height: 40px; background: white; border: 1px solid #e2e8f0;
  border-radius: 12px; color: #64748b; text-decoration: none;
}
.back-btn:hover { color: #6a11cb; border-color: #6a11cb; }
.page-title { font-size: 22px; font-weight: 700; color: #1e293b; margin: 0; }
.page-subtitle { font-size: 13px; color: #64748b; margin-top: 2px; }

.header-actions { display: flex; gap: 12px; }
.btn-primary {
  padding: 10px 20px; background: linear-gradient(135deg, #6a11cb, #7c3aed); color: white;
  border: none; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer;
}
.btn-primary.success { background: #10b981; }

.detail-grid { display: grid; grid-template-columns: 1fr 320px; gap: 24px; margin-top: 24px; }
@media (max-width: 1024px) { .detail-grid { grid-template-columns: 1fr; } }

.section-card { background: white; border-radius: 16px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.section-title { font-size: 18px; font-weight: 700; color: #1e293b; margin: 0; }
.btn-secondary { padding: 6px 12px; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 12px; font-weight: 600; color: #475569; cursor: pointer; }

.ben-cell { display: flex; flex-direction: column; }
.ben-name { font-weight: 600; color: #1e293b; }
.ben-info { font-size: 11px; color: #94a3b8; text-transform: capitalize; }

.amount-text { font-weight: 700; color: #1e293b; }

.table-actions { display: flex; gap: 6px; }
.action-btn {
  width: 28px; height: 28px; border-radius: 6px; border: 1px solid #e2e8f0;
  background: white; color: #64748b; display: flex; align-items: center; justify-content: center;
  cursor: pointer;
}
.action-btn svg { width: 14px; height: 14px; }
.action-btn:hover { border-color: #6a11cb; color: #6a11cb; background: #f5f3ff; }
.action-btn.distribute:hover { border-color: #10b981; color: #10b981; background: #f0fdf4; }

.side-section { display: flex; flex-direction: column; gap: 20px; }
.info-card { background: white; border-radius: 16px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.info-title { font-size: 15px; font-weight: 700; color: #1e293b; margin: 0 0 16px; padding-bottom: 12px; border-bottom: 1px solid #f1f5f9; }
.info-list { display: flex; flex-direction: column; gap: 12px; }
.info-item { display: flex; justify-content: space-between; align-items: center; }
.info-label { font-size: 12px; color: #94a3b8; }
.info-value { font-size: 13px; font-weight: 600; color: #475569; }
.info-value.approved { color: #10b981; }

.notes-text { font-size: 13px; color: #64748b; line-height: 1.6; margin: 0; }
</style>
