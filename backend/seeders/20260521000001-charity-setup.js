'use strict';

/**
 * Seeder: Charity Module Setup
 * 
 * Initializes the Charity module structural data:
 *   - Roles: charity_admin, charity_teamleader
 *   - Settings: 'main' config with sample donor companies
 *   - Teams: Initial sample team
 *   - Beneficiaries: Initial sample beneficiaries
 * 
 * This seeder assumes you will create Users/Employees manually or via other seeders.
 * It will attempt to resolve IDs from existing records where possible.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('\n🚀 Starting Charity Module Setup...');

    // ── 1. ROLES ──────────────────────────────────────────────────────────────
    console.log('  🎭 Seeding Roles...');
    const roles = [
      { name: 'charity_admin', description: 'Can approve donations and manage module settings', is_active: true },
      { name: 'charity_teamleader', description: 'Manages team-specific beneficiaries and drafts donations', is_active: true }
    ];

    for (const role of roles) {
      await queryInterface.sequelize.query(`
        INSERT INTO roles (name, description, is_active, created_at, updated_at)
        SELECT :name, :description, :is_active, NOW(), NOW()
        WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = :name);
      `, { replacements: role });
    }

    // ── 2. CHARITY SETTINGS ───────────────────────────────────────────────────
    console.log('  ⚙️  Seeding Settings...');
    const mainSettings = {
      setting_key: 'main',
      companies: JSON.stringify([
        { name: 'Meta Platforms', full_info: { type: 'main', phone: '+251111111111', email: 'donations@meta.com', address: 'Menelik II Ave, Addis' } },
        { name: 'Safaricom Ethiopia', full_info: { type: 'partner', phone: '+251777777777', email: 'csr@safaricom.et', address: 'Bole Road, Addis' } }
      ]),
      config: JSON.stringify({
        default_currency: 'ETB',
        fiscal_year_start: '2026-01-01',
        auto_approve_small_donations: false
      })
    };

    await queryInterface.sequelize.query(`
      INSERT INTO charity_settings (setting_key, companies, config, created_at, updated_at)
      SELECT :setting_key, :companies::jsonb, :config::jsonb, NOW(), NOW()
      WHERE NOT EXISTS (SELECT 1 FROM charity_settings WHERE setting_key = :setting_key);
    `, { replacements: mainSettings });

    // ── 3. ATTEMPT TO SEED SAMPLE TEAMS (IF EMPLOYEES EXIST) ──────────────────
    // We try to find the first 2 employees to use as Head/Vice
    const [empRows] = await queryInterface.sequelize.query(
      `SELECT employee_id FROM employees LIMIT 2;`
    );
    const [userRows] = await queryInterface.sequelize.query(
      `SELECT user_id FROM users LIMIT 1;`
    );

    if (empRows.length > 0 && userRows.length > 0) {
      console.log('  🛡️  Seeding Sample Team (Linking to existing employees)...');
      const headId = empRows[0].employee_id;
      const viceId = empRows[1] ? empRows[1].employee_id : null;
      const creatorId = userRows[0].user_id;

      const sampleTeam = {
        name: 'Addis Hope Team',
        description: 'Primary team for urban relief efforts',
        head_employee_id: headId,
        vice_employee_id: viceId,
        members: JSON.stringify([headId, viceId].filter(id => id !== null)),
        is_active: true,
        created_by: creatorId
      };

      await queryInterface.sequelize.query(`
        INSERT INTO charity_teams (name, description, head_employee_id, vice_employee_id, members, is_active, created_by, created_at, updated_at)
        SELECT :name, :description, :head_employee_id, :vice_employee_id, :members::jsonb, :is_active, :created_by, NOW(), NOW()
        WHERE NOT EXISTS (SELECT 1 FROM charity_teams WHERE name = :name);
      `, { replacements: sampleTeam });

      // ── 4. SEED SAMPLE BENEFICIARIES (Linking to the new team) ──────────────
      const [teamRows] = await queryInterface.sequelize.query(
        `SELECT team_id FROM charity_teams WHERE name = 'Addis Hope Team' LIMIT 1;`
      );

      if (teamRows.length > 0) {
        console.log('  🤝 Seeding Sample Beneficiaries...');
        const teamId = teamRows[0].team_id;
        const beneficiaries = [
          {
            name: 'Zewditu Charity Center',
            type: 'organization',
            team_id: teamId,
            full_info: JSON.stringify({
              location: { region: 'Addis Ababa', city: 'Arada', woreda: '04' },
              contact: { phone: '0911002233', contactPerson: 'Aster Kassa' }
            }),
            is_active: true,
            created_by: creatorId
          },
          {
            name: 'Tsegaye Gebremedhin',
            type: 'individual',
            team_id: teamId,
            full_info: JSON.stringify({
              location: { region: 'Addis Ababa', city: 'Bole', woreda: '02' },
              contact: { phone: '0922445566' }
            }),
            is_active: true,
            created_by: creatorId
          }
        ];

        for (const ben of beneficiaries) {
          await queryInterface.sequelize.query(`
            INSERT INTO charity_beneficiaries (name, type, team_id, full_info, is_active, created_by, created_at, updated_at)
            SELECT :name, :type, :team_id, :full_info::jsonb, :is_active, :created_by, NOW(), NOW()
            WHERE NOT EXISTS (SELECT 1 FROM charity_beneficiaries WHERE name = :name);
          `, { replacements: ben });
        }
      }
    } else {
      console.warn('  ⚠️  No Employees/Users found. Roles and Settings seeded, but skipping sample Team/Beneficiaries.');
    }

    console.log('\n✅ Charity Module Setup Seeding complete!');
  },

  async down(queryInterface, Sequelize) {
    console.log('\n🗑️ Rolling back Charity Module Setup...');
    await queryInterface.sequelize.query(`DELETE FROM charity_beneficiaries;`);
    await queryInterface.sequelize.query(`DELETE FROM charity_teams;`);
    await queryInterface.sequelize.query(`DELETE FROM charity_settings;`);
    await queryInterface.sequelize.query(`DELETE FROM roles WHERE name IN ('charity_admin', 'charity_teamleader');`);
    console.log('  ✅ Cleaned up Charity specific data.');
  }
};
