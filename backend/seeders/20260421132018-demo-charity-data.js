'use strict';

/**
 * Seeder: Ethiopian Charity Module — Full Lifecycle Demo Data
 *
 * Covers every use case in the charity module:
 *   ✓ Multiple companies (main, sister, partner) with Ethiopian contacts
 *   ✓ Campaigns in all statuses: inactive, active, completed, cancelled
 *   ✓ Beneficiary locations across Ethiopian regions and woredas
 *   ✓ Beneficiary groups with managers
 *   ✓ Individual and organization beneficiaries
 *   ✓ A beneficiary transfer between groups
 *   ✓ Donations in all statuses: draft, pending, approved, distributed, cancelled
 *   ✓ Donation items of all types: money (bank & cash), goods, service
 *   ✓ A recurring (monthly) donation item with intervals
 *   ✓ Distributions to multiple beneficiaries
 *   ✓ Evidence records (placeholder URLs — real files uploaded via the app)
 *   ✓ A partial interval distribution with per-interval evidence
 *   ✓ A deduction + reassignment between beneficiaries
 *   ✓ A returned distribution
 *   ✓ Full approval history (pending → changes requested → re-approved)
 *   ✓ Full audit log trail
 */

const money = (v) => Math.round(parseFloat(v) * 100) / 100;
const now   = () => new Date();
const d     = (str) => new Date(str);

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('\n🇪🇹  Seeding Ethiopian Charity Module...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // ── 0. CLEAR existing charity data ─────────────────────────────────────
    const tables = [
      'donation_deductions', 'donation_logs', 'donation_approvals',
      'donation_distribution_evidences', 'donation_distributions',
      'donation_item_intervals', 'donation_items', 'donations',
      'beneficiary_transfers', 'beneficiaries', 'beneficiary_groups',
      'beneficiary_locations', 'campaigns', 'donation_companies',
    ];
    for (const t of tables) {
      await queryInterface.sequelize.query(
        `TRUNCATE TABLE "${t}" RESTART IDENTITY CASCADE`
      );
    }
    console.log('✅ Charity tables cleared');

    // ── 1. PULL EMPLOYEE IDs from existing HR seed data ────────────────────
    const emps = await queryInterface.sequelize.query(
      `SELECT employee_id, employee_code FROM employees ORDER BY employee_id LIMIT 11`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const empByCode = {};
    emps.forEach(e => { empByCode[e.employee_code] = e.employee_id; });

    // Role aliases for readability
    const adminEmp   = empByCode['EMP001']; // Alemu Bekele (admin)
    const hrEmp1     = empByCode['EMP002']; // Tigist Worku (hr)
    const hrEmp2     = empByCode['EMP003']; // Mekdes Ayele (hr)
    const finEmp1    = empByCode['EMP004']; // Girma Tadesse (finance)
    const finEmp2    = empByCode['EMP005']; // Hiwot Tesfaye (finance)
    const devEmp1    = empByCode['EMP006']; // Abebe Demissie (employee)
    const devEmp2    = empByCode['EMP007']; // Azeb Mulugeta (employee)

    // ── 2. DONATION COMPANIES ───────────────────────────────────────────────
    console.log('\n🏢 Seeding donation companies...');
    await queryInterface.bulkInsert('donation_companies', [
      {
        name: 'Ethio Telecom',
        type: 'main',
        contact_info: JSON.stringify({
          email: 'csr@ethiotelecom.et',
          phone: '+251115517777',
          address: 'Churchill Avenue, Addis Ababa',
          contact_person: 'Ato Tesfaye Belachew'
        }),
        is_active: true,
        created_by: adminEmp,
        created_at: d('2025-11-01'), updated_at: d('2025-11-01'),
      },
      {
        name: 'Commercial Bank of Ethiopia',
        type: 'partner',
        contact_info: JSON.stringify({
          email: 'csr@combanketh.et',
          phone: '+251115511271',
          address: 'Gambia Street, Addis Ababa',
          contact_person: 'Ato Girma Worku'
        }),
        is_active: true,
        created_by: adminEmp,
        created_at: d('2025-11-05'), updated_at: d('2025-11-05'),
      },
      {
        name: 'Dashen Bank',
        type: 'partner',
        contact_info: JSON.stringify({
          email: 'charity@dashenbank.com',
          phone: '+251114702300',
          address: 'Menelik II Avenue, Addis Ababa',
          contact_person: 'W/ro Hiwot Alemu'
        }),
        is_active: true,
        created_by: finEmp1,
        created_at: d('2025-11-10'), updated_at: d('2025-11-10'),
      },
      {
        name: 'MIDROC Ethiopia Technology Group',
        type: 'sister',
        contact_info: JSON.stringify({
          email: 'foundation@midroc-ethiopia.com',
          phone: '+251114704030',
          address: 'Bole Sub-City, Addis Ababa',
          contact_person: 'Ato Solomon Mohammed'
        }),
        is_active: true,
        created_by: adminEmp,
        created_at: d('2025-12-01'), updated_at: d('2025-12-01'),
      },
      {
        // Inactive company — tests the "cannot donate to inactive company" guard
        name: 'Raya Beer Factory',
        type: 'partner',
        contact_info: JSON.stringify({ email: 'info@rayabeer.et', phone: '+251334454545' }),
        is_active: false,
        created_by: adminEmp,
        created_at: d('2025-10-01'), updated_at: d('2026-01-15'),
      },
    ]);
    const companies = await queryInterface.sequelize.query(
      `SELECT company_id, name FROM donation_companies ORDER BY company_id`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const co = {};
    companies.forEach(c => { co[c.name] = c.company_id; });
    console.log(`   ✅ ${companies.length} companies`);

    // ── 3. CAMPAIGNS ────────────────────────────────────────────────────────
    console.log('\n📢 Seeding campaigns...');
    await queryInterface.bulkInsert('campaigns', [
      // ACTIVE — can receive donations
      {
        title: 'Yezare Lijoch — Back to School 2026',
        description: 'Providing school supplies, uniforms, and registration fees for 500 children in Addis Ababa and Adama who cannot afford to return to school. Partners with Addis Ababa City Education Bureau.',
        category: 'Education',
        status: 'active',
        start_date: '2026-01-15',
        end_date: '2026-06-30',
        target_amount: 2500000.00,
        created_by: adminEmp,
        created_at: d('2026-01-10'), updated_at: d('2026-01-10'),
      },
      // ACTIVE — recurring monthly support
      {
        title: 'Ye Arb Mengist Ye Wuha Timhirt — Water & Sanitation',
        description: 'Monthly water purification tablet and jerry can distribution for 200 households in drought-affected Somali Region woredas. In partnership with WASH Ethiopia.',
        category: 'Water & Sanitation',
        status: 'active',
        start_date: '2026-02-01',
        end_date: '2026-07-31',
        target_amount: 960000.00,
        created_by: hrEmp1,
        created_at: d('2026-01-20'), updated_at: d('2026-01-20'),
      },
      // ACTIVE — mixed goods + service donation
      {
        title: 'Ye Hagere Libs — Winter Blanket & Shelter Drive',
        description: 'Emergency blankets, plastic sheeting, and temporary shelter kits for families displaced by flooding in SNNPR. Targets 300 households in Wolaita Zone.',
        category: 'Disaster Relief',
        status: 'active',
        start_date: '2026-03-01',
        end_date: '2026-05-15',
        target_amount: 1800000.00,
        created_by: finEmp1,
        created_at: d('2026-02-25'), updated_at: d('2026-02-25'),
      },
      // COMPLETED — fully distributed
      {
        title: 'Ramadan Iftar — Addis Ababa 2025',
        description: 'Iftar food packages for 1,000 low-income families across Arada and Merkato sub-cities during the holy month of Ramadan.',
        category: 'Food Security',
        status: 'completed',
        start_date: '2025-03-01',
        end_date: '2025-04-10',
        target_amount: 1200000.00,
        actual_end_date: '2025-04-08',
        created_by: adminEmp,
        created_at: d('2025-02-15'), updated_at: d('2025-04-08'),
      },
      // INACTIVE — not yet launched
      {
        title: 'Ye Addis Ketema Ye Dawit Timhirt — Vocational Training Fund',
        description: 'Skills training scholarships for 150 unemployed youth aged 18–30 in Addis Ababa. Covers course fees for welding, tailoring, IT, and hospitality at TVET colleges.',
        category: 'Youth Employment',
        status: 'inactive',
        start_date: '2026-09-01',
        end_date: '2027-02-28',
        target_amount: 3750000.00,
        created_by: hrEmp2,
        created_at: d('2026-04-01'), updated_at: d('2026-04-01'),
      },
      // CANCELLED — terminated early
      {
        title: 'Solar Panels for Rural Clinics — Tigray',
        description: 'Solar panel installation for health posts in rural Tigray. Campaign cancelled due to procurement delays and logistics constraints.',
        category: 'Healthcare',
        status: 'cancelled',
        start_date: '2025-09-01',
        end_date: '2025-12-31',
        target_amount: 4500000.00,
        actual_end_date: '2025-11-20',
        termination_reason: 'Import permit for solar equipment was not granted within the campaign window. Funds not yet received will be redirected to the next cycle.',
        created_by: adminEmp,
        created_at: d('2025-08-15'), updated_at: d('2025-11-20'),
      },
    ]);
    const camps = await queryInterface.sequelize.query(
      `SELECT campaign_id, title FROM campaigns ORDER BY campaign_id`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const camp = {};
    camps.forEach(c => { camp[c.title.slice(0, 20)] = c.campaign_id; });
    // readable keys
    const CAMP_SCHOOL    = camps[0].campaign_id;
    const CAMP_WATER     = camps[1].campaign_id;
    const CAMP_SHELTER   = camps[2].campaign_id;
    const CAMP_RAMADAN   = camps[3].campaign_id;
    const CAMP_INACTIVE  = camps[4].campaign_id;
    const CAMP_CANCELLED = camps[5].campaign_id;
    console.log(`   ✅ ${camps.length} campaigns`);

    // ── 4. BENEFICIARY LOCATIONS ────────────────────────────────────────────
    console.log('\n📍 Seeding beneficiary locations...');
    await queryInterface.bulkInsert('beneficiary_locations', [
      { region: 'Addis Ababa', city: 'Addis Ababa', woreda: 'Arada Woreda 02',   description: 'Merkato area — dense urban low-income' },
      { region: 'Addis Ababa', city: 'Addis Ababa', woreda: 'Bole Woreda 05',    description: 'Bole Airport surroundings — mixed income' },
      { region: 'Addis Ababa', city: 'Addis Ababa', woreda: 'Kolfe Keranyo W12', description: 'Western Addis — large slum pockets' },
      { region: 'Oromia',      city: 'Adama',       woreda: 'Adama Town W03',    description: 'Adama/Nazret urban centre' },
      { region: 'Oromia',      city: 'Bishoftu',    woreda: 'Bishoftu W01',      description: 'Lake town, mixed economy' },
      { region: 'SNNPR',       city: 'Wolaita Sodo',woreda: 'Sodo Zuria W04',    description: 'Flood-affected rural households' },
      { region: 'SNNPR',       city: 'Awassa',      woreda: 'Hawassa City W07',  description: 'Sidama region capital' },
      { region: 'Somali',      city: 'Jigjiga',     woreda: 'Jigjiga W01',       description: 'Regional capital, drought-affected' },
      { region: 'Somali',      city: 'Degahabur',   woreda: 'Degahabur W03',     description: 'Remote rural — very high water stress' },
      { region: 'Amhara',      city: 'Bahir Dar',   woreda: 'Bahir Dar W05',     description: 'Lake Tana shore communities' },
    ]);
    const locs = await queryInterface.sequelize.query(
      `SELECT location_id, woreda FROM beneficiary_locations ORDER BY location_id`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const LOC = {};
    locs.forEach((l, i) => { LOC[i + 1] = l.location_id; });
    console.log(`   ✅ ${locs.length} locations`);

    // ── 5. BENEFICIARY GROUPS ───────────────────────────────────────────────
    console.log('\n👥 Seeding beneficiary groups...');
    await queryInterface.bulkInsert('beneficiary_groups', [
      {
        name: 'Ye Addis Ababa Mektel Lijoch',
        description: 'School-age children (6–14) in Addis Ababa who lack school supplies and cannot pay registration fees.',
        manager_employee_id: hrEmp1,
        is_active: true, created_at: now(), updated_at: now(),
      },
      {
        name: 'Ye Wolaita Ye Dagna Betesebs',
        description: 'Flood-displaced households in Wolaita Zone needing emergency shelter and food assistance.',
        manager_employee_id: hrEmp2,
        is_active: true, created_at: now(), updated_at: now(),
      },
      {
        name: 'Ye Somali Ye Wuha Degafi',
        description: 'Drought-affected households in Somali Region requiring monthly water and sanitation support.',
        manager_employee_id: finEmp1,
        is_active: true, created_at: now(), updated_at: now(),
      },
      {
        name: 'Ye Adama Setoch Mahiber',
        description: 'Women-headed households in Adama receiving food security and livelihood support.',
        manager_employee_id: hrEmp1,
        is_active: true, created_at: now(), updated_at: now(),
      },
      {
        name: 'Ye Bahir Dar Shimaglewoch',
        description: 'Elderly people above 70 years in Bahir Dar area with no family support.',
        manager_employee_id: hrEmp2,
        is_active: false, created_at: now(), updated_at: now(), // inactive group
      },
    ]);
    const groups = await queryInterface.sequelize.query(
      `SELECT group_id FROM beneficiary_groups ORDER BY group_id`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const GRP = {};
    groups.forEach((g, i) => { GRP[i + 1] = g.group_id; });
    console.log(`   ✅ ${groups.length} groups`);

    // ── 6. BENEFICIARIES ────────────────────────────────────────────────────
    console.log('\n🙋 Seeding beneficiaries...');
    await queryInterface.bulkInsert('beneficiaries', [
      // Group 1 — Addis school children
      { type: 'individual', name: 'Selam Tesfaye',     contact_info: JSON.stringify({ phone: '+251911334455', grade: '4' }),              location_id: LOC[1], group_id: GRP[1], created_by: hrEmp1, created_at: now(), updated_at: now() },
      { type: 'individual', name: 'Yonas Girma',       contact_info: JSON.stringify({ phone: '+251922445566', grade: '6' }),              location_id: LOC[1], group_id: GRP[1], created_by: hrEmp1, created_at: now(), updated_at: now() },
      { type: 'individual', name: 'Hiwot Abebe',       contact_info: JSON.stringify({ phone: '+251933556677', grade: '3' }),              location_id: LOC[3], group_id: GRP[1], created_by: hrEmp1, created_at: now(), updated_at: now() },
      { type: 'individual', name: 'Dawit Hailu',       contact_info: JSON.stringify({ phone: '+251944667788', grade: '5' }),              location_id: LOC[2], group_id: GRP[1], created_by: hrEmp2, created_at: now(), updated_at: now() },
      // Group 2 — Wolaita flood displaced
      { type: 'individual', name: 'Zeritu Woldemariam',contact_info: JSON.stringify({ phone: '+251913210011', household_size: 6 }),       location_id: LOC[6], group_id: GRP[2], created_by: hrEmp2, created_at: now(), updated_at: now() },
      { type: 'individual', name: 'Tadesse Bekele',    contact_info: JSON.stringify({ phone: '+251924321122', household_size: 4 }),       location_id: LOC[6], group_id: GRP[2], created_by: hrEmp2, created_at: now(), updated_at: now() },
      { type: 'organization', name: 'Wolaita Zone Community Hall', contact_info: JSON.stringify({ phone: '+251475550100', rep: 'Ato Kiros Tadesse' }), location_id: LOC[6], group_id: GRP[2], created_by: adminEmp, created_at: now(), updated_at: now() },
      // Group 3 — Somali water
      { type: 'individual', name: 'Fadumo Abdi',       contact_info: JSON.stringify({ phone: '+251256770011', household_size: 8 }),       location_id: LOC[8], group_id: GRP[3], created_by: finEmp1, created_at: now(), updated_at: now() },
      { type: 'individual', name: 'Ahmed Hassan',      contact_info: JSON.stringify({ phone: '+251256780022', household_size: 5 }),       location_id: LOC[9], group_id: GRP[3], created_by: finEmp1, created_at: now(), updated_at: now() },
      { type: 'individual', name: 'Nasteho Muuse',     contact_info: JSON.stringify({ phone: '+251256790033', household_size: 7 }),       location_id: LOC[9], group_id: GRP[3], created_by: finEmp1, created_at: now(), updated_at: now() },
      // Group 4 — Adama women
      { type: 'individual', name: 'Almaz Negash',      contact_info: JSON.stringify({ phone: '+251222113344', household_size: 3 }),       location_id: LOC[4], group_id: GRP[4], created_by: hrEmp1, created_at: now(), updated_at: now() },
      { type: 'organization', name: 'Adama Women Business Association', contact_info: JSON.stringify({ phone: '+251222114455', rep: 'W/ro Tigist Lemma' }), location_id: LOC[4], group_id: GRP[4], created_by: adminEmp, created_at: now(), updated_at: now() },
    ]);
    const bens = await queryInterface.sequelize.query(
      `SELECT beneficiary_id, name FROM beneficiaries ORDER BY beneficiary_id`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const B = {};
    bens.forEach((b, i) => { B[i + 1] = b.beneficiary_id; });
    console.log(`   ✅ ${bens.length} beneficiaries`);

    // ── 7. BENEFICIARY TRANSFER (group 4 → group 1) ─────────────────────────
    // Dawit Hailu was initially in Group 4 (Adama women) — moved to Group 1 (school children)
    // The transfer record shows history; beneficiary.group_id is already Group 1 from seed above
    await queryInterface.bulkInsert('beneficiary_transfers', [
      {
        beneficiary_id: B[4],   // Dawit Hailu
        from_group_id: GRP[4],  // Adama Women
        to_group_id:  GRP[1],   // Addis school children
        reason: 'Family relocated from Adama to Addis Ababa. Child enrolled in Gulele primary school. Transferred to appropriate Addis Ababa group.',
        transferred_by: hrEmp1,
        created_at: d('2026-02-10'),
      },
    ]);
    console.log('   ✅ 1 beneficiary transfer');

    // ════════════════════════════════════════════════════════════════════════
    // ── 8. DONATIONS ────────────────────────────────────────────────────────
    // ════════════════════════════════════════════════════════════════════════
    console.log('\n💰 Seeding donations...');

    await queryInterface.bulkInsert('donations', [
      // A — DISTRIBUTED: Ramadan campaign, fully done, Ethio Telecom
      {
        company_id: co['Ethio Telecom'], campaign_id: CAMP_RAMADAN,
        donation_date: '2025-03-05', total_value: 480000.00, status: 'distributed',
        notes: 'Iftar food package donation for 1,000 families. Delivered via CBE branch network.',
        created_by: finEmp1, approved_by: adminEmp, distributed_by: finEmp1,
        created_at: d('2025-03-04'), updated_at: d('2025-03-20'),
      },
      // B — APPROVED: School campaign, ready to distribute
      {
        company_id: co['Commercial Bank of Ethiopia'], campaign_id: CAMP_SCHOOL,
        donation_date: '2026-01-20', total_value: 350000.00, status: 'approved',
        notes: 'First tranche for school supplies and uniforms. Transferred via CBE account.',
        created_by: finEmp1, approved_by: finEmp2, distributed_by: null,
        created_at: d('2026-01-18'), updated_at: d('2026-01-25'),
      },
      // C — PENDING: Water campaign, waiting for approval
      {
        company_id: co['Dashen Bank'], campaign_id: CAMP_WATER,
        donation_date: '2026-02-05', total_value: 160000.00, status: 'pending',
        notes: 'Monthly water tablet supply for 6 months, 200 households. Dashen Bank CSR fund.',
        created_by: finEmp2, approved_by: null, distributed_by: null,
        created_at: d('2026-02-03'), updated_at: d('2026-02-06'),
      },
      // D — DRAFT: Shelter campaign, still being built
      {
        company_id: co['MIDROC Ethiopia Technology Group'], campaign_id: CAMP_SHELTER,
        donation_date: '2026-03-10', total_value: 0.00, status: 'draft',
        notes: 'Emergency blankets and shelter kits for Wolaita flood victims.',
        created_by: finEmp1, approved_by: null, distributed_by: null,
        created_at: d('2026-03-08'), updated_at: d('2026-03-08'),
      },
      // E — CANCELLED: Donor withdrew, school campaign
      {
        company_id: co['Commercial Bank of Ethiopia'], campaign_id: CAMP_SCHOOL,
        donation_date: '2026-01-28', total_value: 0.00, status: 'cancelled',
        notes: 'Second tranche — cancelled by donor due to internal budget freeze.',
        created_by: finEmp1, approved_by: null, distributed_by: null,
        created_at: d('2026-01-26'), updated_at: d('2026-02-01'),
      },
      // F — DISTRIBUTED: Water campaign, completed first month
      {
        company_id: co['Ethio Telecom'], campaign_id: CAMP_WATER,
        donation_date: '2026-02-15', total_value: 96000.00, status: 'distributed',
        notes: 'First month water supplies — 200 households × 3 jerry cans + tablets.',
        created_by: finEmp2, approved_by: adminEmp, distributed_by: finEmp2,
        created_at: d('2026-02-14'), updated_at: d('2026-02-28'),
      },
    ]);

    const donations = await queryInterface.sequelize.query(
      `SELECT donation_id FROM donations ORDER BY donation_id`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const DON_A = donations[0].donation_id; // distributed - ramadan
    const DON_B = donations[1].donation_id; // approved - school
    const DON_C = donations[2].donation_id; // pending - water
    const DON_D = donations[3].donation_id; // draft - shelter
    const DON_E = donations[4].donation_id; // cancelled
    const DON_F = donations[5].donation_id; // distributed - water month 1
    console.log(`   ✅ 6 donations`);

    // ── 9. DONATION ITEMS ───────────────────────────────────────────────────
    console.log('\n📦 Seeding donation items...');

    // DON_A items (distributed - Ramadan)
    await queryInterface.bulkInsert('donation_items', [
      {
        donation_id: DON_A, type: 'money', description: 'Cash transfer via CBE — iftar package procurement',
        quantity: 1, unit_value: 380000.00, total_value: 380000.00,
        payment_method: 'bank', is_recurring: false, status: 'distributed',
        created_at: d('2025-03-04'), updated_at: d('2025-03-20'),
      },
      {
        donation_id: DON_A, type: 'goods', description: 'Injera bread (100g packs, 20 per family)',
        quantity: 20000, unit_value: 5.00, total_value: 100000.00,
        payment_method: null, is_recurring: false, status: 'distributed',
        created_at: d('2025-03-04'), updated_at: d('2025-03-20'),
      },
    ]);

    // DON_B items (approved - school)
    await queryInterface.bulkInsert('donation_items', [
      {
        donation_id: DON_B, type: 'money', description: 'School registration fees — 500 children × 200 ETB',
        quantity: 500, unit_value: 200.00, total_value: 100000.00,
        payment_method: 'bank', is_recurring: false, status: 'pending',
        created_at: d('2026-01-18'), updated_at: d('2026-01-18'),
      },
      {
        donation_id: DON_B, type: 'goods', description: 'School uniform sets (shirt, shorts/dress, socks)',
        quantity: 500, unit_value: 350.00, total_value: 175000.00,
        payment_method: null, is_recurring: false, status: 'pending',
        created_at: d('2026-01-18'), updated_at: d('2026-01-18'),
      },
      {
        donation_id: DON_B, type: 'goods', description: 'School bag with supplies (notebook, pen, pencil, eraser)',
        quantity: 500, unit_value: 150.00, total_value: 75000.00,
        payment_method: null, is_recurring: false, status: 'pending',
        created_at: d('2026-01-18'), updated_at: d('2026-01-18'),
      },
    ]);

    // DON_C items (pending - water, RECURRING monthly)
    await queryInterface.bulkInsert('donation_items', [
      {
        // Monthly purification tablets — 6 intervals
        donation_id: DON_C, type: 'goods', description: 'Water purification tablets (WaterGuard, 200 bottles/month)',
        quantity: 200, unit_value: 45.00, total_value: 54000.00, // per interval × 6 = 324,000 but stored as single-interval total here
        payment_method: null, is_recurring: true, status: 'pending',
        created_at: d('2026-02-03'), updated_at: d('2026-02-03'),
      },
      {
        // One-time jerry can purchase
        donation_id: DON_C, type: 'goods', description: '20-litre plastic jerry cans (3 per household)',
        quantity: 600, unit_value: 180.00, total_value: 108000.00,
        payment_method: null, is_recurring: false, status: 'pending',
        created_at: d('2026-02-03'), updated_at: d('2026-02-03'),
      },
    ]);

    // DON_D items (draft - shelter)
    await queryInterface.bulkInsert('donation_items', [
      {
        donation_id: DON_D, type: 'goods', description: 'Emergency blankets (heavy-duty, 200g/m²)',
        quantity: 600, unit_value: 380.00, total_value: 228000.00,
        payment_method: null, is_recurring: false, status: 'pending',
        created_at: d('2026-03-08'), updated_at: d('2026-03-08'),
      },
      {
        donation_id: DON_D, type: 'goods', description: 'Plastic sheeting (4m × 6m per piece)',
        quantity: 300, unit_value: 520.00, total_value: 156000.00,
        payment_method: null, is_recurring: false, status: 'pending',
        created_at: d('2026-03-08'), updated_at: d('2026-03-08'),
      },
      {
        donation_id: DON_D, type: 'service', description: 'Temporary shelter assembly — trained NGO volunteers (days)',
        quantity: 10, unit_value: 15000.00, total_value: 150000.00,
        payment_method: null, is_recurring: false, status: 'pending',
        created_at: d('2026-03-08'), updated_at: d('2026-03-08'),
      },
    ]);

    // DON_F items (distributed - water month 1)
    await queryInterface.bulkInsert('donation_items', [
      {
        donation_id: DON_F, type: 'goods', description: 'Water purification tablets — February 2026',
        quantity: 200, unit_value: 45.00, total_value: 9000.00,
        payment_method: null, is_recurring: false, status: 'distributed',
        created_at: d('2026-02-14'), updated_at: d('2026-02-28'),
      },
      {
        donation_id: DON_F, type: 'goods', description: 'Jerry cans 20L — initial distribution',
        quantity: 200, unit_value: 180.00, total_value: 36000.00,
        payment_method: null, is_recurring: false, status: 'distributed',
        created_at: d('2026-02-14'), updated_at: d('2026-02-28'),
      },
      {
        donation_id: DON_F, type: 'money', description: 'Cash stipend for community water carriers (daily wage)',
        quantity: 1, unit_value: 51000.00, total_value: 51000.00,
        payment_method: 'cash', is_recurring: false, status: 'distributed',
        created_at: d('2026-02-14'), updated_at: d('2026-02-28'),
      },
    ]);

    // Recalculate DON_D total (draft — total_value = sum of items)
    const don_d_total = 228000 + 156000 + 150000;
    await queryInterface.sequelize.query(
      `UPDATE donations SET total_value = ${don_d_total} WHERE donation_id = ${DON_D}`
    );

    const items = await queryInterface.sequelize.query(
      `SELECT donation_item_id, donation_id, description FROM donation_items ORDER BY donation_item_id`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    console.log(`   ✅ ${items.length} donation items`);

    // Helper to get item by donation + position
    const itemsByDonation = {};
    items.forEach(it => {
      if (!itemsByDonation[it.donation_id]) itemsByDonation[it.donation_id] = [];
      itemsByDonation[it.donation_id].push(it.donation_item_id);
    });
    const I_A = itemsByDonation[DON_A]; // [money, injera]
    const I_B = itemsByDonation[DON_B]; // [fees, uniforms, bags]
    const I_C = itemsByDonation[DON_C]; // [tablets(recurring), jerrycans]
    const I_D = itemsByDonation[DON_D]; // [blankets, sheeting, service]
    const I_F = itemsByDonation[DON_F]; // [tablets, jerrycans, cash]

    // ── 10. DONATION ITEM INTERVALS (recurring DON_C tablets) ───────────────
    console.log('\n🔁 Seeding recurring intervals...');
    const tabletItemId = I_C[0];
    // 6 monthly intervals: Feb–Jul 2026
    const intervalRows = [];
    const monthNames = ['February','March','April','May','June','July'];
    for (let i = 0; i < 6; i++) {
      const start = new Date(2026, 1 + i, 1); // Feb=1
      const end   = new Date(2026, 2 + i, 0); // last day of month
      intervalRows.push({
        donation_item_id: tabletItemId,
        interval_type: 'monthly',
        interval_count: i + 1,
        start_date: start.toISOString().split('T')[0],
        end_date:   end.toISOString().split('T')[0],
        status: i === 0 ? 'distributed' : 'pending', // Feb is done
        created_at: d('2026-02-03'), updated_at: d('2026-02-03'),
      });
    }
    await queryInterface.bulkInsert('donation_item_intervals', intervalRows);
    const intervals = await queryInterface.sequelize.query(
      `SELECT interval_id FROM donation_item_intervals ORDER BY interval_id`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const INT = intervals.map(r => r.interval_id); // INT[0]=Feb, INT[1]=Mar, ...
    console.log(`   ✅ 6 monthly intervals`);

    // ── 11. DONATION DISTRIBUTIONS ──────────────────────────────────────────
    console.log('\n🎁 Seeding distributions...');

    await queryInterface.bulkInsert('donation_distributions', [
      // DON_A: Ramadan money distributed to Addis and Adama families
      { donation_item_id: I_A[0], beneficiary_id: B[1], quantity: 1, value: 95000.00, is_returned: false, created_at: d('2025-03-20'), updated_at: d('2025-03-20') },
      { donation_item_id: I_A[0], beneficiary_id: B[2], quantity: 1, value: 95000.00, is_returned: false, created_at: d('2025-03-20'), updated_at: d('2025-03-20') },
      { donation_item_id: I_A[0], beneficiary_id: B[5], quantity: 1, value: 95000.00, is_returned: false, created_at: d('2025-03-20'), updated_at: d('2025-03-20') },
      { donation_item_id: I_A[0], beneficiary_id: B[6], quantity: 1, value: 95000.00, is_returned: false, created_at: d('2025-03-20'), updated_at: d('2025-03-20') },
      // DON_A: Injera goods
      { donation_item_id: I_A[1], beneficiary_id: B[1], quantity: 5000, value: 25000.00, is_returned: false, created_at: d('2025-03-20'), updated_at: d('2025-03-20') },
      { donation_item_id: I_A[1], beneficiary_id: B[2], quantity: 5000, value: 25000.00, is_returned: false, created_at: d('2025-03-20'), updated_at: d('2025-03-20') },
      { donation_item_id: I_A[1], beneficiary_id: B[5], quantity: 5000, value: 25000.00, is_returned: false, created_at: d('2025-03-20'), updated_at: d('2025-03-20') },
      { donation_item_id: I_A[1], beneficiary_id: B[6], quantity: 5000, value: 25000.00, is_returned: false, created_at: d('2025-03-20'), updated_at: d('2025-03-20') },

      // DON_B: School fees distributed to 4 children
      { donation_item_id: I_B[0], beneficiary_id: B[1], quantity: 1, value: 200.00, is_returned: false, created_at: d('2026-01-25'), updated_at: d('2026-01-25') },
      { donation_item_id: I_B[0], beneficiary_id: B[2], quantity: 1, value: 200.00, is_returned: false, created_at: d('2026-01-25'), updated_at: d('2026-01-25') },
      { donation_item_id: I_B[0], beneficiary_id: B[3], quantity: 1, value: 200.00, is_returned: false, created_at: d('2026-01-25'), updated_at: d('2026-01-25') },
      { donation_item_id: I_B[0], beneficiary_id: B[4], quantity: 1, value: 200.00, is_returned: false, created_at: d('2026-01-25'), updated_at: d('2026-01-25') },
      // DON_B: Uniforms
      { donation_item_id: I_B[1], beneficiary_id: B[1], quantity: 1, value: 350.00, is_returned: false, created_at: d('2026-01-25'), updated_at: d('2026-01-25') },
      { donation_item_id: I_B[1], beneficiary_id: B[2], quantity: 1, value: 350.00, is_returned: false, created_at: d('2026-01-25'), updated_at: d('2026-01-25') },
      { donation_item_id: I_B[1], beneficiary_id: B[3], quantity: 1, value: 350.00,
        // RETURNED — wrong size
        is_returned: true, return_reason: 'Wrong uniform size delivered. Replacement being sourced.',
        returned_at: d('2026-01-28'),
        created_at: d('2026-01-25'), updated_at: d('2026-01-28')
      },
      { donation_item_id: I_B[1], beneficiary_id: B[4], quantity: 1, value: 350.00, is_returned: false, created_at: d('2026-01-25'), updated_at: d('2026-01-25') },
      // DON_B: Bags
      { donation_item_id: I_B[2], beneficiary_id: B[1], quantity: 1, value: 150.00, is_returned: false, created_at: d('2026-01-25'), updated_at: d('2026-01-25') },
      { donation_item_id: I_B[2], beneficiary_id: B[2], quantity: 1, value: 150.00, is_returned: false, created_at: d('2026-01-25'), updated_at: d('2026-01-25') },
      { donation_item_id: I_B[2], beneficiary_id: B[3], quantity: 1, value: 150.00, is_returned: false, created_at: d('2026-01-25'), updated_at: d('2026-01-25') },
      { donation_item_id: I_B[2], beneficiary_id: B[4], quantity: 1, value: 150.00, is_returned: false, created_at: d('2026-01-25'), updated_at: d('2026-01-25') },

      // DON_F: Water tablets Feb — 3 Somali beneficiaries
      { donation_item_id: I_F[0], beneficiary_id: B[8],  quantity: 67, value: 3015.00, is_returned: false, created_at: d('2026-02-28'), updated_at: d('2026-02-28') },
      { donation_item_id: I_F[0], beneficiary_id: B[9],  quantity: 67, value: 3015.00, is_returned: false, created_at: d('2026-02-28'), updated_at: d('2026-02-28') },
      { donation_item_id: I_F[0], beneficiary_id: B[10], quantity: 66, value: 2970.00, is_returned: false, created_at: d('2026-02-28'), updated_at: d('2026-02-28') },
      // DON_F: Jerry cans
      { donation_item_id: I_F[1], beneficiary_id: B[8],  quantity: 67, value: 12060.00, is_returned: false, created_at: d('2026-02-28'), updated_at: d('2026-02-28') },
      { donation_item_id: I_F[1], beneficiary_id: B[9],  quantity: 67, value: 12060.00, is_returned: false, created_at: d('2026-02-28'), updated_at: d('2026-02-28') },
      { donation_item_id: I_F[1], beneficiary_id: B[10], quantity: 66, value: 11880.00, is_returned: false, created_at: d('2026-02-28'), updated_at: d('2026-02-28') },
      // DON_F: Cash stipend — community water carriers
      { donation_item_id: I_F[2], beneficiary_id: B[7],  quantity: 1,  value: 51000.00, is_returned: false, created_at: d('2026-02-28'), updated_at: d('2026-02-28') },
    ]);

    const dists = await queryInterface.sequelize.query(
      `SELECT distribution_id, donation_item_id, beneficiary_id FROM donation_distributions ORDER BY distribution_id`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    console.log(`   ✅ ${dists.length} distributions`);

    // ── 12. EVIDENCES ────────────────────────────────────────────────────────
    console.log('\n📎 Seeding evidence records...');
    await queryInterface.bulkInsert('donation_distribution_evidences', [
      // DON_A — Ramadan money
      { donation_item_id: I_A[0], interval_id: null, file_url: '/uploads/documents/charityEvidences/ramadan-2025-cbe-transfer.pdf',  file_name: 'CBE Bank Transfer Confirmation.pdf', file_type: 'application/pdf', uploaded_by: finEmp1, created_at: d('2025-03-10') },
      // DON_A — injera goods
      { donation_item_id: I_A[1], interval_id: null, file_url: '/uploads/documents/charityEvidences/ramadan-2025-injera-delivery.jpg', file_name: 'Injera Delivery Photo — Merkato.jpg', file_type: 'image/jpeg', uploaded_by: finEmp1, created_at: d('2025-03-19') },
      // DON_B — school fees
      { donation_item_id: I_B[0], interval_id: null, file_url: '/uploads/documents/charityEvidences/school-fees-2026-receipts.pdf',   file_name: 'School Registration Receipts.pdf', file_type: 'application/pdf', uploaded_by: finEmp2, created_at: d('2026-01-23') },
      // DON_B — uniforms
      { donation_item_id: I_B[1], interval_id: null, file_url: '/uploads/documents/charityEvidences/school-uniforms-2026-photo.jpg', file_name: 'Uniform Distribution — Kolfe.jpg', file_type: 'image/jpeg', uploaded_by: hrEmp1, created_at: d('2026-01-24') },
      // DON_B — bags
      { donation_item_id: I_B[2], interval_id: null, file_url: '/uploads/documents/charityEvidences/school-bags-2026-photo.jpg',     file_name: 'School Bag Distribution.jpg', file_type: 'image/jpeg', uploaded_by: hrEmp1, created_at: d('2026-01-24') },
      // DON_F — water tablets Feb (interval evidence)
      { donation_item_id: I_F[0], interval_id: INT[0], file_url: '/uploads/documents/charityEvidences/water-tablets-feb2026.jpg',    file_name: 'Water Tablets Feb 2026 — Jigjiga.jpg', file_type: 'image/jpeg', uploaded_by: finEmp2, created_at: d('2026-02-26') },
      // DON_F — jerry cans
      { donation_item_id: I_F[1], interval_id: null, file_url: '/uploads/documents/charityEvidences/jerrycans-feb2026.jpg',          file_name: 'Jerry Can Distribution — Degahabur.jpg', file_type: 'image/jpeg', uploaded_by: finEmp2, created_at: d('2026-02-26') },
      // DON_F — cash stipend
      { donation_item_id: I_F[2], interval_id: null, file_url: '/uploads/documents/charityEvidences/cash-stipend-feb2026.pdf',       file_name: 'Cash Payment Voucher — Water Carriers.pdf', file_type: 'application/pdf', uploaded_by: adminEmp, created_at: d('2026-02-27') },
    ]);
    console.log('   ✅ 8 evidence records');

    // ── 13. APPROVALS ────────────────────────────────────────────────────────
    console.log('\n✅ Seeding approval history...');
    await queryInterface.bulkInsert('donation_approvals', [
      // DON_A — straightforward approval
      { donation_id: DON_A, approved_by: adminEmp, status: 'approved', comment: 'All items verified. Ramadan campaign delivery plan confirmed.', created_at: d('2025-03-08') },

      // DON_B — initially rejected (changes requested), then re-approved
      { donation_id: DON_B, approved_by: finEmp2, status: 'rejected', comment: 'Please confirm unit prices for uniforms match the agreed procurement rate (350 ETB). Supplier quote required.', created_at: d('2026-01-21') },
      { donation_id: DON_B, approved_by: finEmp2, status: 'approved', comment: 'Supplier quote received and verified. Unit price 350 ETB confirmed. Approved for distribution.', created_at: d('2026-01-25') },

      // DON_C — pending (no approval yet)
      { donation_id: DON_C, approved_by: null, status: 'pending', comment: null, created_at: d('2026-02-06') },

      // DON_F — approved
      { donation_id: DON_F, approved_by: adminEmp, status: 'approved', comment: 'First month water supply confirmed. Evidence of field delivery required within 5 days of distribution.', created_at: d('2026-02-17') },
    ]);
    console.log('   ✅ 5 approval records');

    // ── 14. DEDUCTIONS ───────────────────────────────────────────────────────
    console.log('\n➖ Seeding deductions...');
    // DON_B uniform returned by Hiwot (B[3]) — deducted and reassigned to Selam (B[1])
    const returnedUniformDist = dists.find(d => d.donation_item_id === I_B[1] && d.beneficiary_id === B[3]);
    if (returnedUniformDist) {
      await queryInterface.bulkInsert('donation_deductions', [
        {
          donation_item_id: I_B[1],
          distribution_id: returnedUniformDist.distribution_id,
          interval_id: null,
          amount: 350.00,
          reason: 'Uniform size XS not available in local store. Hiwot Abebe to receive replacement when correct size procured. Amount temporarily reassigned to Selam Tesfaye pending restock.',
          from_beneficiary_id: B[3],
          reassigned_to_beneficiary_id: B[1],
          deduction_date: '2026-01-28',
          created_by: hrEmp1,
          created_at: d('2026-01-28'),
        },
      ]);
    }
    console.log('   ✅ 1 deduction record');

    // ── 15. AUDIT LOGS ───────────────────────────────────────────────────────
    console.log('\n📋 Seeding audit logs...');
    await queryInterface.bulkInsert('donation_logs', [
      // DON_A lifecycle
      { donation_id: DON_A, user_id: finEmp1,  action: 'CREATE',              metadata: JSON.stringify({ company: 'Ethio Telecom', campaign: 'Ramadan Iftar 2025' }),                       created_at: d('2025-03-04') },
      { donation_id: DON_A, user_id: finEmp1,  action: 'ADD_ITEM',            metadata: JSON.stringify({ itemId: I_A[0], type: 'money', value: 380000 }),                                   created_at: d('2025-03-04') },
      { donation_id: DON_A, user_id: finEmp1,  action: 'ADD_ITEM',            metadata: JSON.stringify({ itemId: I_A[1], type: 'goods', description: 'Injera' }),                            created_at: d('2025-03-04') },
      { donation_id: DON_A, user_id: finEmp1,  action: 'SUBMIT_FOR_APPROVAL', metadata: JSON.stringify({}),                                                                                   created_at: d('2025-03-05') },
      { donation_id: DON_A, user_id: adminEmp, action: 'APPROVE',             metadata: JSON.stringify({ comment: 'All items verified.' }),                                                   created_at: d('2025-03-08') },
      { donation_id: DON_A, user_id: finEmp1,  action: 'EVIDENCE_UPLOADED',   metadata: JSON.stringify({ itemId: I_A[0], fileCount: 1 }),                                                   created_at: d('2025-03-10') },
      { donation_id: DON_A, user_id: finEmp1,  action: 'EVIDENCE_UPLOADED',   metadata: JSON.stringify({ itemId: I_A[1], fileCount: 1 }),                                                   created_at: d('2025-03-19') },
      { donation_id: DON_A, user_id: finEmp1,  action: 'DISTRIBUTE',          metadata: JSON.stringify({}),                                                                                   created_at: d('2025-03-20') },

      // DON_B lifecycle (changes requested then re-approved)
      { donation_id: DON_B, user_id: finEmp1,  action: 'CREATE',              metadata: JSON.stringify({ company: 'CBE', campaign: 'Back to School 2026' }),                                 created_at: d('2026-01-18') },
      { donation_id: DON_B, user_id: finEmp1,  action: 'ADD_ITEM',            metadata: JSON.stringify({ itemId: I_B[0], description: 'School fees' }),                                      created_at: d('2026-01-18') },
      { donation_id: DON_B, user_id: finEmp1,  action: 'ADD_ITEM',            metadata: JSON.stringify({ itemId: I_B[1], description: 'Uniforms' }),                                         created_at: d('2026-01-18') },
      { donation_id: DON_B, user_id: finEmp1,  action: 'ADD_ITEM',            metadata: JSON.stringify({ itemId: I_B[2], description: 'Bags' }),                                             created_at: d('2026-01-18') },
      { donation_id: DON_B, user_id: finEmp1,  action: 'SUBMIT_FOR_APPROVAL', metadata: JSON.stringify({}),                                                                                   created_at: d('2026-01-19') },
      { donation_id: DON_B, user_id: finEmp2,  action: 'REQUEST_CHANGES',     metadata: JSON.stringify({ comment: 'Confirm uniform price. Supplier quote required.' }),                      created_at: d('2026-01-21') },
      { donation_id: DON_B, user_id: finEmp1,  action: 'UPDATE_ITEM',         metadata: JSON.stringify({ itemId: I_B[1] }),                                                                  created_at: d('2026-01-22') },
      { donation_id: DON_B, user_id: finEmp1,  action: 'SUBMIT_FOR_APPROVAL', metadata: JSON.stringify({}),                                                                                   created_at: d('2026-01-23') },
      { donation_id: DON_B, user_id: finEmp2,  action: 'APPROVE',             metadata: JSON.stringify({ comment: 'Supplier quote confirmed.' }),                                             created_at: d('2026-01-25') },
      { donation_id: DON_B, user_id: hrEmp1,   action: 'EVIDENCE_UPLOADED',   metadata: JSON.stringify({ itemId: I_B[0], fileCount: 1 }),                                                   created_at: d('2026-01-23') },
      { donation_id: DON_B, user_id: hrEmp1,   action: 'EVIDENCE_UPLOADED',   metadata: JSON.stringify({ itemId: I_B[1], fileCount: 1 }),                                                   created_at: d('2026-01-24') },
      { donation_id: DON_B, user_id: hrEmp1,   action: 'EVIDENCE_UPLOADED',   metadata: JSON.stringify({ itemId: I_B[2], fileCount: 1 }),                                                   created_at: d('2026-01-24') },
      { donation_id: DON_B, user_id: hrEmp1,   action: 'REASSIGN_DISTRIBUTION',metadata: JSON.stringify({ fromBeneficiaryId: B[3], toBeneficiaryId: B[1], amount: 350, itemId: I_B[1] }), created_at: d('2026-01-28') },

      // DON_C lifecycle (pending)
      { donation_id: DON_C, user_id: finEmp2,  action: 'CREATE',              metadata: JSON.stringify({ company: 'Dashen Bank', campaign: 'Water & Sanitation' }),                          created_at: d('2026-02-03') },
      { donation_id: DON_C, user_id: finEmp2,  action: 'ADD_ITEM',            metadata: JSON.stringify({ itemId: I_C[0], description: 'Water tablets recurring' }),                          created_at: d('2026-02-03') },
      { donation_id: DON_C, user_id: finEmp2,  action: 'ADD_ITEM',            metadata: JSON.stringify({ itemId: I_C[1], description: 'Jerry cans' }),                                       created_at: d('2026-02-03') },
      { donation_id: DON_C, user_id: finEmp2,  action: 'SUBMIT_FOR_APPROVAL', metadata: JSON.stringify({}),                                                                                   created_at: d('2026-02-06') },

      // DON_E lifecycle (cancelled)
      { donation_id: DON_E, user_id: finEmp1,  action: 'CREATE',              metadata: JSON.stringify({ company: 'CBE', campaign: 'Back to School 2026 — 2nd tranche' }),                  created_at: d('2026-01-26') },
      { donation_id: DON_E, user_id: finEmp1,  action: 'CANCEL',              metadata: JSON.stringify({ reason: 'Donor budget freeze' }),                                                   created_at: d('2026-02-01') },

      // DON_F lifecycle (distributed water month 1)
      { donation_id: DON_F, user_id: finEmp2,  action: 'CREATE',              metadata: JSON.stringify({ company: 'Ethio Telecom', campaign: 'Water Feb 2026' }),                            created_at: d('2026-02-14') },
      { donation_id: DON_F, user_id: finEmp2,  action: 'ADD_ITEM',            metadata: JSON.stringify({ itemId: I_F[0], description: 'Water tablets Feb' }),                                created_at: d('2026-02-14') },
      { donation_id: DON_F, user_id: finEmp2,  action: 'ADD_ITEM',            metadata: JSON.stringify({ itemId: I_F[1], description: 'Jerry cans' }),                                       created_at: d('2026-02-14') },
      { donation_id: DON_F, user_id: finEmp2,  action: 'ADD_ITEM',            metadata: JSON.stringify({ itemId: I_F[2], description: 'Cash stipend' }),                                     created_at: d('2026-02-14') },
      { donation_id: DON_F, user_id: finEmp2,  action: 'SUBMIT_FOR_APPROVAL', metadata: JSON.stringify({}),                                                                                   created_at: d('2026-02-15') },
      { donation_id: DON_F, user_id: adminEmp, action: 'APPROVE',             metadata: JSON.stringify({ comment: 'First month water supply confirmed.' }),                                  created_at: d('2026-02-17') },
      { donation_id: DON_F, user_id: finEmp2,  action: 'EVIDENCE_UPLOADED',   metadata: JSON.stringify({ itemId: I_F[0], fileCount: 1 }),                                                   created_at: d('2026-02-26') },
      { donation_id: DON_F, user_id: finEmp2,  action: 'EVIDENCE_UPLOADED',   metadata: JSON.stringify({ itemId: I_F[1], fileCount: 1 }),                                                   created_at: d('2026-02-26') },
      { donation_id: DON_F, user_id: adminEmp, action: 'EVIDENCE_UPLOADED',   metadata: JSON.stringify({ itemId: I_F[2], fileCount: 1 }),                                                   created_at: d('2026-02-27') },
      { donation_id: DON_F, user_id: finEmp2,  action: 'DISTRIBUTE',          metadata: JSON.stringify({}),                                                                                   created_at: d('2026-02-28') },
    ]);
    const logCount = await queryInterface.sequelize.query(
      `SELECT COUNT(*) as cnt FROM donation_logs`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    console.log(`   ✅ ${logCount[0].cnt} audit log entries`);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🇪🇹  Ethiopian Charity Module seeded successfully!\n');
    console.log('   Use cases covered:');
    console.log('   ✓ Companies: 4 active (main/partner/sister), 1 inactive');
    console.log('   ✓ Campaigns: active ×3, completed ×1, inactive ×1, cancelled ×1');
    console.log('   ✓ Beneficiary groups ×5, locations ×10, beneficiaries ×12');
    console.log('   ✓ Beneficiary transfer (Adama → Addis)');
    console.log('   ✓ Donations: distributed ×2, approved ×1, pending ×1, draft ×1, cancelled ×1');
    console.log('   ✓ Donation items: money (bank & cash), goods ×multiple, service ×1');
    console.log('   ✓ Recurring item: 6 monthly intervals, 1st distributed');
    console.log('   ✓ Distributions with a returned distribution');
    console.log('   ✓ Evidence files: PDF + JPEG across items and intervals');
    console.log('   ✓ Approval: direct approve, changes-requested → re-approved, pending');
    console.log('   ✓ Deduction + reassignment between beneficiaries');
    console.log('   ✓ Full audit trail: 35+ log entries');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  },

  down: async (queryInterface, Sequelize) => {
    const tables = [
      'donation_deductions', 'donation_logs', 'donation_approvals',
      'donation_distribution_evidences', 'donation_distributions',
      'donation_item_intervals', 'donation_items', 'donations',
      'beneficiary_transfers', 'beneficiaries', 'beneficiary_groups',
      'beneficiary_locations', 'campaigns', 'donation_companies',
    ];
    for (const t of tables) {
      await queryInterface.sequelize.query(
        `TRUNCATE TABLE "${t}" RESTART IDENTITY CASCADE`
      );
    }
  }
};