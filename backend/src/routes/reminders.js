const express = require('express');
const { v4: uuidv4 } = require('uuid');
const requireAuth = require('../middleware/requireAuth');
const db = require('../lib/db');

const router = express.Router();

router.post('/', requireAuth, require('../middleware/validate')({medicine_name:255,dosage:120,frequency:120,reminder_time:8,start_date:10,end_date:10}), async (req, res) => {
  try {
    const { medicine_name, dosage, frequency, reminder_time, times_per_day, start_date, end_date } = req.body;
    if (!medicine_name) return res.status(400).json({ error: 'medicine_name is required' });

    const id = uuidv4();
    await db.query(
      `INSERT INTO medicine_reminders (id, user_id, medicine_name, dosage, frequency, reminder_time, times_per_day, start_date, end_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, req.user.id, medicine_name, dosage || null, frequency || null, reminder_time || null, times_per_day || 1, start_date || null, end_date || null]
    );

    const [rows] = await db.query('SELECT * FROM medicine_reminders WHERE id = ?', [id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('ADD REMINDER ERROR:', err.code || "internal");
    res.status(500).json({ error: 'Failed to add reminder' });
  }
});

// GET all reminders, each annotated with whether it was already taken today.
router.get('/', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.*,
        EXISTS (
          SELECT 1 FROM reminder_logs l
          WHERE l.reminder_id = r.id
            AND l.status = 'taken'
            AND DATE(l.logged_at) = CURDATE()
        ) AS taken_today
       FROM medicine_reminders r
       WHERE r.user_id = ?
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('GET REMINDERS ERROR:', err.code || "internal");
    res.status(500).json({ error: 'Failed to load reminders' });
  }
});

router.post('/:id/log', requireAuth, async (req, res) => {
  try {
    const { status, scheduled_time } = req.body || {};
    const [own] = await db.query('SELECT id FROM medicine_reminders WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!own.length) return res.status(404).json({ error: 'Reminder not found' });
    const when = scheduled_time ? new Date(scheduled_time) : new Date();
    if (Number.isNaN(when.getTime())) return res.status(400).json({ error: 'Invalid scheduled_time' });
    const safeStatus = ['taken', 'skipped', 'missed', 'pending'].includes(status) ? status : 'pending';
    const id = uuidv4();

    await db.query(
      'INSERT INTO reminder_logs (id, reminder_id, scheduled_time, status) VALUES (?, ?, ?, ?)',
      [id, req.params.id, when, safeStatus]
    );

    const [rows] = await db.query('SELECT * FROM reminder_logs WHERE id = ?', [id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('LOG REMINDER ERROR:', err.code || "internal");
    res.status(500).json({ error: 'Failed to log reminder' });
  }
});

// DELETE a reminder (and its logs, so no orphaned rows are left behind).
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const [check] = await db.query(
      'SELECT id FROM medicine_reminders WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (check.length === 0) return res.status(404).json({ error: 'Reminder not found' });

    await db.query('DELETE FROM reminder_logs WHERE reminder_id = ?', [req.params.id]);
    await db.query('DELETE FROM medicine_reminders WHERE id = ?', [req.params.id]);

    res.json({ deleted: true, id: req.params.id });
  } catch (err) {
    console.error('DELETE REMINDER ERROR:', err.code || "internal");
    res.status(500).json({ error: 'Failed to delete reminder' });
  }
});

module.exports = router;