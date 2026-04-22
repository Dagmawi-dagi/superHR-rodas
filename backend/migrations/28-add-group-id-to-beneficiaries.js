'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('beneficiaries', 'group_id', {
      type: Sequelize.INTEGER,
      references: { model: 'beneficiary_groups', key: 'group_id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },
  async down(queryInterface) { await queryInterface.removeColumn('beneficiaries', 'group_id'); }
};