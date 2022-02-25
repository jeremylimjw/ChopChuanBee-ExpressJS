const { sequelize } = require('../db');

/**
 * Avoid creating one js file for each entity. E.g. Employee and ChargedUnderEnum can be combined in the same file.
 * Import your model here. This will let the server create a table based on ur model on startup.
 */
const { Employee, Role } = require('./Employee');
const { AccessRight } = require('./AccessRight');
const View = require('./View');
const Log = require('./Log');
const { Product } = require('./Product');
const { Customer, CustomerMenu, ChargedUnder } = require('./Customer');
const { Supplier, SupplierMenu } = require('./Supplier');
const { LeaveAccount, LeaveType } = require('./LeaveAccount');
const { LeaveApplication, LeaveStatus } = require('./LeaveApplication');

module.exports = {
    // Update this when got new models. This is needed for dynamic query associations
    getModel: (name) => {
        switch (name) {
            case 'employee': return Employee;
            case 'access_right': return AccessRight;
            case 'role': return Role;
            case 'customer': return Customer;
            case 'leave_account': return LeaveAccount;
            case 'leave_application': return LeaveApplication;
            case 'leave_type': return LeaveType;
            case 'leave_status': return LeaveStatus;
            case 'log': return Log;
            case 'product': return Product;
            case 'supplier': return Supplier;
            case 'supplier_menu': return SupplierMenu;
            case 'view': return View;
            case 'customer_menu': return CustomerMenu;
            case 'charged_under': return ChargedUnder;
            default: return null;
        }
    },
    syncAssociations,
}

// Specify your associations here
async function syncAssociations() {
   
    // 1-M association
    Role.hasMany(Employee, { foreignKey: { allowNull: false, name: 'role_id' }});
    Employee.belongsTo(Role, { foreignKey: { allowNull: false, name: 'role_id' }});
    
    // M-M association
    Employee.belongsToMany(View, { through: AccessRight, foreignKey: { allowNull: false, name: 'employee_id' } });
    View.belongsToMany(Employee, { through: AccessRight, foreignKey: { allowNull: false, name: 'view_id' } });
    Employee.hasMany(AccessRight, { foreignKey: { allowNull: false, name: 'employee_id' }});
    AccessRight.belongsTo(Employee, { foreignKey: { allowNull: false, name: 'employee_id' }});
    View.hasMany(AccessRight, { foreignKey: { allowNull: false, name: 'view_id' }});
    AccessRight.belongsTo(View, { foreignKey: { allowNull: false, name: 'view_id' }});
    
    // M-M association
    Employee.hasMany(Log, { foreignKey: { allowNull: false, name: 'employee_id' }});
    Log.belongsTo(Employee, { foreignKey: { allowNull: false, name: 'employee_id' }});
    View.hasMany(Log, { foreignKey: { allowNull: false, name: 'view_id' }});
    Log.belongsTo(View, { foreignKey: { allowNull: false, name: 'view_id' }});

    // 1-M association
    ChargedUnder.hasMany(Customer, { foreignKey: { name: 'charged_under_id' }}); // Foreign key defaults to chargedUnderId, change to standardize
    Customer.belongsTo(ChargedUnder, { foreignKey: { name: 'charged_under_id' }});

    // M-M association
    Customer.hasMany(CustomerMenu, { foreignKey: { allowNull: false, name: 'customer_id' }});
    CustomerMenu.belongsTo(Customer, { foreignKey: { allowNull: false, name: 'customer_id' }});
    Product.hasMany(CustomerMenu, { foreignKey: { allowNull: false, name: 'product_id' }});
    CustomerMenu.belongsTo(Product, { foreignKey: { allowNull: false, name: 'product_id' }});

    // M-M association
    Supplier.belongsToMany(Product, { through: SupplierMenu, foreignKey: { allowNull: false, name: 'supplier_id' } });
    Product.belongsToMany(Supplier, { through: SupplierMenu, foreignKey: { allowNull: false, name: 'product_id' } });
    Supplier.hasMany(SupplierMenu, { foreignKey: { allowNull: false, name: 'supplier_id' }});
    SupplierMenu.belongsTo(Supplier, { foreignKey: { allowNull: false, name: 'supplier_id' }});
    Product.hasMany(SupplierMenu, { foreignKey: { allowNull: false, name: 'product_id' }});
    SupplierMenu.belongsTo(Product, { foreignKey: { allowNull: false, name: 'product_id' }});

    // 1 - M association
    Employee.hasMany(LeaveAccount, { foreignKey: { allowNull: false, name: 'employee_id' }});
    LeaveAccount.belongsTo(Employee, { foreignKey: { allowNull: false, name: 'employee_id' }});

    // 1 - M association
    LeaveType.hasMany(LeaveAccount, { foreignKey: { allowNull: false, name: 'leave_type_id' }});
    LeaveAccount.belongsTo(LeaveType,  { foreignKey: { allowNull: false, name: 'leave_type_id' }});

    // 1 - M association
    LeaveAccount.hasMany(LeaveApplication, { foreignKey: { allowNull: false, name: 'leave_account_id' }});
    LeaveApplication.belongsTo(LeaveAccount, { foreignKey: { allowNull: false, name: 'leave_account_id' }});

    // 1 - M association
    LeaveStatus.hasMany(LeaveApplication, { foreignKey: { allowNull: false, name: 'leave_status_id' }});
    LeaveApplication.belongsTo(LeaveStatus,  { foreignKey: { allowNull: false, name: 'leave_status_id' }});
    
    await sequelize.sync(); // This will create tables if not exists
    // await sequelize.sync({ force: true }); // ONLY USE THIS FOR TESTING. This will ALWAYS drop tables and then create
    
}

