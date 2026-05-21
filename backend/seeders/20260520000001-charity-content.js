'use strict';

/**
 * Seeder: Charity Content
 *
 * Seeds:
 *   - 2 Charity Teams (Addis Hope, Rural Reach)
 *   - 5 Charity Beneficiaries distributed among those teams
 *
 * Depends on: 20260421132018-demo-charity-data.js (for users/employees)
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('\n📦 Seeding charity content (Teams & Beneficiaries)...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // ── 1. RESOLVE REFERENCES ──────────────────────────────────────────────────
    
    // Resolve User IDs
    const [userRows] = await queryInterface.sequelize.query(
      `SELECT user_id, username FROM users WHERE username IN ('charity_admin', 'team_lead_1', 'team_lead_2')`
    );
    const userMap = {};
    userRows.forEach(u => { userMap[u.username] = u.user_id; });

    // Resolve Employee IDs
    const [empRows] = await queryInterface.sequelize.query(
      `SELECT employee_id, employee_code FROM employees WHERE employee_code IN ('EMP-CA01', 'EMP-TL01', 'EMP-TL02')`
    );
    const empMap = {};
    empRows.forEach(e => { empMap[e.employee_code] = e.employee_id; });

    const adminUserId = userMap['charity_admin'];
    const tl1EmpId    = empMap['EMP-TL01'];
    const tl2EmpId    = empMap['EMP-TL02'];

    if (!adminUserId || !tl1EmpId || !tl2EmpId) {
      console.warn('⚠️  Required users/employees not found. Skipping content seeding.');
      return;
    }

    // ── 2. SEED TEAMS ───────────────────────────────────────────────────────────
    console.log('\n🛡️ Seeding charity teams...');
    
    const teamsToSeed = [
      {
        name: 'Addis Hope Team',
        description: 'Providing aid to urban families in Addis Ababa',
        head_employee_id: tl1EmpId,
        vice_employee_id: tl2EmpId,
        members: JSON.stringify([tl1EmpId, tl2EmpId]),
        is_active: true,
        created_by: adminUserId
      },
      {
        name: 'Rural Reach Out',
        description: 'Supporting remote farming communities',
        head_employee_id: tl2EmpId,
        vice_employee_id: null,
        members: JSON.stringify([tl2EmpId]),
        is_active: true,
        created_by: adminUserId
      }
    ];

    for (const t of teamsToSeed) {
      await queryInterface.sequelize.query(`
        INSERT INTO charity_teams (name, description, head_employee_id, vice_employee_id, members, is_active, created_by, created_at, updated_at)
        SELECT :name, :description, :head_employee_id, :vice_employee_id, :members::jsonb, :is_active, :created_by, NOW(), NOW()
        WHERE NOT EXISTS (SELECT 1 FROM charity_teams WHERE name = :name);
      `, { replacements: t });
      console.log(`  ✅ team: ${t.name}`);
    }

    // Resolve Team IDs
    const [teamRows] = await queryInterface.sequelize.query(
      `SELECT team_id, name FROM charity_teams WHERE name IN ('Addis Hope Team', 'Rural Reach Out')`
    );
    const teamMap = {};
    teamRows.forEach(t => { teamMap[t.name] = t.team_id; });

    const addisTeamId = teamMap['Addis Hope Team'];
    const ruralTeamId = teamMap['Rural Reach Out'];

    // ── 3. SEED BENEFICIARIES ────────────────────────────────────────────────────
    console.log('\n🤝 Seeding beneficiaries...');

    const beneficiariesToSeed = [
      {
        name: 'Tsegaye Gebremedhin',
        type: 'individual',
        team_id: addisTeamId,
        full_info: JSON.stringify({
          location: { region: 'Addis Ababa', city: 'Arada', woreda: '04' },
          contact: { phone: '0911223344', email: 'tsegaye@example.com' }
        }),
        is_active: true,
        created_by: adminUserId
      },
      {
        name: 'Mekanisa Orphanage',
        type: 'organization',
        team_id: addisTeamId,
        full_info: JSON.stringify({
          location: { region: 'Addis Ababa', city: 'Nifas Silk', woreda: '10' },
          contact: { phone: '0115544332', email: 'info@mekanisa.org' }
        }),
        is_active: true,
        created_by: adminUserId
      },
      {
        name: 'Aster Awoke Support Group',
        type: 'organization',
        team_id: ruralTeamId,
        full_info: JSON.stringify({
          location: { region: 'Amhara', city: 'Bahir Dar', woreda: '01' },
          contact: { phone: '0582201122' }
        }),
        is_active: true,
        created_by: adminUserId
      },
      {
        name: 'Kebede Balcha',
        type: 'individual',
        team_id: ruralTeamId,
        full_info: JSON.stringify({
          location: { region: 'Oromia', city: 'Bishoftu', woreda: '02' },
          contact: { phone: '0922334455' }
        }),
        is_active: true,
        created_by: adminUserId
      }
    ];

    for (const b of beneficiariesToSeed) {
      await queryInterface.sequelize.query(`
        INSERT INTO charity_beneficiaries (name, type, team_id, full_info, is_active, created_by, created_at, updated_at)
        SELECT :name, :type, :team_id, :full_info::jsonb, :is_active, :created_by, NOW(), NOW()
        WHERE NOT EXISTS (SELECT 1 FROM charity_beneficiaries WHERE name = :name);
      `, { replacements: b });
      console.log(`  ✅ beneficiary: ${b.name} (${b.type})`);
    }

    console.log('\n✅ Charity content seeding complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  },

  async down(queryInterface, Sequelize) {
    console.log('\n🗑️ Rolling back charity content...');
    await queryInterface.sequelize.query(`DELETE FROM charity_beneficiaries;`);
    await queryInterface.sequelize.query(`DELETE FROM charity_teams;`);
    console.log('  ✅ Rolled back teams and beneficiaries.');
  }
};