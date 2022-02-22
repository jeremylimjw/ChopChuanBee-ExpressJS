const { hashPassword } = require('../auth/bcrypt');
const { Sequelize, DataTypes } = require('sequelize');
const ViewType = require('../common/ViewType');
const RoleType = require('../common/RoleType');
const ChargedUnderType = require('../common/ChargedUnderType');
const PaymentTermType = require('../common/PaymentTermType');
const PurchaseOrderStatusType = require('../common/PurchaseOrderStatusType');
const LeaveTypeEnum = require('../common/LeaveTypeEnum');
const LeaveStatusEnum = require('../common/LeaveStatusEnum');
const ProductCategoryEnum = require('../common/ProductCategory');
<<<<<<< HEAD
const PaymentMethodType = require('../common/PaymentMethodType');
const AccountingTypeEnum = require('../common/AccountingTypeEnum');
const MovementTypeEnum = require('../common/MovementTypeEnum');
=======
const { insertDemoData } = require('../demo');
>>>>>>> first-release

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
    const { syncAssociations } = require('../models');
    await syncAssociations();

    // Data initiation
    const { Employee, Role } = require('../models/Employee');
    const { AccessRight } = require('../models/AccessRight');
    const employees = await Employee.findOne();

    if (employees == null) {
      console.log("First run detected, running data init");

      const View = require('../models/View');
      const { ChargedUnder, Customer } = require('../models/Customer');
      const { LeaveType, LeaveAccount, STANDARD_LEAVE_ACCOUNTS } = require('../models/LeaveAccount');
      const { LeaveStatus } = require('../models/LeaveApplication');
      const { ProductCategory } = require('../models/Product');

      await View.bulkCreate(Object.keys(ViewType).map(key => ViewType[key]));
      await Role.bulkCreate(Object.keys(RoleType).map(key => RoleType[key]));
      await ChargedUnder.bulkCreate(Object.keys(ChargedUnderType).map(key => ChargedUnderType[key]));
      await LeaveType.bulkCreate(Object.keys(LeaveTypeEnum).map(key => LeaveTypeEnum[key]));
      await LeaveStatus.bulkCreate(Object.keys(LeaveStatusEnum).map(key => LeaveStatusEnum[key]));
      await ProductCategory.bulkCreate(Object.keys(ProductCategoryEnum).map(key => ProductCategoryEnum[key]));
     
      const employees = await Employee.bulkCreate([
        { name: "Admin", username: "admin", password: await hashPassword('password'), email: "admin@gmail.com", role_id: RoleType.ADMIN.id, leave_accounts: STANDARD_LEAVE_ACCOUNTS },
        { name: "Alice", username: "alice", password: await hashPassword('password'), email: "alice@gmail.com", role_id: RoleType.STAFF.id, leave_accounts: STANDARD_LEAVE_ACCOUNTS },
      ], { include: LeaveAccount })

      await AccessRight.bulkCreate(Object.keys(ViewType).map(key => ({ employee_id: employees[1].id, view_id: ViewType[key].id, has_write_access: false })))

      const { Supplier, GUEST_ID } = require('../models/Supplier');
      await Supplier.create({ id: GUEST_ID, company_name: 'Guest', s1_name: 'Guest', s1_phone_number: 'NA', address: 'NA', postal_code: 'NA' });

      // Comment this out if u don't want large dataset to init
      await insertDemoData();

    }
  
  } catch (err) {
    console.log("Connection to database failed.");
    console.log(err);
  }
})()

module.exports = {
  sequelize
}