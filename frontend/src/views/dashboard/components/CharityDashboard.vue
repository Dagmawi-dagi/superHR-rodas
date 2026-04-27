<template>
  <div class="charity-dashboard">
    <div class="page-header">
      <div>
        <h1 class="page-title">Charity Dashboard</h1>
        <p class="page-subtitle">Overview of donations, beneficiaries, and campaigns</p>
      </div>
    </div>

    <!-- KPI Stats Grid -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon !p-3">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="#FFF" class="size-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
          </svg>

        </div>
        <div class="stat-content">
          <h3>Total Donations</h3>
          <p class="stat-number">{{ stats.totalDonations }}</p>
          <span class="stat-trend">{{ stats.draft || 0 }} drafts pending</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon !p-3">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="#fff" class="size-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
        </svg>

        </div>
        <div class="stat-content">
          <h3>Total Value</h3>
          <p class="stat-number">{{ formatCurrency(stats.totalValue) }}</p>
          <span class="stat-trend">Approved: {{ formatCurrency(stats.approvedValue || 0) }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon !p-3">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="#fff" class="size-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
          </svg>

        </div>
        <div class="stat-content">
          <h3>Beneficiaries</h3>
          <p class="stat-number">{{ stats.beneficiaryCount }}</p>
          <span class="stat-trend">Groups: {{ stats.groupCount }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon !p-3">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="#fff" class="size-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
          </svg>

        </div>
        <div class="stat-content">
          <h3>Active Campaigns</h3>
          <p class="stat-number">{{ stats.activeCampaigns }}</p>
          <span class="stat-trend">{{ stats.totalCampaigns }} total</span>
        </div>
      </div>
    </div>

    <!-- Status Breakdown & Type Distribution -->
    <div class="charts-grid">
      <div class="section">
        <h2>Donations by Status</h2>
        <div class="status-list">
          <div v-for="item in statusList" :key="item.label" class="status-item">
            <span class="status-label">{{ item.label }}</span>
            <div class="status-bar">
              <div
                class="status-fill"
                :style="{ width: item.percentage + '%' }"
                :class="'fill-' + item.status"
              ></div>
            </div>
            <span class="status-count">{{ item.count }}</span>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>Donations by Type</h2>
        <div class="type-list">
          <div v-for="item in typesList" :key="item.label" class="type-item">
            <span class="type-label">{{ item.label }}</span>
            <span class="type-value">{{ formatCurrency(item.value) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="section">
      <h2>Recent Donations</h2>
      <div class="activity-list">
        <div v-for="donation in recentDonations" :key="donation.donationId" class="activity-item">
          <span class="activity-time">{{ formatDate(donation.donationDate) }}</span>
          <span>
            <strong>{{ donation.DonationCompany?.name || 'Unknown' }}</strong>
            donated
            <strong>{{ formatCurrency(donation.totalValue) }}</strong>
            to {{ donation.Campaign?.title || 'campaign' }}
          </span>
          <span :class="['status-badge', `status-${donation.status}`]">
            {{ getStatusLabel(donation.status) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import CharityService from '@/stores/charity'

const stats = ref({
  totalDonations: 0,
  totalValue: 0,
  draft: 0,
  pending: 0,
  approved: 0,
  distributed: 0,
  cancelled: 0,
  approvedValue: 0,
  beneficiaryCount: 0,
  groupCount: 0,
  activeCampaigns: 0,
  totalCampaigns: 0
})

const recentDonations = ref([])

// Status breakdown for display
const statusList = computed(() => [
  { label: 'Draft', status: 'draft', count: stats.value.draft, percentage: stats.value.totalDonations ? (stats.value.draft / stats.value.totalDonations * 100).toFixed(1) : 0 },
  { label: 'Pending', status: 'pending', count: stats.value.pending, percentage: stats.value.totalDonations ? (stats.value.pending / stats.value.totalDonations * 100).toFixed(1) : 0 },
  { label: 'Approved', status: 'approved', count: stats.value.approved, percentage: stats.value.totalDonations ? (stats.value.approved / stats.value.totalDonations * 100).toFixed(1) : 0 },
  { label: 'Distributed', status: 'distributed', count: stats.value.distributed, percentage: stats.value.totalDonations ? (stats.value.distributed / stats.value.totalDonations * 100).toFixed(1) : 0 },
  { label: 'Cancelled', status: 'cancelled', count: stats.value.cancelled, percentage: stats.value.totalDonations ? (stats.value.cancelled / stats.value.totalDonations * 100).toFixed(1) : 0 }
])

const typesList = computed(() => [
  { label: 'Money', value: stats.value.valueMoney || 0 },
  { label: 'Goods', value: stats.value.valueGoods || 0 },
  { label: 'Services', value: stats.value.valueService || 0 }
])

const fetchDashboardData = async () => {
  const [donationStats, beneficiariesRes, campaignsRes, groupsRes] = await Promise.all([
    CharityService.getDonationStats(),
    CharityService.getBeneficiaries(),
    CharityService.getCampaigns(),
    CharityService.getBeneficiaryGroups()
  ])

  // Donation stats
  if (donationStats.success && donationStats.data) {
    const d = donationStats.data
    stats.value.totalDonations = d.totalDonations || 0
    stats.value.totalValue = d.totalValue || 0
    stats.value.statusBreakdown = d.statusBreakdown || {}
    stats.value.draft = d.statusBreakdown?.['draft'] || 0
    stats.value.pending = d.statusBreakdown?.['pending'] || 0
    stats.value.approved = d.statusBreakdown?.['approved'] || 0
    stats.value.distributed = d.statusBreakdown?.['distributed'] || 0
    stats.value.cancelled = d.statusBreakdown?.['cancelled'] || 0
    stats.value.approvedValue = d.statusBreakdown?.['approved'] || 0 // sum of approved values? maybe different
    stats.value.valueMoney = d.valueByType?.['money'] || 0
    stats.value.valueGoods = d.valueByType?.['goods'] || 0
    stats.value.valueService = d.valueByType?.['service'] || 0
    recentDonations.value = d.recentDonations || []
  }

  // Beneficiaries
  if (beneficiariesRes.success) {
    stats.value.beneficiaryCount = beneficiariesRes.data?.length || 0
  }

  // Campaigns
  if (campaignsRes.success) {
    const campaigns = campaignsRes.data || []
    stats.value.totalCampaigns = campaigns.length
    stats.value.activeCampaigns = campaigns.filter(c => c.status === 'active').length
  }

  // Groups
  if (groupsRes.success) {
    stats.value.groupCount = groupsRes.data?.length || 0
  }
}

const formatCurrency = (v) => v ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ETB' }).format(v) : 'ETB 0.00'
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''
const getStatusLabel = (status) => {
  const labels = { draft: 'Draft', pending: 'Pending', approved: 'Approved', distributed: 'Distributed', cancelled: 'Cancelled' }
  return labels[status] || status
}

onMounted(() => fetchDashboardData())
</script>

<style scoped>
.charity-dashboard {
  padding: 16px;
  min-height: 100vh;
  background: #f5f7fb;
  animation: fadeIn 0.3s ease;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.page-subtitle {
  font-size: 13px;
  color: #64748b;
  margin-top: 4px;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  background: white;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  font-size: 32px;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #3b82f6;
  border-radius: 12px;
}


.stat-content h3 {
  font-size: 13px;
  color: #64748b;
  margin: 0 0 4px;
}

.stat-number {
  font-size: 28px;
  font-weight: bold;
  color: #1e293b;
  margin: 4px 0;
}

.stat-trend {
  font-size: 12px;
  color: #10b981;
}

/* Charts Grid */
.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

/* Sections */
.section {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  margin-bottom: 24px;
}

.section h2 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px;
  color: #1e293b;
}

/* Status bars */
.status-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.status-label {
  width: 80px;
  font-size: 13px;
  color: #475569;
}

.status-bar {
  flex: 1;
  height: 24px;
  background: #f1f5f9;
  border-radius: 12px;
  overflow: hidden;
}

.status-fill {
  height: 100%;
  border-radius: 12px;
  transition: width 0.4s;
}

.fill-draft { background: #cbd5e1; }
.fill-pending { background: #fbbf24; }
.fill-approved { background: #3b82f6; }
.fill-distributed { background: #10b981; }
.fill-cancelled { background: #ef4444; }

.status-count {
  min-width: 30px;
  font-weight: 600;
  font-size: 13px;
}

/* Type list */
.type-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #f1f5f9;
}

.type-label {
  font-size: 14px;
  color: #475569;
}

.type-value {
  font-weight: 600;
  color: #1e293b;
}

/* Activity list */
.activity-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  background: #f9fafb;
  border-left: 3px solid #6a11cb;
  border-radius: 8px;
  font-size: 14px;
}

.activity-time {
  font-size: 12px;
  color: #6b7280;
  min-width: 70px;
}

.status-badge {
  padding: 2px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  text-transform: capitalize;
  margin-left: auto;
}

.status-draft { background: #f1f5f9; color: #475569; }
.status-pending { background: #fef3c7; color: #b45309; }
.status-approved { background: #dbeafe; color: #1d4ed8; }
.status-distributed { background: #dcfce7; color: #15803d; }
.status-cancelled { background: #fee2e2; color: #b91c1c; }

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 768px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
}
</style>