<template>
  <aside class="sidebar" :class="{ collapsed: isCollapsed }">
    <div class="user-section" :class="{ 'collapsed-user': isCollapsed }">
      <div class="user-avatar">
        <img :src="userAvatar" alt="User" />
        <span class="online-dot"></span>
      </div>
      <div v-show="!isCollapsed" class="user-info">
        <h4>{{ userDisplayName }}</h4>
        <p>{{ roleTitle }}</p>
      </div>
    </div>

    <nav class="nav-menu">
      <template v-for="item in menuItems" :key="item.path">
        <router-link
          v-if="!item.dropdownMenu"
          :to="item.path"
          class="nav-item"
          :class="{ active: isActiveRoute(item.path) }"
        >
          <component :is="getIcon(item.icon)" class="nav-icon" />
          <span class="nav-text">{{ item.name }}</span>
          <span v-if="item.badge" class="nav-badge">{{ item.badge }}</span>
        </router-link>

        <div v-if="item.dropdownMenu">
          <button
            @click="toggleDropdown(item.path)"
            class="!py-2.5 !px-3 w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#2d3a54] hover:text-white transition-colors"
            :class="{ 'bg-[#2d3a54] text-white': openDropdown === item.path }"
          >
            <div class="flex items-center space-x-3 gap-2">
              <component :is="getIcon(item.icon)" class="nav-icon" />
              <span class="text-sm">{{ item.name }}</span>
            </div>
            <component
              class="nav-icon !w-3 !min-w-px"
              :is="openDropdown === item.path ? getIcon('ChevronDownIcon') : getIcon('ChevronRightIcon')"
              :size="14"
            />
          </button>
          <div v-if="openDropdown === item.path" class="mt-1 ml-9 space-y-1 !pl-4 overflow-hidden transition-all duration-300">
            <router-link
              v-for="sub in item.dropdownMenu"
              :key="sub.path"
              :to="sub.path"
              class="nav-item !py-1 !px-1"
              :class="{ active: isActiveRoute(sub.path) }"
            >
              <component :is="getIcon(sub.icon)" class="nav-icon !w-4 !min-w-px" />
              <span class="nav-text">{{ sub.name }}</span>
              <span v-if="sub.badge" class="nav-badge">{{ sub.badge }}</span>
            </router-link>
          </div>
        </div>
      </template>
    </nav>

    <div class="sidebar-footer">
      <button class="logout-btn" @click="handleLogout">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
        </svg>
        <span v-show="!isCollapsed">Logout</span>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import * as icons from '@heroicons/vue/24/outline'

const props = defineProps({ collapsed: { type: Boolean, default: false } })
const emit  = defineEmits(['update:collapsed'])

const route     = useRoute()
const router    = useRouter()
const authStore = useAuthStore()

const userRole      = computed(() => authStore.user?.role || 'employee')
const isCollapsed   = ref(props.collapsed)
const openDropdown  = ref(null)

const toggleDropdown = (path) => {
  openDropdown.value = openDropdown.value === path ? null : path
}

const userDisplayName = computed(() =>
  authStore.user?.fullEmployeeName || authStore.user?.fullName || 'User'
)
const userAvatar = computed(() =>
  authStore.user?.profilePicture ||
  authStore.user?.profilePictureUrl ||
  `https://ui-avatars.com/api/?background=6a11cb&color=fff&bold=true&name=${encodeURIComponent(userDisplayName.value)}`
)

const roleTitle = computed(() => {
  const titles = {
    admin: 'Administrator',
    hr: 'HR Manager',
    finance: 'Finance Officer',
    employee: 'Employee',
    attendance: 'Attendance Manager',
    charity_admin: 'Charity Admin',
    charity_teamleader: 'Team Leader',
  }
  return titles[userRole.value] || 'User'
})

const roleMenus = {
  admin: [
    { name: 'Dashboard', path: '/dashboard', icon: 'HomeIcon' },
    { name: 'Users',     path: '/users',     icon: 'UsersIcon' },
    { name: 'Employees', path: '/employees', icon: 'UserGroupIcon' },
    { name: 'Attendance',path: '/attendance',icon: 'ClockIcon' },
    { name: 'Leave Requests', path: '/leaves', icon: 'CalendarIcon' },
    { name: 'Salary',    path: '/salary',    icon: 'CurrencyDollarIcon' },
    { name: 'Reports',   path: '/reports',   icon: 'ChartBarIcon' },
    { name: 'Settings', path: '/settings', icon: 'CogIcon' },
  ],

  // ── charity_admin ──────────────────────────────────────────────────────────
  charity_admin: [
    { name: 'Dashboard', path: '/dashboard', icon: 'HomeIcon' },
    { name: 'All Donations',      path: '/charity/donations',                 icon: 'ArchiveBoxIcon' },
    { name: 'Adjustment Requests',path: '/charity/donations/adjustments',      icon: 'AdjustmentsHorizontalIcon' },
    { name: 'Beneficiaries',      path: '/charity/beneficiaries',             icon: 'UsersIcon' },
    { name: 'Beneficiary Groups', path: '/charity/groups',                  icon: 'RectangleStackIcon' },
    { name: 'Campaigns',          path: '/charity/campaigns',    icon: 'SpeakerWaveIcon' },
    { name: 'Donation Companies', path: '/charity/companies',    icon: 'BuildingOffice2Icon' },
  ],

  // ── charity_teamleader ─────────────────────────────────────────────────────
  charity_teamleader: [
    { name: 'Dashboard',        path: '/dashboard',            icon: 'HomeIcon' },
    { name: 'My Donations',     path: '/charity/my-donations',     icon: 'ArchiveBoxIcon' },
    { name: 'My Beneficiaries', path: '/charity/my-beneficiaries', icon: 'UsersIcon' },
  ],

  hr: [
    { name: 'Dashboard',     path: '/dashboard', icon: 'HomeIcon' },
    { name: 'Employees',     path: '/employees', icon: 'UserGroupIcon' },
    { name: 'Attendance',    path: '/attendance',icon: 'ClockIcon' },
    { name: 'Leave Requests',path: '/leaves',    icon: 'CalendarIcon' },
    { name: 'Reports',       path: '/reports',   icon: 'ChartBarIcon' },
  ],
  finance: [
    { name: 'Dashboard', path: '/dashboard', icon: 'HomeIcon' },
    { name: 'Employees', path: '/employees', icon: 'UserGroupIcon' },
    { name: 'Salary',    path: '/salary',    icon: 'CurrencyDollarIcon' },
    { name: 'Payroll',   path: '/payroll',   icon: 'BanknotesIcon' },
    { name: 'Reports',   path: '/reports',   icon: 'ChartBarIcon' },
  ],
  employee: [
    { name: 'Dashboard',   path: '/dashboard',   icon: 'HomeIcon' },
    { name: 'My Profile',  path: '/profile',     icon: 'UserIcon' },
    { name: 'My Attendance',path: '/my-attendance',icon: 'ClockIcon' },
    { name: 'My Leaves',   path: '/my-leaves',   icon: 'CalendarIcon' },
    { name: 'My Salary',   path: '/my-salary',   icon: 'CurrencyDollarIcon' },
  ],
  attendance: [
    { name: 'Dashboard',   path: '/dashboard', icon: 'HomeIcon' },
    { name: 'My Attendance',path: '/attendance',icon: 'ClockIcon' },
  ],

}

const menuItems = computed(() => roleMenus[userRole.value] || roleMenus.employee)

const getIcon    = (name) => icons[name] || icons.HomeIcon
const isActiveRoute = (path) => {
  const cur = route.path
  if (path === '/dashboard') return cur === '/dashboard'
  return cur === path || cur.startsWith(path + '/')
}

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
  emit('update:collapsed', isCollapsed.value)
  localStorage.setItem('sidebarCollapsed', isCollapsed.value)
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

const savedState = localStorage.getItem('sidebarCollapsed')
if (savedState !== null) {
  isCollapsed.value = savedState === 'true'
  emit('update:collapsed', isCollapsed.value)
}
</script>

<style scoped>
/* ── layout ─────────────────────────────────────────────────────────────── */
.sidebar {
  width: 200px;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  color: white;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  flex-shrink: 0;
  position: sticky;
  top: 60px;
  height: calc(100vh - 60px);
  overflow-y: auto;
}
.sidebar.collapsed { width: 70px; }
.sidebar::-webkit-scrollbar { width: 5px; }
.sidebar::-webkit-scrollbar-track { background: #2a2a4a; }
.sidebar::-webkit-scrollbar-thumb { background: #5a5a8a; border-radius: 5px; }

/* ── user section ───────────────────────────────────────────────────────── */
.user-section {
  display: flex; align-items: center; gap: 10px;
  padding: 20px 16px;
  border-bottom: 1px solid rgba(255,255,255,.1);
  margin-bottom: 16px; flex-shrink: 0;
}
.user-avatar { position: relative; flex-shrink: 0; }
.user-avatar img { width: 40px; height: 40px; border-radius: 50%; border: 2px solid #667eea; object-fit: cover; }
.online-dot {
  position: absolute; bottom: 2px; right: 2px;
  width: 10px; height: 10px;
  background: #4ade80; border-radius: 50%;
  border: 2px solid #1a1a2e;
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0%,100% { transform: scale(1); opacity: 1; }
  50%      { transform: scale(1.2); opacity: .7; }
}
.user-info { overflow: hidden; white-space: nowrap; }
.user-info h4 { font-size: .85rem; font-weight: 600; margin-bottom: 2px; }
.user-info p  { font-size: .65rem; opacity: .7; }
.collapsed-user { justify-content: center; padding: 20px 0; }

/* ── nav ────────────────────────────────────────────────────────────────── */
.nav-menu { flex: 1; padding: 0 12px; }
.nav-item {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 12px; margin: 4px 0;
  border-radius: 10px;
  color: rgba(255,255,255,.7);
  text-decoration: none;
  transition: all .2s; white-space: nowrap;
}
.nav-item:hover { background: rgba(255,255,255,.1); color: white; }
.nav-item.active {
  background: linear-gradient(135deg, #6a11cb, #7c3aed);
  color: white;
  box-shadow: 0 2px 8px rgba(106,17,203,.3);
}
.nav-icon { width: 20px; height: 20px; min-width: 20px; }
.nav-text { font-size: .85rem; font-weight: 500; }
.nav-badge {
  background: #ef4444; color: white;
  font-size: .6rem; font-weight: 600;
  padding: 2px 6px; border-radius: 20px;
  min-width: 20px; text-align: center; margin-left: auto;
}

/* ── footer ─────────────────────────────────────────────────────────────── */
.sidebar-footer { padding: 16px; border-top: 1px solid rgba(255,255,255,.1); flex-shrink: 0; }
.logout-btn {
  width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px;
  padding: 10px;
  background: rgba(239,68,68,.1); border: 1px solid rgba(239,68,68,.3);
  border-radius: 10px; color: #f87171; cursor: pointer;
  transition: all .2s; font-weight: 500; font-size: .85rem;
}
.logout-btn:hover { background: rgba(239,68,68,.2); border-color: #ef4444; }
.logout-btn svg { width: 18px; height: 18px; }

/* ── collapsed ───────────────────────────────────────────────────────────── */
.sidebar.collapsed .nav-text,
.sidebar.collapsed .user-info,
.sidebar.collapsed .logout-btn span { display: none; }
.sidebar.collapsed .nav-item { justify-content: center; padding: 10px; }
.sidebar.collapsed .logout-btn { justify-content: center; }

@media (max-width: 768px) {
  .sidebar {
    position: fixed; left: 0; top: 60px;
    height: calc(100vh - 60px); z-index: 1000;
    transform: translateX(-100%); transition: transform .3s ease;
  }
  .sidebar.collapsed { transform: translateX(0); width: 260px; }
  .sidebar.collapsed .nav-text { display: inline; }
}
</style>