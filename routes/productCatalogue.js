var express = require('express');
var router = express.Router();
const { requireAccess } = require('../auth');
const ViewType = require('../common/ViewType');
const { ProductCatalogueItem, MenuCategory } = require('../models/ProductCatalogueItem');
const Log = require('../models/Log');
const { Sequelize } = require('sequelize');
const { sequelize } = require('../db');
const { parseRequest, assertNotNull } = require('../common/helpers');
const { Product } = require('../models/Product');
const { sendEmailTo } = require('../emailer');


router.get('/', requireAccess(ViewType.CATALOGUE, false), async function(req, res, next) {
  const { short } = req.query;
  delete req.query.short;
  
  const predicate = parseRequest(req.query);
  
  try {
    let new_product_catalogue_items = [];
    const product_catalogue_items = await ProductCatalogueItem.findAll(predicate);

    for ( let prod_catalogue_item of product_catalogue_items ) {

      let item = prod_catalogue_item.toJSON();

      if (short) {
        delete item.image;
      }

      if(prod_catalogue_item.menu_category_id != null) {
        const newmenu = await MenuCategory.findByPk(prod_catalogue_item.menu_category_id);
        item['menu_category_name'] = newmenu.name;
      } else {
        item['menu_category_name'] = null;
      }

      if(prod_catalogue_item.product_id != null) {
        const newprod = await Product.findByPk(prod_catalogue_item.product_id);
        item['product_name'] = newprod.name;
      } else {
        item['product_name'] = null;
      }

      new_product_catalogue_items.push(item);
    }

    res.send(new_product_catalogue_items);    

  } catch(err) {
    // Catch and return any uncaught exceptions while inserting into database
    console.log(err);
    res.status(500).send(err);
  }
    
});
//create 
router.post('/', requireAccess(ViewType.CATALOGUE, true), async function(req, res, next) { 

  const {name, description, image, menu_category_id, product_id } = req.body;
    
  try {
    assertNotNull(req.body, ['name'])
  } catch(err) {
    res.status(400).send(err);
    return;
  }
  
  try {
    const newProductCatalogueItem = await ProductCatalogueItem.create({ name, description, image, menu_category_id, product_id });
 
    // Record to admin logs
    const user = res.locals.user;
    await Log.create({ 
      employee_id: user.id, 
      view_id: ViewType.CATALOGUE.id,
      text: `${user.name} created a product catalogue item for ${name}`, 
    });

    const newProduct = newProductCatalogueItem.toJSON();

    if (product_id != null) {
      const product = await Product.findByPk(product_id);
      newProduct.product_name = product.name;
    }
    const category = await MenuCategory.findByPk(menu_category_id);
    newProduct.menu_category_name = category.name;

    res.send(newProduct);

  } catch(err) {
    // Catch and return any uncaught exceptions while inserting into database
    console.log(err);
    res.status(500).send(err);
  }
});

router.put('/', requireAccess(ViewType.CATALOGUE, true), async function(req, res, next) {
  const { id, name, description, image, menu_category_id, product_id } = req.body;

  try {
    assertNotNull(req.body, ['id', 'name'])
  } catch(err) {
    res.status(400).send(err);
    return;
  }

  try {
    const result = await ProductCatalogueItem.update(
      { name, description, image, menu_category_id, product_id },
      { where: { id: id } }
    );

    // If 'id' is not found return 400 Bad Request, if found then return the 'id'
    if (result[0] === 0) {
      res.status(400).send(`Product catalogue item id ${id} not found.`)

    } else {
      // Record to admin logs
      const user = res.locals.user;
      await Log.create({ 
        employee_id: user.id, 
        view_id: ViewType.CATALOGUE.id,
        text: `${user.name} updated ${name}'s product catalogue item record`, 
      });

      res.send({ id: id });
    }


  } catch(err) {
    // Catch and return any uncaught exceptions while inserting into database
    console.log(err);
    res.status(500).send(err);
  }
});



router.delete('/', requireAccess(ViewType.CATALOGUE, true), async function(req, res, next) {
  const { id } = req.query;
  
  // Validation
  try {
      assertNotNull(req.query, ['id']);
  } catch(err) {
      res.status(400).send(err);
      return;
  }
  
  try {
      await ProductCatalogueItem.destroy({ where: { id: id }});
      
      // Record to admin logs
      const user = res.locals.user;
      await Log.create({ 
          employee_id: user.id, 
          view_id: ViewType.CATALOGUE.id,
          text: `${user.name} deleted a product catalogue item with ID ${id}`, 
      });

      res.send({ id: id });
      
  } catch(err) {
      // Catch and return any uncaught exceptions while inserting into database
      console.log(err);
      res.status(500).send(err);
  }

});



router.get('/menu_category', requireAccess(ViewType.CATALOGUE, false), async function(req, res, next) {
  const predicate = parseRequest(req.query);
  
  try {
      const menu_category = await MenuCategory.findAll(predicate);
      res.send(menu_category);
      
    } catch(err) {
      // Catch and return any uncaught exceptions while inserting into database
      console.log(err);
      res.status(500).send(err);
    }
  
});

// Removed require login as catalogue frontend dont have login
router.get('/all_menu_category', async function(req, res, next) {
  const predicate = parseRequest(req.query);
  
  try {
      let newMenu = [];
      const menu_categories = await MenuCategory.findAll(predicate);
      for ( let menu_category of menu_categories ) {
        let item = menu_category.toJSON();
        const product_items = await ProductCatalogueItem.findAll({ where: { menu_category_id: menu_category.id }})
        item['attachedMenuItems'] = product_items;
        newMenu.push(item);
      }
      res.send(newMenu);
      
    } catch(err) {
      // Catch and return any uncaught exceptions while inserting into database
      console.log(err);
      res.status(500).send(err);
    }
  
});

router.post('/menu_category', requireAccess(ViewType.CATALOGUE, true), async function(req, res, next) { 

  const {name } = req.body;
    
  try {
    assertNotNull(req.body, ['name'])
  } catch(err) {
    res.status(400).send(err);
    return;
  }
  
  try {
    const newMenuCategory = await MenuCategory.create({ name});

    // Record to admin logs
    const user = res.locals.user;
    await Log.create({ 
      employee_id: user.id, 
      view_id: ViewType.CATALOGUE.id,
      text: `${user.name} created a Menu category called ${name}`, 
    });

    res.send(newMenuCategory.toJSON());

  } catch(err) {
    // Catch and return any uncaught exceptions while inserting into database
    console.log(err);
    res.status(500).send(err);
  }
});


router.delete('/menu_category', requireAccess(ViewType.CATALOGUE, true), async function(req, res, next) {
  const { id } = req.query;
  
  // Validation
  try {
      assertNotNull(req.query, ['id']);
  } catch(err) {
      res.status(400).send(err);
      return;
  }
  
  try {
    
    const menuCategory = await MenuCategory.findByPk(id);
   // const newProductCatalogueItem = await ProductCatalogueItem.create({ name, description, menu_category_id : newMenuCategory.id});

    const prod_catalogue_items = await ProductCatalogueItem.findAll({ where: { menu_category_id : menuCategory.id }});

    for ( let prod_catalogue_item of prod_catalogue_items ){
      prod_catalogue_item.menu_category_id = null;
      prod_catalogue_item.save();
    }

      await MenuCategory.destroy({ where: { id: id }});
      
      // Record to admin logs
      const user = res.locals.user;
      await Log.create({ 
          employee_id: user.id, 
          view_id: ViewType.CATALOGUE.id,
          text: `${user.name} deleted a product catalogue item with ID ${id}`, 
      });

      res.send({ id: id });
      
  } catch(err) {
      // Catch and return any uncaught exceptions while inserting into database
      console.log(err);
      res.status(500).send(err);
  }

});


// Send email regarding the customer's enquiry
router.post('/enquiry', async function(req, res, next) { 
  const { name, email, phone, text } = req.body;
    
  try {
    assertNotNull(req.body, ['name', 'email', 'text'])
  } catch(err) {
    res.status(400).send(err);
    return;
  }
  
  try {
    sendEmailTo(email, 'enquiry', { name, email, phone, text });
    sendEmailTo(email, 'enquiryReply', { name, email, phone, text });

    res.send({});

  } catch(err) {
    // Catch and return any uncaught exceptions while inserting into database
    console.log(err);
    res.status(500).send(err);
  }
});



module.exports = router; 