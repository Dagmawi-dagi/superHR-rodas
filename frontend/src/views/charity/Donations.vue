<template>
  <div class="donations-page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Donation Management</h1>
        <p class="page-subtitle">Manage donations, campaigns, and distributions</p>
      </div>
      <div class="header-buttons">
        <router-link to="/charity/analytics" class="btn-analytics">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.66 0 3-4 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4-3-9s1.34-9 3-9" />
            <path d="M12 3v18" />
          </svg>
          Analytics
        </router-link>
        <router-link to="/charity/donations/create" class="btn-primary">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New Donation
        </router-link>
      </div>
    </div>

    <!-- Stats Cards -->
    <DonationStatsCards :stats="kpiStats" />

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
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
        :can-approve="canApprove"
        @view-donation="viewDonation"
        @edit-donation="editDonation"
        @submit-donation="submitDonation"
        @approve-donation="approveDonation"
        @distribute-donation="distributeDonation"
        @cancel-donation="confirmCancel"
        @go-to-page="goToPage"
        @clear-filters="clearFilters"
      />
    </div>

    <!-- Modals -->
    <DonationModals
      :show-cancel-modal="showCancelModal"
      :donation-to-cancel="donationToCancel"
      :canceling="canceling"
      :toasts="toasts"
      @close-cancel-modal="closeCancelModal"
      @confirm-cancel="cancelDonation"
      @remove-toast="removeToast"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import CharityService from '@/stores/charity';
import { useAuthStore } from '@/stores/auth';

import DonationStatsCards from './components/Donation/DonationStatsCards.vue';
import DonationFiltersBar from './components/Donation/DonationFiltersBar.vue';
import DonationTable from './components/Donation/DonationTable.vue';
import DonationModals from './components/Donation/DonationModals.vue';

const router = useRouter();
const authStore = useAuthStore();

// State
const donations = ref([]);
const companies = ref([]);
const campaigns = ref([]);
const kpiStats = ref({
  totalDonations: 0,
  totalValue: 0,
  statusBreakdown: {},
  valueByType: {}
});
const loading = ref(false);
const canceling = ref(false);

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

// Modal
const showCancelModal = ref(false);
const donationToCancel = ref(null);

// Toasts
const toasts = ref([]);

// Computed
const canApprove = computed(() => {
  const role = authStore.user?.role;
  return role === 'admin' || role === 'finance';
});

// Debounce
let searchTimeout = null;

// ========== METHODS ==========
const addToast = (message, type = 'success') => {
  const id = Date.now();
  toasts.value.push({ id, message, type });
  setTimeout(() => removeToast(id), 3000);
};

const removeToast = (id) => {
  toasts.value = toasts.value.filter(t => t.id !== id);
};

const loadCompanies = async () => {
  const result = await CharityService.getCompanies();
  if (result.success) companies.value = result.data;
};

const loadCampaigns = async () => {
  const result = await CharityService.getCampaigns();
  if (result.success) campaigns.value = result.data;
};

const loadKpiStats = async () => {
  const result = await CharityService.getDonationStats();
  if (result.success && result.data) kpiStats.value = result.data;
};

const loadDonations = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.value.currentPage,
      size: pagination.value.pageSize,
      search: filters.value.search,
      status: filters.value.status,
      companyId: filters.value.companyId,
      campaignId: filters.value.campaignId
    };
    const result = await CharityService.getDonations(params);
    if (result.success) {
      donations.value = result.data;
      pagination.value = result.pagination;
    } else {
      addToast(result.error || 'Failed to load donations', 'error');
    }
  } catch (error) {
    addToast('Failed to load donations', 'error');
  } finally {
    loading.value = false;
  }
};

const viewDonation = (donation) => router.push(`/charity/donations/${donation.donationId}`);
const editDonation = (donation) => router.push(`/charity/donations/${donation.donationId}/edit`);

const submitDonation = async (donation) => {
  const result = await CharityService.submitDonation(donation.donationId);
  result.success ? addToast('Submission successful', 'success') : addToast(result.error, 'error');
  loadDonations();
  loadKpiStats();
};

const approveDonation = async (donation) => {
  const result = await CharityService.approveDonation(donation.donationId);
  result.success ? addToast('Donation approved', 'success') : addToast(result.error, 'error');
  loadDonations();
  loadKpiStats();
};

const distributeDonation = async (donation) => {
  const result = await CharityService.distributeDonation(donation.donationId);
  result.success ? addToast('Marked as distributed', 'success') : addToast(result.error, 'error');
  loadDonations();
  loadKpiStats();
};

const confirmCancel = (donation) => {
  donationToCancel.value = donation;
  showCancelModal.value = true;
};

const cancelDonation = async () => {
  canceling.value = true;
  const result = await CharityService.cancelDonation(donationToCancel.value.donationId);
  canceling.value = false;
  if (result.success) {
    addToast('Donation cancelled', 'success');
    closeCancelModal();
    loadDonations();
    loadKpiStats();
  } else {
    addToast(result.error, 'error');
  }
};

const closeCancelModal = () => {
  showCancelModal.value = false;
  donationToCancel.value = null;
};

const clearFilters = () => {
  filters.value = { search: '', status: '', companyId: '', campaignId: '' };
  pagination.value.currentPage = 1;
  loadDonations();
};

const updateFilters = (newFilters) => {
  filters.value = { ...filters.value, ...newFilters };
};

const goToPage = (page) => {
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
  await Promise.all([loadCompanies(), loadCampaigns(), loadKpiStats(), loadDonations()]);
});
</script>

<style scoped>
.donations-page {
  padding: 16px;
  min-height: 100vh;
  background: #f5f7fb;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
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

.header-buttons {
  display: flex;
  gap: 12px;
}

.btn-primary, .btn-analytics {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 10px;
  font-weight: 600;
  text-decoration: none;
  font-size: 14px;
}

.btn-primary {
  background: linear-gradient(135deg, #6a11cb, #7c3aed);
  color: white;
  border: none;
}

.btn-analytics {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
}

.btn-icon { width: 18px; height: 18px; }

.loading-state {
  text-align: center;
  padding: 60px;
  background: white;
  border-radius: 16px;
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
  .donations-page { padding: 12px; }
  .page-title { font-size: 20px; }
}
</style>