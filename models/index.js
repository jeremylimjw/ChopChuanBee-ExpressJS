// const Customer = require('./customer.model');
const { sequelize } = require('../db');

module.exports = async function() {
    /**
     * Avoid creating one js file for each entity. E.g. Employee and ChargedUnderEnum can be combined in the same file.
     * Import your model here. This will let the server create a table based on ur model on startup.
     * Specify your associations here also
     */
    const { Employee, Role , AccessRight } = require('./Employee');

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

    await sequelize.sync(); // This will create tables if not exists
    // await sequelize.sync({ force: true }); // ONLY USE THIS FOR TESTING. This will ALWAYS drop tables and then create

}

