// const Customer = require('./customer.model');
const { sequelize } = require('../db');

module.exports = async function() {
    /**
     * Avoid creating one js file for each entity. E.g. Employee and ChargedUnderEnum can be combined in the same file.
     * Import your model here. This will let the server create a table based on ur model on startup.
     * Specify your associations here also
     */
    const { Employee, Role } = require('./Employee');
    const { AccessRight } = require('./AccessRight');
   
    // 1-M association
    Role.hasMany(Employee, { foreignKey: { allowNull: false, name: 'role_id' }});
    Employee.belongsTo(Role, { foreignKey: { allowNull: false, name: 'role_id' }});
   
    const View = require('./View');
    
    // M-M association
    Employee.belongsToMany(View, { through: AccessRight, foreignKey: { allowNull: false, name: 'employee_id' } });
    View.belongsToMany(Employee, { through: AccessRight, foreignKey: { allowNull: false, name: 'view_id' } });
    Employee.hasMany(AccessRight, { foreignKey: { allowNull: false, name: 'employee_id' }});
    AccessRight.belongsTo(Employee, { foreignKey: { allowNull: false, name: 'employee_id' }});
    View.hasMany(AccessRight, { foreignKey: { allowNull: false, name: 'view_id' }});
    AccessRight.belongsTo(View, { foreignKey: { allowNull: false, name: 'view_id' }});

    const Log = require('./Log');
    
    // M-M association
    Employee.hasMany(Log, { foreignKey: { allowNull: false, name: 'employee_id' }});
    Log.belongsTo(Employee, { foreignKey: { allowNull: false, name: 'employee_id' }});
    View.hasMany(Log, { foreignKey: { allowNull: false, name: 'view_id' }});
    Log.belongsTo(View, { foreignKey: { allowNull: false, name: 'view_id' }});

    const { Customer, ChargedUnder } = require('./Customer');

    // 1-M association
    ChargedUnder.hasMany(Customer, { foreignKey: { allowNull: false, name: 'charged_under_id' }}); // Foreign key defaults to chargedUnderId, change to standardize
    Customer.belongsTo(ChargedUnder, { foreignKey: { allowNull: false, name: 'charged_under_id' }});

    const { Supplier } = require('./Supplier');
    const { Product } = require('./Product');
    
    const { LeaveAccount, LeaveType } = require('./LeaveAccount');
    const { LeaveApplication, LeaveStatus } = require('./LeaveApplication');

    //1 - Many
    Employee.hasMany(LeaveAccount, { foreignKey: { allowNull: false, name: 'employee_id' }});
    LeaveAccount.belongsTo(Employee, { foreignKey: { allowNull: false, name: 'employee_id' }});

    LeaveType.hasMany(LeaveAccount, { foreignKey: { allowNull: false, name: 'leave_type_id' }});
    LeaveAccount.belongsTo(LeaveType,  { foreignKey: { allowNull: false, name: 'leave_type_id' }});

    LeaveAccount.hasMany(LeaveApplication, { foreignKey: { allowNull: false, name: 'leave_account_id' }});
    LeaveApplication.belongsTo(LeaveAccount, { foreignKey: { allowNull: false, name: 'leave_account_id' }});

    LeaveStatus.hasMany(LeaveApplication, { foreignKey: { allowNull: false, name: 'leave_status_id' }});
    LeaveApplication.belongsTo(LeaveStatus,  { foreignKey: { allowNull: false, name: 'leave_status_id' }});

    const { PurchaseOrder, PurchaseOrderItem, PaymentTerm, POStatus } = require('../models/PurchaseOrder');

    PaymentTerm.hasMany(PurchaseOrder, { foreignKey: { allowNull: false, name: 'payment_term_id' }});
    PurchaseOrder.belongsTo(PaymentTerm, { foreignKey: { allowNull: false, name: 'payment_term_id' }});

    POStatus.hasMany(PurchaseOrder, { foreignKey: { allowNull: false, name: 'purchase_order_status_id' }});
    PurchaseOrder.belongsTo(POStatus, { foreignKey: { allowNull: false, name: 'purchase_order_status_id' }});

    PurchaseOrder.hasMany(PurchaseOrderItem, { foreignKey: { allowNull: false, name: 'purchase_order_id' }});
    PurchaseOrderItem.belongsTo(PurchaseOrder, { foreignKey: { allowNull: false, name: 'purchase_order_id' }});

    Supplier.hasMany(PurchaseOrder, { foreignKey: { allowNull: false, name: 'supplier_id' }});
    PurchaseOrder.belongsTo(Supplier, { foreignKey: { allowNull: false, name: 'supplier_id' }});

    const { InventoryMovement } = require('../models/InventoryMovement');
    const { Payment, PaymentMethod, AccountingType } = require('../models/Payment');

    PurchaseOrderItem.hasOne(InventoryMovement, { foreignKey: { name: 'purchase_order_item_id' }});
    InventoryMovement.belongsTo(PurchaseOrderItem, { foreignKey: { name: 'purchase_order_item_id' }});

    PurchaseOrder.hasMany(Payment, { foreignKey: { allowNull: false, name: 'purchase_order_id' }});
    Payment.belongsTo(PurchaseOrder, { foreignKey: { allowNull: false, name: 'purchase_order_id' }});

    PaymentMethod.hasMany(Payment, { foreignKey: { allowNull: false, name: 'payment_method_id' }});
    Payment.belongsTo(PaymentMethod, { foreignKey: { allowNull: false, name: 'payment_method_id' }});

    AccountingType.hasMany(Payment, { foreignKey: { name: 'accounting_type_id' }});
    Payment.belongsTo(AccountingType, { foreignKey: { name: 'accounting_type_id' }});
    
    const { MovementType } = require('../models/MovementType');

    MovementType.hasMany(Payment, { foreignKey: { allowNull: false, name: 'movement_type_id' }});
    Payment.belongsTo(MovementType, { foreignKey: { allowNull: false, name: 'movement_type_id' }});

    MovementType.hasMany(InventoryMovement, { foreignKey: { allowNull: false, name: 'movement_type_id' }});
    InventoryMovement.belongsTo(MovementType, { foreignKey: { allowNull: false, name: 'movement_type_id' }});
 
    
    // await sequelize.sync(); // This will create tables if not exists
    await sequelize.sync({ force: true }); // ONLY USE THIS FOR TESTING. This will ALWAYS drop tables and then create

    
}

