'use strict';
const bcrypt = require('bcryptjs');

/**
 * Seeder v3 — Ethiopian Charity Module
 *
 * New in v3:
 *  - charity_admin and charity_teamleader roles (+ 2 users, 2 employees)
 *  - beneficiary_groups with head_employee_id, vice_head_employee_id, members
 *  - donations linked to a group_id
 *  - donation_items each with a beneficiary_id, distribution_date, payment_method per item
 *  - donation_item_adjustment_requests (all statuses)
 */
const money = (v) => Math.round(parseFloat(v) * 100) / 100;
const now   = ()  => new Date();
const d     = (s) => new Date(s);

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('\n🇪🇹  Seeding Ethiopian Charity Module v3...');

    // ── 0. CLEAR ─────────────────────────────────────────────────────────────
    const tables = [
      'donation_item_adjustment_requests',
      'donation_deductions', 'donation_logs', 'donation_approvals',
      'donation_distribution_evidences', 'donation_distributions',
      'donation_item_intervals', 'donation_items', 'donations',
      'beneficiary_transfers', 'beneficiaries', 'beneficiary_groups',
      'beneficiary_locations', 'campaigns', 'donation_companies',
    ];
    for (const t of tables) {
      await queryInterface.sequelize.query(`TRUNCATE TABLE "${t}" RESTART IDENTITY CASCADE`);
    }
    console.log('✅ Charity tables cleared');

    // ── 1. ENSURE ROLES EXIST ─────────────────────────────────────────────────
    const existingRoles = await queryInterface.sequelize.query(
      `SELECT name FROM roles`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const existingRoleNames = existingRoles.map(r => r.name);

    if (!existingRoleNames.includes('charity_admin')) {
      await queryInterface.bulkInsert('roles', [
        { name: 'charity_admin',      description: 'Charity Administrator — approvals, CRUD, all operations', is_active: true, created_at: now(), updated_at: now() },
        { name: 'charity_teamleader', description: 'Charity Team Leader — creates donations for their group, requests adjustments', is_active: true, created_at: now(), updated_at: now() },
      ]);
    }

    const roleRows = await queryInterface.sequelize.query(
      `SELECT role_id, name FROM roles`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const roleMap = {};
    roleRows.forEach(r => { roleMap[r.name] = r.role_id; });

    // ── 2. EXISTING EMPLOYEES (from demo seeder) ───────────────────────────────
    const emps = await queryInterface.sequelize.query(
      `SELECT employee_id, employee_code FROM employees ORDER BY employee_id LIMIT 11`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const empByCode = {};
    emps.forEach(e => { empByCode[e.employee_code] = e.employee_id; });
    const adminEmp  = empByCode['EMP001'];
    const finEmp1   = empByCode['EMP004'];
    const finEmp2   = empByCode['EMP005'];

    // ── 3. NEW USERS & EMPLOYEES for charity roles ────────────────────────────
    const deptRows = await queryInterface.sequelize.query(
      `SELECT department_id, name FROM departments`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const deptMap = {};
    deptRows.forEach(d => { deptMap[d.name] = d.department_id; });
    const charityDeptId = deptMap['Human Resources'] || deptMap[Object.keys(deptMap)[0]];

    const hashedPw = await bcrypt.hash('charity123', 10);

    const existingUsers = await queryInterface.sequelize.query(
      `SELECT username FROM users WHERE username IN ('selam_charity_admin','dagmawi_lead')`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const existingUsernames = existingUsers.map(u => u.username);

    let charityAdminEmpId, teamleaderEmpId;

    if (!existingUsernames.includes('selam_charity_admin')) {
      await queryInterface.bulkInsert('users', [
        {
          username: 'selam_charity_admin',
          email: 'selam.charity@hrsystem.com',
          password_hash: hashedPw,
          full_name: 'Selam Tesfaye',
          role_id: roleMap['charity_admin'],
          department_id: charityDeptId,
          is_active: true, created_at: now(), updated_at: now(),
        },
        {
          username: 'dagmawi_lead',
          email: 'dagmawi.lead@hrsystem.com',
          password_hash: hashedPw,
          full_name: 'Dagmawi Hadgu',
          role_id: roleMap['charity_teamleader'],
          department_id: charityDeptId,
          is_active: true, created_at: now(), updated_at: now(),
        },
      ]);
    }

    const charityUserRows = await queryInterface.sequelize.query(
      `SELECT user_id, username FROM users WHERE username IN ('selam_charity_admin','dagmawi_lead')`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const charityUserMap = {};
    charityUserRows.forEach(u => { charityUserMap[u.username] = u.user_id; });

    // Create employee records if not present
    const positionRow = await queryInterface.sequelize.query(
      `SELECT position_id FROM positions LIMIT 1`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const posId = positionRow[0]?.position_id || 1;

    const lastEmpRow = await queryInterface.sequelize.query(
      `SELECT employee_code FROM employees ORDER BY employee_id DESC LIMIT 1`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const lastCode = parseInt((lastEmpRow[0]?.employee_code || 'EMP000').replace('EMP', '')) || 0;

    const existingCharityEmps = await queryInterface.sequelize.query(
      `SELECT employee_id, user_id FROM employees WHERE user_id = ANY(ARRAY[${Object.values(charityUserMap).join(',')}])`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const existingEmpUserIds = existingCharityEmps.map(e => e.user_id);

    const newEmps = [];
    if (!existingEmpUserIds.includes(charityUserMap['selam_charity_admin'])) {
      newEmps.push({
        employee_code: `EMP${String(lastCode + 1).padStart(3, '0')}`,
        user_id: charityUserMap['selam_charity_admin'],
        first_name: 'Selam', last_name: 'Tesfaye',
        department_id: charityDeptId, position_id: posId,
        hire_date: '2024-01-01', employment_type: 'full-time',
        created_at: now(), updated_at: now(),
      });
    }
    if (!existingEmpUserIds.includes(charityUserMap['dagmawi_lead'])) {
      newEmps.push({
        employee_code: `EMP${String(lastCode + 2).padStart(3, '0')}`,
        user_id: charityUserMap['dagmawi_lead'],
        first_name: 'Dagmawi', last_name: 'Hadgu',
        department_id: charityDeptId, position_id: posId,
        hire_date: '2024-01-01', employment_type: 'full-time',
        created_at: now(), updated_at: now(),
      });
    }
    if (newEmps.length) await queryInterface.bulkInsert('employees', newEmps);

    const charityEmpRows = await queryInterface.sequelize.query(
      `SELECT employee_id, user_id FROM employees WHERE user_id = ANY(ARRAY[${Object.values(charityUserMap).join(',')}])`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    charityEmpRows.forEach(e => {
      if (e.user_id === charityUserMap['selam_charity_admin']) charityAdminEmpId = e.employee_id;
      if (e.user_id === charityUserMap['dagmawi_lead'])         teamleaderEmpId  = e.employee_id;
    });

    console.log(`✅ Roles: charity_admin (emp ${charityAdminEmpId}), charity_teamleader (emp ${teamleaderEmpId})`);

    // ── 4. DONATION COMPANIES ─────────────────────────────────────────────────
    await queryInterface.bulkInsert('donation_companies', [
      { name: 'Ethio Telecom',                    type: 'main',    contact_info: JSON.stringify({ email: 'csr@ethiotelecom.et',      phone: '+251115517777', contact_person: 'Ato Tesfaye Belachew' }), is_active: true,  created_by: charityAdminEmpId, created_at: d('2025-11-01'), updated_at: d('2025-11-01') },
      { name: 'Commercial Bank of Ethiopia',      type: 'partner', contact_info: JSON.stringify({ email: 'csr@combanketh.et',         phone: '+251115511271', contact_person: 'Ato Girma Worku' }),       is_active: true,  created_by: charityAdminEmpId, created_at: d('2025-11-05'), updated_at: d('2025-11-05') },
      { name: 'Dashen Bank',                      type: 'partner', contact_info: JSON.stringify({ email: 'charity@dashenbank.com',    phone: '+251114702300', contact_person: 'W/ro Hiwot Alemu' }),     is_active: true,  created_by: finEmp1,          created_at: d('2025-11-10'), updated_at: d('2025-11-10') },
      { name: 'MIDROC Ethiopia Technology Group', type: 'sister',  contact_info: JSON.stringify({ email: 'foundation@midroc-ethiopia.com', phone: '+251114704030', contact_person: 'Ato Solomon Mohammed' }), is_active: true, created_by: charityAdminEmpId, created_at: d('2025-12-01'), updated_at: d('2025-12-01') },
    ]);
    const companies = await queryInterface.sequelize.query(`SELECT company_id, name FROM donation_companies ORDER BY company_id`, { type: Sequelize.QueryTypes.SELECT });
    const co = {};
    companies.forEach(c => { co[c.name] = c.company_id; });
    console.log(`✅ ${companies.length} companies`);

    // ── 5. CAMPAIGNS ─────────────────────────────────────────────────────────
    await queryInterface.bulkInsert('campaigns', [
      { title: 'Yezare Lijoch — Back to School 2026',            description: 'School supplies, uniforms, and fees for 500 children in Addis Ababa and Adama.',    category: 'Education',      status: 'active',    start_date: '2026-01-15', end_date: '2026-06-30', target_amount: 2500000.00, created_by: charityAdminEmpId, created_at: d('2026-01-10'), updated_at: d('2026-01-10') },
      { title: 'Ye Arb Mengist Ye Wuha Timhirt',                 description: 'Monthly water purification for drought-affected Somali Region households.',          category: 'Water',          status: 'active',    start_date: '2026-02-01', end_date: '2026-07-31', target_amount: 960000.00,  created_by: charityAdminEmpId, created_at: d('2026-01-20'), updated_at: d('2026-01-20') },
      { title: 'Ye Hagere Libs — Winter Blanket & Shelter Drive', description: 'Emergency blankets and shelter kits for flood-displaced families in Wolaita Zone.', category: 'Disaster Relief', status: 'active',    start_date: '2026-03-01', end_date: '2026-05-15', target_amount: 1800000.00, created_by: charityAdminEmpId, created_at: d('2026-02-25'), updated_at: d('2026-02-25') },
      { title: 'Ramadan Iftar — Addis Ababa 2025',               description: 'Iftar food packages for 1,000 low-income families in Arada and Merkato.',           category: 'Food Security',  status: 'completed', start_date: '2025-03-01', end_date: '2025-04-10', target_amount: 1200000.00, created_by: charityAdminEmpId, actual_end_date: '2025-04-08', created_at: d('2025-02-15'), updated_at: d('2025-04-08') },
    ]);
    const camps = await queryInterface.sequelize.query(`SELECT campaign_id FROM campaigns ORDER BY campaign_id`, { type: Sequelize.QueryTypes.SELECT });
    const CAMP_SCHOOL  = camps[0].campaign_id;
    const CAMP_WATER   = camps[1].campaign_id;
    const CAMP_SHELTER = camps[2].campaign_id;
    const CAMP_RAMADAN = camps[3].campaign_id;
    console.log(`✅ ${camps.length} campaigns`);

    // ── 6. BENEFICIARY LOCATIONS ──────────────────────────────────────────────
    await queryInterface.bulkInsert('beneficiary_locations', [
      { region: 'Addis Ababa', city: 'Addis Ababa', woreda: 'Arada Woreda 02',   description: 'Merkato area — dense urban low-income' },
      { region: 'Addis Ababa', city: 'Addis Ababa', woreda: 'Kolfe Keranyo W12', description: 'Western Addis — large slum pockets' },
      { region: 'Oromia',      city: 'Adama',       woreda: 'Adama Town W03',    description: 'Adama/Nazret urban centre' },
      { region: 'SNNPR',       city: 'Wolaita Sodo',woreda: 'Sodo Zuria W04',    description: 'Flood-affected rural households' },
      { region: 'Somali',      city: 'Jigjiga',     woreda: 'Jigjiga W01',       description: 'Regional capital, drought-affected' },
      { region: 'Somali',      city: 'Degahabur',   woreda: 'Degahabur W03',     description: 'Remote rural — high water stress' },
    ]);
    const locs = await queryInterface.sequelize.query(`SELECT location_id FROM beneficiary_locations ORDER BY location_id`, { type: Sequelize.QueryTypes.SELECT });
    const LOC = locs.map(l => l.location_id);
    console.log(`✅ ${locs.length} locations`);

    // ── 7. BENEFICIARY GROUPS (v3: head, vice, members) ───────────────────────
    await queryInterface.bulkInsert('beneficiary_groups', [
      // Group 1 — School children — teamleader is head
      {
        name: 'Ye Addis Ababa Mektel Lijoch',
        description: 'School-age children (6–14) in Addis Ababa lacking school supplies.',
        head_employee_id:      teamleaderEmpId,
        vice_head_employee_id: finEmp1,
        members: JSON.stringify([teamleaderEmpId, finEmp1, finEmp2]),
        manager_employee_id:   teamleaderEmpId,
        is_active: true, created_at: now(), updated_at: now(),
      },
      // Group 2 — Flood displaced — admin is head
      {
        name: 'Ye Wolaita Ye Dagna Betesebs',
        description: 'Flood-displaced households in Wolaita Zone needing emergency support.',
        head_employee_id:      charityAdminEmpId,
        vice_head_employee_id: finEmp2,
        members: JSON.stringify([charityAdminEmpId, finEmp2]),
        manager_employee_id:   charityAdminEmpId,
        is_active: true, created_at: now(), updated_at: now(),
      },
      // Group 3 — Water / Somali
      {
        name: 'Ye Somali Ye Wuha Degafi',
        description: 'Drought-affected households in Somali Region needing water support.',
        head_employee_id:      teamleaderEmpId,
        vice_head_employee_id: finEmp1,
        members: JSON.stringify([teamleaderEmpId, finEmp1]),
        manager_employee_id:   teamleaderEmpId,
        is_active: true, created_at: now(), updated_at: now(),
      },
    ]);
    const grps = await queryInterface.sequelize.query(`SELECT group_id FROM beneficiary_groups ORDER BY group_id`, { type: Sequelize.QueryTypes.SELECT });
    const GRP1 = grps[0].group_id;
    const GRP2 = grps[1].group_id;
    const GRP3 = grps[2].group_id;
    console.log(`✅ ${grps.length} groups`);

    // ── 8. BENEFICIARIES ──────────────────────────────────────────────────────
    await queryInterface.bulkInsert('beneficiaries', [
      // Group 1 — school children
      { type: 'individual', name: 'Selam Tesfaye',      contact_info: JSON.stringify({ phone: '+251911334455', grade: '4' }), location_id: LOC[0], group_id: GRP1, created_by: charityAdminEmpId, created_at: now(), updated_at: now() },
      { type: 'individual', name: 'Yonas Girma',        contact_info: JSON.stringify({ phone: '+251922445566', grade: '6' }), location_id: LOC[0], group_id: GRP1, created_by: charityAdminEmpId, created_at: now(), updated_at: now() },
      { type: 'individual', name: 'Hiwot Abebe',        contact_info: JSON.stringify({ phone: '+251933556677', grade: '3' }), location_id: LOC[1], group_id: GRP1, created_by: charityAdminEmpId, created_at: now(), updated_at: now() },
      { type: 'individual', name: 'Dawit Hailu',        contact_info: JSON.stringify({ phone: '+251944667788', grade: '5' }), location_id: LOC[1], group_id: GRP1, created_by: charityAdminEmpId, created_at: now(), updated_at: now() },
      // Group 2 — flood displaced
      { type: 'individual', name: 'Zeritu Woldemariam', contact_info: JSON.stringify({ phone: '+251913210011', household_size: 6 }), location_id: LOC[3], group_id: GRP2, created_by: charityAdminEmpId, created_at: now(), updated_at: now() },
      { type: 'individual', name: 'Tadesse Bekele',     contact_info: JSON.stringify({ phone: '+251924321122', household_size: 4 }), location_id: LOC[3], group_id: GRP2, created_by: charityAdminEmpId, created_at: now(), updated_at: now() },
      // Group 3 — Somali water
      { type: 'individual', name: 'Fadumo Abdi',        contact_info: JSON.stringify({ phone: '+251256770011', household_size: 8 }), location_id: LOC[4], group_id: GRP3, created_by: charityAdminEmpId, created_at: now(), updated_at: now() },
      { type: 'individual', name: 'Ahmed Hassan',       contact_info: JSON.stringify({ phone: '+251256780022', household_size: 5 }), location_id: LOC[5], group_id: GRP3, created_by: charityAdminEmpId, created_at: now(), updated_at: now() },
      { type: 'individual', name: 'Nasteho Muuse',      contact_info: JSON.stringify({ phone: '+251256790033', household_size: 7 }), location_id: LOC[5], group_id: GRP3, created_by: charityAdminEmpId, created_at: now(), updated_at: now() },
    ]);
    const bens = await queryInterface.sequelize.query(`SELECT beneficiary_id FROM beneficiaries ORDER BY beneficiary_id`, { type: Sequelize.QueryTypes.SELECT });
    const B = bens.map(b => b.beneficiary_id);
    console.log(`✅ ${bens.length} beneficiaries`);

    // ── 9. DONATIONS (v3: include group_id, created by teamleader) ────────────
    await queryInterface.bulkInsert('donations', [
      // DON_A — distributed (Ramadan, group 1, created by teamleader, approved by charity_admin)
      { company_id: co['Ethio Telecom'],               campaign_id: CAMP_RAMADAN, group_id: GRP1, donation_date: '2025-03-05', total_value: 480000.00, status: 'distributed', notes: 'Ramadan iftar package donation.',           created_by: teamleaderEmpId, approved_by: charityAdminEmpId, distributed_by: charityAdminEmpId, created_at: d('2025-03-04'), updated_at: d('2025-03-20') },
      // DON_B — approved (school, group 1)
      { company_id: co['Commercial Bank of Ethiopia'], campaign_id: CAMP_SCHOOL,  group_id: GRP1, donation_date: '2026-01-20', total_value: 0.00,      status: 'approved',    notes: 'First tranche — school supplies.',         created_by: teamleaderEmpId, approved_by: charityAdminEmpId, distributed_by: null,                created_at: d('2026-01-18'), updated_at: d('2026-01-25') },
      // DON_C — pending (water, group 3)
      { company_id: co['Dashen Bank'],                 campaign_id: CAMP_WATER,   group_id: GRP3, donation_date: '2026-02-05', total_value: 0.00,      status: 'pending',     notes: 'Water supply for 3 Somali households.',    created_by: teamleaderEmpId, approved_by: null,              distributed_by: null,                created_at: d('2026-02-03'), updated_at: d('2026-02-06') },
      // DON_D — draft (shelter, group 2)
      { company_id: co['MIDROC Ethiopia Technology Group'], campaign_id: CAMP_SHELTER, group_id: GRP2, donation_date: '2026-03-10', total_value: 0.00, status: 'draft',      notes: 'Emergency blankets for Wolaita flood victims.', created_by: teamleaderEmpId, approved_by: null, distributed_by: null, created_at: d('2026-03-08'), updated_at: d('2026-03-08') },
    ]);
    const dons = await queryInterface.sequelize.query(`SELECT donation_id FROM donations ORDER BY donation_id`, { type: Sequelize.QueryTypes.SELECT });
    const DON_A = dons[0].donation_id;
    const DON_B = dons[1].donation_id;
    const DON_C = dons[2].donation_id;
    const DON_D = dons[3].donation_id;
    console.log(`✅ ${dons.length} donations`);

    // ── 10. DONATION ITEMS (v3: per-beneficiary, with distribution_date, payment_method per item) ──
    await queryInterface.bulkInsert('donation_items', [
      // DON_A — Ramadan: 4 items (money, per beneficiary), various payment methods
      { donation_id: DON_A, beneficiary_id: B[0], type: 'money', description: 'Iftar package — Selam Tesfaye',      quantity: 1, unit_value: 120000.00, total_value: 120000.00, payment_method: 'bank',  distribution_date: '2025-03-20', payment_date: '2025-03-20', is_recurring: false, status: 'distributed', created_at: d('2025-03-04'), updated_at: d('2025-03-20') },
      { donation_id: DON_A, beneficiary_id: B[1], type: 'money', description: 'Iftar package — Yonas Girma',        quantity: 1, unit_value: 120000.00, total_value: 120000.00, payment_method: 'bank',  distribution_date: '2025-03-20', payment_date: '2025-03-20', is_recurring: false, status: 'distributed', created_at: d('2025-03-04'), updated_at: d('2025-03-20') },
      { donation_id: DON_A, beneficiary_id: B[2], type: 'money', description: 'Iftar package — Hiwot Abebe',        quantity: 1, unit_value: 120000.00, total_value: 120000.00, payment_method: 'cash',  distribution_date: '2025-03-20', payment_date: '2025-03-20', is_recurring: false, status: 'distributed', created_at: d('2025-03-04'), updated_at: d('2025-03-20') },
      { donation_id: DON_A, beneficiary_id: B[3], type: 'money', description: 'Iftar package — Dawit Hailu',        quantity: 1, unit_value: 120000.00, total_value: 120000.00, payment_method: 'cash',  distribution_date: '2025-03-20', payment_date: '2025-03-20', is_recurring: false, status: 'distributed', created_at: d('2025-03-04'), updated_at: d('2025-03-20') },

      // DON_B — School: fees + uniform + bag per beneficiary (4 children × 3 item types)
      { donation_id: DON_B, beneficiary_id: B[0], type: 'money', description: 'Registration fee — Selam',    quantity: 1, unit_value: 200.00, total_value: 200.00, payment_method: 'bank',  distribution_date: '2026-02-01', payment_date: null, is_recurring: false, status: 'pending', created_at: d('2026-01-18'), updated_at: d('2026-01-18') },
      { donation_id: DON_B, beneficiary_id: B[0], type: 'goods', description: 'Uniform set — Selam',         quantity: 1, unit_value: 350.00, total_value: 350.00, payment_method: 'bank',  distribution_date: '2026-02-01', payment_date: null, is_recurring: false, status: 'pending', created_at: d('2026-01-18'), updated_at: d('2026-01-18') },
      { donation_id: DON_B, beneficiary_id: B[0], type: 'goods', description: 'School bag — Selam',          quantity: 1, unit_value: 150.00, total_value: 150.00, payment_method: 'bank',  distribution_date: '2026-02-01', payment_date: null, is_recurring: false, status: 'pending', created_at: d('2026-01-18'), updated_at: d('2026-01-18') },

      { donation_id: DON_B, beneficiary_id: B[1], type: 'money', description: 'Registration fee — Yonas',    quantity: 1, unit_value: 200.00, total_value: 200.00, payment_method: 'bank',  distribution_date: '2026-02-01', payment_date: null, is_recurring: false, status: 'pending', created_at: d('2026-01-18'), updated_at: d('2026-01-18') },
      { donation_id: DON_B, beneficiary_id: B[1], type: 'goods', description: 'Uniform set — Yonas',         quantity: 1, unit_value: 350.00, total_value: 350.00, payment_method: 'bank',  distribution_date: '2026-02-01', payment_date: null, is_recurring: false, status: 'pending', created_at: d('2026-01-18'), updated_at: d('2026-01-18') },
      { donation_id: DON_B, beneficiary_id: B[1], type: 'goods', description: 'School bag — Yonas',          quantity: 1, unit_value: 150.00, total_value: 150.00, payment_method: 'bank',  distribution_date: '2026-02-01', payment_date: null, is_recurring: false, status: 'pending', created_at: d('2026-01-18'), updated_at: d('2026-01-18') },

      { donation_id: DON_B, beneficiary_id: B[2], type: 'money', description: 'Registration fee — Hiwot',    quantity: 1, unit_value: 200.00, total_value: 200.00, payment_method: 'cash',  distribution_date: '2026-02-01', payment_date: null, is_recurring: false, status: 'pending', created_at: d('2026-01-18'), updated_at: d('2026-01-18') },
      { donation_id: DON_B, beneficiary_id: B[2], type: 'goods', description: 'Uniform set — Hiwot',         quantity: 1, unit_value: 350.00, total_value: 350.00, payment_method: 'cash',  distribution_date: '2026-02-01', payment_date: null, is_recurring: false, status: 'pending', created_at: d('2026-01-18'), updated_at: d('2026-01-18') },
      { donation_id: DON_B, beneficiary_id: B[2], type: 'goods', description: 'School bag — Hiwot',          quantity: 1, unit_value: 150.00, total_value: 150.00, payment_method: 'cash',  distribution_date: '2026-02-01', payment_date: null, is_recurring: false, status: 'pending', created_at: d('2026-01-18'), updated_at: d('2026-01-18') },

      { donation_id: DON_B, beneficiary_id: B[3], type: 'money', description: 'Registration fee — Dawit',    quantity: 1, unit_value: 200.00, total_value: 200.00, payment_method: 'cash',  distribution_date: '2026-02-01', payment_date: null, is_recurring: false, status: 'pending', created_at: d('2026-01-18'), updated_at: d('2026-01-18') },
      { donation_id: DON_B, beneficiary_id: B[3], type: 'goods', description: 'Uniform set — Dawit',         quantity: 1, unit_value: 350.00, total_value: 350.00, payment_method: 'cash',  distribution_date: '2026-02-01', payment_date: null, is_recurring: false, status: 'pending', created_at: d('2026-01-18'), updated_at: d('2026-01-18') },
      { donation_id: DON_B, beneficiary_id: B[3], type: 'goods', description: 'School bag — Dawit',          quantity: 1, unit_value: 150.00, total_value: 150.00, payment_method: 'cash',  distribution_date: '2026-02-01', payment_date: null, is_recurring: false, status: 'pending', created_at: d('2026-01-18'), updated_at: d('2026-01-18') },

      // DON_C — Water: per-beneficiary water tablets (3 Somali households)
      { donation_id: DON_C, beneficiary_id: B[6], type: 'goods', description: 'Water purification tablets — Fadumo', quantity: 67, unit_value: 45.00, total_value: 3015.00, payment_method: 'bank', distribution_date: '2026-02-28', payment_date: null, is_recurring: true, status: 'pending', created_at: d('2026-02-03'), updated_at: d('2026-02-03') },
      { donation_id: DON_C, beneficiary_id: B[7], type: 'goods', description: 'Water purification tablets — Ahmed',  quantity: 67, unit_value: 45.00, total_value: 3015.00, payment_method: 'bank', distribution_date: '2026-02-28', payment_date: null, is_recurring: true, status: 'pending', created_at: d('2026-02-03'), updated_at: d('2026-02-03') },
      { donation_id: DON_C, beneficiary_id: B[8], type: 'goods', description: 'Water purification tablets — Nasteho',quantity: 66, unit_value: 45.00, total_value: 2970.00, payment_method: 'bank', distribution_date: '2026-02-28', payment_date: null, is_recurring: true, status: 'pending', created_at: d('2026-02-03'), updated_at: d('2026-02-03') },

      // DON_D — Shelter: blankets + service per beneficiary
      { donation_id: DON_D, beneficiary_id: B[4], type: 'goods',   description: 'Emergency blankets — Zeritu',  quantity: 6, unit_value: 380.00, total_value: 2280.00, payment_method: 'bank', distribution_date: '2026-04-01', payment_date: null, is_recurring: false, status: 'pending', created_at: d('2026-03-08'), updated_at: d('2026-03-08') },
      { donation_id: DON_D, beneficiary_id: B[4], type: 'service',  description: 'Shelter assembly — Zeritu',    quantity: 1, unit_value: 1500.00, total_value: 1500.00, payment_method: 'cash', distribution_date: '2026-04-01', payment_date: null, is_recurring: false, status: 'pending', created_at: d('2026-03-08'), updated_at: d('2026-03-08') },
      { donation_id: DON_D, beneficiary_id: B[5], type: 'goods',   description: 'Emergency blankets — Tadesse',  quantity: 4, unit_value: 380.00, total_value: 1520.00, payment_method: 'bank', distribution_date: '2026-04-01', payment_date: null, is_recurring: false, status: 'pending', created_at: d('2026-03-08'), updated_at: d('2026-03-08') },
      { donation_id: DON_D, beneficiary_id: B[5], type: 'service',  description: 'Shelter assembly — Tadesse',    quantity: 1, unit_value: 1500.00, total_value: 1500.00, payment_method: 'cash', distribution_date: '2026-04-01', payment_date: null, is_recurring: false, status: 'pending', created_at: d('2026-03-08'), updated_at: d('2026-03-08') },
    ]);

    // Update DON_A, DON_B, DON_C, DON_D total_values
    await queryInterface.sequelize.query(`UPDATE donations SET total_value = 480000.00 WHERE donation_id = ${DON_A}`);
    await queryInterface.sequelize.query(`UPDATE donations SET total_value = 2800.00   WHERE donation_id = ${DON_B}`);  // 4×(200+350+150)
    await queryInterface.sequelize.query(`UPDATE donations SET total_value = 9000.00   WHERE donation_id = ${DON_C}`);  // 3015+3015+2970
    await queryInterface.sequelize.query(`UPDATE donations SET total_value = 6800.00   WHERE donation_id = ${DON_D}`);  // 2280+1500+1520+1500

    const items = await queryInterface.sequelize.query(`SELECT donation_item_id, donation_id FROM donation_items ORDER BY donation_item_id`, { type: Sequelize.QueryTypes.SELECT });
    console.log(`✅ ${items.length} donation items`);

    // ── 11. APPROVALS ─────────────────────────────────────────────────────────
    await queryInterface.bulkInsert('donation_approvals', [
      // DON_A — direct approval
      { donation_id: DON_A, approved_by: charityAdminEmpId, status: 'approved', comment: 'All items verified. Ramadan delivery confirmed.', created_at: d('2025-03-08') },
      // DON_B — changes requested (twice), then approved
      { donation_id: DON_B, approved_by: charityAdminEmpId, status: 'rejected', comment: 'Please confirm uniform prices match procurement rate.', created_at: d('2026-01-21') },
      { donation_id: DON_B, approved_by: charityAdminEmpId, status: 'rejected', comment: 'Supplier quote still missing. Resubmit with attached invoice.', created_at: d('2026-01-23') },
      { donation_id: DON_B, approved_by: charityAdminEmpId, status: 'approved', comment: 'Supplier invoice verified. Approved.', created_at: d('2026-01-25') },
      // DON_C — pending
      { donation_id: DON_C, approved_by: null, status: 'pending', comment: null, created_at: d('2026-02-06') },
    ]);
    console.log('✅ 5 approval records');

    // ── 12. ADJUSTMENT REQUESTS (all statuses) ────────────────────────────────
    const donBItems = items.filter(i => i.donation_id === DON_B);
    const uniformHiwotItemId = donBItems.find((_, idx) => idx === 10)?.donation_item_id; // Hiwot uniform

    if (uniformHiwotItemId) {
      await queryInterface.bulkInsert('donation_item_adjustment_requests', [
        // PENDING — teamleader requests a deduction for Hiwot's uniform (wrong size)
        {
          donation_item_id: uniformHiwotItemId,
          beneficiary_id:   B[2],
          type:             'deduct',
          amount:           350.00,
          reason:           'Wrong uniform size delivered. Hiwot needs XS but only S available. Deducting until replacement sourced.',
          to_beneficiary_id: null,
          status:           'pending',
          requested_by:     teamleaderEmpId,
          reviewed_by:      null,
          admin_comment:    null,
          created_at:       now(), updated_at: now(),
        },
        // APPROVED — increase for Selam's bag (price increase)
        {
          donation_item_id: donBItems[2]?.donation_item_id,
          beneficiary_id:   B[0],
          type:             'increase',
          amount:           50.00,
          reason:           'Bag supplier raised price from 150 to 200 ETB due to material cost increase.',
          to_beneficiary_id: null,
          status:           'approved',
          requested_by:     teamleaderEmpId,
          reviewed_by:      charityAdminEmpId,
          admin_comment:    'Approved. Updated supplier contract confirmed.',
          created_at:       d('2026-01-26'), updated_at: d('2026-01-27'),
        },
        // REJECTED — reassign attempt
        {
          donation_item_id: donBItems[0]?.donation_item_id,
          beneficiary_id:   B[0],
          type:             'reassign',
          amount:           200.00,
          reason:           'Selam already paid school fees privately. Request to redirect to Dawit.',
          to_beneficiary_id: B[3],
          status:           'rejected',
          requested_by:     teamleaderEmpId,
          reviewed_by:      charityAdminEmpId,
          admin_comment:    'Rejected — already distributed. Submit a return request instead.',
          created_at:       d('2026-01-28'), updated_at: d('2026-01-28'),
        },
      ]);
    }
    console.log('✅ Adjustment requests');

    // ── 13. AUDIT LOGS ────────────────────────────────────────────────────────
    await queryInterface.bulkInsert('donation_logs', [
      // DON_A
      { donation_id: DON_A, user_id: teamleaderEmpId,  action: 'CREATE',               metadata: JSON.stringify({ campaign: 'Ramadan 2025' }), created_at: d('2025-03-04') },
      { donation_id: DON_A, user_id: teamleaderEmpId,  action: 'ADD_ITEM',             metadata: JSON.stringify({ beneficiaryId: B[0], type: 'money' }), created_at: d('2025-03-04') },
      { donation_id: DON_A, user_id: teamleaderEmpId,  action: 'ADD_ITEM',             metadata: JSON.stringify({ beneficiaryId: B[1], type: 'money' }), created_at: d('2025-03-04') },
      { donation_id: DON_A, user_id: teamleaderEmpId,  action: 'ADD_ITEM',             metadata: JSON.stringify({ beneficiaryId: B[2], type: 'money', paymentMethod: 'cash' }), created_at: d('2025-03-04') },
      { donation_id: DON_A, user_id: teamleaderEmpId,  action: 'ADD_ITEM',             metadata: JSON.stringify({ beneficiaryId: B[3], type: 'money', paymentMethod: 'cash' }), created_at: d('2025-03-04') },
      { donation_id: DON_A, user_id: teamleaderEmpId,  action: 'SUBMIT_FOR_APPROVAL',  metadata: JSON.stringify({}), created_at: d('2025-03-05') },
      { donation_id: DON_A, user_id: charityAdminEmpId,action: 'APPROVE',              metadata: JSON.stringify({ comment: 'All items verified.' }), created_at: d('2025-03-08') },
      { donation_id: DON_A, user_id: charityAdminEmpId,action: 'DISTRIBUTE',           metadata: JSON.stringify({}), created_at: d('2025-03-20') },
      // DON_B
      { donation_id: DON_B, user_id: teamleaderEmpId,  action: 'CREATE',               metadata: JSON.stringify({ campaign: 'Back to School 2026' }), created_at: d('2026-01-18') },
      { donation_id: DON_B, user_id: teamleaderEmpId,  action: 'SUBMIT_FOR_APPROVAL',  metadata: JSON.stringify({}), created_at: d('2026-01-19') },
      { donation_id: DON_B, user_id: charityAdminEmpId,action: 'REQUEST_CHANGES',      metadata: JSON.stringify({ comment: 'Confirm uniform price.' }), created_at: d('2026-01-21') },
      { donation_id: DON_B, user_id: charityAdminEmpId,action: 'REQUEST_CHANGES',      metadata: JSON.stringify({ comment: 'Invoice still missing.' }), created_at: d('2026-01-23') },
      { donation_id: DON_B, user_id: teamleaderEmpId,  action: 'SUBMIT_FOR_APPROVAL',  metadata: JSON.stringify({}), created_at: d('2026-01-24') },
      { donation_id: DON_B, user_id: charityAdminEmpId,action: 'APPROVE',              metadata: JSON.stringify({ comment: 'Supplier invoice verified.' }), created_at: d('2026-01-25') },
      { donation_id: DON_B, user_id: teamleaderEmpId,  action: 'ADJUSTMENT_REQUESTED', metadata: JSON.stringify({ type: 'deduct', beneficiaryId: B[2], amount: 350 }), created_at: d('2026-01-26') },
      { donation_id: DON_B, user_id: charityAdminEmpId,action: 'ADJUSTMENT_APPROVED',  metadata: JSON.stringify({ type: 'increase', beneficiaryId: B[0], amount: 50 }), created_at: d('2026-01-27') },
      { donation_id: DON_B, user_id: charityAdminEmpId,action: 'ADJUSTMENT_REJECTED',  metadata: JSON.stringify({ type: 'reassign', comment: 'Already distributed.' }), created_at: d('2026-01-28') },
      // DON_C
      { donation_id: DON_C, user_id: teamleaderEmpId,  action: 'CREATE',               metadata: JSON.stringify({ campaign: 'Water & Sanitation' }), created_at: d('2026-02-03') },
      { donation_id: DON_C, user_id: teamleaderEmpId,  action: 'SUBMIT_FOR_APPROVAL',  metadata: JSON.stringify({}), created_at: d('2026-02-06') },
      // DON_D
      { donation_id: DON_D, user_id: teamleaderEmpId,  action: 'CREATE',               metadata: JSON.stringify({ campaign: 'Winter Blanket & Shelter' }), created_at: d('2026-03-08') },
      { donation_id: DON_D, user_id: teamleaderEmpId,  action: 'ADD_ITEM',             metadata: JSON.stringify({ beneficiaryId: B[4], type: 'goods', description: 'Blankets' }), created_at: d('2026-03-08') },
      { donation_id: DON_D, user_id: teamleaderEmpId,  action: 'ADD_ITEM',             metadata: JSON.stringify({ beneficiaryId: B[5], type: 'goods', description: 'Blankets' }), created_at: d('2026-03-08') },
    ]);
    console.log('✅ Audit logs');

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🇪🇹  Charity v3 seeded!\n');
    console.log('Login credentials (password: charity123)');
    console.log('  charity_admin:      selam_charity_admin');
    console.log('  charity_teamleader: dagmawi_lead');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  },

  down: async (queryInterface) => {
    const tables = [
      'donation_item_adjustment_requests',
      'donation_deductions', 'donation_logs', 'donation_approvals',
      'donation_distribution_evidences', 'donation_distributions',
      'donation_item_intervals', 'donation_items', 'donations',
      'beneficiary_transfers', 'beneficiaries', 'beneficiary_groups',
      'beneficiary_locations', 'campaigns', 'donation_companies',
    ];
    for (const t of tables) {
      await queryInterface.sequelize.query(`TRUNCATE TABLE "${t}" RESTART IDENTITY CASCADE`);
    }
  },
};