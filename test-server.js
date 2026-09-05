const express = require('express');
const app = express();

// Test route
app.post('/api/v1/auth/login', (req, res) => {
    res.json({ message: 'Login route works!' });
});

// Test route with parameters
app.get('/api/v1/test/:id', (req, res) => {
    res.json({ message: 'Params work!', id: req.params.id });
});

app.listen(3001, () => {
    console.log('Test server on http://localhost:3001');
    console.log('Test: curl -X POST http://localhost:3001/api/v1/auth/login');
});
