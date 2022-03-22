const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');
const QRCode = require('qrcode')

const DeliveryOrder = sequelize.define('delivery_order', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false
  },
  postal_code: {
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
  deliver_at: {
    type: DataTypes.DATE,
  },
  sequence: {
    type: DataTypes.INTEGER,
    defaultValue: -1,
  },
  remarks: DataTypes.STRING,
  qr_code: DataTypes.TEXT,
  signature: DataTypes.TEXT,
}, {
  updatedAt: 'updated_at', // Standardize 'updatedAt' column name to 'updated_at'
  createdAt: 'created_at', // Standardize 'createdAt' column name to 'created_at'
});

const DeliveryStatus = sequelize.define('delivery_status', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
}, { 
  timestamps: false // Dont record 'updatedAt' and 'createdAt'
});


async function generateAndSaveQRCode(deliveryOrder) {
  const qr = await QRCode.toDataURL(`${process.env.REACT_URL}/completeDelivery?id=${deliveryOrder.id}`)
  await DeliveryOrder.update({ qr_code: qr }, { where: { id: deliveryOrder.id } });
}

module.exports = { DeliveryOrder, DeliveryStatus, generateAndSaveQRCode };