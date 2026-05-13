import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import MainLayout from "@/layouts/MainLayout.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/login",
      name: "login",
      component: () => import("@/views/auth/loginpage.vue"),
      meta: { requiresAuth: false, title: "Login" },
    },
    {
      path: "/",
      component: MainLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: "dashboard",
          name: "dashboard",
          component: () => import("@/views/dashboard/Dashboard.vue"),
          meta: {
            title: "Dashboard",
            roles: ["admin", "hr", "finance", "employee","attendance","charity_admin","charity_teamleader"],
          },
        },
        {
          path: "profile",
          name: "profile",
          component: () => import("@/views/employee/Profile.vue"),
          meta: {
            title: "My Profile",
            roles: ["admin", "hr", "finance", "employee","attendance","charity"],
          },
        },
        {
          path: "employees",
          name: "employees",
          component: () => import("@/views/employee/Employees.vue"),
          meta: { title: "Employees Management", roles: ["admin"] },
        },
        {
          path: "employees/create",
          name: "employee-create",
          component: () => import("@/views/employee/EmployeeCreate.vue"),
          meta: { title: "Create Employee", roles: ["admin"] },
        },
        {
          path: "employees/:id",
          name: "employee-detail",
          component: () => import("@/views/employee/EmployeeDetail.vue"),
          meta: { title: "Employee Details", roles: ["admin"] },
        },
        {
          path: "employees/:id/edit",
          name: "employee-edit",
          component: () => import("@/views/employee/EmployeeEdit.vue"),
          meta: { title: "Edit Employee", roles: ["admin"] },
        },
        {
          path: "users",
          name: "users",
          component: () => import("@/views/users/Users.vue"),
          meta: { title: "Users Management", roles: ["admin"] },
        },
        {
          path: "analytics",
          name: "analytics",
          component: () => import("@/views/analytics/Analytics.vue"),
          meta: { title: "HR Analytics", roles: ["admin", "hr"] },
        },
        {
          path: "attendance",
          name: "attendance",
          component: () => import("@/views/attendance/attendance.vue"),
          meta: { title: "HR attendance", roles: ["admin", "hr","attendance"] },
        },
        {
          path: "settings",
          name: "settings",
          component: () => import("@/views/settings/settings.vue"),
          meta: { title: "HR settings", roles: ["admin"] },
        },
        {
          path: "attendanceConfig",
          name: "attendanceConfig",
          component: () => import("@/views/attendance/attendanceConfig.vue"),
          meta: { title: "HR attendance Config", roles: ["admin", "hr","attendance"] },
        },
        // Only the charity section — replace the existing charity routes block in your router/index.ts
        // Roles: "charity_admin" | "charity_teamleader"

        // ── CHARITY ADMIN routes ───────────────────────────────────────────────────
        {
          path: 'charity/donations',
          name: 'donations',
          component: () => import('@/views/charity/Donations.vue'),
          meta: { title: 'Donations', roles: ['admin', 'charity_admin'] },
        },
        {
          path: 'charity/donations/pending-approvals',
          name: 'donations-pending',
          component: () => import('@/views/charity/DonationsPendingApproval.vue'),
          meta: { title: 'Pending Approvals', roles: ['admin', 'charity_admin'] },
        },
        {
          path: 'charity/donations/adjustments',
          name: 'adjustment-requests',
          component: () => import('@/views/charity/AdjustmentRequests.vue'),
          meta: { title: 'Adjustment Requests', roles: ['admin', 'charity_admin'] },
        },
        {
          path: 'charity/donations/:id',
          name: 'donation-detail',
          component: () => import('@/views/charity/DonationDetail.vue'),
          meta: { title: 'Donation Detail', roles: ['admin', 'charity_admin', 'charity_teamleader'] },
        },
        {
          path: 'charity/campaigns',
          name: 'campaigns',
          component: () => import('@/views/charity/Campaigns.vue'),
          meta: { title: 'Campaigns', roles: ['admin', 'charity_admin'] },
        },
        {
          path: 'charity/campaigns/create',
          name: 'campaigns-create',
          component: () => import('@/views/charity/CampaignCreate.vue'),
          meta: { title: 'New Campaign', roles: ['admin', 'charity_admin'] },
        },
        {
          path: 'charity/campaigns/:id/edit',
          name: 'campaigns-edit',
          component: () => import('@/views/charity/CampaignCreate.vue'),
          meta: { title: 'Edit Campaign', roles: ['admin', 'charity_admin'] },
        },
        {
          path: 'charity/groups',
          name: 'beneficiary-groups',
          component: () => import('@/views/charity/BeneficiaryGroups.vue'),
          meta: { title: 'Beneficiary Groups', roles: ['admin', 'charity_admin'] },
        },
        {
          path: 'charity/groups/:id/beneficiaries',
          name: 'group-beneficiaries',
          component: () => import('@/views/charity/GroupBeneficiaries.vue'),
          meta: { title: 'Group Beneficiaries', roles: ['admin', 'charity_admin'] },
        },
        {
          path: 'charity/beneficiaries',
          name: 'charity-beneficiaries',
          component: () => import('@/views/charity/Beneficiaries.vue'),
          meta: { title: 'All Beneficiaries', roles: ['admin', 'charity_admin'] },
        },
        {
          path: 'charity/beneficiaries/create',
          name: 'beneficiaries-create',
          component: () => import('@/views/charity/BeneficiaryCreate.vue'),
          meta: { title: 'Add Beneficiary', roles: ['admin', 'charity_admin'] },
        },
        {
          path: 'charity/beneficiaries/:id/edit',
          name: 'beneficiaries-edit',
          component: () => import('@/views/charity/BeneficiaryCreate.vue'),
          meta: { title: 'Edit Beneficiary', roles: ['admin', 'charity_admin'] },
        },
        {
          path: 'charity/companies',
          name: 'companies',
          component: () => import('@/views/charity/Companies.vue'),
          meta: { title: 'Donation Companies', roles: ['admin', 'charity_admin'] },
        },
        {
          path: 'charity/companies/create',
          name: 'companies-create',
          component: () => import('@/views/charity/CompanyCreate.vue'),
          meta: { title: 'Add Company', roles: ['admin', 'charity_admin'] },
        },

        // ── CHARITY TEAMLEADER routes ──────────────────────────────────────────────
        {
          path: 'charity/my-donations',
          name: 'my-donations',
          component: () => import('@/views/charity/MyDonations.vue'),
          meta: { title: 'My Donations', roles: ['charity_teamleader'] },
        },
        {
          path: 'charity/my-donations/create',
          name: 'my-donations-create',
          component: () => import('@/views/charity/DonationCreate.vue'),
          meta: { title: 'Create Donation', roles: ['charity_teamleader'] },
        },
        {
          path: 'charity/my-donations/:id/edit',
          name: 'my-donations-edit',
          component: () => import('@/views/charity/DonationCreate.vue'),
          meta: { title: 'Edit Donation', roles: ['charity_teamleader'] },
        },
        {
          path: 'charity/my-beneficiaries',
          name: 'my-beneficiaries',
          component: () => import('@/views/charity/MyBeneficiaries.vue'),
          meta: { title: 'My Beneficiaries', roles: ['charity_teamleader'] },
        },
        {
          path: "",
          redirect: "/dashboard",
        },
      ],
    },
  ],
});

// Navigation guard with role-based access control
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  const isAuthenticated = authStore.isAuthenticated;
  const userRole = authStore.userRole;

  // Check authentication
  if (to.meta.requiresAuth && !isAuthenticated) {
    next("/login");
    return;
  }

  // Redirect to dashboard if already logged in and trying to access login
  if (to.path === "/login" && isAuthenticated) {
    next("/dashboard");
    return;
  }

  // Check role-based access
  if (
    to.meta.roles &&
    Array.isArray(to.meta.roles) &&
    to.meta.roles.length > 0
  ) {
    if (!to.meta.roles.includes(userRole)) {
      next("/dashboard");
      return;
    }
  }

  next();
});

export default router;
