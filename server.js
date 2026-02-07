const express = require('express');
const mysql = require('mysql');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcrypt');
const app = express();
app.disable('x-powered-by');
const PORT = 3000;

const db = mysql.createPool({
    connectionLimit: 10,
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hair_salon'
});

db.getConnection((err, connection) => {
    if (err) {
        console.error('ГРЕШКА: не може да се свърже с MySQL:', err.message);
    } else {
        console.log('Свързан с MySQL базата данни (pool)');
        connection.release();
    }
});

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'salon-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

const requireAdmin = (req, res, next) => {
    if (req.session && req.session.isAdmin) {
        return next();
    }
    return res.status(401).json({ error: 'Неоторизиран достъп' });
};

function handleDbError(res, err, context = '') {
    console.error('DB ERROR', context, err);
   
    return res.status(500).json({ error: 'Вътрешна грешка в сървъра' });
}

app.get('/api/services', (req, res) => {
    db.query('SELECT * FROM services', (err, results) => {
        if (err) return handleDbError(res, err, '/api/services');
        res.json(results);
    });
});

app.get('/api/working-hours', (req, res) => {
    db.query('SELECT * FROM working_hours ORDER BY day_of_week', (err, results) => {
        if (err) return handleDbError(res, err, '/api/working-hours');
        res.json(results);
    });
});

app.post('/api/appointments', (req, res) => {
    const { name, phone, service_id, date } = req.body;

    if (!name || !phone || !service_id || !date) {
        return res.status(400).json({ error: 'Липсващо задължително поле' });
    }

    const appointment = {
        customer_name: name,
        customer_phone: phone,
        service_id: service_id,
        appointment_date: date
    };
    
    db.query('INSERT INTO appointments SET ?', appointment, (err, result) => {
        if (err) return handleDbError(res, err, '/api/appointments - INSERT');
        res.json({ success: true, id: result.insertId });
    });
});

app.post('/api/contacts', (req, res) => {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Липсващо задължително поле' });
    }
    const sql = 'INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)';
    db.query(sql, [name, email, message], (err, result) => {
        if (err) return handleDbError(res, err, '/api/contacts - INSERT');
        res.json({ success: true, id: result.insertId });
    });
});

app.post('/api/reviews', (req, res) => {
    const { customer_name, rating, comment } = req.body;
    if (!customer_name || !rating) {
        return res.status(400).json({ error: 'Липсващо задължително поле' });
    }
    const sql = 'INSERT INTO reviews (customer_name, rating, comment) VALUES (?, ?, ?)';
    db.query(sql, [customer_name, rating, comment], (err, result) => {
        if (err) return handleDbError(res, err, '/api/reviews - INSERT');
        res.json({ success: true, id: result.insertId });
    });
});

app.get('/api/reviews/approved', (req, res) => {
    const sql = 'SELECT * FROM reviews WHERE approved = TRUE ORDER BY created_at DESC';
    db.query(sql, (err, results) => {
        if (err) return handleDbError(res, err, '/api/reviews/approved');
        res.json(results);
    });
});

app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Липсва потребителско име или парола' });
    }
    
    const sql = 'SELECT * FROM admins WHERE username = ?';
    db.query(sql, [username], async (err, results) => {
        if (err) return handleDbError(res, err, '/api/admin/login - SELECT');
        
        if (results.length === 0) {
            return res.status(401).json({ error: 'Грешно потребителско име или парола' });
        }
        
        const admin = results[0];
        try {
            const validPassword = await bcrypt.compare(password, admin.password_hash);
            if (validPassword) {
                req.session.isAdmin = true;
                req.session.adminId = admin.id;
                req.session.adminUsername = admin.username;
                return res.json({ success: true, username: admin.username });
            } else {
                return res.status(401).json({ error: 'Грешно потребителско име или парола' });
            }
        } catch (compareErr) {
            console.error('bcrypt error', compareErr);
            return res.status(500).json({ error: 'Вътрешна грешка' });
        }
    });
});

app.post('/api/admin/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Session destroy error', err);
            return res.status(500).json({ error: 'Неуспешен изход' });
        }
        res.json({ success: true });
    });
});

app.get('/api/admin/check', (req, res) => {
    res.json({ isAdmin: !!req.session.isAdmin });
});

app.get('/api/admin/appointments', requireAdmin, (req, res) => {
    const sql = `
        SELECT a.*, s.name as service_name 
        FROM appointments a 
        LEFT JOIN services s ON a.service_id = s.id 
        ORDER BY a.appointment_date DESC
    `;
    db.query(sql, (err, results) => {
        if (err) return handleDbError(res, err, '/api/admin/appointments');
        res.json(results);
    });
});

app.put('/api/admin/appointments/:id', requireAdmin, (req, res) => {
    const { status, notes } = req.body;
    const sql = 'UPDATE appointments SET status = ?, notes = ? WHERE id = ?';
    db.query(sql, [status, notes, req.params.id], (err, result) => {
        if (err) return handleDbError(res, err, '/api/admin/appointments/:id - UPDATE');
        res.json({ success: true });
    });
});

app.get('/api/admin/contacts', requireAdmin, (req, res) => {
    const sql = 'SELECT * FROM contacts ORDER BY created_at DESC';
    db.query(sql, (err, results) => {
        if (err) return handleDbError(res, err, '/api/admin/contacts');
        res.json(results);
    });
});

app.put('/api/admin/contacts/:id', requireAdmin, (req, res) => {
    const { status } = req.body;
    const sql = 'UPDATE contacts SET status = ? WHERE id = ?';
    db.query(sql, [status, req.params.id], (err, result) => {
        if (err) return handleDbError(res, err, '/api/admin/contacts/:id - UPDATE');
        res.json({ success: true });
    });
});

app.get('/api/admin/reviews', requireAdmin, (req, res) => {
    const sql = 'SELECT * FROM reviews ORDER BY created_at DESC';
    db.query(sql, (err, results) => {
        if (err) return handleDbError(res, err, '/api/admin/reviews');
        res.json(results);
    });
});

app.put('/api/admin/reviews/:id', requireAdmin, (req, res) => {
    const { approved } = req.body;
    const sql = 'UPDATE reviews SET approved = ? WHERE id = ?';
    db.query(sql, [approved, req.params.id], (err, result) => {
        if (err) return handleDbError(res, err, '/api/admin/reviews/:id - UPDATE');
        res.json({ success: true });
    });
});

app.use((err, req, res, next) => {
    console.error('Unhandled error in route:', err);
    res.status(500).json({ error: 'Вътрешна грешка в сървъра' });
});

process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('UNHANDLED REJECTION at:', promise, 'reason:', reason);
});

app.listen(PORT, () => {
    console.log(`Сървърът работи на http://localhost:${PORT}`);
});
