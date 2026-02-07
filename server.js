const express = require('express');
const mysql = require('mysql');
const path = require('path');
const app = express();
const PORT = 3000;

// Конфигурация на базата данни
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // променете според настройките
    password: '', // добавете парола ако има
    database: 'hair_salon'
});

db.connect(err => {
    if (err) throw err;
    console.log('Свързан с MySQL базата данни');
});

// Middleware
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Маршрути
app.get('/api/services', (req, res) => {
    db.query('SELECT * FROM services', (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

app.get('/api/working-hours', (req, res) => {
    db.query('SELECT * FROM working_hours ORDER BY day_of_week', (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

app.post('/api/appointments', (req, res) => {
    const { name, phone, service_id, date } = req.body;
    const appointment = {
        customer_name: name,
        customer_phone: phone,
        service_id: service_id,
        appointment_date: date
    };
    
    db.query('INSERT INTO appointments SET ?', appointment, (err, result) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ success: true, id: result.insertId });
        }
    });
});

app.get('/api/appointments', (req, res) => {
    db.query('SELECT a.*, s.name as service_name FROM appointments a JOIN services s ON a.service_id = s.id', (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

// Стартиране на сървъра
app.listen(PORT, () => {
    console.log(`Сървърът работи на http://localhost:${PORT}`);
});