const { hashPassword } = require('../auth/bcrypt');
const { Sequelize, DataTypes } = require('sequelize');
const ViewType = require('../common/ViewType');
const RoleType = require('../common/RoleType');
const ChargedUnderType = require('../common/ChargedUnderType');
const LeaveTypeEnum = require('../common/LeaveTypeEnum');
const LeaveStatusEnum = require('../common/LeaveStatusEnum');
const ProductCategoryEnum = require('../common/ProductCategory');

const sequelize = new Sequelize(process.env.PGDATABASE, process.env.PGUSER, process.env.PGPASSWORD, {
  host: process.env.PGHOST,
  dialect: 'postgres',
  port: 5432,
  logging: false
});

(async () => {
  try {
    // Test the database connection
    await sequelize.query(`SELECT NOW()`);
    console.log("Connection to database established");

    // Load and initialize all tables/associations
    await require('../models')();

    // Data initiation
    const { Employee, Role } = require('../models/Employee');
    const { AccessRight } = require('../models/AccessRight');
    const employees = await Employee.findOne();

    if (employees == null) {
      console.log("First run detected, running data init");

      const View = require('../models/View');
      const { ChargedUnder } = require('../models/Customer');
      const {LeaveType, LeaveAccount} = require('../models/LeaveAccount');
      const {LeaveStatus} = require('../models/LeaveApplication');
      const { ProductCategory } = require('../models/Product');

      await View.bulkCreate(Object.keys(ViewType).map(key => ViewType[key]));
      await Role.bulkCreate(Object.keys(RoleType).map(key => RoleType[key]));
      await ChargedUnder.bulkCreate(Object.keys(ChargedUnderType).map(key => ChargedUnderType[key]));
      await LeaveType.bulkCreate(Object.keys(LeaveTypeEnum).map(key => LeaveTypeEnum[key]));
      await LeaveStatus.bulkCreate(Object.keys(LeaveStatusEnum).map(key => LeaveStatusEnum[key]));
     /*  await LeaveAccount.bulkCreate([ 
        { entitled_days: 14, entitled_rollover: 3, leave_type_id: LeaveTypeEnum.ANNUAL.id },
        { entitled_days: 14, entitled_rollover: 3, leave_type_id: LeaveTypeEnum.ANNUAL.id }

      ]); */
      await ProductCategory.bulkCreate(Object.keys(ProductCategoryEnum).map(key => ProductCategoryEnum[key]));
     
      await Employee.bulkCreate([
        { name: "Admin", username: "admin", password: await hashPassword('password'), email: "admin@gmail.com", role_id: RoleType.ADMIN.id },
        { name: "Alice", username: "alice", password: await hashPassword('password'), email: "alice@gmail.com", role_id: RoleType.STAFF.id },
      ])

      const alice = await Employee.findOne({ where: { name: "Alice" } });
      await AccessRight.create({ has_write_access: true, employee_id: alice.id, view_id: ViewType.HR.id })
      await AccessRight.create({ has_write_access: false, employee_id: alice.id, view_id: ViewType.CRM.id })

    }
  
  } catch (err) {
    console.log("Connection to database failed.");
    console.log(err);
  }
})()

module.exports = {
  sequelize
}