const { hashPassword } = require('../auth/bcrypt');
const { Sequelize, DataTypes } = require('sequelize');
const ViewType = require('../common/ViewType');
const RoleType = require('../common/RoleType');
const PaymentTermType = require('../common/PaymentTermType');
const PurchaseOrderStatusType = require('../common/PurchaseOrderStatusType');
const LeaveTypeEnum = require('../common/LeaveTypeEnum');
const LeaveStatusEnum = require('../common/LeaveStatusEnum');
const ProductCategoryEnum = require('../common/ProductCategory');
const PaymentMethodType = require('../common/PaymentMethodType');
const AccountingTypeEnum = require('../common/AccountingTypeEnum');
const MovementTypeEnum = require('../common/MovementTypeEnum');
const ExpensesTypeEnum = require('../common/ExpensesTypeEnum');
const { insertDemoData } = require('../demo');
const DeliveryStatusEnum = require('../common/DeliveryStatusEnum');

const sequelize = new Sequelize(process.env.PGDATABASE, process.env.PGUSER, process.env.PGPASSWORD, {
  host: process.env.PGHOST,
  dialect: 'postgres',
  port: 5432,
  logging: false,
  dialectOptions: {
    useUTC: false
  },
  timezone: '+08:00'
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
      const { Customer, ChargedUnder } = require('../models/Customer');
      const { LeaveType, LeaveAccount, STANDARD_LEAVE_ACCOUNTS } = require('../models/LeaveAccount');
      const { LeaveStatus } = require('../models/LeaveApplication');
      const { ProductCategory } = require('../models/Product');
      const { DeliveryStatus } = require('../models/DeliveryOrder');

      await View.bulkCreate(Object.keys(ViewType).map(key => ViewType[key]));
      await Role.bulkCreate(Object.keys(RoleType).map(key => RoleType[key]));
      await LeaveType.bulkCreate(Object.keys(LeaveTypeEnum).map(key => LeaveTypeEnum[key]));
      await LeaveStatus.bulkCreate(Object.keys(LeaveStatusEnum).map(key => LeaveStatusEnum[key]));
      await ProductCategory.bulkCreate(Object.keys(ProductCategoryEnum).map(key => ProductCategoryEnum[key]));
      await DeliveryStatus.bulkCreate(Object.keys(DeliveryStatusEnum).map(key => DeliveryStatusEnum[key]));

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

      const { PurchaseOrder, PaymentTerm, POStatus, PurchaseOrderItem } = require('../models/PurchaseOrder');
      const { SalesOrder, SalesOrderItem } = require('../models/SalesOrder');

      await PaymentTerm.bulkCreate(Object.keys(PaymentTermType).map(key => PaymentTermType[key]));
      await POStatus.bulkCreate(Object.keys(PurchaseOrderStatusType).map(key => PurchaseOrderStatusType[key]));

      const heng = await Supplier.findOne({ where: { company_name: "Heng Heng" } });
      await PurchaseOrder.bulkCreate([
        { payment_term_id: 2, purchase_order_status_id: 2, supplier_id: heng.id },
      ]); 

      const ikanBilis = await Product.findOne({ where: { name: "Ikan Bilis" } });
      await PurchaseOrderItem.bulkCreate([
        { unit_cost: 1,  quantity: 20, purchase_order_id: 1, product_id: ikanBilis.id }
      ]); 
 
      const { Payment, PaymentMethod, AccountingType } = require('../models/Payment');
      await PaymentMethod.bulkCreate(Object.keys(PaymentMethodType).map(key => PaymentMethodType[key]));
      await AccountingType.bulkCreate(Object.keys(AccountingTypeEnum).map(key => AccountingTypeEnum[key]));

      const { MovementType } = require('../models/MovementType');
      await MovementType.bulkCreate(Object.keys(MovementTypeEnum).map(key => MovementTypeEnum[key]));
      
       await Payment.bulkCreate([
        { amount: 100, purchase_order_id: 1, accounting_type_id: 1, movement_type_id:1 },
        { amount: -50, purchase_order_id: 1, payment_method_id:1, accounting_type_id: 1, movement_type_id:1 },
      ]); 
      await ChargedUnder.bulkCreate([
        { 
          name: "CCB", 
          address: "Blk 14 Pasir Panjang Wholesale Centre #01-37, Singapore 110014 ", 
          shipping_address: "Blk 14 Pasir Panjang Wholesale Centre #01-37, Singapore 110014 ", 
          contact_number: "6779 0003 / 6776 6505 / 9776 3737 / 9826 1304 (Whatsapp)", 
          registration_number: "53138053W", 
          gst_rate: 7 
        },
        { 
          name: "CBFS", 
          address: "Blk 14 Pasir Panjang Wholesale Centre #01-37, Singapore 110014 ", 
          shipping_address: "Blk 14 Pasir Panjang Wholesale Centre #01-37, Singapore 110014 ", 
          contact_number: "6779 0003 / 6776 6505 / 9776 3737 / 9826 1304 (Whatsapp)", 
          registration_number: "", 
          gst_rate: 0 
        },
      ]);
      
      const employees = await Employee.bulkCreate([
        { name: "Admin", username: "admin", password: await hashPassword('password'), email: "admin@gmail.com", role_id: RoleType.ADMIN.id, leave_accounts: STANDARD_LEAVE_ACCOUNTS },
        { name: "Alice", username: "alice", password: await hashPassword('password'), email: "alice@gmail.com", role_id: RoleType.STAFF.id, leave_accounts: STANDARD_LEAVE_ACCOUNTS },
      ], { include: LeaveAccount })

      // Give view access to all views for Alice
      await AccessRight.bulkCreate(Object.keys(ViewType).map(key => ({ employee_id: employees[1].id, view_id: ViewType[key].id, has_write_access: false })))

      const { InventoryMovement } = require('../models/InventoryMovement');
      const lineItem = await PurchaseOrderItem.findOne({ where: { product_id: ikanBilis.id } });
      await InventoryMovement.bulkCreate([
        { unit_cost: 1, quantity: 20, purchase_order_item_id: lineItem.id, movement_type_id: 1 },
        { unit_cost: 2, quantity: 70, purchase_order_item_id: lineItem.id, movement_type_id: 1 },
        { unit_cost: 1, quantity: -30, purchase_order_item_id: lineItem.id, movement_type_id: 2 }
      ]); 
      const { GUEST_ID } = require('../models/Supplier');
      await Supplier.create({ id: GUEST_ID, company_name: 'Guest', s1_name: 'Guest', s1_phone_number: 'NA', address: 'NA', postal_code: 'NA' });
    
      //>>> For analytics - Supplier ['company_name', 's1_name', 's1_phone_number', 'address', 'postal_code']
      await Supplier.bulkCreate([
        { company_name: 'supplier1', s1_name: 'supplier1', s1_phone_number: 'NA', address: 'NA', postal_code: 'NA', created_at: '2021-01-10' },
        { company_name: 'supplier2', s1_name: 'supplier2', s1_phone_number: 'NA', address: 'NA', postal_code: 'NA', created_at: '2021-01-10' },
        { company_name: 'supplier3', s1_name: 'supplier3', s1_phone_number: 'NA', address: 'NA', postal_code: 'NA', created_at: '2021-01-09' },
        { company_name: 'supplier4', s1_name: 'supplier4', s1_phone_number: 'NA', address: 'NA', postal_code: 'NA', created_at: '2021-01-09' },
        { company_name: 'supplier5', s1_name: 'supplier5', s1_phone_number: 'NA', address: 'NA', postal_code: 'NA', created_at: '2021-01-08' },
        { company_name: 'supplier6', s1_name: 'supplier6', s1_phone_number: 'NA', address: 'NA', postal_code: 'NA', created_at: '2021-01-08' },
        { company_name: 'supplier7', s1_name: 'supplier7', s1_phone_number: 'NA', address: 'NA', postal_code: 'NA', created_at: '2021-01-07' },
        { company_name: 'supplier8', s1_name: 'supplier8', s1_phone_number: 'NA', address: 'NA', postal_code: 'NA', created_at: '2021-01-07' },
        { company_name: 'supplier9', s1_name: 'supplier9', s1_phone_number: 'NA', address: 'NA', postal_code: 'NA', created_at: '2021-01-06' },
        { company_name: 'supplier10', s1_name: 'supplier10', s1_phone_number: 'NA', address: 'NA', postal_code: 'NA', created_at: '2021-01-06' },
        { company_name: 'supplier11', s1_name: 'supplier11', s1_phone_number: 'NA', address: 'NA', postal_code: 'NA', created_at: '2021-01-05' },
        { company_name: 'supplier12', s1_name: 'supplier12', s1_phone_number: 'NA', address: 'NA', postal_code: 'NA', created_at: '2021-01-05' },
        { company_name: 'supplier13', s1_name: 'supplier13', s1_phone_number: 'NA', address: 'NA', postal_code: 'NA', created_at: '2021-01-04' },
        { company_name: 'supplier14', s1_name: 'supplier14', s1_phone_number: 'NA', address: 'NA', postal_code: 'NA', created_at: '2021-01-04' },
        { company_name: 'supplier15', s1_name: 'supplier15', s1_phone_number: 'NA', address: 'NA', postal_code: 'NA', created_at: '2021-01-03' },
        { company_name: 'supplier16', s1_name: 'supplier16', s1_phone_number: 'NA', address: 'NA', postal_code: 'NA', created_at: '2021-01-03' },
        { company_name: 'supplier17', s1_name: 'supplier17', s1_phone_number: 'NA', address: 'NA', postal_code: 'NA', created_at: '2021-01-02' },
        { company_name: 'supplier18', s1_name: 'supplier18', s1_phone_number: 'NA', address: 'NA', postal_code: 'NA', created_at: '2021-01-02' },
        { company_name: 'supplier19', s1_name: 'supplier19', s1_phone_number: 'NA', address: 'NA', postal_code: 'NA', created_at: '2021-01-01' },
        { company_name: 'supplier20', s1_name: 'supplier20', s1_phone_number: 'NA', address: 'NA', postal_code: 'NA', created_at: '2021-01-01'}
      ]); 

      const supplier1 = await Supplier.findOne({ where: { company_name: "supplier1" } });
      const supplier2 = await Supplier.findOne({ where: { company_name: "supplier2" } });
      const supplier3 = await Supplier.findOne({ where: { company_name: "supplier3" } });
      const supplier4 = await Supplier.findOne({ where: { company_name: "supplier4" } });
      const supplier5 = await Supplier.findOne({ where: { company_name: "supplier5" } });
      const supplier6 = await Supplier.findOne({ where: { company_name: "supplier6" } });
      const supplier7 = await Supplier.findOne({ where: { company_name: "supplier7" } });
      const supplier8 = await Supplier.findOne({ where: { company_name: "supplier8" } });
      const supplier9 = await Supplier.findOne({ where: { company_name: "supplier9" } });
      const supplier10 = await Supplier.findOne({ where: { company_name: "supplier10" } });
      const supplier11 = await Supplier.findOne({ where: { company_name: "supplier11" } });
      const supplier12 = await Supplier.findOne({ where: { company_name: "supplier12" } });
      const supplier13 = await Supplier.findOne({ where: { company_name: "supplier13" } });
      const supplier14 = await Supplier.findOne({ where: { company_name: "supplier14" } });
      const supplier15 = await Supplier.findOne({ where: { company_name: "supplier15" } });
      const supplier16 = await Supplier.findOne({ where: { company_name: "supplier16" } });
      const supplier17 = await Supplier.findOne({ where: { company_name: "supplier17" } });
      const supplier18 = await Supplier.findOne({ where: { company_name: "supplier18" } });
      const supplier19 = await Supplier.findOne({ where: { company_name: "supplier19" } });
      const supplier20 = await Supplier.findOne({ where: { company_name: "supplier20" } });
      

    //For analytics - Customer ['id', 'company_name', 'p1_name', 'p1_phone_number', 'address', 'postal_code', 'charged_under_id', 'gst', 'gst_show']  
   
    const ccb = await ChargedUnder.findOne({ where: { name : 'CCB'} });
    const cbfs = await ChargedUnder.findOne({ where: { name : 'CBFS'} });
    await Customer.bulkCreate([
      { company_name : 'customer1', p1_name: 'customer1', p1_phone_number: 'NA' ,address: 'NA', postal_code: 'NA', 'charged_under_id': ccb.id, gst: true, gst_show: true , created_at: '2021-01-10'},
      { company_name : 'customer2', p1_name: 'customer2', p1_phone_number: 'NA', address: 'NA', postal_code: 'NA', 'charged_under_id': ccb.id, gst: true, gst_show: true, created_at: '2021-01-10' },
      { company_name : 'customer3', p1_name: 'customer3', p1_phone_number: 'NA', address: 'NA', postal_code: 'NA', 'charged_under_id': ccb.id, gst: true, gst_show: false, created_at: '2021-01-09' },
      { company_name : 'customer4', p1_name: 'customer4', p1_phone_number: 'NA', address: 'NA', postal_code: 'NA', 'charged_under_id': ccb.id, gst: true, gst_show: false, created_at: '2021-01-09' },
      { company_name : 'customer5', p1_name: 'customer5', p1_phone_number: 'NA', address: 'NA', postal_code: 'NA', 'charged_under_id': ccb.id, gst: false, gst_show: true , created_at: '2021-01-08'},
      { company_name : 'customer6', p1_name: 'customer6', p1_phone_number: 'NA', address: 'NA', postal_code: 'NA', 'charged_under_id': ccb.id, gst: false, gst_show: true , created_at: '2021-01-08'},
      { company_name : 'customer7', p1_name: 'customer7', p1_phone_number: 'NA', address: 'NA', postal_code: 'NA', 'charged_under_id': ccb.id, gst: false, gst_show: true , created_at: '2021-01-07'},
      { company_name : 'customer8', p1_name: 'customer8', p1_phone_number: 'NA', address: 'NA', postal_code: 'NA', 'charged_under_id': ccb.id, gst: false, gst_show: false , created_at: '2021-01-07'},
      { company_name : 'customer9', p1_name: 'customer9', p1_phone_number: 'NA', address: 'NA', postal_code: 'NA', 'charged_under_id': ccb.id, gst: false, gst_show: false, created_at: '2021-01-06' },
      { company_name : 'customer10', p1_name: 'customer10', p1_phone_number: 'NA', address: 'NA', postal_code: 'NA', 'charged_under_id': cbfs.id, gst: true, gst_show: true , created_at: '2021-01-06'},
      { company_name : 'customer11', p1_name: 'customer11', p1_phone_number: 'NA', address: 'NA', postal_code: 'NA', 'charged_under_id': cbfs.id, gst: true, gst_show: true, created_at: '2021-01-05' },
      { company_name : 'customer12', p1_name: 'customer12', p1_phone_number: 'NA', address: 'NA', postal_code: 'NA', 'charged_under_id': cbfs.id, gst: true, gst_show: false, created_at: '2021-01-05' },
      { company_name : 'customer13', p1_name: 'customer13', p1_phone_number: 'NA', address: 'NA', postal_code: 'NA', 'charged_under_id': cbfs.id, gst: true, gst_show: false, created_at: '2021-01-04' },
      { company_name : 'customer14', p1_name: 'customer14', p1_phone_number: 'NA', address: 'NA', postal_code: 'NA', 'charged_under_id': cbfs.id, gst: true, gst_show: false, created_at: '2021-01-04' },
      { company_name : 'customer15', p1_name: 'customer15', p1_phone_number: 'NA', address: 'NA', postal_code: 'NA', 'charged_under_id': cbfs.id, gst: false, gst_show: true, created_at: '2021-01-03' },
      { company_name : 'customer16', p1_name: 'customer16', p1_phone_number: 'NA', address: 'NA', postal_code: 'NA', 'charged_under_id': cbfs.id, gst: false, gst_show: true, created_at: '2021-01-03' },
      { company_name : 'customer17', p1_name: 'customer17', p1_phone_number: 'NA', address: 'NA', postal_code: 'NA', 'charged_under_id': cbfs.id, gst: false, gst_show: true , created_at: '2021-01-02'},
      { company_name : 'customer18', p1_name: 'customer18', p1_phone_number: 'NA', address: 'NA', postal_code: 'NA', 'charged_under_id': cbfs.id, gst: false, gst_show: false, created_at: '2021-01-02' },
      { company_name : 'customer19', p1_name: 'customer19', p1_phone_number: 'NA', address: 'NA', postal_code: 'NA', 'charged_under_id': cbfs.id, gst: false, gst_show: false , created_at: '2021-01-01'},
      { company_name : 'customer20', p1_name: 'customer20', p1_phone_number: 'NA', address: 'NA', postal_code: 'NA', 'charged_under_id': cbfs.id, gst: false, gst_show: false, created_at: '2021-01-01' }
    ]);
      

    const customer1 = await Customer.findOne({ where: { company_name: "customer1" } });
    const customer2 = await Customer.findOne({ where: { company_name: "customer2" } });
    const customer3 = await Customer.findOne({ where: { company_name: "customer3" } });
    const customer4 = await Customer.findOne({ where: { company_name: "customer4" } });
    const customer5 = await Customer.findOne({ where: { company_name: "customer5" } });
    const customer6 = await Customer.findOne({ where: { company_name: "customer6" } });
    const customer7 = await Customer.findOne({ where: { company_name: "customer7" } });
    const customer8 = await Customer.findOne({ where: { company_name: "customer8" } });
    const customer9 = await Customer.findOne({ where: { company_name: "customer9" } });
    const customer10 = await Customer.findOne({ where: { company_name: "customer10" } });
    const customer11 = await Customer.findOne({ where: { company_name: "customer11" } });
    const customer12 = await Customer.findOne({ where: { company_name: "customer12" } });
    const customer13 = await Customer.findOne({ where: { company_name: "customer13" } });
    const customer14 = await Customer.findOne({ where: { company_name: "customer14" } });
    const customer15 = await Customer.findOne({ where: { company_name: "customer15" } });
    const customer16 = await Customer.findOne({ where: { company_name: "customer16" } });
    const customer17 = await Customer.findOne({ where: { company_name: "customer17" } });
    const customer18 = await Customer.findOne({ where: { company_name: "customer18" } });
    const customer19 = await Customer.findOne({ where: { company_name: "customer19" } });
    const customer20 = await Customer.findOne({ where: { company_name: "customer20" } });

      //Analytics - Products
      await Product.bulkCreate([
        { name: "product1", min_inventory_level: 1000, unit: "litres", created_at: '2021-01-01' },
        { name: "product2", min_inventory_level: 1500, unit: "bottles", created_at: '2021-01-01' },
        { name: "product3", min_inventory_level: 1800, unit: "containers", created_at: '2021-01-01' },
        { name: "product4", min_inventory_level: 2000, unit: "boxes", created_at: '2021-01-01' },
        { name: "product5", min_inventory_level: 2200, unit: "bottles" , created_at: '2021-01-01'},
        { name: "product6", min_inventory_level: 2500, unit: "containers" , created_at: '2021-01-01'},
        {name: "product7", min_inventory_level: 2800, unit: "bottles" , created_at: '2021-01-01'},
        { name: "product8", min_inventory_level: 2900, unit: "containers" , created_at: '2021-01-01'},
        { name: "product9", min_inventory_level: 3000, unit: "litres", created_at: '2021-01-01' },
        { name: "product10", min_inventory_level: 1200, unit: "litres" , created_at: '2021-01-01'}
      ]);

      const product1 = await Product.findOne({ where: { name: "product1" } });
      const product2 = await Product.findOne({ where: { name: "product2" } });
      const product3 = await Product.findOne({ where: { name: "product3" } });
      const product4 = await Product.findOne({ where: { name: "product4" } });
      const product5 = await Product.findOne({ where: { name: "product5" } });
      const product6 = await Product.findOne({ where: { name: "product6" } });
      const product7 = await Product.findOne({ where: { name: "product7" } });
      const product8 = await Product.findOne({ where: { name: "product8" } });
      const product9 = await Product.findOne({ where: { name: "product9" } });
      const product10 = await Product.findOne({ where: { name: "product10" } });
      

      // Analytics - Purchase Order
      await PurchaseOrder.bulkCreate([
        { payment_term_id: 2, purchase_order_status_id: 2, supplier_id: supplier1.id, created_at: '2021-01-01' , gst_rate: 7, offset: 2 , charged_under_id : ccb.id}, // credit payment term
        { payment_term_id: 2, purchase_order_status_id: 2, supplier_id: supplier1.id, created_at: '2021-01-01' , gst_rate: 7, offset: 2 , charged_under_id : ccb.id},
        { payment_term_id: 2, purchase_order_status_id: 2, supplier_id: supplier2.id, created_at: '2021-02-01', gst_rate: 0, offset: 2  },
        { payment_term_id: 2, purchase_order_status_id: 2, supplier_id: supplier2.id, created_at: '2021-02-01', gst_rate: 7, offset: 0  },
        { payment_term_id: 2, purchase_order_status_id: 2, supplier_id: supplier3.id, created_at: '2021-03-01', gst_rate: 7, offset: 2  },
        { payment_term_id: 2, purchase_order_status_id: 2, supplier_id: supplier3.id, created_at: '2021-03-01', gst_rate: 0, offset: 2 },
        { payment_term_id: 2, purchase_order_status_id: 2, supplier_id: supplier4.id, created_at: '2021-04-01' , gst_rate: 7, offset: 2 },
        { payment_term_id: 2, purchase_order_status_id: 2, supplier_id: supplier4.id, created_at: '2021-04-01', gst_rate: 7, offset: 0  },
        { payment_term_id: 2, purchase_order_status_id: 2, supplier_id: supplier5.id, created_at: '2021-05-01' , gst_rate: 7, offset: 2 },
        { payment_term_id: 2, purchase_order_status_id: 2, supplier_id: supplier5.id, created_at: '2021-05-01', gst_rate: 0, offset: 2  },
        { payment_term_id: 2, purchase_order_status_id: 2, supplier_id: supplier6.id, created_at: '2021-06-01', gst_rate: 7, offset: 2  },
        { payment_term_id: 2, purchase_order_status_id: 2, supplier_id: supplier6.id, created_at: '2021-06-01', gst_rate: 0, offset: 0  },
        { payment_term_id: 2, purchase_order_status_id: 2, supplier_id: supplier7.id, created_at: '2021-07-01' , gst_rate: 7, offset: 2 },
        { payment_term_id: 2, purchase_order_status_id: 2, supplier_id: supplier7.id, created_at: '2021-07-01' , gst_rate: 7, offset: 2 },
        { payment_term_id: 2, purchase_order_status_id: 2, supplier_id: supplier8.id, created_at: '2021-08-01' , gst_rate: 11, offset: 0 },
        { payment_term_id: 2, purchase_order_status_id: 2, supplier_id: supplier8.id, created_at: '2021-08-01' , gst_rate: 7, offset: 2 },
        { payment_term_id: 2, purchase_order_status_id: 2, supplier_id: supplier9.id, created_at: '2021-09-01' , gst_rate: 7, offset: 0 },
        { payment_term_id: 2, purchase_order_status_id: 2, supplier_id: supplier9.id, created_at: '2021-09-01' , gst_rate: 7, offset: 2 },
        { payment_term_id: 2, purchase_order_status_id: 2, supplier_id: supplier10.id, created_at: '2021-10-01' , gst_rate: 7, offset: 2 },
        { payment_term_id: 2, purchase_order_status_id: 2, supplier_id: supplier10.id, created_at: '2021-10-01' , gst_rate: 7, offset: 0 },
        { payment_term_id: 2, purchase_order_status_id: 2, supplier_id: supplier11.id, created_at: '2021-11-01' , gst_rate: 7, offset: 2 },
        { payment_term_id: 2, purchase_order_status_id: 2, supplier_id: supplier11.id, created_at: '2021-11-01' , gst_rate: 7, offset: 2 },
        { payment_term_id: 2, purchase_order_status_id: 2, supplier_id: supplier12.id, created_at: '2021-12-01', gst_rate: 7, offset: 2  },
        { payment_term_id: 2, purchase_order_status_id: 2, supplier_id: supplier12.id, created_at: '2021-12-01' , gst_rate: 7, offset: 2 },
        { payment_term_id: 2, purchase_order_status_id: 2, supplier_id: supplier13.id, created_at: '2021-01-01' , gst_rate: 7, offset: 2 },
        { payment_term_id: 2, purchase_order_status_id: 2, supplier_id: supplier13.id, created_at: '2021-01-01' , gst_rate: 7, offset: 2 },
        { payment_term_id: 2, purchase_order_status_id: 2, supplier_id: supplier14.id, created_at: '2021-02-01' , gst_rate: 7, offset: 2 },
        { payment_term_id: 2, purchase_order_status_id: 2, supplier_id: supplier14.id, created_at: '2021-02-01' , gst_rate: 7, offset: 2 },
        { payment_term_id: 2, purchase_order_status_id: 2, supplier_id: supplier15.id, created_at: '2021-03-01', gst_rate: 7, offset: 2  },
        { payment_term_id: 2, purchase_order_status_id: 2, supplier_id: supplier15.id, created_at: '2021-03-01' , gst_rate: 7, offset: 2 },
        { payment_term_id: 1, purchase_order_status_id: 2, supplier_id: supplier16.id, created_at: '2021-04-01' , gst_rate: 7, offset: 2 }, //cash payment term for supplier 16 to 20, PO no 16 to 20  
        { payment_term_id: 1, purchase_order_status_id: 2, supplier_id: supplier16.id, created_at: '2021-04-01' , gst_rate: 7, offset: 2 },
        { payment_term_id: 1, purchase_order_status_id: 2, supplier_id: supplier17.id, created_at: '2021-05-01' , gst_rate: 7, offset: 2 },
        { payment_term_id: 1, purchase_order_status_id: 2, supplier_id: supplier17.id, created_at: '2021-05-01' , gst_rate: 7, offset: 2 },
        { payment_term_id: 1, purchase_order_status_id: 2, supplier_id: supplier18.id, created_at: '2021-06-01' , gst_rate: 7, offset: 2 },
        { payment_term_id: 1, purchase_order_status_id: 2, supplier_id: supplier18.id, created_at: '2021-06-01' , gst_rate: 7, offset: 2 },
        { payment_term_id: 1, purchase_order_status_id: 2, supplier_id: supplier19.id, created_at: '2021-07-01' , gst_rate: 7, offset: 2 },
        { payment_term_id: 1, purchase_order_status_id: 2, supplier_id: supplier19.id, created_at: '2021-07-01' , gst_rate: 7, offset: 2 },
        { payment_term_id: 1, purchase_order_status_id: 2, supplier_id: supplier20.id, created_at: '2021-08-01' , gst_rate: 7, offset: 2 },
        { payment_term_id: 1, purchase_order_status_id: 2, supplier_id: supplier20.id, created_at: '2021-08-01' , gst_rate: 11, offset: 0 }
      ]); 

      await PurchaseOrderItem.bulkCreate([
        { unit_cost: 1.1,  quantity: 10 , purchase_order_id: 1, product_id: product1.id, created_at: '2021-01-01' }, //quantity = product id * 10, unit_cost = product id
        { unit_cost: 2.1,  quantity: 10 , purchase_order_id: 1, product_id: product2.id, created_at: '2021-01-01' }, //purchase months = purchase_order_id 
        { unit_cost: 3.5,  quantity: 20 , purchase_order_id: 2, product_id: product3.id, created_at: '2021-02-01' },
        { unit_cost: 4.5,  quantity: 20 , purchase_order_id: 2, product_id: product4.id, created_at: '2021-02-01'}, 
        { unit_cost: 5.9,  quantity: 30 , purchase_order_id: 3, product_id: product5.id, created_at: '2021-03-01' }, 
        { unit_cost: 6.2,  quantity: 30 , purchase_order_id: 3, product_id: product6.id, created_at: '2021-03-01' },
        { unit_cost: 7.2,  quantity: 40 , purchase_order_id: 4, product_id: product7.id, created_at: '2021-04-01'},
        { unit_cost: 8.5,  quantity: 40 , purchase_order_id: 4, product_id: product8.id, created_at: '2021-04-01' },
        { unit_cost: 9.2,  quantity: 50 , purchase_order_id: 5, product_id: product9.id, created_at: '2021-05-01' },
        { unit_cost: 0.9,  quantity: 50 , purchase_order_id: 5, product_id: product1.id, created_at: '2021-05-01' },
        { unit_cost: 2.5,  quantity: 60 , purchase_order_id: 6, product_id: product2.id, created_at: '2021-06-01' },
        { unit_cost: 3.1,  quantity: 60 , purchase_order_id: 6, product_id: product3.id, created_at: '2021-06-01' },
        { unit_cost: 4.2,  quantity: 70 , purchase_order_id: 7, product_id: product4.id, created_at: '2021-07-01' },
        { unit_cost: 5.2,  quantity: 70 , purchase_order_id: 7, product_id: product5.id, created_at: '2021-07-01' },
        { unit_cost: 6.3,  quantity: 80 , purchase_order_id: 8, product_id: product6.id, created_at: '2021-08-01' },
        { unit_cost: 7.2,  quantity: 80 , purchase_order_id: 8, product_id: product7.id, created_at: '2021-08-01' },
        { unit_cost: 8.5,  quantity: 90 , purchase_order_id: 9, product_id: product8.id, created_at: '2021-09-01' },
        { unit_cost: 9.5,  quantity: 90 , purchase_order_id: 9, product_id: product9.id, created_at: '2021-09-01' },
        { unit_cost: 10.2,  quantity: 100 , purchase_order_id: 10, product_id: product10.id, created_at: '2021-10-01' },
        { unit_cost: 1.2,  quantity: 100 , purchase_order_id: 10, product_id: product1.id, created_at: '2021-10-01' },
        { unit_cost: 2.5,  quantity: 110 , purchase_order_id: 11, product_id: product2.id, created_at: '2021-11-01' },
        { unit_cost: 3.5,  quantity: 110 , purchase_order_id: 11, product_id: product3.id, created_at: '2021-11-01' },
        { unit_cost: 4.1,  quantity: 120 , purchase_order_id: 12, product_id: product4.id, created_at: '2021-12-01' },
        { unit_cost: 5.8,  quantity: 120 , purchase_order_id: 12, product_id: product5.id, created_at: '2021-12-01' },
        { unit_cost: 6.2,  quantity: 130 , purchase_order_id: 13, product_id: product6.id, created_at: '2021-01-01' },
        { unit_cost: 7.6,  quantity: 130 , purchase_order_id: 13, product_id: product7.id, created_at: '2021-01-01' },
        { unit_cost: 8.5,  quantity: 140 , purchase_order_id: 14, product_id: product8.id, created_at: '2021-02-01' },
        { unit_cost: 9.2,  quantity: 140 , purchase_order_id: 14, product_id: product9.id, created_at: '2021-02-01' },
        { unit_cost: 10.5,  quantity: 150 , purchase_order_id: 15, product_id: product10.id, created_at: '2021-03-01' },
        { unit_cost: 1.1,  quantity: 150 , purchase_order_id: 15, product_id: product1.id, created_at: '2021-03-01' },
        { unit_cost: 2.1,  quantity: 160 , purchase_order_id: 16, product_id: product2.id, created_at: '2021-04-01' },
        { unit_cost: 3.5,  quantity: 160 , purchase_order_id: 16, product_id: product3.id, created_at: '2021-04-01' },
        { unit_cost: 4.5,  quantity: 170 , purchase_order_id: 17, product_id: product4.id, created_at: '2021-05-01' },
        { unit_cost: 5.2,  quantity: 170 , purchase_order_id: 17, product_id: product5.id, created_at: '2021-05-01' },
        { unit_cost: 6.2,  quantity: 180 , purchase_order_id: 18, product_id: product6.id, created_at: '2021-06-01' },
        { unit_cost: 7.2,  quantity: 180 , purchase_order_id: 18, product_id: product7.id, created_at: '2021-06-01' },
        { unit_cost: 8.5,  quantity: 190 , purchase_order_id: 19, product_id: product8.id, created_at: '2021-07-01' },
        { unit_cost: 9.2,  quantity: 190 , purchase_order_id: 19, product_id: product9.id, created_at: '2021-07-01' },
        { unit_cost: 10.2,  quantity: 200 , purchase_order_id: 20, product_id: product10.id, created_at: '2021-08-01' },
        { unit_cost: 1.5,  quantity: 200 , purchase_order_id: 20, product_id: product1.id, created_at: '2021-08-01' },
      ]); 

      const po1a = await PurchaseOrderItem.findOne({ where: {  unit_cost: 1.1,  quantity: 10 , purchase_order_id: 1, product_id: product1.id  } });
      const po1b = await PurchaseOrderItem.findOne({ where: {  unit_cost: 2.1,  quantity: 10 , purchase_order_id: 1, product_id: product2.id   } });
      const po2a = await PurchaseOrderItem.findOne({ where: {  unit_cost: 3.5,  quantity: 20 , purchase_order_id: 2, product_id: product3.id   } });
      const po2b = await PurchaseOrderItem.findOne({ where: {  unit_cost: 4.5,  quantity: 20 , purchase_order_id: 2, product_id: product4.id   } });
      const po3a = await PurchaseOrderItem.findOne({ where: {  unit_cost: 5.9,  quantity: 30 , purchase_order_id: 3, product_id: product5.id   } });
      const po3b = await PurchaseOrderItem.findOne({ where: {  unit_cost: 6.2,  quantity: 30 , purchase_order_id: 3, product_id: product6.id   } });
      const po4a = await PurchaseOrderItem.findOne({ where: {  unit_cost: 7.2,  quantity: 40 , purchase_order_id: 4, product_id: product7.id   } });
      const po4b = await PurchaseOrderItem.findOne({ where: {  unit_cost: 8.5,  quantity: 40 , purchase_order_id: 4, product_id: product8.id    } });
      const po5a = await PurchaseOrderItem.findOne({ where: {  unit_cost: 9.2,  quantity: 50 , purchase_order_id: 5, product_id: product9.id   } });
      const po5b = await PurchaseOrderItem.findOne({ where: {  unit_cost: 0.9,  quantity: 50 , purchase_order_id: 5, product_id: product1.id   } });
      const po6a = await PurchaseOrderItem.findOne({ where: {  unit_cost: 0.9,  quantity: 50 , purchase_order_id: 5, product_id: product1.id   } });
      const po6b = await PurchaseOrderItem.findOne({ where: {  unit_cost: 3.1,  quantity: 60 , purchase_order_id: 6, product_id: product3.id   } });
      const po7a = await PurchaseOrderItem.findOne({ where: {  unit_cost: 4.2,  quantity: 70 , purchase_order_id: 7, product_id: product4.id   } });
      const po7b = await PurchaseOrderItem.findOne({ where: {  unit_cost: 5.2,  quantity: 70 , purchase_order_id: 7, product_id: product5.id  } });
      const po8a = await PurchaseOrderItem.findOne({ where: {  unit_cost: 6.3,  quantity: 80 , purchase_order_id: 8, product_id: product6.id  } });
      const po8b = await PurchaseOrderItem.findOne({ where: {  unit_cost: 7.2,  quantity: 80 , purchase_order_id: 8, product_id: product7.id   } });
      const po9a = await PurchaseOrderItem.findOne({ where: {  unit_cost: 8.5,  quantity: 90 , purchase_order_id: 9, product_id: product8.id   } });
      const po9b = await PurchaseOrderItem.findOne({ where: {  unit_cost: 9.5,  quantity: 90 , purchase_order_id: 9, product_id: product9.id   } });
      const po10a = await PurchaseOrderItem.findOne({ where: {  unit_cost: 10.2,  quantity: 100 , purchase_order_id: 10, product_id: product10.id  } });
      const po10b = await PurchaseOrderItem.findOne({ where: {  unit_cost: 1.2,  quantity: 100 , purchase_order_id: 10, product_id: product1.id  } });
      const po11a = await PurchaseOrderItem.findOne({ where: {  unit_cost: 2.5,  quantity: 110 , purchase_order_id: 11, product_id: product2.id  } });
      const po11b = await PurchaseOrderItem.findOne({ where: {  unit_cost: 3.5,  quantity: 110 , purchase_order_id: 11, product_id: product3.id   } });
      const po12a = await PurchaseOrderItem.findOne({ where: {  unit_cost: 4.1,  quantity: 120 , purchase_order_id: 12, product_id: product4.id    } });
      const po12b = await PurchaseOrderItem.findOne({ where: {  unit_cost: 5.8,  quantity: 120 , purchase_order_id: 12, product_id: product5.id  } });
      const po13a = await PurchaseOrderItem.findOne({ where: {  unit_cost: 6.2,  quantity: 130 , purchase_order_id: 13, product_id: product6.id   } });
      const po13b = await PurchaseOrderItem.findOne({ where: {  unit_cost: 7.6,  quantity: 130 , purchase_order_id: 13, product_id: product7.id   } });
      const po14a = await PurchaseOrderItem.findOne({ where: {  unit_cost: 8.5,  quantity: 140 , purchase_order_id: 14, product_id: product8.id    } });
      const po14b = await PurchaseOrderItem.findOne({ where: {  unit_cost: 9.2,  quantity: 140 , purchase_order_id: 14, product_id: product9.id   } });
      const po15a = await PurchaseOrderItem.findOne({ where: {  unit_cost: 10.5,  quantity: 150 , purchase_order_id: 15, product_id: product10.id   } });
      const po15b = await PurchaseOrderItem.findOne({ where: {  unit_cost: 1.1,  quantity: 150 , purchase_order_id: 15, product_id: product1.id   } });
      const po16a = await PurchaseOrderItem.findOne({ where: {  unit_cost: 2.1,  quantity: 160 , purchase_order_id: 16, product_id: product2.id    } });
      const po16b = await PurchaseOrderItem.findOne({ where: { unit_cost: 3.5,  quantity: 160 , purchase_order_id: 16, product_id: product3.id  } });
      const po17a = await PurchaseOrderItem.findOne({ where: { unit_cost: 4.5,  quantity: 170 , purchase_order_id: 17, product_id: product4.id    } });
      const po17b = await PurchaseOrderItem.findOne({ where: { unit_cost: 5.2,  quantity: 170 , purchase_order_id: 17, product_id: product5.id    } });
      const po18a = await PurchaseOrderItem.findOne({ where: { unit_cost: 6.2,  quantity: 180 , purchase_order_id: 18, product_id: product6.id    } });
      const po18b = await PurchaseOrderItem.findOne({ where: { unit_cost: 7.2,  quantity: 180 , purchase_order_id: 18, product_id: product7.id    } });
      const po19a = await PurchaseOrderItem.findOne({ where: { unit_cost: 8.5,  quantity: 190 , purchase_order_id: 19, product_id: product8.id    } });
      const po19b = await PurchaseOrderItem.findOne({ where: { unit_cost: 9.2,  quantity: 190 , purchase_order_id: 19, product_id: product9.id    } });
      const po20a = await PurchaseOrderItem.findOne({ where: { unit_cost: 10.2,  quantity: 200 , purchase_order_id: 20, product_id: product10.id     } });
      const po20b = await PurchaseOrderItem.findOne({ where: { unit_cost: 1.5,  quantity: 200 , purchase_order_id: 20, product_id: product1.id    } });



      //Payment for each of the PO
      await Payment.bulkCreate([
        { amount: 22, purchase_order_id: 1, accounting_type_id: 1, movement_type_id: 1, created_at: '2021-01-01'},
        { amount: -10, purchase_order_id: 1, payment_method_id:1, accounting_type_id: 1, movement_type_id:1 , created_at: '2021-01-02'}, //double payment for PO1 to PO10
        { amount: -2, purchase_order_id: 1, payment_method_id:1, accounting_type_id: 1, movement_type_id:1 , created_at: '2021-01-03'},  //1 day apart

        { amount: 160, purchase_order_id: 2, accounting_type_id: 1, movement_type_id: 1, created_at: '2021-02-01' },
        { amount: -60, purchase_order_id: 2, payment_method_id:1, accounting_type_id: 1, movement_type_id:1 , created_at: '2021-02-02'}, 
        { amount: -20, purchase_order_id: 2, payment_method_id:1, accounting_type_id: 1, movement_type_id:1 , created_at: '2021-02-03'},

        { amount: 363, purchase_order_id: 3, accounting_type_id: 1, movement_type_id: 1 , created_at: '2021-03-01'},
        { amount: -63, purchase_order_id: 3, payment_method_id:1, accounting_type_id: 1, movement_type_id:1 , created_at: '2021-03-02'},
        { amount: -50, purchase_order_id: 3, payment_method_id:1, accounting_type_id: 1, movement_type_id:1 , created_at: '2021-03-03'},

        { amount: 628, purchase_order_id: 4, accounting_type_id: 1, movement_type_id:1, created_at: '2021-04-01' },
        { amount: -28, purchase_order_id: 4, payment_method_id:1, accounting_type_id: 1, movement_type_id:1 , created_at: '2021-04-02'},
        { amount: -150, purchase_order_id: 4, payment_method_id:1, accounting_type_id: 1, movement_type_id:1 , created_at: '2021-04-03'},

        { amount: 505, purchase_order_id: 5, accounting_type_id: 1, movement_type_id:1 , created_at: '2021-05-01'},
        { amount: -5, purchase_order_id: 5, payment_method_id:1, accounting_type_id: 1, movement_type_id:1 , created_at: '2021-05-02'},
        { amount: -250, purchase_order_id: 5, payment_method_id:1, accounting_type_id: 1, movement_type_id:1 , created_at: '2021-05-03'},

        { amount: 336, purchase_order_id: 6, accounting_type_id: 1, movement_type_id:1 , created_at: '2021-06-01'},
        { amount: -36, purchase_order_id: 6, payment_method_id:1, accounting_type_id: 1, movement_type_id:1 , created_at: '2021-06-02'},
        { amount: -100, purchase_order_id: 6, payment_method_id:1, accounting_type_id: 1, movement_type_id:1 , created_at: '2021-06-03'},

        { amount: 658, purchase_order_id: 7, accounting_type_id: 1, movement_type_id:1 , created_at: '2021-07-01'},
        { amount: -58, purchase_order_id: 7, payment_method_id:1, accounting_type_id: 1, movement_type_id:1 , created_at: '2021-07-02'},
        { amount: -200, purchase_order_id: 7, payment_method_id:1, accounting_type_id: 1, movement_type_id:1 , created_at: '2021-07-03'},

        { amount: 1080, purchase_order_id: 8, accounting_type_id: 1, movement_type_id:1, created_at: '2021-08-01' },
        { amount: -80, purchase_order_id: 8, payment_method_id:1, accounting_type_id: 1, movement_type_id:1 , created_at: '2021-08-02'},
        { amount: -500, purchase_order_id: 8, payment_method_id:1, accounting_type_id: 1, movement_type_id:1 , created_at: '2021-08-03'},

        { amount: 1620, purchase_order_id: 9, accounting_type_id: 1, movement_type_id:1 , created_at: '2021-09-01'},
        { amount: -120, purchase_order_id: 9, payment_method_id:1, accounting_type_id: 1, movement_type_id:1 , created_at: '2021-09-02'},
        { amount: -1200, purchase_order_id: 9, payment_method_id:1, accounting_type_id: 1, movement_type_id:1, created_at: '2021-09-03'},

        { amount: 1140, purchase_order_id: 10, accounting_type_id: 1, movement_type_id:1 , created_at: '2021-10-01'},
        { amount: -140, purchase_order_id: 10, payment_method_id:1, accounting_type_id: 1, movement_type_id:1 , created_at: '2021-10-02'},
        { amount: -200, purchase_order_id: 10, payment_method_id:1, accounting_type_id: 1, movement_type_id:1, created_at: '2021-10-03' },

        { amount: 660, purchase_order_id: 11, accounting_type_id: 1, movement_type_id:1 , created_at: '2021-11-01'},
        { amount: -60, purchase_order_id: 11, payment_method_id:1, accounting_type_id: 1, movement_type_id:1, created_at: '2021-11-02' },
        { amount: 100, purchase_order_id: 11, payment_method_id:1, movement_type_id:3 , created_at: '2021-11-03'}, //PO-11 supplier refund

        { amount: 1188, purchase_order_id: 12, accounting_type_id: 1, movement_type_id:1 , created_at: '2021-12-01'},
        { amount: -188, purchase_order_id: 12, payment_method_id:1, accounting_type_id: 1, movement_type_id:1 , created_at: '2021-12-02'},
        { amount: 100, purchase_order_id: 12, payment_method_id:1, movement_type_id:3 , created_at: '2021-01-01'}, //PO-12 supplier refund

        { amount: 1794, purchase_order_id: 13, accounting_type_id: 1, movement_type_id:1, created_at: '2021-01-01' },
        { amount: -194, purchase_order_id: 13, payment_method_id:1, accounting_type_id: 1, movement_type_id:1 , created_at: '2021-01-01'},
        { amount: 100, purchase_order_id: 13, payment_method_id:1, movement_type_id:3 , created_at: '2021-01-01'}, //PO-13 supplier refund

        { amount: 2478, purchase_order_id: 14, accounting_type_id: 1, movement_type_id:1 , created_at: '2021-02-01'},
        { amount: -278, purchase_order_id: 14, payment_method_id:1, accounting_type_id: 1, movement_type_id:1 , created_at: '2021-01-01'},
        { amount: 100, purchase_order_id: 14, payment_method_id:1, movement_type_id:3 , created_at: '2021-01-01'}, //PO-14 supplier refund

        { amount: 1740, purchase_order_id: 15, accounting_type_id: 1, movement_type_id:1, created_at: '2021-03-01' },
        { amount: -140, purchase_order_id: 15, payment_method_id:1, accounting_type_id: 1, movement_type_id:1 , created_at: '2021-01-01'},
        { amount: 100, purchase_order_id: 15, payment_method_id:1, movement_type_id:3 , created_at: '2021-01-01'}, //PO-15 supplier refund

        { amount: -896, purchase_order_id: 16, movement_type_id:1 , created_at: '2021-04-01'}, // cash 
        { amount: 196, purchase_order_id: 16, payment_method_id:1, movement_type_id:3 , created_at: '2021-01-01'}, //PO-16 supplier refund

        { amount: 1649, purchase_order_id: 17, movement_type_id:1, created_at: '2021-05-01' }, // cash 

        { amount: 2412, purchase_order_id: 18,  movement_type_id:1, created_at: '2021-06-01' }, // cash 

        { amount: 3363, purchase_order_id: 19,  movement_type_id:1, created_at: '2021-07-01' }, // cash 

        { amount: 2340, purchase_order_id: 20,  movement_type_id:1 , created_at: '2021-08-01'}, // cash 
      ]); 

      //inventory movement
      await InventoryMovement.bulkCreate([
        //{ unit_cost: 1, quantity: 20, purchase_order_item_id: lineItem.id, movement_type_id: 1 },
        //{ unit_cost: 2, quantity: 70, purchase_order_item_id: lineItem.id, movement_type_id: 1 },
        //{ unit_cost: 1, quantity: -30, purchase_order_item_id: lineItem.id, movement_type_id: 2 },

        { unit_cost: 1.1,  quantity: 10 , purchase_order_item_id: po1a.id, movement_type_id: 2, created_at: '2021-01-02' }, //quantity = product id * 10, unit_cost = product id
        { unit_cost: 2.1,  quantity: 10 , purchase_order_item_id: po1b.id, movement_type_id: 2, created_at: '2021-01-02' },

        { unit_cost: 3.5,  quantity: 20 , purchase_order_item_id: po2a.id, movement_type_id: 2, created_at: '2021-02-02' },
        { unit_cost: 4.5,  quantity: 20 , purchase_order_item_id: po2b.id, movement_type_id: 2, created_at: '2021-02-02' },

        { unit_cost: 5.9,  quantity: 30 , purchase_order_item_id: po3a.id, movement_type_id: 1, created_at: '2021-03-02' },
        { unit_cost: 6.2,  quantity: 30 , purchase_order_item_id: po3b.id, movement_type_id: 1, created_at: '2021-03-02' },

        { unit_cost: 7.2,  quantity: 40 , purchase_order_item_id: po4a.id, movement_type_id: 1, created_at: '2021-04-02' },
        { unit_cost: 8.5,  quantity: 40 , purchase_order_item_id: po4b.id, movement_type_id: 1, created_at: '2021-04-02' },

        { unit_cost: 9.2,  quantity: 50 , purchase_order_item_id: po5a.id, movement_type_id: 1, created_at: '2021-05-02' },
        { unit_cost: 0.9,  quantity: 50 , purchase_order_item_id: po5b.id, movement_type_id: 1, created_at: '2021-05-02' },

        { unit_cost: 2.5,  quantity: 60 , purchase_order_item_id: po6a.id, movement_type_id: 1, created_at: '2021-06-02' },
        { unit_cost: 3.1,  quantity: 60 , purchase_order_item_id: po6b.id, movement_type_id: 1, created_at: '2021-06-02' },

        { unit_cost: 4.2,  quantity: 70 , purchase_order_item_id: po7a.id, movement_type_id: 1, created_at: '2021-07-02' },
        { unit_cost: 5.2,  quantity: 70 , purchase_order_item_id: po7b.id, movement_type_id: 1, created_at: '2021-07-02' },

        { unit_cost: 6.3,  quantity: 80 , purchase_order_item_id: po8a.id, movement_type_id: 1, created_at: '2021-08-02' },
        { unit_cost: 7.2,  quantity: 80 , purchase_order_item_id: po8b.id, movement_type_id: 1, created_at: '2021-08-02' },

        { unit_cost: 8.5,  quantity: 90 , purchase_order_item_id: po9a.id, movement_type_id: 1, created_at: '2021-09-02' },
        { unit_cost: 9.5,  quantity: 90 , purchase_order_item_id: po9b.id, movement_type_id: 1, created_at: '2021-09-02' },

        { unit_cost: 10.2,  quantity: 100 , purchase_order_item_id: po10a.id, movement_type_id: 1, created_at: '2021-10-02' },
        { unit_cost: 1.2,  quantity: 100 , purchase_order_item_id: po10b.id, movement_type_id: 1, created_at: '2021-10-02' },

        { unit_cost: 2.5,  quantity: 110 , purchase_order_item_id: po11a.id, movement_type_id: 1, created_at: '2021-11-02'  },
        { unit_cost: 3.5,  quantity: 110 , purchase_order_item_id: po11b.id, movement_type_id: 1, created_at: '2021-11-02'  },

        { unit_cost: 4.1,  quantity: 120 , purchase_order_item_id: po12a.id, movement_type_id: 1, created_at: '2021-12-02'  },
        { unit_cost: 5.8,  quantity: 120 , purchase_order_item_id: po12b.id, movement_type_id: 1, created_at: '2021-12-02'  },

        { unit_cost: 6.2,  quantity: 130 , purchase_order_item_id: po13a.id, movement_type_id: 1 , created_at: '2021-01-02' },
        { unit_cost: 7.6,  quantity: 130 , purchase_order_item_id: po13b.id, movement_type_id: 1, created_at: '2021-01-02'  },

        { unit_cost: 8.5,  quantity: 140 , purchase_order_item_id: po14a.id, movement_type_id: 1, created_at: '2021-02-02'  },
        { unit_cost: 9.2,  quantity: 140 , purchase_order_item_id: po14b.id, movement_type_id: 1, created_at: '2021-02-02'  },

        { unit_cost: 10.5,  quantity: 150 , purchase_order_item_id: po15a.id, movement_type_id: 1, created_at: '2021-03-02'  },
        { unit_cost: 1.1,  quantity: 150 , purchase_order_item_id: po15b.id, movement_type_id: 1, created_at: '2021-03-02'  },

        { unit_cost: 2.1,  quantity: 160 , purchase_order_item_id: po16a.id, movement_type_id: 1 , created_at: '2021-04-02' },
        { unit_cost: 3.5,  quantity: 160 , purchase_order_item_id: po16b.id, movement_type_id: 1 , created_at: '2021-04-02' },

        { unit_cost: 4.5,  quantity: 170 , purchase_order_item_id: po17a.id, movement_type_id: 1 , created_at: '2021-05-02' },
        { unit_cost: 5.2,  quantity: 170 , purchase_order_item_id: po17b.id, movement_type_id: 1 , created_at: '2021-05-02' },

        { unit_cost: 6.2,  quantity: 180 , purchase_order_item_id: po18a.id, movement_type_id: 1 , created_at: '2021-06-02' },
        { unit_cost: 7.2,  quantity: 180 , purchase_order_item_id: po18b.id, movement_type_id: 1 , created_at: '2021-06-02'},

        { unit_cost: 8.5,  quantity: 190 , purchase_order_item_id: po19a.id, movement_type_id: 1 , created_at: '2021-07-02' },
        { unit_cost: 9.2,  quantity: 190 , purchase_order_item_id: po19b.id, movement_type_id: 1 , created_at: '2021-07-02' },

        { unit_cost: 10.2,  quantity: 200 , purchase_order_item_id: po20a.id, movement_type_id: 1 , created_at: '2021-08-02' },
        { unit_cost: 1.5,  quantity: 200 , purchase_order_item_id: po20b.id, movement_type_id: 1 , created_at: '2021-08-02' },

        //recording refunds
        { unit_cost: 2.5,  quantity: -50 , purchase_order_item_id: po11a.id, movement_type_id: 3 , created_at: '2021-11-03' },
        { unit_cost: 3.5,  quantity: -40 , purchase_order_item_id: po11b.id, movement_type_id: 3 , created_at: '2021-11-03' },
        { unit_cost: 4.1,  quantity: -60 , purchase_order_item_id: po12a.id, movement_type_id: 3 , created_at: '2021-12-03' },
        { unit_cost: 5.8,  quantity: -20 , purchase_order_item_id: po12b.id, movement_type_id: 3 , created_at: '2021-12-03' },
        { unit_cost: 6.2,  quantity: -30 , purchase_order_item_id: po13a.id, movement_type_id: 3 , created_at: '2021-01-03' },
        { unit_cost: 7.6,  quantity: -30 , purchase_order_item_id: po13b.id, movement_type_id: 3 , created_at: '2021-01-03' },
        { unit_cost: 8.5,  quantity: -40 , purchase_order_item_id: po14a.id, movement_type_id: 3 , created_at: '2021-02-03' },
        { unit_cost: 9.2,  quantity: -40 , purchase_order_item_id: po14b.id, movement_type_id: 3 , created_at: '2021-02-03' },
        { unit_cost: 10.5,  quantity: -50 , purchase_order_item_id: po15a.id, movement_type_id: 3 , created_at: '2021-03-03' },
        { unit_cost: 1.1,  quantity: -50 , purchase_order_item_id: po15b.id, movement_type_id: 3 , created_at: '2021-03-03' },
        { unit_cost: 2.1,  quantity: -60 , purchase_order_item_id: po16a.id, movement_type_id: 3 , created_at: '2021-04-03' },
        { unit_cost: 3.5,  quantity: -60 , purchase_order_item_id: po16b.id, movement_type_id: 3  , created_at: '2021-04-03'},
      ]); 


      // Analytics - Sales Order
      await SalesOrder.bulkCreate([
        { payment_term_id: 1, customer_id: customer1.id, created_at: '2021-01-10', gst_rate : 7, offset: 1 }, //cash
        { payment_term_id: 1, customer_id: customer1.id, created_at: '2021-01-10', gst_rate : 7 , offset: 1 },
        { payment_term_id: 1, customer_id: customer2.id, created_at: '2021-02-10', gst_rate : 7 , offset: 1 }, 
        { payment_term_id: 1, customer_id: customer2.id, created_at: '2021-02-10', gst_rate : 9, offset: 1  },
        { payment_term_id: 1, customer_id: customer3.id, created_at: '2021-03-10', gst_rate: 9, offset: 1  }, 
        { payment_term_id: 1, customer_id: customer3.id, created_at: '2021-03-10' , gst_rate : 9, offset: 1 },
        { payment_term_id: 1, customer_id: customer4.id, created_at:'2021-04-10' , gst_rate : 9, offset: 1 }, 
        { payment_term_id: 1, customer_id: customer4.id, created_at: '2021-04-10' , gst_rate : 9, offset: 1 },
        { payment_term_id: 1, customer_id: customer5.id, created_at: '2021-05-10' , gst_rate : 9, offset: 1 }, 
        { payment_term_id: 1, customer_id: customer5.id, created_at:'2021-05-10', gst_rate : 7, offset: 1  },
        { payment_term_id: 1, customer_id: customer6.id, created_at: '2021-06-10' , gst_rate : 7 , offset: 1}, 
        { payment_term_id: 1, customer_id: customer6.id, created_at: '2021-06-10' , gst_rate :7 , offset: 1},
        { payment_term_id: 2, customer_id: customer7.id, created_at: '2021-07-10' , gst_rate : 7 , offset: 1}, // credit
        { payment_term_id: 2, customer_id: customer7.id, created_at:'2021-07-10' , gst_rate : 7 , offset: 1},
        { payment_term_id: 2, customer_id: customer8.id, created_at: '2021-08-10' , gst_rate : 7 , offset: 1}, 
        { payment_term_id: 2, customer_id: customer8.id, created_at: '2021-08-10' , gst_rate :0 , offset: 1},
        { payment_term_id: 2, customer_id: customer9.id, created_at: '2021-09-10' , gst_rate: 11, offset: 1 }, 
        { payment_term_id: 2, customer_id: customer9.id, created_at: '2021-09-10'  , gst_rate : 7, offset: 1},
        { payment_term_id: 2, customer_id: customer10.id, created_at: '2021-10-10' , gst_rate : 7 , offset: 1}, 
        { payment_term_id: 2, customer_id: customer10.id, created_at: '2021-10-10' , gst_rate : 7 , offset: 1}, 
        { payment_term_id: 2, customer_id: customer11.id, created_at: '2021-11-10' , gst_rate : 7 , offset: 1},
        { payment_term_id: 2, customer_id: customer11.id, created_at: '2021-11-10' , gst_rate :0 , offset: 1}, 
        { payment_term_id: 2, customer_id: customer12.id, created_at: '2021-12-10' , gst_rate : 7 , offset: 1},
        { payment_term_id: 2, customer_id: customer12.id, created_at: '2021-12-10' , gst_rate : 7, offset: 1 }, //new pattern
        { payment_term_id: 2, customer_id: customer13.id, created_at: '2021-02-10' , gst_rate: 7, offset: 1 },
        { payment_term_id: 2, customer_id: customer13.id, created_at: '2021-02-10' , gst_rate : 7, offset: 1 }, 
        { payment_term_id: 2, customer_id: customer14.id, created_at: '2021-04-10', gst_rate : 0, offset: 1 },
        { payment_term_id: 2, customer_id: customer14.id, created_at:'2021-04-10' , gst_rate :7, offset: 1 }, 
        { payment_term_id: 2, customer_id: customer15.id, created_at: '2021-06-10', gst_rate : 7 , offset: 1 },
        { payment_term_id: 2, customer_id: customer15.id, created_at: '2021-06-10', gst_rate : 7, offset: 1  },
        { payment_term_id: 2, customer_id: customer16.id, created_at: '2021-08-10', gst_rate : 7, offset: 1}, 
        { payment_term_id: 2, customer_id: customer16.id, created_at:'2021-08-10' , gst_rate : 0 , offset: 1},
        { payment_term_id: 2, customer_id: customer17.id, created_at: '2021-10-10', gst_rate: 7  , offset: 1}, 
        { payment_term_id: 2, customer_id: customer17.id, created_at:'2021-10-10', gst_rate : 7 , offset: 1 },
        { payment_term_id: 2, customer_id: customer18.id, created_at:'2021-12-10' , gst_rate :9, offset: 1 }, 
        { payment_term_id: 2, customer_id: customer18.id, created_at: '2021-12-10' , gst_rate :9 , offset: 1},
        { payment_term_id: 2, customer_id: customer19.id, created_at:'2021-12-10' , gst_rate : 9 , offset: 1}, 
        { payment_term_id: 2, customer_id: customer19.id, created_at: '2021-12-10' , gst_rate : 9, offset: 1},
        { payment_term_id: 2, customer_id: customer20.id, created_at: '2021-12-10'  , gst_rate : 9, offset: 1}, 
        { payment_term_id: 2, customer_id: customer20.id, created_at: '2021-12-10' , gst_rate : 9, offset: 1 }
      ]); 

      await SalesOrderItem.bulkCreate([
        { unit_price: 2.2,  quantity: 5 , sales_order_id: 1, product_id: product1.id, created_at: '2021-01-10' }, //quantity = product id * 10, unit_cost = product id
        { unit_price: 3.2,  quantity: 5 , sales_order_id: 1, product_id: product2.id, created_at: '2021-01-10' }, //purchase months = purchase_order_id 
        { unit_price: 5.1,  quantity: 2 , sales_order_id: 2, product_id: product3.id, created_at: '2021-02-10' },
        { unit_price: 6.5,  quantity: 5 , sales_order_id: 2, product_id: product4.id, created_at: '2021-02-10' }, 
        { unit_price: 6.2,  quantity: 15 , sales_order_id: 3, product_id: product5.id, created_at:'2021-03-10' }, 
        { unit_price: 7.6,  quantity: 23 , sales_order_id: 3, product_id: product6.id, created_at:'2021-03-10' },
        { unit_price: 9.2,  quantity: 34 , sales_order_id: 4, product_id: product7.id, created_at:'2021-04-10' },
        { unit_price: 9.5,  quantity: 32 , sales_order_id: 4, product_id: product8.id, created_at: '2021-04-10' },
        { unit_price: 10.2,  quantity: 45 , sales_order_id: 5, product_id: product9.id, created_at: '2021-05-10'},
        { unit_price: 1.9,  quantity: 24 , sales_order_id: 5, product_id: product1.id, created_at: '2021-05-10' },
        { unit_price: 3.5,  quantity: 24 , sales_order_id: 6, product_id: product2.id, created_at:'2021-06-10'  },
        { unit_price: 5.1,  quantity: 34 , sales_order_id: 6, product_id: product3.id, created_at:'2021-06-10'  },
        { unit_price: 9.2,  quantity: 65 , sales_order_id: 7, product_id: product4.id, created_at: '2021-07-10' },
        { unit_price: 12.2,  quantity: 42 , sales_order_id: 7, product_id: product5.id, created_at: '2021-07-10'},
        { unit_price: 8.3,  quantity: 40 , sales_order_id: 8, product_id: product6.id, created_at: '2021-08-10' },
        { unit_price: 9.2,  quantity: 40 , sales_order_id: 8, product_id: product7.id, created_at: '2021-08-10' },
        { unit_price: 12.5,  quantity: 40 , sales_order_id: 9, product_id: product8.id, created_at: '2021-09-10' },
        { unit_price: 13.5,  quantity: 40 , sales_order_id: 9, product_id: product9.id, created_at:'2021-09-10' },
        { unit_price: 12.2,  quantity: 50 , sales_order_id: 10, product_id: product10.id, created_at:'2021-10-10' },
        { unit_price: 2.2,  quantity: 50 , sales_order_id: 10, product_id: product1.id, created_at: '2021-10-10'},
        { unit_price: 4.5,  quantity: 50 , sales_order_id: 11, product_id: product2.id, created_at:'2021-11-10' },
        { unit_price: 5.5,  quantity: 50 , sales_order_id: 11, product_id: product3.id, created_at:'2021-11-10' },
        { unit_price: 6.1,  quantity: 72 , sales_order_id: 12, product_id: product4.id, created_at: '2021-12-10' },
        { unit_price: 7.8,  quantity: 71 , sales_order_id: 12, product_id: product5.id, created_at:'2021-12-10' },
        { unit_price: 7.2,  quantity: 35 , sales_order_id: 13, product_id: product6.id, created_at:'2021-02-10' },
        { unit_price: 8.6,  quantity: 85 , sales_order_id: 13, product_id: product7.id, created_at:'2021-02-10' },
        { unit_price: 9.5,  quantity: 70 , sales_order_id: 14, product_id: product8.id, created_at:'2021-04-10'},
        { unit_price: 10.2,  quantity: 90 , sales_order_id: 14, product_id: product9.id, created_at: '2021-04-10'},
        { unit_price: 11.5,  quantity: 80 , sales_order_id: 15, product_id: product10.id, created_at:'2021-06-10'},
        { unit_price: 12.1,  quantity: 80 , sales_order_id: 15, product_id: product1.id, created_at: '2021-06-10'},
        { unit_price: 5.1,  quantity: 90 , sales_order_id: 16, product_id: product2.id, created_at: '2021-08-10' },
        { unit_price: 5.5,  quantity: 90 , sales_order_id: 16, product_id: product3.id, created_at: '2021-08-10' },
        { unit_price: 6.5,  quantity: 120 , sales_order_id: 17, product_id: product4.id, created_at: '2021-10-10' },
        { unit_price: 7.2,  quantity: 5 , sales_order_id: 17, product_id: product5.id, created_at: '2021-10-10' },
        { unit_price: 8.2,  quantity: 123 , sales_order_id: 18, product_id: product6.id, created_at:'2021-12-10' },
        { unit_price: 9.2,  quantity: 123 , sales_order_id: 18, product_id: product7.id, created_at: '2021-12-10'},
        { unit_price: 10.5,  quantity: 90 , sales_order_id: 19, product_id: product8.id, created_at:'2021-12-10' },
        { unit_price: 11.2,  quantity: 90 , sales_order_id: 19, product_id: product9.id, created_at:'2021-12-10' },
        { unit_price: 12.2,  quantity: 100 , sales_order_id: 20, product_id: product10.id, created_at:'2021-12-10'},
        { unit_price: 13.5,  quantity: 100 , sales_order_id: 20, product_id: product1.id, created_at:'2021-12-10' }
      ]); 

      const so1a = await SalesOrderItem.findOne({ where: {    unit_price: 2.2,  quantity: 5 , sales_order_id: 1, product_id: product1.id } });
      const so1b = await SalesOrderItem.findOne({ where: {    unit_price: 3.2,  quantity: 5 , sales_order_id: 1, product_id: product2.id  } });
      const so2a = await SalesOrderItem.findOne({ where: {    unit_price: 5.1,  quantity: 2 , sales_order_id: 2, product_id: product3.id  } });
      const so2b = await SalesOrderItem.findOne({ where: {     unit_price: 6.5,  quantity: 5 , sales_order_id: 2, product_id: product4.id } });
      const so3a = await SalesOrderItem.findOne({ where: {   unit_price: 6.2,  quantity: 15 , sales_order_id: 3, product_id: product5.id  } });
      const so3b = await SalesOrderItem.findOne({ where: {    unit_price: 7.6,  quantity: 23 , sales_order_id: 3, product_id: product6.id  } });
      const so4a = await SalesOrderItem.findOne({ where: {  unit_price: 9.2,  quantity: 34 , sales_order_id: 4, product_id: product7.id   } });
      const so4b = await SalesOrderItem.findOne({ where: {    unit_price: 9.5,  quantity: 32 , sales_order_id: 4, product_id: product8.id   } });
      const so5a = await SalesOrderItem.findOne({ where: {   unit_price: 10.2,  quantity: 45 , sales_order_id: 5, product_id: product9.id  } });
      const so5b = await SalesOrderItem.findOne({ where: {  unit_price: 1.9,  quantity: 24 , sales_order_id: 5, product_id: product1.id  } });
      const so6a = await SalesOrderItem.findOne({ where: {   unit_price: 3.5,  quantity: 24 , sales_order_id: 6, product_id: product2.id  } });
      const so6b = await SalesOrderItem.findOne({ where: {  unit_price: 5.1,  quantity: 34 , sales_order_id: 6, product_id: product3.id  } });
      const so7a = await SalesOrderItem.findOne({ where: {  unit_price: 9.2,  quantity: 65 , sales_order_id: 7, product_id: product4.id   } });
      const so7b = await SalesOrderItem.findOne({ where: {   unit_price: 12.2,  quantity: 42 , sales_order_id: 7, product_id: product5.id} });
      const so8a = await SalesOrderItem.findOne({ where: {  unit_price: 8.3,  quantity: 40 , sales_order_id: 8, product_id: product6.id } });
      const so8b = await SalesOrderItem.findOne({ where: {   unit_price: 9.2,  quantity: 40 , sales_order_id: 8, product_id: product7.id  } });
      const so9a = await SalesOrderItem.findOne({ where: {   unit_price: 12.5,  quantity: 40 , sales_order_id: 9, product_id: product8.id   } });
      const so9b = await SalesOrderItem.findOne({ where: {   unit_price: 13.5,  quantity: 40 , sales_order_id: 9, product_id: product9.id  } });
      const so10a = await SalesOrderItem.findOne({ where: { unit_price: 12.2,  quantity: 50 , sales_order_id: 10, product_id: product10.id } });
      const so10b = await SalesOrderItem.findOne({ where: {  unit_price: 2.2,  quantity: 50 , sales_order_id: 10, product_id: product1.id } });
      const so11a = await SalesOrderItem.findOne({ where: {  unit_price: 4.5,  quantity: 50 , sales_order_id: 11, product_id: product2.id  } });
      const so11b = await SalesOrderItem.findOne({ where: { unit_price: 5.5,  quantity: 50 , sales_order_id: 11, product_id: product3.id  } });
      const so12a = await SalesOrderItem.findOne({ where: {   unit_price: 6.1,  quantity: 72 , sales_order_id: 12, product_id: product4.id   } });
      const so12b = await SalesOrderItem.findOne({ where: { unit_price: 7.8,  quantity: 71 , sales_order_id: 12, product_id: product5.id   } });
      const so13a = await SalesOrderItem.findOne({ where: {  unit_price: 7.2,  quantity: 35 , sales_order_id: 13, product_id: product6.id   } });
      const so13b = await SalesOrderItem.findOne({ where: {  unit_price: 8.6,  quantity: 85 , sales_order_id: 13, product_id: product7.id  } });
      const so14a = await SalesOrderItem.findOne({ where: {   unit_price: 9.5,  quantity: 70 , sales_order_id: 14, product_id: product8.id   } });
      const so14b = await SalesOrderItem.findOne({ where: {   unit_price: 10.2,  quantity: 90 , sales_order_id: 14, product_id: product9.id   } });
      const so15a = await SalesOrderItem.findOne({ where: { unit_price: 11.5,  quantity: 80 , sales_order_id: 15, product_id: product10.id   } });
      const so15b = await SalesOrderItem.findOne({ where: {   unit_price: 12.1,  quantity: 80 , sales_order_id: 15, product_id: product1.id } });
      const so16a = await SalesOrderItem.findOne({ where: {  unit_price: 5.1,  quantity: 90 , sales_order_id: 16, product_id: product2.id   } });
      const so16b = await SalesOrderItem.findOne({ where: {  unit_price: 5.5,  quantity: 90 , sales_order_id: 16, product_id: product3.id  } });
      const so17a = await SalesOrderItem.findOne({ where: {   unit_price: 6.5,  quantity: 120 , sales_order_id: 17, product_id: product4.id   } });
      const so17b = await SalesOrderItem.findOne({ where: {  unit_price: 7.2,  quantity: 5 , sales_order_id: 17, product_id: product5.id } });
      const so18a = await SalesOrderItem.findOne({ where: {   unit_price: 8.2,  quantity: 123 , sales_order_id: 18, product_id: product6.id  } });
      const so18b = await SalesOrderItem.findOne({ where: {  unit_price: 9.2,  quantity: 123 , sales_order_id: 18, product_id: product7.id   } });
      const so19a = await SalesOrderItem.findOne({ where: {    unit_price: 10.5,  quantity: 90 , sales_order_id: 19, product_id: product8.id  } });
      const so19b = await SalesOrderItem.findOne({ where: {   unit_price: 11.2,  quantity: 90 , sales_order_id: 19, product_id: product9.id  } });
      const so20a = await SalesOrderItem.findOne({ where: {   unit_price: 12.2,  quantity: 100 , sales_order_id: 20, product_id: product10.id  } });
      const so20b = await SalesOrderItem.findOne({ where: {   unit_price: 13.5,  quantity: 100 , sales_order_id: 20, product_id: product1.id  } });


      //inventory movement
      await InventoryMovement.bulkCreate([
        { unit_cost: 1.1 , unit_price: 2.2,  quantity: -5 , sales_order_item_id: so1a.id, movement_type_id:2 , created_at: '2021-01-12'} ,//deliver 2 days later
        { unit_cost: 2.1 , unit_price: 3.2,  quantity: -5 ,sales_order_item_id: so1b.id, movement_type_id:2 , created_at: '2021-01-12' } ,

        { unit_cost: 3.5 , unit_price: 5.1,  quantity: -2 , sales_order_item_id: so2a.id, movement_type_id:2, created_at: '2021-02-12' },
        { unit_cost: 4.5 , unit_price: 6.5,  quantity: -5 , sales_order_item_id: so2b.id, movement_type_id:2 , created_at: '2021-02-12'} ,

        { unit_cost: 5.9, unit_price: 6.2,  quantity: -15 ,sales_order_item_id: so3a.id, movement_type_id:2 , created_at: '2021-03-12' }  ,
        { unit_cost: 6.2, unit_price: 7.6,  quantity: -23 , sales_order_item_id: so3b.id, movement_type_id:2 , created_at: '2021-03-12' }  ,

        { unit_cost: 7.2 , unit_price: 9.2,  quantity: -34 , sales_order_item_id: so4a.id, movement_type_id:2 , created_at: '2021-04-12'  }  ,
        { unit_cost: 8.5, unit_price: 9.5,  quantity: -32 ,sales_order_item_id: so4b.id, movement_type_id:2 , created_at: '2021-04-12'  }  ,

        { unit_cost:  9.2, unit_price: 10.2,  quantity: -45 , sales_order_item_id: so5a.id, movement_type_id:2 , created_at: '2021-05-12'}  ,
        { unit_cost:  0.9, unit_price: 1.9,  quantity: -24 , sales_order_item_id: so5b.id, movement_type_id:2, created_at: '2021-05-12'  }  ,

        { unit_cost: 2.5 ,  unit_price: 3.5,  quantity: -24 ,sales_order_item_id: so6a.id, movement_type_id:2 , created_at: '2021-06-12'}  ,
        { unit_cost: 3.1, unit_price: 5.1,  quantity: -34 , sales_order_item_id: so6b.id, movement_type_id:2 , created_at: '2021-06-12' } ,

        { unit_cost: 4.2 , unit_price: 9.2,  quantity: -65 , sales_order_item_id: so7a.id, movement_type_id:2 , created_at: '2021-07-12' }  ,
        { unit_cost:  5.2, unit_price: 12.2,  quantity: -42 , sales_order_item_id: so7b.id, movement_type_id:2, created_at: '2021-07-12'}  ,

        { unit_cost:  6.3, unit_price: 8.3,  quantity: -40 , sales_order_item_id: so8a.id, movement_type_id:2 , created_at: '2021-08-12'} ,
        { unit_cost:  7.2, unit_price: 9.2,  quantity: -40 , sales_order_item_id: so8b.id, movement_type_id:2 , created_at: '2021-08-12' }  ,

        { unit_cost:  8.5, unit_price: 12.5,  quantity: -40 ,sales_order_item_id: so9a.id, movement_type_id:2 , created_at: '2021-09-12' }  ,
        { unit_cost:  9.5, unit_price: 13.5,  quantity: -40 , sales_order_item_id: so9b.id, movement_type_id:2 , created_at: '2021-09-12' } ,

        { unit_cost:  10.2, unit_price: 12.2,  quantity: -50 , sales_order_item_id: so10a.id, movement_type_id:2, created_at: '2021-10-12' }  ,
        { unit_cost:  1.2, unit_price: 2.2,  quantity: -50 , sales_order_item_id: so10b.id, movement_type_id:2, created_at: '2021-10-12' }  ,

        { unit_cost:  2.5, unit_price: 4.5,  quantity: -50 , sales_order_item_id: so11a.id, movement_type_id:2  , created_at: '2021-11-12'}  ,
        { unit_cost:  3.5, unit_price: 5.5,  quantity: -50 ,sales_order_item_id: so11b.id, movement_type_id:2 , created_at: '2021-11-12'}  ,

        { unit_cost:  4.1, unit_price: 6.1,  quantity: -72 , sales_order_item_id: so12a.id, movement_type_id:2 , created_at: '2021-12-12'}  ,
        { unit_cost:  5.8, unit_price: 7.8,  quantity: -71 ,sales_order_item_id: so12b.id, movement_type_id:2, created_at: '2021-12-12' }  ,

        { unit_cost: 6.2 , unit_price: 7.2,  quantity: -35 , sales_order_item_id: so13a.id, movement_type_id:2  , created_at: '2021-02-12'}  ,
        { unit_cost:  7.6, unit_price: 8.6,  quantity: -85 , sales_order_item_id: so13b.id, movement_type_id:2, created_at: '2021-02-12'}  ,

        { unit_cost:  8.5, unit_price: 9.5,  quantity: -70 ,sales_order_item_id: so14a.id, movement_type_id:2  , created_at: '2021-04-12'}  ,
        { unit_cost:  9.2, unit_price: 10.2,  quantity: -90 ,sales_order_item_id: so14b.id, movement_type_id:2  , created_at: '2021-04-12' }  ,

        { unit_cost:  10.5, unit_price: 11.5,  quantity: -80 ,sales_order_item_id: so15a.id, movement_type_id:2  , created_at: '2021-06-12'}  , //customer refunds below
        { unit_cost:  1.1,  unit_price: 12.1,  quantity: -80 , sales_order_item_id: so15b.id, movement_type_id:2 , created_at: '2021-06-12'}  ,
        { unit_cost:  1.1,  unit_price: 12.1,  quantity: 50 , sales_order_item_id: so15b.id, movement_type_id:3 , created_at: '2021-06-13'}  ,

        { unit_cost:  2.1, unit_price: 5.1,  quantity: -90 ,sales_order_item_id: so16a.id, movement_type_id:2  , created_at: '2021-08-12'}  ,
        { unit_cost:  3.5, unit_price: 5.5,  quantity: -90 , sales_order_item_id: so16b.id, movement_type_id:2 , created_at: '2021-08-12'}  ,
        { unit_cost:  1.1,  unit_price: 12.1,  quantity: 50 , sales_order_item_id: so16b.id, movement_type_id:3 , created_at: '2021-08-13'}  ,

        { unit_cost:  4.5, unit_price: 6.5,  quantity: -120 ,sales_order_item_id: so17a.id, movement_type_id:2  , created_at: '2021-10-12' }  ,
        { unit_cost:  5.2, unit_price: 7.2,  quantity: -5 ,sales_order_item_id: so17b.id, movement_type_id:2 , created_at: '2021-10-12'}  ,
        { unit_cost:  1.1,  unit_price: 12.1,  quantity: 1 , sales_order_item_id: so17b.id, movement_type_id:3 , created_at: '2021-10-13'}  ,

        { unit_cost:  6.2, unit_price: 8.2,  quantity: -123 ,sales_order_item_id: so18a.id, movement_type_id:2, created_at: '2021-12-12'  }  ,
        { unit_cost:  7.2, unit_price: 9.2,  quantity: -123 , sales_order_item_id: so18b.id, movement_type_id:2  , created_at: '2021-12-12' } ,
        { unit_cost:  1.1,  unit_price: 12.1,  quantity: 23 , sales_order_item_id: so18b.id, movement_type_id:3 , created_at: '2021-12-13'},

        { unit_cost:  8.5, unit_price: 10.5,  quantity: -90 , sales_order_item_id: so19a.id, movement_type_id:2  , created_at: '2021-12-12'} ,
        { unit_cost:  9.2, unit_price: 11.2,  quantity: -90 ,sales_order_item_id: so19b.id, movement_type_id:2 , created_at: '2021-12-12' }  ,
        { unit_cost:  1.1,  unit_price: 12.1,  quantity: 1 , sales_order_item_id: so19b.id, movement_type_id:3 , created_at: '2021-12-13'}  ,

        { unit_cost:  10.2, unit_price: 12.2,  quantity: -100 ,sales_order_item_id: so20a.id, movement_type_id:2  , created_at: '2021-12-12'} ,
        { unit_cost:  1.5, unit_price: 13.5,  quantity: -100 , sales_order_item_id: so20b.id, movement_type_id:2, created_at: '2021-12-12' } ,
        { unit_cost:  1.1,  unit_price: 12.1,  quantity: 10 , sales_order_item_id: so20b.id, movement_type_id:3 , created_at: '2021-12-13' },

        //damaged goods
        { unit_cost: 7.2 , unit_price: 0,  quantity: -3 , sales_order_item_id: so4a.id, movement_type_id:4 , created_at: '2021-04-12'  }  ,
        { unit_cost:  2.5, unit_price: 0,  quantity: -5 , sales_order_item_id: so11a.id, movement_type_id:4  , created_at: '2021-11-12'}  ,
        { unit_cost:  3.5, unit_price: 0,  quantity: -6 ,sales_order_item_id: so11b.id, movement_type_id:4 , created_at: '2021-11-12'}  ,
        { unit_cost:  4.5, unit_price: 0,  quantity: -10 ,sales_order_item_id: so17a.id, movement_type_id:4  , created_at: '2021-10-12' }  ,
        { unit_cost:  5.2, unit_price: 0,  quantity: -2 ,sales_order_item_id: so17b.id, movement_type_id:4 , created_at: '2021-10-12'}  ,
        { unit_cost:  1.1,  unit_price: 0,  quantity: -19 , sales_order_item_id: so19b.id, movement_type_id:4 , created_at: '2021-12-13'}  ,
        { unit_cost:  10.2, unit_price: 0,  quantity: -5 ,sales_order_item_id: so20a.id, movement_type_id:4  , created_at: '2021-12-12'} ,
      ]); 

      await Payment.bulkCreate([
        // { amount: 22, purchase_order_id: 1, accounting_type_id: 1, movement_type_id: 1, created_at: '2021-01-01'},
        // { amount: -10, purchase_order_id: 1, payment_method_id:1, accounting_type_id: 1, movement_type_id:1 , created_at: '2021-01-02'}, //double payment for PO1 to PO10
        // { amount: -2, purchase_order_id: 1, payment_method_id:1, accounting_type_id: 1, movement_type_id:1 , created_at: '2021-01-03'},  //1 day apart

        // { amount: 660, purchase_order_id: 11, accounting_type_id: 1, movement_type_id:1 , created_at: '2021-11-01'},
        // { amount: -60, purchase_order_id: 11, payment_method_id:1, accounting_type_id: 1, movement_type_id:1, created_at: '2021-11-02' },
        // { amount: 100, purchase_order_id: 11, payment_method_id:1, movement_type_id:3 , created_at: '2021-11-03'}, //PO-11 supplier refund

        // { amount: 1649, purchase_order_id: 17, accounting_type_id: 1, movement_type_id:1, created_at: '2021-05-01' }, // cash 

        {amount: 27 , sales_order_id: 1, movement_type_id: 2, created_at: '2021-01-12', payment_method_id:1 }, //cash

        {amount: 42.7 , sales_order_id: 2, movement_type_id: 2, created_at: '2021-02-12', payment_method_id:1},

        {amount: 267.8 , sales_order_id: 3,  movement_type_id: 2, created_at: '2021-03-12', payment_method_id:1},

        {amount: 616.8 , sales_order_id: 4,  movement_type_id: 2, created_at: '2021-04-12', payment_method_id:1},

        {amount: 504.6 , sales_order_id: 5, movement_type_id: 2, created_at: '2021-05-12', payment_method_id:1},

        {amount: 257.4 , sales_order_id: 6,  movement_type_id: 2, created_at: '2021-06-12', payment_method_id:1},

        {amount: -1110.4, sales_order_id: 7, accounting_type_id: 2, movement_type_id: 2, created_at: '2021-07-12'},//credit
        {amount: 1000, sales_order_id: 7, accounting_type_id: 2, movement_type_id: 2, created_at: '2021-07-13', payment_method_id:1},

        {amount: -700 , sales_order_id: 8, accounting_type_id: 2, movement_type_id: 2, created_at: '2021-08-12'},
        {amount: 500 , sales_order_id: 8, accounting_type_id: 2, movement_type_id: 2, created_at: '2021-08-12', payment_method_id:1},

        {amount: -1040 , sales_order_id: 9, accounting_type_id: 2, movement_type_id: 2, created_at: '2021-09-12'},
        {amount: 900 , sales_order_id: 9, accounting_type_id: 2, movement_type_id: 2, created_at: '2021-09-12', payment_method_id:1},

        {amount: -720 , sales_order_id: 10, accounting_type_id: 2, movement_type_id: 2, created_at: '2021-10-12'},
        {amount: 720 , sales_order_id: 10, accounting_type_id: 2, movement_type_id: 2, created_at: '2021-10-12', payment_method_id:1},

        {amount: -500 , sales_order_id: 11, accounting_type_id: 2, movement_type_id: 2, created_at: '2021-11-12'},
        {amount: 500 , sales_order_id: 11, accounting_type_id: 2, movement_type_id: 2, created_at: '2021-11-12', payment_method_id:1},

        {amount: -993 , sales_order_id: 12, accounting_type_id: 2, movement_type_id: 2, created_at: '2021-12-12'},
        {amount: 803 , sales_order_id: 12, accounting_type_id: 2, movement_type_id: 2, created_at: '2021-12-12', payment_method_id:1},

        {amount: -983 , sales_order_id: 13, accounting_type_id: 2, movement_type_id: 2, created_at: '2021-02-12'},
        {amount: 903 , sales_order_id: 13, accounting_type_id: 2, movement_type_id: 2, created_at: '2021-02-12', payment_method_id:1},

        {amount: -1583 , sales_order_id: 14, accounting_type_id: 2, movement_type_id: 2, created_at: '2021-04-12'},
        {amount: 1500 , sales_order_id: 14, accounting_type_id: 2, movement_type_id: 2, created_at: '2021-04-12', payment_method_id:1},

        {amount: -1888 , sales_order_id: 15, accounting_type_id: 2, movement_type_id: 2, created_at: '2021-06-12'}, //refunds below
        {amount: 1783 , sales_order_id: 15, accounting_type_id: 2, movement_type_id: 2, created_at: '2021-04-12', payment_method_id:1},
        {amount: -80 , sales_order_id: 15, accounting_type_id: 2, movement_type_id: 3, created_at: '2021-06-13'},

        {amount: -954 , sales_order_id: 16, accounting_type_id: 2, movement_type_id: 2, created_at: '2021-08-12'},
        {amount: 854 , sales_order_id: 16, accounting_type_id: 2, movement_type_id: 2, created_at: '2021-08-12', payment_method_id:1},
        {amount: -204 , sales_order_id: 16, accounting_type_id: 2, movement_type_id: 3, created_at: '2021-08-12'},

        {amount: -816 , sales_order_id: 17, accounting_type_id: 2, movement_type_id: 2, created_at: '2021-10-12'},
        {amount: 716 , sales_order_id: 17, accounting_type_id: 2, movement_type_id: 2, created_at: '2021-10-12', payment_method_id:1},
        {amount: -16 , sales_order_id: 17, accounting_type_id: 2, movement_type_id: 3, created_at: '2021-10-12'},

        {amount: -2140.2 , sales_order_id: 18, accounting_type_id: 2, movement_type_id: 2, created_at: '2021-12-12'},
        {amount: 1500.2 , sales_order_id: 18, accounting_type_id: 2, movement_type_id: 2, created_at: '2021-12-12', payment_method_id:1},
        {amount: -40.2 , sales_order_id: 18, accounting_type_id: 2, movement_type_id: 3, created_at: '2021-12-12'},

        {amount: -1953 , sales_order_id: 19, accounting_type_id: 2, movement_type_id: 2, created_at: '2021-12-12'},
        {amount: 1253 , sales_order_id: 19, accounting_type_id: 2, movement_type_id: 2, created_at: '2021-12-12', payment_method_id:1},
        {amount: -53 , sales_order_id: 19, accounting_type_id: 2, movement_type_id: 2, created_at: '2021-12-12'},

        {amount: -2570 , sales_order_id: 20, accounting_type_id: 2, movement_type_id: 2, created_at: '2021-12-12'},
        {amount: 2070 , sales_order_id: 20, accounting_type_id: 2, movement_type_id: 2, created_at: '2021-12-12', payment_method_id:1},
        {amount: -70 , sales_order_id: 20, accounting_type_id: 2, movement_type_id: 2, created_at: '2021-12-12'},
       

      ]); 







      

      const {ExpensesType} = require('../models/Expenses');
      await ExpensesType.bulkCreate(Object.keys(ExpensesTypeEnum).map(key => ExpensesTypeEnum[key]));
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