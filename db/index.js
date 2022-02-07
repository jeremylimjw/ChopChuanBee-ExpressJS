const { hashPassword } = require('../auth/bcrypt');
const { Sequelize, DataTypes } = require('sequelize');
const ViewType = require('../common/ViewType');
const RoleType = require('../common/RoleType');
const ChargedUnderType = require('../common/ChargedUnderType');
const PaymentTermType = require('../common/PaymentTermType');
const POStatusType = require('../common/POStatusType');
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
      await ProductCategory.bulkCreate(Object.keys(ProductCategoryEnum).map(key => ProductCategoryEnum[key]));
     
      await Employee.bulkCreate([
        { name: "Admin", username: "admin", password: await hashPassword('password'), email: "admin@gmail.com", role_id: RoleType.ADMIN.id },
        { name: "Alice", username: "alice", password: await hashPassword('password'), email: "alice@gmail.com", role_id: RoleType.STAFF.id },
      ])

      const alice = await Employee.findOne({ where: { name: "Alice" } });
      await AccessRight.create({ has_write_access: true, employee_id: alice.id, view_id: ViewType.HR.id })
      await AccessRight.create({ has_write_access: false, employee_id: alice.id, view_id: ViewType.INVENTORY.id })

      
      const { Supplier } = require('../models/Supplier');
      await Supplier.bulkCreate([
        { company_name: "Heng Heng", s1_name: "Ah Heng", s1_phone_number: "82663467", address: "21 Heng St", postal_code: "745728" },
        { company_name: "Sheng Shiong", s1_name: "David King", s1_phone_number: "9277472", address: "Hougang Ave 8", postal_code: "565523" },
        { company_name: "Fairprice", s1_name: "Laurie", s1_phone_number: "87476828", address: "2 Buona Vista Rd", postal_code: "845125" },
      ]);

      
      const { Product } = require('../models/Product');
      await Product.bulkCreate([
        { name: "Ketchup", unit: "bottle", min_inventory_level: "100" },
        { name: "Ikan Bilis", unit: "kg", min_inventory_level: "50" },
        { name: "Soy Sauce", unit: "bottle", min_inventory_level: "80" },
      ]);

      const { PurchaseOrder, PaymentTerm, POStatus } = require('../models/PurchaseOrder');
      await PaymentTerm.bulkCreate(Object.keys(PaymentTermType).map(key => PaymentTermType[key]));
      await POStatus.bulkCreate(Object.keys(POStatusType).map(key => POStatusType[key]));

    }
  
  } catch (err) {
    console.log("Connection to database failed.");
    console.log(err);
  }
})()

module.exports = {
  sequelize
}