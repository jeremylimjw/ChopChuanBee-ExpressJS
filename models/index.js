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
const { DeliveryOrder } = require('./DeliveryOrder');
const { ProductCatalogueItem, MenuCategory } = require('./ProductCatalogueItem')

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
            case 'product_catalogue_item' : return ProductCatalogueItem;
            case 'menu_category' : return MenuCategory;
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

    const { PurchaseOrder, PurchaseOrderItem, PaymentTerm, POStatus } = require('../models/PurchaseOrder');

    // 1-M association
    PaymentTerm.hasMany(PurchaseOrder, { foreignKey: { name: 'payment_term_id' }});
    PurchaseOrder.belongsTo(PaymentTerm, { foreignKey: { name: 'payment_term_id' }});

    // 1-M association
    POStatus.hasMany(PurchaseOrder, { foreignKey: { allowNull: false, name: 'purchase_order_status_id' }});
    PurchaseOrder.belongsTo(POStatus, { foreignKey: { allowNull: false, name: 'purchase_order_status_id' }});

    // 1-M association
    Supplier.hasMany(PurchaseOrder, { foreignKey: { allowNull: false, name: 'supplier_id' }});
    PurchaseOrder.belongsTo(Supplier, { foreignKey: { allowNull: false, name: 'supplier_id' }});

    // 1-M association
    PurchaseOrder.hasMany(PurchaseOrderItem, { foreignKey: { allowNull: false, name: 'purchase_order_id' }});
    PurchaseOrderItem.belongsTo(PurchaseOrder, { foreignKey: { allowNull: false, name: 'purchase_order_id' }});

    // 1-M association
    Product.hasMany(PurchaseOrderItem, { foreignKey: { allowNull: false, name: 'product_id' }});
    PurchaseOrderItem.belongsTo(Product, { foreignKey: { allowNull: false, name: 'product_id' }});

    // 1-M association
    ChargedUnder.hasMany(PurchaseOrder, { foreignKey: { name: 'charged_under_id' }});
    PurchaseOrder.belongsTo(ChargedUnder, { foreignKey: { name: 'charged_under_id' }});

    const { InventoryMovement } = require('../models/InventoryMovement');
    const { Payment, PaymentMethod, AccountingType } = require('../models/Payment');

    // 1-M association
    PaymentMethod.hasMany(PurchaseOrder, { foreignKey: { name: 'payment_method_id' }});
    PurchaseOrder.belongsTo(PaymentMethod, { foreignKey: { name: 'payment_method_id' }});

    // 1-M association
    Product.hasMany(InventoryMovement, { foreignKey: { allowNull: false, name: 'product_id' }});
    InventoryMovement.belongsTo(Product, { foreignKey: { allowNull: false, name: 'product_id' }});

    // 1-M association
    PurchaseOrderItem.hasMany(InventoryMovement, { foreignKey: { name: 'purchase_order_item_id' }});
    InventoryMovement.belongsTo(PurchaseOrderItem, { foreignKey: { name: 'purchase_order_item_id' }});

    // 1-M association
    PurchaseOrder.hasMany(Payment, { foreignKey: { name: 'purchase_order_id' }});
    Payment.belongsTo(PurchaseOrder, { foreignKey: { name: 'purchase_order_id' }});

    // 1-M association
    PaymentMethod.hasMany(Payment, { foreignKey: { name: 'payment_method_id' }});
    Payment.belongsTo(PaymentMethod, { foreignKey: { name: 'payment_method_id' }});

    // 1-M association
    AccountingType.hasMany(Payment, { foreignKey: { name: 'accounting_type_id' }});
    Payment.belongsTo(AccountingType, { foreignKey: { name: 'accounting_type_id' }});
    
    const { MovementType } = require('../models/MovementType');

    // 1-M association
    MovementType.hasMany(Payment, { foreignKey: { allowNull: false, name: 'movement_type_id' }});
    Payment.belongsTo(MovementType, { foreignKey: { allowNull: false, name: 'movement_type_id' }});

    // 1-M association
    MovementType.hasMany(InventoryMovement, { foreignKey: { allowNull: false, name: 'movement_type_id' }});
    InventoryMovement.belongsTo(MovementType, { foreignKey: { allowNull: false, name: 'movement_type_id' }});
    
    const { SalesOrder, SalesOrderItem } = require('../models/SalesOrder');

    PaymentTerm.hasMany(SalesOrder, { foreignKey: { name: 'payment_term_id' }});
    SalesOrder.belongsTo(PaymentTerm, { foreignKey: { name: 'payment_term_id' }});

    SalesOrder.hasMany(SalesOrderItem, { foreignKey: { allowNull: false, name: 'sales_order_id' }});
    SalesOrderItem.belongsTo(SalesOrder, { foreignKey: { allowNull: false, name: 'sales_order_id' }});

    Product.hasMany(SalesOrderItem, { foreignKey: { allowNull: false, name: 'product_id' }});
    SalesOrderItem.belongsTo(Product, { foreignKey: { allowNull: false, name: 'product_id' }});

    SalesOrderItem.hasMany(InventoryMovement, { foreignKey: { name: 'sales_order_item_id' }});
    InventoryMovement.belongsTo(SalesOrderItem, { foreignKey: { name: 'sales_order_item_id' }});

    Customer.hasMany(SalesOrder, { foreignKey: { allowNull: false, name: 'customer_id' }});
    SalesOrder.belongsTo(Customer, { foreignKey: { allowNull: false, name: 'customer_id' }});

    SalesOrder.hasMany(Payment, { foreignKey: { name: 'sales_order_id' }});
    Payment.belongsTo(SalesOrder, { foreignKey: { name: 'sales_order_id' }});
 
    // 1-M association
    PaymentMethod.hasMany(SalesOrder, { foreignKey: { name: 'payment_method_id' }});
    SalesOrder.belongsTo(PaymentMethod, { foreignKey: { name: 'payment_method_id' }});

    // 1-M association
    ChargedUnder.hasMany(SalesOrder, { foreignKey: { name: 'charged_under_id' }});
    SalesOrder.belongsTo(ChargedUnder, { foreignKey: { name: 'charged_under_id' }});

    // 1-M association
    POStatus.hasMany(SalesOrder, { foreignKey: { allowNull: false, name: 'sales_order_status_id' }});
    SalesOrder.belongsTo(POStatus, { foreignKey: { allowNull: false, name: 'sales_order_status_id' }});

    const { DeliveryOrder, DeliveryStatus } = require('../models/DeliveryOrder');

    // 1-1 association
    SalesOrder.hasOne(DeliveryOrder, { foreignKey: { name: 'sales_order_id' }});
    DeliveryOrder.belongsTo(SalesOrder, { foreignKey: { name: 'sales_order_id' }});

    // 1-1 association
    DeliveryStatus.hasOne(DeliveryOrder, { foreignKey: { allowNull: false, name: 'delivery_status_id' }});
    DeliveryOrder.belongsTo(DeliveryStatus, { foreignKey: { allowNull: false, name: 'delivery_status_id' }});

    const { Itinerary } = require('../models/Itinerary');

    // 1-M association
    Employee.hasMany(Itinerary, { foreignKey: { allowNull: false, name: 'driver_id' }});
    Itinerary.belongsTo(Employee, { foreignKey: { allowNull: false, name: 'driver_id' }});

    // 1-M association
    Itinerary.hasMany(DeliveryOrder, { foreignKey: { name: 'itinerary_id' }});
    DeliveryOrder.belongsTo(Itinerary, { foreignKey: { name: 'itinerary_id' }});

    const { Channel, Text, Participant } = require('../models/Chat');

    // 1-M association
    Employee.hasMany(Text, { foreignKey: { allowNull: false, name: 'employee_id' }});
    Text.belongsTo(Employee, { foreignKey: { allowNull: false, name: 'employee_id' }});

    // 1-M association
    Employee.hasMany(Channel, { foreignKey: { allowNull: false, name: 'owner_id' }});
    Channel.belongsTo(Employee, { foreignKey: { allowNull: false, name: 'owner_id' }});

    // M-M association
    Employee.belongsToMany(Channel, { through: Participant, foreignKey: { allowNull: false, name: 'employee_id' } });
    Channel.belongsToMany(Employee, { through: Participant, foreignKey: { allowNull: false, name: 'channel_id' } });
    Employee.hasMany(Participant, { foreignKey: { allowNull: false, name: 'employee_id' }});
    Participant.belongsTo(Employee, { foreignKey: { allowNull: false, name: 'employee_id' }});
    Channel.hasMany(Participant, { foreignKey: { allowNull: false, name: 'channel_id' }});
    Participant.belongsTo(Channel, { foreignKey: { allowNull: false, name: 'channel_id' }});

    // 1-M association
    Channel.hasMany(Text, { foreignKey: { allowNull: false, name: 'channel_id' }});
    Text.belongsTo(Channel, { foreignKey: { allowNull: false, name: 'channel_id' }});
  
    const SOFP = require('../models/SOFP');
    const IncomeStatement = require('../models/IncomeStatement');
   
    // 1-M association
    MenuCategory.hasMany(ProductCatalogueItem, { foreignKey: {  name: 'menu_category_id' }});
    ProductCatalogueItem.belongsTo(MenuCategory, { foreignKey: {  name: 'menu_category_id' }});
    
    // 1-1 association
    Product.hasOne(ProductCatalogueItem, { foreignKey: { name: 'product_id' }});
    ProductCatalogueItem.belongsTo(Product, { foreignKey: {  name: 'product_id' }});


    await sequelize.sync(); // This will create tables if not exists
    // await sequelize.sync({ force: true }); // ONLY USE THIS FOR TESTING. This will ALWAYS drop tables and then create
    // await sequelize.sync({ alter: true }); // ONLY USE THIS FOR TESTING. This checks what is the current state of the table in the database (which columns it has, what are their data types, etc), and then performs the necessary changes in the table to make it match the model.
    
}

