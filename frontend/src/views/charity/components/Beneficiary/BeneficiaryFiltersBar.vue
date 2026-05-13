<template>
  <div class="filters-bar">
    <div class="search-wrapper">
      <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
      <input
        v-model="localFilters.search"
        type="text"
        placeholder="Search beneficiaries..."
        class="search-input"
        @input="emitSearch"
      />
    </div>
    <select v-model="localFilters.type" class="filter-select" @change="emitAll">
      <option value="">All Types</option>
      <option value="individual">Individual</option>
      <option value="organization">Organization</option>
    </select>
    <select v-model="localFilters.groupId" class="filter-select" @change="emitAll">
      <option value="">All Groups</option>
      <option v-for="group in groups" :key="group.groupId" :value="group.groupId">
          {{ `${group?.manager?.firstName} ${group?.manager?.lastName}  <${group?.name}>`}}
      </option>
    </select>
    <select v-model="localFilters.locationId" class="filter-select" @change="emitAll">
      <option value="">All Locations</option>
      <option v-for="loc in locations" :key="loc.locationId" :value="loc.locationId">
        {{ loc.region }} - {{ loc.city }} - {{loc.woreda}}
      </option>
    </select>
    <button class="btn-clear" @click="clearFilters">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
        <path d="M18 6 6 18M6 6l12 12" />
      </svg>
      Clear
    </button>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  filters: { type: Object, required: true },
  groups: { type: Array, default: () => [] },
  locations: { type: Array, default: () => [] }
});

const emit = defineEmits(['update:filters', 'clear-filters']);

const localFilters = ref({ ...props.filters });

watch(() => props.filters, (val) => { localFilters.value = { ...val }; }, { deep: true });

function emitSearch() { emit('update:filters', { search: localFilters.value.search }); }
function emitAll() { emit('update:filters', { ...localFilters.value }); }

function clearFilters() {
  localFilters.value = { search: '', type: '', groupId: '', locationId: '' };
  emit('clear-filters');
}
</script>

<style scoped>
.filters-bar {
  display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap;
  background: white; padding: 16px; border-radius: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  align-items: center;
}
.search-wrapper { position: relative; flex: 1; min-width: 200px; }
.search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: #94a3b8; }
.search-input { width: 100%; padding: 8px 16px 8px 36px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 14px; }
.search-input:focus { border-color: #6a11cb; }
.filter-select { padding: 8px 16px; border: 1px solid #e2e8f0; border-radius: 10px; background: white; font-size: 14px; min-width: 150px; }
.btn-clear { display: flex; align-items: center; gap: 6px; padding: 8px 16px; background: #f1f5f9; border: none; border-radius: 10px; cursor: pointer; font-weight: 500; color: #475569; }
.btn-clear:hover { background: #e2e8f0; }
.btn-icon { width: 16px; height: 16px; }
</style>