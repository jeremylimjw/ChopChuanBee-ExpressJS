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

    const Supplier = require('./Supplier');
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
    
 
    
    // await sequelize.sync(); // This will create tables if not exists
    await sequelize.sync({ force: true }); // ONLY USE THIS FOR TESTING. This will ALWAYS drop tables and then create

    
}

