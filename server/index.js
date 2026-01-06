const express = require('express');
const cors = require('cors');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
    res.send('Alpha Dentkart API is running');
});

// GET All Orders
app.get('/api/orders', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM orders ORDER BY created_at DESC');
        // Parse the items_json back to object
        const orders = rows.map(order => ({
            ...order,
            items: JSON.parse(order.items_json || '[]')
        }));
        res.json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// POST Create Order
app.post('/api/orders', async (req, res) => {
    const { id, user_email, total, items, customer_name, payment_id } = req.body;

    try {
        const query = `
            INSERT INTO orders (id, user_email, total, items_json, customer_name, payment_id) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const values = [id, user_email, total, JSON.stringify(items), customer_name, payment_id];

        await db.query(query, values);
        res.status(201).json({ message: 'Order created successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
