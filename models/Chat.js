const { DataTypes, Sequelize } = require('sequelize');
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
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
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
    last_received: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    last_read: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    updatedAt: 'updated_at', // Standardize 'updatedAt' column name to 'updated_at'
    createdAt: 'created_at', // Standardize 'createdAt' column name to 'created_at'
});

module.exports = { Channel, Text, Participant };