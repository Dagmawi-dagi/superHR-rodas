<template>
  <div class="my-beneficiaries-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">My Beneficiaries</h1>
        <p class="page-subtitle">Beneficiaries in {{ groupName || 'your group' }}</p>
      </div>
    </div>

    <!-- Stats Cards -->
    <BeneficiaryStatsCards :stats="stats" />

    <div v-if="loading && !beneficiaries.length" class="loading-state">
      <div class="spinner"></div>
      <p>Loading beneficiaries...</p>
    </div>

    <div v-else>
      <!-- Filters -->
      <BeneficiaryFiltersBar
        :filters="filters"
        :groups="[]" 
        :locations="locations"
        @update:filters="updateFilters"
        @clear-filters="clearFilters"
      />

      <!-- Table -->
      <BeneficiaryTable
        :beneficiaries="beneficiaries"
        :pagination="pagination"
        :can-manage="false"
        @go-to-page="goToPage"
        @clear-filters="clearFilters"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import charityService from '@/stores/charity';

import BeneficiaryStatsCards from './components/Beneficiary/BeneficiaryStatsCards.vue';
import BeneficiaryFiltersBar from './components/Beneficiary/BeneficiaryFiltersBar.vue';
import BeneficiaryTable from './components/Beneficiary/BeneficiaryTable.vue';

// State
const beneficiaries = ref([]);
const locations = ref([]);
const groupName = ref('');
const groupId = ref<number | null>(null);
const loading = ref(false);

const stats = ref({
  total: 0,
  organizations: 0,
  individuals: 0
});

const pagination = ref({
  totalItems: 0,
  totalPages: 1,
  currentPage: 1,
  pageSize: 10
});

const filters = ref({
  search: '',
  type: '',
  groupId: '',
  locationId: ''
});

// Debounce
let searchTimeout: any = null;

// ========== METHODS ==========
const loadMyGroup = async () => {
  const res = await charityService.getMyGroup();
  if (res.success && res.data?.length) {
    groupName.value = res.data[0].name;
    groupId.value = res.data[0].groupId;
    filters.value.groupId = String(res.data[0].groupId);
    return res.data[0].groupId;
  }
  return null;
};

const loadLocations = async () => {
  const result = await charityService.getLocations();
  if (result.success) locations.value = result.data;
};

const calculateStats = () => {
  stats.value = {
    total: beneficiaries.value.length,
    organizations: beneficiaries.value.filter((b: any) => b.type === 'organization').length,
    individuals: beneficiaries.value.filter((b: any) => b.type === 'individual').length
  };
};

const loadBeneficiaries = async () => {
  if (!groupId.value) return;
  loading.value = true;
  try {
    const params = {
      page: pagination.value.currentPage,
      limit: pagination.value.pageSize,
      search: filters.value.search,
      type: filters.value.type,
      locationId: filters.value.locationId as any,
      groupId: groupId.value 
    };
    const result = await charityService.getBeneficiaries(params);
    if (result.success) {
      beneficiaries.value = result.data;
      pagination.value = result.pagination || { totalItems: result.data.length, totalPages: 1, currentPage: 1, pageSize: 10 };
      calculateStats();
    }
  } catch (error) {
    console.error('Failed to load beneficiaries', error);
  } finally {
    loading.value = false;
  }
};

const clearFilters = () => {
  filters.value = { search: '', type: '', groupId: String(groupId.value), locationId: '' };
  pagination.value.currentPage = 1;
  loadBeneficiaries();
};

const updateFilters = (newFilters: any) => {
  filters.value = { ...filters.value, ...newFilters };
  // Ensure they don't change the groupId filter away from their own group
  filters.value.groupId = String(groupId.value);
};

const goToPage = (page: number) => {
  pagination.value.currentPage = page;
  loadBeneficiaries();
};

// Watchers
watch(() => filters.value.search, () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    pagination.value.currentPage = 1;
    loadBeneficiaries();
  }, 500);
});

watch([() => filters.value.type, () => filters.value.locationId], () => {
  pagination.value.currentPage = 1;
  loadBeneficiaries();
});

// Init
onMounted(async () => {
  const myGroupId = await loadMyGroup();
  if (myGroupId) {
    await Promise.all([loadLocations(), loadBeneficiaries()]);
  }
});
</script>

<style scoped>
.my-beneficiaries-page {
  padding: 24px;
  min-height: 100vh;
  background: #f5f7fb;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
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
  .my-beneficiaries-page { padding: 16px; }
  .page-title { font-size: 20px; }
}
</style>
