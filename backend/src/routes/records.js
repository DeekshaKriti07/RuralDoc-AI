const express = require('express');
const { v4: uuidv4 } = require('uuid');
const requireAuth = require('../middleware/requireAuth');
const db = require('../lib/db');

const router = express.Router();

router.post('/', requireAuth, require('../middleware/validate')({record_type:40,title:255,details:20000,file_url:500,recorded_date:10}), async (req, res) => {
  try {
    const { record_type, title, details, file_url, recorded_date } = req.body;
    if (!record_type || !title) {
      return res.status(400).json({ error: 'record_type and title are required' });
    }

    const id = uuidv4();
    await db.query(
      `INSERT INTO medical_records (id, user_id, record_type, title, details, file_url, recorded_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, req.user.id, record_type, title, details || null, file_url || null, recorded_date || null]
    );

    const [rows] = await db.query('SELECT * FROM medical_records WHERE id = ?', [id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('ADD RECORD ERROR:', err.code || "internal");
    res.status(500).json({ error: 'Failed to add record' });
  }
});

router.get('/', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM medical_records WHERE user_id = ? ORDER BY created_at DESC LIMIT 200',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('GET RECORDS ERROR:', err.code || "internal");
    res.status(500).json({ error: 'Failed to load records' });
  }
});

// GET a single record's full detail
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM medical_records WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Record not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('GET RECORD ERROR:', err.code || "internal");
    res.status(500).json({ error: 'Failed to load record' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const [check] = await db.query(
      'SELECT id FROM medical_records WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (check.length === 0) return res.status(404).json({ error: 'Record not found' });

    await db.query('DELETE FROM medical_records WHERE id = ?', [req.params.id]);
    res.json({ deleted: true, id: req.params.id });
  } catch (err) {
    console.error('DELETE RECORD ERROR:', err.code || "internal");
    res.status(500).json({ error: 'Failed to delete record' });
  }
});

module.exports = router;