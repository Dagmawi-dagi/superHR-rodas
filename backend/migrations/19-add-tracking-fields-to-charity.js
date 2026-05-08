'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('donation_companies', 'created_by', {
      type: Sequelize.INTEGER,
      references: { model: 'employees', key: 'employee_id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
    await queryInterface.addColumn('beneficiaries', 'created_by', {
      type: Sequelize.INTEGER,
      references: { model: 'employees', key: 'employee_id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
    await queryInterface.addColumn('donations', 'created_by', {
      type: Sequelize.INTEGER,
      references: { model: 'employees', key: 'employee_id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
    await queryInterface.addColumn('donations', 'approved_by', {
      type: Sequelize.INTEGER,
      references: { model: 'employees', key: 'employee_id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
    await queryInterface.addColumn('donations', 'distributed_by', {
      type: Sequelize.INTEGER,
      references: { model: 'employees', key: 'employee_id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('donation_companies', 'created_by');
    await queryInterface.removeColumn('beneficiaries', 'created_by');
    await queryInterface.removeColumn('donations', 'created_by');
    await queryInterface.removeColumn('donations', 'approved_by');
    await queryInterface.removeColumn('donations', 'distributed_by');
  }
};
