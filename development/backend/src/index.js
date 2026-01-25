const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());

const pool = new Pool({
    user: 'user',
    host: 'postgres',
    database: 'appdb',
    password: 'password',
    port: 5432,
});

app.get('/api/status', async (req, res) => {
    try {
        const dbRes = await pool.query('SELECT NOW()');
        res.json({
            message: 'Backend conectado!',
            dbTime: dbRes.rows[0].now
        });
    } catch (err) {
        res.status(500).json({ message: 'Error en la DB', error: err.message });
    }
});

app.listen(3000, '0.0.0.0', () => {
    console.log('Backend corriendo en puerto 3000');
});