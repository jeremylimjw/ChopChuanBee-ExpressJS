const { ChargedUnder, Customer } = require("../models/Customer");
const { InventoryMovement } = require("../models/InventoryMovement");
const { Payment } = require("../models/Payment");
const { Product } = require("../models/Product");
const { PurchaseOrderItem, PurchaseOrder } = require("../models/PurchaseOrder");
const { SalesOrder, SalesOrderItem } = require("../models/SalesOrder");
const { Supplier } = require("../models/Supplier");

async function initAnalytics() {
  const suppliers = await Supplier.findAll();
  const products = await Product.findAll();
  const chargedUnders = await ChargedUnder.findAll();
  const ccb = chargedUnders[0];
  const cbfs = chargedUnders[1];

  const heng = suppliers[0];

  await PurchaseOrder.bulkCreate([
    { payment_term_id: 2, purchase_order_status_id: 2, supplier_id: heng.id, charged_under_id : ccb.id },
  ]); 

  const ikanBilis = products[0];

  await PurchaseOrderItem.bulkCreate([
    { unit_cost: 1,  quantity: 20, purchase_order_id: 1, product_id: ikanBilis.id }
  ]); 

  await Payment.bulkCreate([
    { amount: 100, purchase_order_id: 1, accounting_type_id: 1, movement_type_id:1 },
    { amount: -50, purchase_order_id: 1, payment_method_id:1, accounting_type_id: 1, movement_type_id:1 },
  ]); 

  const lineItem = await PurchaseOrderItem.findOne({ where: { product_id: ikanBilis.id } });
  
  await InventoryMovement.bulkCreate([
    { unit_cost: 1, quantity: 20, purchase_order_item_id: lineItem.id, movement_type_id: 1 , product_id : lineItem.product_id },
    { unit_cost: 2, quantity: 70, purchase_order_item_id: lineItem.id, movement_type_id: 1 , product_id : lineItem.product_id },
    { unit_cost: 1, quantity: -30, purchase_order_item_id: lineItem.id, movement_type_id: 2 , product_id : lineItem.product_id }
  ]); 
    
  //>>> For analytics - Supplier ['company_name', 's1_name', 's1_phone_number', 'address', 'postal_code']
  const supplier1 = suppliers[0];
  const supplier2 = suppliers[1];
  const supplier3 = suppliers[2];
  const supplier4 = suppliers[3];
  const supplier5 = suppliers[4];
  const supplier6 = suppliers[5];
  const supplier7 = suppliers[6];
  const supplier8 = suppliers[7];
  const supplier9 = suppliers[8];
  const supplier10 = suppliers[9];
  const supplier11 = suppliers[10];
  const supplier12 = suppliers[11];
  const supplier13 = suppliers[12];
  const supplier14 = suppliers[13];
  const supplier15 = suppliers[14];
  const supplier16 = suppliers[15];
  const supplier17 = suppliers[16];
  const supplier18 = suppliers[17];
  const supplier19 = suppliers[18];
  const supplier20 = suppliers[19];

  //For analytics - Customer ['id', 'company_name', 'p1_name', 'p1_phone_number', 'address', 'postal_code', 'charged_under_id', 'gst', 'gst_show']  
  const customers = await Customer.findAll();

  const customer1 = customers[0];
  const customer2 = customers[1];
  const customer3 = customers[2];
  const customer4 = customers[3];
  const customer5 = customers[4];
  const customer6 = customers[5];
  const customer7 = customers[6];
  const customer8 = customers[7];
  const customer9 = customers[8];
  const customer10 = customers[9];
  const customer11 = customers[10];
  const customer12 = customers[11];
  const customer13 = customers[12];
  const customer14 = customers[13];
  const customer15 = customers[14];
  const customer16 = customers[15];
  const customer17 = customers[16];
  const customer18 = customers[17];
  const customer19 = customers[18];
  const customer20 = customers[19];

  //Analytics - Products
  const product1 = products[0];
  const product2 = products[1];
  const product3 = products[2];
  const product4 = products[3];
  const product5 = products[4];
  const product6 = products[5];
  const product7 = products[6];
  const product8 = products[7];
  const product9 = products[8];
  const product10 = products[9];

  // Analytics - Purchase Order
  const pos = await PurchaseOrder.bulkCreate([
    { payment_term_id: 2, purchase_order_status_id: 2, supplier_id: supplier1.id, created_at: '2021-01-01' , gst_rate: 7, offset: 2 , charged_under_id : ccb.id}, // credit payment term
    { payment_term_id: 2, purchase_order_status_id: 2, supplier_id: supplier1.id, created_at: '2021-01-01' , gst_rate: 7, offset: 2 , charged_under_id : ccb.id},
    { payment_term_id: 2, purchase_order_status_id: 2, supplier_id: supplier2.id, created_at: '2021-02-01', gst_rate: 0, offset: 2, charged_under_id : ccb.id  },
    { payment_term_id: 2, purchase_order_status_id: 2, supplier_id: supplier2.id, created_at: '2021-02-01', gst_rate: 7, offset: 0, charged_under_id : ccb.id  },
    { payment_term_id: 2, purchase_order_status_id: 2, supplier_id: supplier3.id, created_at: '2021-03-01', gst_rate: 7, offset: 2, charged_under_id : ccb.id  },
    { payment_term_id: 2, purchase_order_status_id: 2, supplier_id: supplier3.id, created_at: '2021-03-01', gst_rate: 0, offset: 2, charged_under_id : ccb.id },
    { payment_term_id: 2, purchase_order_status_id: 2, supplier_id: supplier4.id, created_at: '2021-04-01' , gst_rate: 7, offset: 2, charged_under_id : ccb.id },
    { payment_term_id: 2, purchase_order_status_id: 2, supplier_id: supplier4.id, created_at: '2021-04-01', gst_rate: 7, offset: 0, charged_under_id : ccb.id  },
    { payment_term_id: 2, purchase_order_status_id: 2, supplier_id: supplier5.id, created_at: '2021-05-01' , gst_rate: 7, offset: 2, charged_under_id : ccb.id },
    { payment_term_id: 2, purchase_order_status_id: 2, supplier_id: supplier5.id, created_at: '2021-05-01', gst_rate: 0, offset: 2, charged_under_id : ccb.id  },
    { payment_term_id: 2, purchase_order_status_id: 2, supplier_id: supplier6.id, created_at: '2021-06-01', gst_rate: 7, offset: 2, charged_under_id : ccb.id  },
    { payment_term_id: 2, purchase_order_status_id: 2, supplier_id: supplier6.id, created_at: '2021-06-01', gst_rate: 0, offset: 0, charged_under_id : ccb.id  },
    { payment_term_id: 2, purchase_order_status_id: 2, supplier_id: supplier7.id, created_at: '2021-07-01' , gst_rate: 7, offset: 2, charged_under_id : ccb.id },
    { payment_term_id: 2, purchase_order_status_id: 2, supplier_id: supplier7.id, created_at: '2021-07-01' , gst_rate: 7, offset: 2, charged_under_id : ccb.id },
    { payment_term_id: 2, purchase_order_status_id: 2, supplier_id: supplier8.id, created_at: '2021-08-01' , gst_rate: 11, offset: 0, charged_under_id : ccb.id },
    { payment_term_id: 2, purchase_order_status_id: 2, supplier_id: supplier8.id, created_at: '2021-08-01' , gst_rate: 7, offset: 2, charged_under_id : ccb.id },
    { payment_term_id: 2, purchase_order_status_id: 2, supplier_id: supplier9.id, created_at: '2021-09-01' , gst_rate: 7, offset: 0, charged_under_id : ccb.id },
    { payment_term_id: 2, purchase_order_status_id: 2, supplier_id: supplier9.id, created_at: '2021-09-01' , gst_rate: 7, offset: 2, charged_under_id : ccb.id },
    { payment_term_id: 2, purchase_order_status_id: 2, supplier_id: supplier10.id, created_at: '2021-10-01' , gst_rate: 7, offset: 2, charged_under_id : ccb.id },
    { payment_term_id: 2, purchase_order_status_id: 2, supplier_id: supplier10.id, created_at: '2021-10-01' , gst_rate: 7, offset: 0, charged_under_id : ccb.id },
    { payment_term_id: 2, purchase_order_status_id: 2, supplier_id: supplier11.id, created_at: '2021-11-01' , gst_rate: 7, offset: 2, charged_under_id : ccb.id },
    { payment_term_id: 2, purchase_order_status_id: 2, supplier_id: supplier11.id, created_at: '2021-11-01' , gst_rate: 7, offset: 2, charged_under_id : ccb.id },
    { payment_term_id: 2, purchase_order_status_id: 2, supplier_id: supplier12.id, created_at: '2021-12-01', gst_rate: 7, offset: 2, charged_under_id : ccb.id  },
    { payment_term_id: 2, purchase_order_status_id: 2, supplier_id: supplier12.id, created_at: '2021-12-01' , gst_rate: 7, offset: 2, charged_under_id : ccb.id },
    { payment_term_id: 2, purchase_order_status_id: 2, supplier_id: supplier13.id, created_at: '2021-01-01' , gst_rate: 7, offset: 2, charged_under_id : ccb.id },
    { payment_term_id: 2, purchase_order_status_id: 2, supplier_id: supplier13.id, created_at: '2021-01-01' , gst_rate: 7, offset: 2, charged_under_id : ccb.id },
    { payment_term_id: 2, purchase_order_status_id: 2, supplier_id: supplier14.id, created_at: '2021-02-01' , gst_rate: 7, offset: 2, charged_under_id : ccb.id },
    { payment_term_id: 2, purchase_order_status_id: 2, supplier_id: supplier14.id, created_at: '2021-02-01' , gst_rate: 7, offset: 2, charged_under_id : ccb.id },
    { payment_term_id: 2, purchase_order_status_id: 2, supplier_id: supplier15.id, created_at: '2021-03-01', gst_rate: 7, offset: 2, charged_under_id : ccb.id  },
    { payment_term_id: 2, purchase_order_status_id: 2, supplier_id: supplier15.id, created_at: '2021-03-01' , gst_rate: 7, offset: 2, charged_under_id : ccb.id },
    { payment_term_id: 1, purchase_order_status_id: 2, supplier_id: supplier16.id, created_at: '2021-04-01' , gst_rate: 7, offset: 2, charged_under_id : ccb.id }, //cash payment term for supplier 16 to 20, PO no 16 to 20  
    { payment_term_id: 1, purchase_order_status_id: 2, supplier_id: supplier16.id, created_at: '2021-04-01' , gst_rate: 7, offset: 2, charged_under_id : ccb.id },
    { payment_term_id: 1, purchase_order_status_id: 2, supplier_id: supplier17.id, created_at: '2021-05-01' , gst_rate: 7, offset: 2, charged_under_id : ccb.id },
    { payment_term_id: 1, purchase_order_status_id: 2, supplier_id: supplier17.id, created_at: '2021-05-01' , gst_rate: 7, offset: 2, charged_under_id : ccb.id },
    { payment_term_id: 1, purchase_order_status_id: 2, supplier_id: supplier18.id, created_at: '2021-06-01' , gst_rate: 7, offset: 2, charged_under_id : ccb.id },
    { payment_term_id: 1, purchase_order_status_id: 2, supplier_id: supplier18.id, created_at: '2021-06-01' , gst_rate: 7, offset: 2, charged_under_id : ccb.id },
    { payment_term_id: 1, purchase_order_status_id: 2, supplier_id: supplier19.id, created_at: '2021-07-01' , gst_rate: 7, offset: 2, charged_under_id : ccb.id },
    { payment_term_id: 1, purchase_order_status_id: 2, supplier_id: supplier19.id, created_at: '2021-07-01' , gst_rate: 7, offset: 2, charged_under_id : ccb.id },
    { payment_term_id: 1, purchase_order_status_id: 2, supplier_id: supplier20.id, created_at: '2021-08-01' , gst_rate: 7, offset: 2, charged_under_id : ccb.id },
    { payment_term_id: 1, purchase_order_status_id: 2, supplier_id: supplier20.id, created_at: '2021-08-01' , gst_rate: 11, offset: 0, charged_under_id : ccb.id }
  ]); 

  const pois = await PurchaseOrderItem.bulkCreate([
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

  const po1a = pois[0];
  const po1b = pois[1];
  const po2a = pois[2];
  const po2b = pois[3];
  const po3a = pois[4];
  const po3b = pois[5];
  const po4a = pois[6];
  const po4b = pois[7];
  const po5a = pois[8];
  const po5b = pois[9];
  const po6a = pois[10];
  const po6b = pois[11];
  const po7a = pois[12];
  const po7b = pois[13];
  const po8a = pois[14];
  const po8b = pois[15];
  const po9a = pois[16];
  const po9b = pois[17];
  const po10a = pois[18];
  const po10b = pois[19];
  const po11a = pois[20];
  const po11b = pois[21];
  const po12a = pois[22];
  const po12b = pois[23];
  const po13a = pois[24];
  const po13b = pois[25];
  const po14a = pois[26];
  const po14b = pois[27];
  const po15a = pois[28];
  const po15b = pois[29];
  const po16a = pois[30];
  const po16b = pois[31];
  const po17a = pois[32];
  const po17b = pois[33];
  const po18a = pois[34];
  const po18b = pois[35];
  const po19a = pois[36];
  const po19b = pois[37];
  const po20a = pois[38];
  const po20b = pois[39];

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
    { unit_cost: 1, quantity: 20, purchase_order_item_id: lineItem.id, movement_type_id: 1, product_id : lineItem.product_id },
    { unit_cost: 2, quantity: 70, purchase_order_item_id: lineItem.id, movement_type_id: 1 ,product_id : lineItem.product_id },
    { unit_cost: 1, quantity: -30, purchase_order_item_id: lineItem.id, movement_type_id: 2 ,product_id :lineItem.product_id},

    { unit_cost: 1.1,  quantity: 10 , purchase_order_item_id: po1a.id, movement_type_id: 2, created_at: '2021-01-02' , product_id : po1a.product_id}, //quantity = product id * 10, unit_cost = product id
    { unit_cost: 2.1,  quantity: 10 , purchase_order_item_id: po1b.id, movement_type_id: 2, created_at: '2021-01-02',  product_id : po1b.product_id },

    { unit_cost: 3.5,  quantity: 20 , purchase_order_item_id: po2a.id, movement_type_id: 2, created_at: '2021-02-02' , product_id : po2a.product_id},
    { unit_cost: 4.5,  quantity: 20 , purchase_order_item_id: po2b.id, movement_type_id: 2, created_at: '2021-02-02', product_id : po2b.product_id },

    { unit_cost: 5.9,  quantity: 30 , purchase_order_item_id: po3a.id, movement_type_id: 1, created_at: '2021-03-02' , product_id : po3a.product_id},
    { unit_cost: 6.2,  quantity: 30 , purchase_order_item_id: po3b.id, movement_type_id: 1, created_at: '2021-03-02' , product_id : po3b.product_id},

    { unit_cost: 7.2,  quantity: 40 , purchase_order_item_id: po4a.id, movement_type_id: 1, created_at: '2021-04-02' , product_id : po4a.product_id},
    { unit_cost: 8.5,  quantity: 40 , purchase_order_item_id: po4b.id, movement_type_id: 1, created_at: '2021-04-02' , product_id : po4b.product_id},

    { unit_cost: 9.2,  quantity: 50 , purchase_order_item_id: po5a.id, movement_type_id: 1, created_at: '2021-05-02' , product_id : po5a.product_id},
    { unit_cost: 0.9,  quantity: 50 , purchase_order_item_id: po5b.id, movement_type_id: 1, created_at: '2021-05-02' , product_id : po5b.product_id},

    { unit_cost: 2.5,  quantity: 60 , purchase_order_item_id: po6a.id, movement_type_id: 1, created_at: '2021-06-02' , product_id : po6a.product_id},
    { unit_cost: 3.1,  quantity: 60 , purchase_order_item_id: po6b.id, movement_type_id: 1, created_at: '2021-06-02' , product_id : po6b.product_id},

    { unit_cost: 4.2,  quantity: 70 , purchase_order_item_id: po7a.id, movement_type_id: 1, created_at: '2021-07-02' , product_id : po7a.product_id},
    { unit_cost: 5.2,  quantity: 70 , purchase_order_item_id: po7b.id, movement_type_id: 1, created_at: '2021-07-02' , product_id : po7b.product_id},

    { unit_cost: 6.3,  quantity: 80 , purchase_order_item_id: po8a.id, movement_type_id: 1, created_at: '2021-08-02' , product_id : po8a.product_id},
    { unit_cost: 7.2,  quantity: 80 , purchase_order_item_id: po8b.id, movement_type_id: 1, created_at: '2021-08-02' , product_id : po8b.product_id},

    { unit_cost: 8.5,  quantity: 90 , purchase_order_item_id: po9a.id, movement_type_id: 1, created_at: '2021-09-02' , product_id : po9a.product_id},
    { unit_cost: 9.5,  quantity: 90 , purchase_order_item_id: po9b.id, movement_type_id: 1, created_at: '2021-09-02' , product_id : po9b.product_id},

    { unit_cost: 10.2,  quantity: 100 , purchase_order_item_id: po10a.id, movement_type_id: 1, created_at: '2021-10-02' , product_id : po10a.product_id},
    { unit_cost: 1.2,  quantity: 100 , purchase_order_item_id: po10b.id, movement_type_id: 1, created_at: '2021-10-02' , product_id : po10b.product_id},

    { unit_cost: 2.5,  quantity: 110 , purchase_order_item_id: po11a.id, movement_type_id: 1, created_at: '2021-11-02'  , product_id : po11a.product_id},
    { unit_cost: 3.5,  quantity: 110 , purchase_order_item_id: po11b.id, movement_type_id: 1, created_at: '2021-11-02'  , product_id : po11b.product_id},

    { unit_cost: 4.1,  quantity: 120 , purchase_order_item_id: po12a.id, movement_type_id: 1, created_at: '2021-12-02'  , product_id : po12a.product_id},
    { unit_cost: 5.8,  quantity: 120 , purchase_order_item_id: po12b.id, movement_type_id: 1, created_at: '2021-12-02'  , product_id : po12b.product_id},

    { unit_cost: 6.2,  quantity: 130 , purchase_order_item_id: po13a.id, movement_type_id: 1 , created_at: '2021-01-02' , product_id : po13a.product_id},
    { unit_cost: 7.6,  quantity: 130 , purchase_order_item_id: po13b.id, movement_type_id: 1, created_at: '2021-01-02'  , product_id : po13b.product_id},

    { unit_cost: 8.5,  quantity: 140 , purchase_order_item_id: po14a.id, movement_type_id: 1, created_at: '2021-02-02'  , product_id : po14a.product_id},
    { unit_cost: 9.2,  quantity: 140 , purchase_order_item_id: po14b.id, movement_type_id: 1, created_at: '2021-02-02'  , product_id : po14b.product_id},

    { unit_cost: 10.5,  quantity: 150 , purchase_order_item_id: po15a.id, movement_type_id: 1, created_at: '2021-03-02' , product_id : po15a.product_id },
    { unit_cost: 1.1,  quantity: 150 , purchase_order_item_id: po15b.id, movement_type_id: 1, created_at: '2021-03-02'  , product_id : po15b.product_id},

    { unit_cost: 2.1,  quantity: 160 , purchase_order_item_id: po16a.id, movement_type_id: 1 , created_at: '2021-04-02' , product_id : po16a.product_id},
    { unit_cost: 3.5,  quantity: 160 , purchase_order_item_id: po16b.id, movement_type_id: 1 , created_at: '2021-04-02' , product_id : po16b.product_id},

    { unit_cost: 4.5,  quantity: 170 , purchase_order_item_id: po17a.id, movement_type_id: 1 , created_at: '2021-05-02' , product_id : po17a.product_id},
    { unit_cost: 5.2,  quantity: 170 , purchase_order_item_id: po17b.id, movement_type_id: 1 , created_at: '2021-05-02' , product_id : po17b.product_id},

    { unit_cost: 6.2,  quantity: 180 , purchase_order_item_id: po18a.id, movement_type_id: 1 , created_at: '2021-06-02' , product_id : po18a.product_id},
    { unit_cost: 7.2,  quantity: 180 , purchase_order_item_id: po18b.id, movement_type_id: 1 , created_at: '2021-06-02' , product_id : po18b.product_id},

    { unit_cost: 8.5,  quantity: 190 , purchase_order_item_id: po19a.id, movement_type_id: 1 , created_at: '2021-07-02' , product_id : po19a.product_id},
    { unit_cost: 9.2,  quantity: 190 , purchase_order_item_id: po19b.id, movement_type_id: 1 , created_at: '2021-07-02' , product_id : po19b.product_id},

    { unit_cost: 10.2,  quantity: 200 , purchase_order_item_id: po20a.id, movement_type_id: 1 , created_at: '2021-08-02' , product_id : po20a.product_id},
    { unit_cost: 1.5,  quantity: 200 , purchase_order_item_id: po20b.id, movement_type_id: 1 , created_at: '2021-08-02' , product_id : po20b.product_id},

    //recording refunds
    { unit_cost: 2.5,  quantity: -50 , purchase_order_item_id: po11a.id, movement_type_id: 3 , created_at: '2021-11-03' , product_id : po11a.product_id},
    { unit_cost: 3.5,  quantity: -40 , purchase_order_item_id: po11b.id, movement_type_id: 3 , created_at: '2021-11-03' , product_id : po11b.product_id},
    { unit_cost: 4.1,  quantity: -60 , purchase_order_item_id: po12a.id, movement_type_id: 3 , created_at: '2021-12-03' , product_id : po12a.product_id},
    { unit_cost: 5.8,  quantity: -20 , purchase_order_item_id: po12b.id, movement_type_id: 3 , created_at: '2021-12-03' , product_id : po12b.product_id},
    { unit_cost: 6.2,  quantity: -30 , purchase_order_item_id: po13a.id, movement_type_id: 3 , created_at: '2021-01-03' , product_id : po13a.product_id},
    { unit_cost: 7.6,  quantity: -30 , purchase_order_item_id: po13b.id, movement_type_id: 3 , created_at: '2021-01-03' , product_id : po13b.product_id},
    { unit_cost: 8.5,  quantity: -40 , purchase_order_item_id: po14a.id, movement_type_id: 3 , created_at: '2021-02-03' , product_id : po14a.product_id},
    { unit_cost: 9.2,  quantity: -40 , purchase_order_item_id: po14b.id, movement_type_id: 3 , created_at: '2021-02-03' , product_id : po14b.product_id},
    { unit_cost: 10.5,  quantity: -50 , purchase_order_item_id: po15a.id, movement_type_id: 3 , created_at: '2021-03-03' , product_id : po15a.product_id},
    { unit_cost: 1.1,  quantity: -50 , purchase_order_item_id: po15b.id, movement_type_id: 3 , created_at: '2021-03-03' , product_id : po15b.product_id},
    { unit_cost: 2.1,  quantity: -60 , purchase_order_item_id: po16a.id, movement_type_id: 3 , created_at: '2021-04-03' , product_id : po16a.product_id},
    { unit_cost: 3.5,  quantity: -60 , purchase_order_item_id: po16b.id, movement_type_id: 3  , created_at: '2021-04-03', product_id : po16b.product_id},
  ]); 

  // Analytics - Sales Order
  await SalesOrder.bulkCreate([
    { payment_term_id: 1, customer_id: customer1.id, created_at: '2021-01-10', gst_rate : 7, offset: 1  , sales_order_status_id : 2, charged_under_id: ccb.id }, //cash
    { payment_term_id: 1, customer_id: customer1.id, created_at: '2021-01-10', gst_rate : 7 , offset: 1 , sales_order_status_id : 2, charged_under_id : ccb.id},
    { payment_term_id: 1, customer_id: customer2.id, created_at: '2021-02-10', gst_rate : 7 , offset: 1 , sales_order_status_id : 2, charged_under_id : ccb.id }, 
    { payment_term_id: 1, customer_id: customer2.id, created_at: '2021-02-10', gst_rate : 9, offset: 1 , sales_order_status_id : 2, charged_under_id : ccb.id },
    { payment_term_id: 1, customer_id: customer3.id, created_at: '2021-03-10', gst_rate: 9, offset: 1  , sales_order_status_id : 2, charged_under_id : ccb.id}, 
    { payment_term_id: 1, customer_id: customer3.id, created_at: '2021-03-10' , gst_rate : 9, offset: 1 , sales_order_status_id : 2, charged_under_id : ccb.id },
    { payment_term_id: 1, customer_id: customer4.id, created_at:'2021-04-10' , gst_rate : 9, offset: 1 , sales_order_status_id : 2, charged_under_id : ccb.id}, 
    { payment_term_id: 1, customer_id: customer4.id, created_at: '2021-04-10' , gst_rate : 9, offset: 1 , sales_order_status_id : 2, charged_under_id : ccb.id},
    { payment_term_id: 1, customer_id: customer5.id, created_at: '2021-05-10' , gst_rate : 9, offset: 1 , sales_order_status_id : 2, charged_under_id : ccb.id}, 
    { payment_term_id: 1, customer_id: customer5.id, created_at:'2021-05-10', gst_rate : 7, offset: 1  , sales_order_status_id : 2, charged_under_id : ccb.id},
    { payment_term_id: 1, customer_id: customer6.id, created_at: '2021-06-10' , gst_rate : 7 , offset: 1 , sales_order_status_id : 2, charged_under_id : ccb.id}, 
    { payment_term_id: 1, customer_id: customer6.id, created_at: '2021-06-10' , gst_rate :7 , offset: 1 , sales_order_status_id : 2, charged_under_id : ccb.id},
    { payment_term_id: 2, customer_id: customer7.id, created_at: '2021-07-10' , gst_rate : 7 , offset: 1 , sales_order_status_id : 2, charged_under_id : ccb.id}, // credit
    { payment_term_id: 2, customer_id: customer7.id, created_at:'2021-07-10' , gst_rate : 7 , offset: 1 , sales_order_status_id : 2, charged_under_id : ccb.id},
    { payment_term_id: 2, customer_id: customer8.id, created_at: '2021-08-10' , gst_rate : 7 , offset: 1, sales_order_status_id : 2, charged_under_id : ccb.id}, 
    { payment_term_id: 2, customer_id: customer8.id, created_at: '2021-08-10' , gst_rate :0 , offset: 1, sales_order_status_id : 2, charged_under_id : ccb.id},
    { payment_term_id: 2, customer_id: customer9.id, created_at: '2021-09-10' , gst_rate: 11, offset: 1 , sales_order_status_id : 2, charged_under_id : ccb.id }, 
    { payment_term_id: 2, customer_id: customer9.id, created_at: '2021-09-10'  , gst_rate : 7, offset: 1 , sales_order_status_id : 2, charged_under_id : ccb.id},
    { payment_term_id: 2, customer_id: customer10.id, created_at: '2021-10-10' , gst_rate : 7 , offset: 1 , sales_order_status_id : 2, charged_under_id : ccb.id}, 
    { payment_term_id: 2, customer_id: customer10.id, created_at: '2021-10-10' , gst_rate : 7 , offset: 1 , sales_order_status_id : 2, charged_under_id : ccb.id}, 
    { payment_term_id: 2, customer_id: customer11.id, created_at: '2021-11-10' , gst_rate : 7 , offset: 1 , sales_order_status_id : 2, charged_under_id : ccb.id},
    { payment_term_id: 2, customer_id: customer11.id, created_at: '2021-11-10' , gst_rate :0 , offset: 1 , sales_order_status_id : 2, charged_under_id : ccb.id}, 
    { payment_term_id: 2, customer_id: customer12.id, created_at: '2021-12-10' , gst_rate : 7 , offset: 1 , sales_order_status_id : 2, charged_under_id : ccb.id},
    { payment_term_id: 2, customer_id: customer12.id, created_at: '2021-12-10' , gst_rate : 7, offset: 1 , sales_order_status_id : 2, charged_under_id : ccb.id}, //new pattern
    { payment_term_id: 2, customer_id: customer13.id, created_at: '2021-02-10' , gst_rate: 7, offset: 1 , sales_order_status_id : 2, charged_under_id : ccb.id},
    { payment_term_id: 2, customer_id: customer13.id, created_at: '2021-02-10' , gst_rate : 7, offset: 1 ,sales_order_status_id : 2, charged_under_id : ccb.id }, 
    { payment_term_id: 2, customer_id: customer14.id, created_at: '2021-04-10', gst_rate : 0, offset: 1  , sales_order_status_id : 2, charged_under_id : ccb.id},
    { payment_term_id: 2, customer_id: customer14.id, created_at:'2021-04-10' , gst_rate :7, offset: 1 , sales_order_status_id : 2, charged_under_id : ccb.id}, 
    { payment_term_id: 2, customer_id: customer15.id, created_at: '2021-06-10', gst_rate : 7 , offset: 1  , sales_order_status_id : 2, charged_under_id : ccb.id},
    { payment_term_id: 2, customer_id: customer15.id, created_at: '2021-06-10', gst_rate : 7, offset: 1  , sales_order_status_id : 2, charged_under_id : ccb.id},
    { payment_term_id: 2, customer_id: customer16.id, created_at: '2021-08-10', gst_rate : 7, offset: 1 , sales_order_status_id : 2, charged_under_id : ccb.id}, 
    { payment_term_id: 2, customer_id: customer16.id, created_at:'2021-08-10' , gst_rate : 0 , offset: 1 , sales_order_status_id : 2, charged_under_id : ccb.id},
    { payment_term_id: 2, customer_id: customer17.id, created_at: '2021-10-10', gst_rate: 7  , offset: 1 , sales_order_status_id : 2, charged_under_id : ccb.id}, 
    { payment_term_id: 2, customer_id: customer17.id, created_at:'2021-10-10', gst_rate : 7 , offset: 1 ,sales_order_status_id : 2, charged_under_id : ccb.id },
    { payment_term_id: 2, customer_id: customer18.id, created_at:'2021-12-10' , gst_rate :9, offset: 1 , sales_order_status_id : 2, charged_under_id : ccb.id}, 
    { payment_term_id: 2, customer_id: customer18.id, created_at: '2021-12-10' , gst_rate :9 , offset: 1 , sales_order_status_id : 2, charged_under_id : ccb.id},
    { payment_term_id: 2, customer_id: customer19.id, created_at:'2021-12-10' , gst_rate : 9 , offset: 1 , sales_order_status_id : 2, charged_under_id : ccb.id}, 
    { payment_term_id: 2, customer_id: customer19.id, created_at: '2021-12-10' , gst_rate : 9, offset: 1 , sales_order_status_id : 2, charged_under_id : ccb.id},
    { payment_term_id: 2, customer_id: customer20.id, created_at: '2021-12-10'  , gst_rate : 9, offset: 1 , sales_order_status_id : 2, charged_under_id : ccb.id}, 
    { payment_term_id: 2, customer_id: customer20.id, created_at: '2021-12-10' , gst_rate : 9, offset: 1 , sales_order_status_id : 2, charged_under_id : ccb.id}
  ]); 

  const sois = await SalesOrderItem.bulkCreate([
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

  const so1a = sois[0];
  const so1b = sois[1];
  const so2a = sois[2];
  const so2b = sois[3];
  const so3a = sois[4];
  const so3b = sois[5];
  const so4a = sois[6];
  const so4b = sois[7];
  const so5a = sois[8];
  const so5b = sois[9];
  const so6a = sois[10];
  const so6b = sois[11];
  const so7a = sois[12];
  const so7b = sois[13];
  const so8a = sois[14];
  const so8b = sois[15];
  const so9a = sois[16];
  const so9b = sois[17];
  const so10a = sois[18];
  const so10b = sois[19];
  const so11a = sois[20];
  const so11b = sois[21];
  const so12a = sois[22];
  const so12b = sois[23];
  const so13a = sois[24];
  const so13b = sois[25];
  const so14a = sois[26];
  const so14b = sois[27];
  const so15a = sois[28];
  const so15b = sois[29];
  const so16a = sois[30];
  const so16b = sois[31];
  const so17a = sois[32];
  const so17b = sois[33];
  const so18a = sois[34];
  const so18b = sois[35];
  const so19a = sois[36];
  const so19b = sois[37];
  const so20a = sois[38];
  const so20b = sois[39];

  //inventory movement
  await InventoryMovement.bulkCreate([
    { unit_cost: 1.1 , unit_price: 2.2,  quantity: -5 , sales_order_item_id: so1a.id, movement_type_id:2 , created_at: '2021-01-12' , product_id : so1a.product_id} ,//deliver 2 days later
    { unit_cost: 2.1 , unit_price: 3.2,  quantity: -5 ,sales_order_item_id: so1b.id, movement_type_id:2 , created_at: '2021-01-12' ,  product_id : so1b.product_id} ,

    { unit_cost: 3.5 , unit_price: 5.1,  quantity: -2 , sales_order_item_id: so2a.id, movement_type_id:2, created_at: '2021-02-12' , product_id : so2a.product_id },
    { unit_cost: 4.5 , unit_price: 6.5,  quantity: -5 , sales_order_item_id: so2b.id, movement_type_id:2 , created_at: '2021-02-12' , product_id : so2b.product_id} ,

    { unit_cost: 5.9, unit_price: 6.2,  quantity: -15 ,sales_order_item_id: so3a.id, movement_type_id:2 , created_at: '2021-03-12' , product_id : so3a.product_id}  ,
    { unit_cost: 6.2, unit_price: 7.6,  quantity: -23 , sales_order_item_id: so3b.id, movement_type_id:2 , created_at: '2021-03-12' , product_id : so3b.product_id}  ,

    { unit_cost: 7.2 , unit_price: 9.2,  quantity: -34 , sales_order_item_id: so4a.id, movement_type_id:2 , created_at: '2021-04-12', product_id : so4a.product_id }  ,
    { unit_cost: 8.5, unit_price: 9.5,  quantity: -32 ,sales_order_item_id: so4b.id, movement_type_id:2 , created_at: '2021-04-12' , product_id : so4b.product_id}  ,

    { unit_cost:  9.2, unit_price: 10.2,  quantity: -45 , sales_order_item_id: so5a.id, movement_type_id:2 , created_at: '2021-05-12' , product_id : so5a.product_id}  ,
    { unit_cost:  0.9, unit_price: 1.9,  quantity: -24 , sales_order_item_id: so5b.id, movement_type_id:2, created_at: '2021-05-12'  , product_id : so5b.product_id}  ,

    { unit_cost: 2.5 ,  unit_price: 3.5,  quantity: -24 ,sales_order_item_id: so6a.id, movement_type_id:2 , created_at: '2021-06-12' , product_id : so6a.product_id}  ,
    { unit_cost: 3.1, unit_price: 5.1,  quantity: -34 , sales_order_item_id: so6b.id, movement_type_id:2 , created_at: '2021-06-12' , product_id : so6b.product_id} ,

    { unit_cost: 4.2 , unit_price: 9.2,  quantity: -65 , sales_order_item_id: so7a.id, movement_type_id:2 , created_at: '2021-07-12' , product_id : so7a.product_id}  ,
    { unit_cost:  5.2, unit_price: 12.2,  quantity: -42 , sales_order_item_id: so7b.id, movement_type_id:2, created_at: '2021-07-12', product_id : so7b.product_id}  ,

    { unit_cost:  6.3, unit_price: 8.3,  quantity: -40 , sales_order_item_id: so8a.id, movement_type_id:2 , created_at: '2021-08-12' , product_id : so8a.product_id} ,
    { unit_cost:  7.2, unit_price: 9.2,  quantity: -40 , sales_order_item_id: so8b.id, movement_type_id:2 , created_at: '2021-08-12' , product_id : so8b.product_id }  ,

    { unit_cost:  8.5, unit_price: 12.5,  quantity: -40 ,sales_order_item_id: so9a.id, movement_type_id:2 , created_at: '2021-09-12' , product_id : so9a.product_id}  ,
    { unit_cost:  9.5, unit_price: 13.5,  quantity: -40 , sales_order_item_id: so9b.id, movement_type_id:2 , created_at: '2021-09-12', product_id : so9b.product_id } ,

    { unit_cost:  10.2, unit_price: 12.2,  quantity: -50 , sales_order_item_id: so10a.id, movement_type_id:2, created_at: '2021-10-12', product_id : so10a.product_id}  ,
    { unit_cost:  1.2, unit_price: 2.2,  quantity: -50 , sales_order_item_id: so10b.id, movement_type_id:2, created_at: '2021-10-12' , product_id : so10b.product_id}  ,

    { unit_cost:  2.5, unit_price: 4.5,  quantity: -50 , sales_order_item_id: so11a.id, movement_type_id:2  , created_at: '2021-11-12', product_id : so11a.product_id}  ,
    { unit_cost:  3.5, unit_price: 5.5,  quantity: -50 ,sales_order_item_id: so11b.id, movement_type_id:2 , created_at: '2021-11-12' , product_id : so11b.product_id}  ,

    { unit_cost:  4.1, unit_price: 6.1,  quantity: -72 , sales_order_item_id: so12a.id, movement_type_id:2 , created_at: '2021-12-12' , product_id : so12a.product_id}  ,
    { unit_cost:  5.8, unit_price: 7.8,  quantity: -71 ,sales_order_item_id: so12b.id, movement_type_id:2, created_at: '2021-12-12' , product_id : so12b.product_id}  ,

    { unit_cost: 6.2 , unit_price: 7.2,  quantity: -35 , sales_order_item_id: so13a.id, movement_type_id:2  , created_at: '2021-02-12' , product_id : so13a.product_id}  ,
    { unit_cost:  7.6, unit_price: 8.6,  quantity: -85 , sales_order_item_id: so13b.id, movement_type_id:2, created_at: '2021-02-12' , product_id : so13b.product_id}  ,

    { unit_cost:  8.5, unit_price: 9.5,  quantity: -70 ,sales_order_item_id: so14a.id, movement_type_id:2  , created_at: '2021-04-12' , product_id : so14a.product_id}  ,
    { unit_cost:  9.2, unit_price: 10.2,  quantity: -90 ,sales_order_item_id: so14b.id, movement_type_id:2  , created_at: '2021-04-12' , product_id : so14b.product_id}  ,

    { unit_cost:  10.5, unit_price: 11.5,  quantity: -80 ,sales_order_item_id: so15a.id, movement_type_id:2  , created_at: '2021-06-12', product_id : so15a.product_id}  , //customer refunds below
    { unit_cost:  1.1,  unit_price: 12.1,  quantity: -80 , sales_order_item_id: so15b.id, movement_type_id:2 , created_at: '2021-06-12' , product_id : so15b.product_id}  ,
    { unit_cost:  1.1,  unit_price: 12.1,  quantity: 50 , sales_order_item_id: so15b.id, movement_type_id:3 , created_at: '2021-06-13' , product_id : so15b.product_id}  ,

    { unit_cost:  2.1, unit_price: 5.1,  quantity: -90 ,sales_order_item_id: so16a.id, movement_type_id:2  , created_at: '2021-08-12' , product_id : so16a.product_id}  ,
    { unit_cost:  3.5, unit_price: 5.5,  quantity: -90 , sales_order_item_id: so16b.id, movement_type_id:2 , created_at: '2021-08-12' , product_id : so16b.product_id}  ,
    { unit_cost:  1.1,  unit_price: 12.1,  quantity: 50 , sales_order_item_id: so16b.id, movement_type_id:3 , created_at: '2021-08-13' , product_id : so16b.product_id}  ,

    { unit_cost:  4.5, unit_price: 6.5,  quantity: -120 ,sales_order_item_id: so17a.id, movement_type_id:2  , created_at: '2021-10-12' , product_id : so17a.product_id }  ,
    { unit_cost:  5.2, unit_price: 7.2,  quantity: -5 ,sales_order_item_id: so17b.id, movement_type_id:2 , created_at: '2021-10-12' , product_id : so17b.product_id}  ,
    { unit_cost:  1.1,  unit_price: 12.1,  quantity: 1 , sales_order_item_id: so17b.id, movement_type_id:3 , created_at: '2021-10-13' , product_id : so17b.product_id}  ,

    { unit_cost:  6.2, unit_price: 8.2,  quantity: -123 ,sales_order_item_id: so18a.id, movement_type_id:2, created_at: '2021-12-12', product_id : so18a.product_id  }  ,
    { unit_cost:  7.2, unit_price: 9.2,  quantity: -123 , sales_order_item_id: so18b.id, movement_type_id:2  , created_at: '2021-12-12', product_id : so18b.product_id } ,
    { unit_cost:  1.1,  unit_price: 12.1,  quantity: 23 , sales_order_item_id: so18b.id, movement_type_id:3 , created_at: '2021-12-13' , product_id : so18b.product_id},

    { unit_cost:  8.5, unit_price: 10.5,  quantity: -90 , sales_order_item_id: so19a.id, movement_type_id:2  , created_at: '2021-12-12', product_id : so19a.product_id} ,
    { unit_cost:  9.2, unit_price: 11.2,  quantity: -90 ,sales_order_item_id: so19b.id, movement_type_id:2 , created_at: '2021-12-12', product_id : so19b.product_id }  ,
    { unit_cost:  1.1,  unit_price: 12.1,  quantity: 1 , sales_order_item_id: so19b.id, movement_type_id:3 , created_at: '2021-12-13' , product_id : so19b.product_id}  ,

    { unit_cost:  10.2, unit_price: 12.2,  quantity: -100 ,sales_order_item_id: so20a.id, movement_type_id:2  , created_at: '2021-12-12', product_id : so20a.product_id} ,
    { unit_cost:  1.5, unit_price: 13.5,  quantity: -100 , sales_order_item_id: so20b.id, movement_type_id:2, created_at: '2021-12-12', product_id : so20b.product_id } ,
    { unit_cost:  1.1,  unit_price: 12.1,  quantity: 10 , sales_order_item_id: so20b.id, movement_type_id:3 , created_at: '2021-12-13' , product_id : so20b.product_id},

    //damaged goods
    { unit_cost: 7.2 , unit_price: 0,  quantity: -3 , sales_order_item_id: so4a.id, movement_type_id:4 , created_at: '2021-04-12' , product_id : so4a.product_id}  ,
    { unit_cost:  2.5, unit_price: 0,  quantity: -5 , sales_order_item_id: so11a.id, movement_type_id:4  , created_at: '2021-11-12', product_id : so11a.product_id}  ,
    { unit_cost:  3.5, unit_price: 0,  quantity: -6 ,sales_order_item_id: so11b.id, movement_type_id:4 , created_at: '2021-11-12' , product_id : so11b.product_id}  ,
    { unit_cost:  4.5, unit_price: 0,  quantity: -10 ,sales_order_item_id: so17a.id, movement_type_id:4  , created_at: '2021-10-12', product_id : so17a.product_id }  ,
    { unit_cost:  5.2, unit_price: 0,  quantity: -2 ,sales_order_item_id: so17b.id, movement_type_id:4 , created_at: '2021-10-12', product_id : so17b.product_id}  ,
    { unit_cost:  1.1,  unit_price: 0,  quantity: -19 , sales_order_item_id: so19b.id, movement_type_id:4 , created_at: '2021-12-13', product_id : so19b.product_id}  ,
    { unit_cost:  10.2, unit_price: 0,  quantity: -5 ,sales_order_item_id: so20a.id, movement_type_id:4  , created_at: '2021-12-12' , product_id : so20a.product_id} ,
  ]); 

  await Payment.bulkCreate([
    { amount: 22, purchase_order_id: 1, accounting_type_id: 1, movement_type_id: 1, created_at: '2021-01-01'},
    { amount: -10, purchase_order_id: 1, payment_method_id:1, accounting_type_id: 1, movement_type_id:1 , created_at: '2021-01-02'}, //double payment for PO1 to PO10
    { amount: -2, purchase_order_id: 1, payment_method_id:1, accounting_type_id: 1, movement_type_id:1 , created_at: '2021-01-03'},  //1 day apart

    { amount: 660, purchase_order_id: 11, accounting_type_id: 1, movement_type_id:1 , created_at: '2021-11-01'},
    { amount: -60, purchase_order_id: 11, payment_method_id:1, accounting_type_id: 1, movement_type_id:1, created_at: '2021-11-02' },
    { amount: 100, purchase_order_id: 11, payment_method_id:1, movement_type_id:3 , created_at: '2021-11-03'}, //PO-11 supplier refund

    { amount: 1649, purchase_order_id: 17, accounting_type_id: 1, movement_type_id:1, created_at: '2021-05-01' }, // cash 

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
}

module.exports = { initAnalytics };