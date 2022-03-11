const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const Itinerary = sequelize.define('itinerary', {
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
    },
    start_time: {
        type: DataTypes.DATE,
        allowNull: false
    },
    session: {
        type: DataTypes.STRING,
        allowNull: false
    },
    origin_postal_code: {
        type: DataTypes.STRING,
        allowNull: false
    },
    longitude: {
        type: DataTypes.DECIMAL,
        allowNull: false
    },
    latitude: {
        type: DataTypes.DECIMAL,
        allowNull: false
    },
}, {
    updatedAt: 'updated_at', // Standardize 'updatedAt' column name to 'updated_at'
    createdAt: 'created_at', // Standardize 'createdAt' column name to 'created_at'
});

module.exports = { Itinerary };