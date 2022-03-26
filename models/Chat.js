const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const Channel = sequelize.define('channel', {
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
    },
    title: DataTypes.STRING,
}, {
    updatedAt: 'updated_at', // Standardize 'updatedAt' column name to 'updated_at'
    createdAt: 'created_at', // Standardize 'createdAt' column name to 'created_at'
});

const Text = sequelize.define('text', {
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
    },
    text: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    updatedAt: 'updated_at', // Standardize 'updatedAt' column name to 'updated_at'
    createdAt: 'created_at', // Standardize 'createdAt' column name to 'created_at'
});

const Participant = sequelize.define('participant', {
    last_received: DataTypes.DATE,
    last_read: DataTypes.DATE,
}, {
    updatedAt: 'updated_at', // Standardize 'updatedAt' column name to 'updated_at'
    createdAt: 'created_at', // Standardize 'createdAt' column name to 'created_at'
});

module.exports = { Channel, Text, Participant };