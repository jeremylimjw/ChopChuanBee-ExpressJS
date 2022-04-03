const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const ProductCatalogueItem = sequelize.define('product_catalogue_item', {
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    // pictures: DataTypes.STRING,
    description: DataTypes.STRING,
}, {
    updatedAt: 'updated_at',
    createdAt: 'created_at',
});

const MenuCategory = sequelize.define('menu_category', {
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    }

}, {
    updatedAt: 'updated_at',
    createdAt: 'created_at',
});



module.exports = { ProductCatalogueItem, MenuCategory };