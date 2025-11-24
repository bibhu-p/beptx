const express = require('express');
const app = express();

app.use(express.json());

// Simple GET route
app.get('/api/users', (req, res) => {
    const { limit, page } = req.query;
    res.json({ users: [], limit, page });
});

// GET with parameter
app.get('/api/users/:id', (req, res) => {
    const { id } = req.params;
    res.json({ id, name: 'John Doe', email: 'john@example.com' });
});

// POST route with body
app.post('/api/users', (req, res) => {
    const { email, name, age } = req.body;

    if (!email || !name) {
        return res.status(400).json({ error: 'Email and name are required' });
    }

    res.status(201).json({ id: '123', email, name, age });
});

// PUT route
app.put('/api/users/:id', (req, res) => {
    const { id } = req.params;
    const { email, name, age } = req.body;

    res.json({ id, email, name, age, updated: true });
});

// DELETE route
app.delete('/api/users/:id', (req, res) => {
    const { id } = req.params;
    res.status(204).send();
});

// Route with validation
app.post('/api/products', (req, res) => {
    const { name, price, description, isActive } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Name is required' });
    }

    if (typeof price !== 'number' || price < 0) {
        return res.status(400).json({ error: 'Price must be a positive number' });
    }

    res.status(201).json({ id: '456', name, price, description, isActive });
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Example Express server running on http://localhost:${PORT}`);
    });
}

module.exports = app;
