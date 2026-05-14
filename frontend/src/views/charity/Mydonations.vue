<template>
  <div class="my-donations-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">My Donations</h1>
        <p class="page-subtitle">Donations created by you</p>
      </div>
      <router-link to="/charity/my-donations/create" class="btn-primary">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon"><path d="M12 5v14M5 12h14"/></svg>
        New Donation
      </router-link>
    </div>

    <!-- Stats Cards -->
    <DonationStatsCards :stats="kpiStats" />

    <div v-if="loading && !donations.length" class="loading-state">
      <div class="spinner"></div>
      <p>Loading donations...</p>
    </div>

    <div v-else>
      <!-- Filters -->
      <DonationFiltersBar
        :filters="filters"
        :companies="companies"
        :campaigns="campaigns"
        @update:filters="updateFilters"
        @clear-filters="clearFilters"
        @load-donations="loadDonations"
      />

      <!-- Table -->
      <DonationTable
        :donations="donations"
        :pagination="pagination"
        :can-approve="false"
        @view-donation="viewDonation"
        @edit-donation="editDonation"
        @submit-donation="submitDonation"
        @go-to-page="goToPage"
        @clear-filters="clearFilters"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import charityService from '@/stores/charity';
import { useAuthStore } from '@/stores/auth';

import DonationStatsCards from './components/Donation/DonationStatsCards.vue';
import DonationFiltersBar from './components/Donation/DonationFiltersBar.vue';
import DonationTable from './components/Donation/DonationTable.vue';

const router = useRouter();
const authStore = useAuthStore();

// State
const donations = ref([]);
const companies = ref([]);
const campaigns = ref([]);
const myGroupName = ref('');
const myGroupId = ref<number | null>(null);
const loading = ref(false);

const kpiStats = ref({
  totalDonations: 0,
  totalValue: 0,
  statusBreakdown: {},
  valueByType: {},
  returnedValue: 0
});

const pagination = ref({
  totalItems: 0,
  totalPages: 1,
  currentPage: 1,
  pageSize: 10
});

const filters = ref({
  search: '',
  status: '',
  companyId: '',
  campaignId: ''
});

// Debounce
let searchTimeout: any = null;

// ========== METHODS ==========
const loadMyGroup = async () => {
  const res = await charityService.getMyGroup();
  if (res.success && res.data?.length) {
    myGroupName.value = res.data[0].name;
    myGroupId.value = res.data[0].groupId;
    return res.data[0].groupId;
  }
  return null;
};

const loadCompanies = async () => {
  const result = await charityService.getCompanies();
  if (result.success) companies.value = result.data;
};

const loadCampaigns = async () => {
  const result = await charityService.getCampaigns();
  if (result.success) campaigns.value = result.data;
};

const loadKpiStats = async () => {
  const params: any = {
    createdBy: authStore.user?.employeeId
  };
  const result = await charityService.getDonationStats(params);
  if (result.success && result.data) kpiStats.value = result.data;
};

const loadDonations = async () => {
  loading.value = true;
  try {
    const params: any = {
      page: pagination.value.currentPage,
      size: pagination.value.pageSize, // match backend 'size' param
      search: filters.value.search,
      status: filters.value.status,
      companyId: filters.value.companyId as any,
      campaignId: filters.value.campaignId as any,
      createdBy: authStore.user?.employeeId
    };

    const result = await charityService.getDonations(params);
    if (result.success) {
      donations.value = result.data;
      pagination.value = result.pagination;
    }
  } catch (error) {
    console.error('Failed to load donations', error);
  } finally {
    loading.value = false;
  }
};

const viewDonation = (donation: any) => router.push(`/charity/donations/${donation.donationId}`);
const editDonation = (donation: any) => router.push(`/charity/my-donations/${donation.donationId}/edit`);

const submitDonation = async (donation: any) => {
  const result = await charityService.submitDonation(donation.donationId);
  if (result.success) {
    await loadDonations();
    await loadKpiStats();
  } else {
    alert(result.error || 'Failed to submit donation');
  }
};

const clearFilters = () => {
  filters.value = { search: '', status: '', companyId: '', campaignId: '' };
  pagination.value.currentPage = 1;
  loadDonations();
};

const updateFilters = (newFilters: any) => {
  filters.value = { ...filters.value, ...newFilters };
};

const goToPage = (page: number) => {
  pagination.value.currentPage = page;
  loadDonations();
};

// Watchers
watch(() => filters.value.search, () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    pagination.value.currentPage = 1;
    loadDonations();
  }, 500);
});

watch([() => filters.value.status, () => filters.value.companyId, () => filters.value.campaignId], () => {
  pagination.value.currentPage = 1;
  loadDonations();
});

// Init
onMounted(async () => {
  // We still load group info just to show the name if available, but it's not a filter requirement anymore
  loadMyGroup();
  
  await Promise.all([
    loadCompanies(), 
    loadCampaigns(), 
    loadKpiStats(), 
    loadDonations()
  ]);
});
</script>

<style scoped>
.my-donations-page {
  padding: 24px;
  min-height: 100vh;
  background: #f5f7fb;
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
  margin-bottom: 4px;
}

.page-subtitle {
  font-size: 13px;
  color: #64748b;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #6a11cb, #7c3aed);
  color: white;
  border-radius: 10px;
  font-weight: 600;
  text-decoration: none;
  font-size: 14px;
  border: none;
  cursor: pointer;
}

.btn-primary:hover {
  opacity: 0.9;
}

.btn-icon { width: 18px; height: 18px; }

.loading-state {
  text-align: center;
  padding: 60px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #6a11cb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 768px) {
  .my-donations-page { padding: 16px; }
  .page-title { font-size: 20px; }
}
</style>
