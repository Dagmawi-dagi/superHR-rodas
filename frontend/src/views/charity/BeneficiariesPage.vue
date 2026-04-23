<template>
  <div class="beneficiaries-page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Beneficiary Management</h1>
        <p class="page-subtitle">Manage beneficiaries, groups, and transfers</p>
      </div>
      <div class="header-buttons">
        <router-link to="/charity/beneficiaries/create" class="btn-primary">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add Beneficiary
        </router-link>
      </div>
    </div>

    <!-- Stats -->
    <BeneficiaryStatsCards :stats="stats" />

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading beneficiaries...</p>
    </div>

    <div v-else>
      <!-- Filters -->
      <BeneficiaryFiltersBar
        :filters="filters"
        :groups="groups"
        :locations="locations"
        @update:filters="updateFilters"
        @clear-filters="clearFilters"
      />

      <!-- Table -->
      <BeneficiaryTable
        :beneficiaries="beneficiaries"
        :pagination="pagination"
        @view="viewBeneficiary"
        @edit="editBeneficiary"
        @transfer="openTransferModal"
        @delete="openDeleteModal"
        @go-to-page="goToPage"
        @clear-filters="clearFilters"
      />
    </div>

    <!-- Modals -->
    <BeneficiaryModals
      :show-transfer-modal="showTransferModal"
      :show-delete-modal="showDeleteModal"
      :beneficiary-to-transfer="beneficiaryToTransfer"
      :beneficiary-to-delete="beneficiaryToDelete"
      :groups="groups"
      :deleting="deleting"
      :toasts="toasts"
      @close-transfer-modal="closeTransferModal"
      @confirm-transfer="confirmTransfer"
      @close-delete-modal="closeDeleteModal"
      @confirm-delete="deleteBeneficiary"
      @remove-toast="removeToast"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import CharityService from '@/stores/charity';

// Components
import BeneficiaryStatsCards from './components/Beneficiary/BeneficiaryStatsCards.vue';
import BeneficiaryFiltersBar from './components/Beneficiary/BeneficiaryFiltersBar.vue';
import BeneficiaryTable from './components/Beneficiary/BeneficiaryTable.vue';
import BeneficiaryModals from './components/Beneficiary/BeneficiaryModals.vue';

const router = useRouter();

// State
const beneficiaries = ref([]);
const groups = ref([]);
const locations = ref([]);
const loading = ref(false);
const deleting = ref(false);

const stats = ref({ total: 0, organizations: 0, groups: 0, individuals: 0 });

const pagination = ref({ currentPage: 1, totalPages: 1 });
const filters = ref({ search: '', type: '', groupId: '', locationId: '' });

// Modals
const showTransferModal = ref(false);
const beneficiaryToTransfer = ref(null);
const showDeleteModal = ref(false);
const beneficiaryToDelete = ref(null);

const toasts = ref([]);
let searchTimeout = null;

// Toast helpers
const addToast = (message, type = 'success') => {
  const id = Date.now();
  toasts.value.push({ id, message, type });
  setTimeout(() => removeToast(id), 3000);
};
const removeToast = (id) => { toasts.value = toasts.value.filter(t => t.id !== id); };

// Data loading
const loadGroups = async () => {
  const res = await CharityService.getBeneficiaryGroups();
  if (res.success) groups.value = res.data;
};

const loadLocations = async () => {
  const res = await CharityService.getLocations();
  if (res.success) locations.value = res.data;
};

const loadStats = async () => {
  // Compute stats from current beneficiaries data or fetch separately
  const all = await CharityService.getBeneficiaries({ size: 1 }); // get total count quickly
  // For accurate breakdown, we can rely on the list data but we'll compute from loaded data
  // Simple: just fetch all first page with large size? Better: call a stats endpoint if exists, else compute from list
  // As a simple solution, we call getBeneficiaries without pagination to count. Or we can create a separate stats call.
  // Since we don't have a dedicated stats endpoint for beneficiaries, we'll calculate from the current full list after load.
};

const loadBeneficiaries = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.value.currentPage,
      size: 10,
      search: filters.value.search,
      type: filters.value.type,
      groupId: filters.value.groupId,
      locationId: filters.value.locationId
    };
    const res = await CharityService.getBeneficiaries(params);
    if (res.success) {
      beneficiaries.value = res.data;
      pagination.value = res.pagination || { currentPage: 1, totalPages: 1 };
      // Compute stats from full list (not perfect, but close)
      updateStats(res.data);
    } else {
      addToast(res.error || 'Failed to load beneficiaries', 'error');
    }
  } catch (e) {
    addToast('Failed to load beneficiaries', 'error');
  } finally {
    loading.value = false;
  }
};

// Simple stats from current page data (not full but indicative)
const updateStats = (list) => {
  stats.value.total = pagination.value.totalItems || 0;
  // To get accurate counts, we might need separate aggregation. For simplicity, we count current page only.
  // In a real app, you'd have a stats endpoint.
  const orgs = list.filter(b => b.type === 'organization').length;
  const grps = list.filter(b => b.type === 'group').length;
  const inds = list.filter(b => b.type === 'individual').length;
  // We'll store page-level counts. For total stats across all pages, you'd need backend support.
  // We'll set to 0 as placeholder, but you can implement a backend /beneficiaries/stats route if needed.
  // For now, just show placeholder based on pagination total (not accurate breakdown).
  stats.value.organizations = orgs;
  stats.value.groups = grps;
  stats.value.individuals = inds;
};

// Actions
const viewBeneficiary = (ben) => router.push(`/charity/beneficiaries/${ben.beneficiaryId}`);
const editBeneficiary = (ben) => router.push(`/charity/beneficiaries/${ben.beneficiaryId}/edit`);

const openTransferModal = (ben) => {
  beneficiaryToTransfer.value = ben;
  showTransferModal.value = true;
};
const closeTransferModal = () => {
  showTransferModal.value = false;
  beneficiaryToTransfer.value = null;
};

const confirmTransfer = async ({ beneficiaryId, toGroupId, reason }) => {
  const res = await CharityService.transferBeneficiary(beneficiaryId, toGroupId, reason);
  if (res.success) {
    addToast('Beneficiary transferred successfully');
    closeTransferModal();
    loadBeneficiaries();
  } else {
    addToast(res.error || 'Transfer failed', 'error');
  }
};

const openDeleteModal = (ben) => {
  beneficiaryToDelete.value = ben;
  showDeleteModal.value = true;
};
const closeDeleteModal = () => {
  showDeleteModal.value = false;
  beneficiaryToDelete.value = null;
};

const deleteBeneficiary = async () => {
  deleting.value = true;
  const res = await CharityService.deleteBeneficiary(beneficiaryToDelete.value.beneficiaryId);
  deleting.value = false;
  if (res.success) {
    addToast('Beneficiary deleted');
    closeDeleteModal();
    loadBeneficiaries();
  } else {
    addToast(res.error || 'Delete failed', 'error');
  }
};

const clearFilters = () => {
  filters.value = { search: '', type: '', groupId: '', locationId: '' };
  pagination.value.currentPage = 1;
  loadBeneficiaries();
};

const updateFilters = (newFilters) => {
  filters.value = { ...filters.value, ...newFilters };
};

const goToPage = (page) => {
  pagination.value.currentPage = page;
  loadBeneficiaries();
};

// Watchers
watch(() => filters.value.search, () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => { pagination.value.currentPage = 1; loadBeneficiaries(); }, 500);
});
watch([() => filters.value.type, () => filters.value.groupId, () => filters.value.locationId], () => {
  pagination.value.currentPage = 1;
  loadBeneficiaries();
});

// Init
onMounted(async () => {
  await Promise.all([loadGroups(), loadLocations(), loadBeneficiaries()]);
});
</script>

<style scoped>
.beneficiaries-page { padding: 16px; min-height: 100vh; background: #f5f7fb; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
.page-title { font-size: 24px; font-weight: 700; color: #1e293b; margin-bottom: 4px; }
.page-subtitle { font-size: 13px; color: #64748b; }
.header-buttons { display: flex; gap: 12px; }
.btn-primary { display: flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 10px; font-weight: 600; text-decoration: none; font-size: 14px; background: linear-gradient(135deg, #6a11cb, #7c3aed); color: white; border: none; }
.btn-icon { width: 18px; height: 18px; }
.loading-state { text-align: center; padding: 60px; background: white; border-radius: 16px; }
.spinner { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #6a11cb; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 768px) { .beneficiaries-page { padding: 12px; } .page-title { font-size: 20px; } }
</style>