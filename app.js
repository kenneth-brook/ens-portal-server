const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(express.json());

const pool = new Pool({
    user: 'ensclient',
    host: 'ens-client.cfzb4vlbttqg.us-east-2.rds.amazonaws.com',
    database: 'postgres',
    password: 'gQ9Sf8cIczKhZiCswXXy',
    port: 5432,
    max: 20,
    ssl: true,
});

// User registration
app.post('/register', async (req, res) => {
    try {
      const { username, password } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await pool.query('INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *', [username, hashedPassword]);
      res.status(201).send(`User created with ID: ${result.rows[0].id}`);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
});
  
  // User login
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  
        if (result.rows.length > 0) {
            const validPassword = await bcrypt.compare(password, result.rows[0].password);
            if (validPassword) {
                const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '1h' });
                res.json({ token });
            } else {
                res.status(400).send('Invalid credentials');
            }
        } else {
            res.status(400).send('Invalid credentials');
        }
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
});

module.exports = app;