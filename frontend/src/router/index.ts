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
            roles: ["admin", "hr", "finance", "employee","attendance","charity"],
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
        {
          path: "charity/donations",
          name: "donations",
          component: () => import("@/views/charity/Donations.vue"),
          meta: { 
            title: "charity", 
            roles: ["admin","charity"],
          },

        },
        { 
          path: '/charity/donations/create', 
          name: 'donations-create', 
          component: () => import('@/views/charity/DonationCreate.vue') ,
          meta: { 
            title: "charity", 
            roles: ["admin","charity"],
          },
        },
        { 
          path: '/charity/donations/:id', 
          component: () => import('@/views/charity/DonationDetail.vue') ,
          meta: { 
            title: "charity", 
            roles: ["admin","charity"],
          },
        },
        { 
          path: '/charity/donations/:id/edit', 
          component: () => import('@/views/charity/DonationCreate.vue') ,
          meta: { 
            title: "charity", 
            roles: ["admin","charity"],
          },
        },
        { 
          path: '/charity/beneficiaries', 
          name: "charity-beneficiaries",
          component: () => import('@/views/charity/Beneficiaries.vue'),
          meta: { 
            title: "charity", 
            roles: ["admin","charity"],
          },
        },
        { 
          path: '/charity/beneficiaries/create', 
          name: 'beneficiaries-create', 
          component: () => import('@/views/charity/BeneficiaryCreate.vue'),
          meta: { 
            title: "charity", 
            roles: ["admin","charity"],
          },
        },
        { 
          path: '/charity/beneficiaries/:id/edit', 
          component: () => import('@/views/charity/BeneficiaryCreate.vue') ,
          meta: { 
            title: "charity", 
            roles: ["admin","charity"],
          },
        },
        { 
          path: '/charity/companies', 
          name: 'companies', 
          component: () => import('@/views/charity/Companies.vue'),
          meta: { 
            title: "charity", 
            roles: ["admin","charity"],
          },
        },
        { 
          path: '/charity/companies/create', 
          name: 'companies-create', 
          component: () => import('@/views/charity/CompanyCreate.vue'),
          meta: { 
            title: "charity", 
            roles: ["admin","charity"],
          }, 
        },
        { 
          path: '/charity/campaigns', 
          name: 'campaigns', 
          component: () => import('@/views/charity/Campaigns.vue'),
          meta: { 
            title: "charity", 
            roles: ["admin","charity"],
          }, 
        },
        { 
          path: '/charity/campaigns/create', 
          name: 'campaigns-create', 
          component: () => import('@/views/charity/CampaignCreate.vue') ,
          meta: { 
            title: "charity", 
            roles: ["admin","charity"],
          },
        },
        { 
          path: '/charity/campaigns/:id/edit', 
          component: () => import('@/views/charity/CampaignCreate.vue') ,
          meta: { 
            title: "charity", 
            roles: ["admin","charity"],
          },
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
