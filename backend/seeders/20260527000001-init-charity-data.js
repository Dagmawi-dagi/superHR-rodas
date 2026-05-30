'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // 1. Teams (with no beneficiaries initially)
    await queryInterface.bulkInsert('charity_teams', [
      { name: 'Team Alpha',  description: 'First donation team',  members: JSON.stringify([]), is_active: true, created_at: now, updated_at: now },
      { name: 'Team Beta',   description: 'Second donation team', members: JSON.stringify([]), is_active: true, created_at: now, updated_at: now }
    ]);

    // 2. Beneficiaries (10 individuals, no team assignment, no head/vice)
    const beneficiaries = Array.from({ length: 10 }, (_, i) => ({
      name: `Beneficiary ${i + 1}`,
      type: 'individual',
      full_info: JSON.stringify({}),   // JSONB needs a stringified object
      team_id: null,                   // no team
      is_active: true,
      created_at: now,
      updated_at: now
    }));
    await queryInterface.bulkInsert('charity_beneficiaries', beneficiaries);

    // 3. Settings (one default row)
    await queryInterface.bulkInsert('charity_settings', [{
      setting_key: 'main',
      companies: JSON.stringify([]),
      config: JSON.stringify({ currency: 'ETB', default_payment: 'bank' }),
      created_at: now,
      updated_at: now
    }]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('charity_settings', null, {});
    await queryInterface.bulkDelete('charity_beneficiaries', null, {});
    await queryInterface.bulkDelete('charity_teams', null, {});
  }
};