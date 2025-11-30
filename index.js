require('dotenv').config(); // Load the variables from .env
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// --- Database Connection ---
// Replace 'database', 'username', 'password' with your MySQL credentials
const sequelize = new Sequelize(
    process.env.DB_NAME, 
    process.env.DB_USER, 
    process.env.DB_PASS, 
    {
        host: process.env.DB_HOST,
        // Convert the string from .env to a Number for safety
        port: Number(process.env.DB_PORT), 
        dialect: 'mysql',
        timezone: '-03:00', // Brazil Time
        logging: false,      // Set to console.log if you want to see SQL
    }
);

// --- Models (The Schema) ---

// 1. The Purchase Header
const Purchase = sequelize.define('Purchase', {
  supplier: { type: DataTypes.STRING, allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  shippingCost: { type: DataTypes.FLOAT, defaultValue: 0 },
  otherCost: { type: DataTypes.FLOAT, defaultValue: 0 },
  // Storing totals explicitly for faster read performance
  totalMerchandise: { type: DataTypes.FLOAT, defaultValue: 0 },
  totalExtras: { type: DataTypes.FLOAT, defaultValue: 0 },
  grandTotal: { type: DataTypes.FLOAT, defaultValue: 0 },
});

// 2. The Individual Items
const Item = sequelize.define('Item', {
  model: { type: DataTypes.STRING },
  brand: { type: DataTypes.STRING },
  description: { type: DataTypes.STRING },
  qty: { type: DataTypes.INTEGER, allowNull: false },
  unitPrice: { type: DataTypes.FLOAT, allowNull: false },
  // Calculated fields saved for historical accuracy
  totalValue: { type: DataTypes.FLOAT },
  extraCostShareTotal: { type: DataTypes.FLOAT },
  finalUnitCost: { type: DataTypes.FLOAT }
});

// --- Relationships ---
// This tells MySQL: "One Purchase has many Items"
// onDelete: 'CASCADE' means if you delete the Purchase, MySQL auto-deletes its Items
Purchase.hasMany(Item, { as: 'items', onDelete: 'CASCADE' });
Item.belongsTo(Purchase);

// --- Sync Database ---
// This creates the tables automatically
sequelize.sync({ alter: true })
  .then(() => console.log('MySQL Database & Tables synced'))
  .catch(err => console.error('Error syncing DB:', err));

// --- Routes ---

// GET: Fetch all purchases with their items
app.get('/api/purchases', async (req, res) => {
  try {
    const purchases = await Purchase.findAll({
      include: [{ model: Item, as: 'items' }], // Join with Items table
      order: [['createdAt', 'DESC']]
    });
    res.json(purchases);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Create a Purchase AND its Items in one transaction
app.post('/api/purchases', async (req, res) => {
  try {
    // We expect the JSON body to look like: { supplier: '...', items: [...] }
    const { totals, ...rest } = req.body;
    
    // Flatten the 'totals' object into the main object to match our SQL columns
    const purchasePayload = {
      ...rest,
      totalMerchandise: totals?.merchandise || 0,
      totalExtras: totals?.extras || 0,
      grandTotal: totals?.grandTotal || 0
    };

    // Sequelize is smart: if we pass 'items' array, it creates the relations automatically
    const newPurchase = await Purchase.create(purchasePayload, {
      include: [{ model: Item, as: 'items' }]
    });

    res.status(201).json(newPurchase);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});

// DELETE: Remove a purchase
app.delete('/api/purchases/:id', async (req, res) => {
  try {
    const result = await Purchase.destroy({
      where: { id: req.params.id }
    });
    if (result) res.json({ message: 'Deleted successfully' });
    else res.status(404).json({ message: 'Not found' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(``));
