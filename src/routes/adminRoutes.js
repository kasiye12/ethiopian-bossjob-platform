const express = require('express');
const pool = require('../config/database');
const bcrypt = require('bcrypt');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware.authenticate);

// Get all users
router.get('/users', async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT id, phone_number, email, full_name, role, is_active, company_position, created_at FROM users ORDER BY created_at DESC'
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Toggle user status - FIXED (only toggles is_active, does NOT delete)
router.put('/users/:id/toggle', async (req, res) => {
    try {
        const userId = req.params.id;
        console.log('🔄 Toggling user status:', userId);
        
        // Get current status
        const current = await pool.query(
            'SELECT is_active FROM users WHERE id = $1',
            [userId]
        );
        
        if (current.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        const newStatus = !current.rows[0].is_active;
        
        // Update only is_active field
        const { rows } = await pool.query(
            'UPDATE users SET is_active = $1 WHERE id = $2 RETURNING id, full_name, is_active',
            [newStatus, userId]
        );
        
        console.log(`✅ User ${rows[0].full_name} is now ${newStatus ? 'Active' : 'Inactive'}`);
        
        res.json({ 
            success: true, 
            data: rows[0], 
            message: `User ${newStatus ? 'activated' : 'deactivated'}` 
        });
    } catch (error) {
        console.error('❌ Toggle error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update user
router.put('/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const { full_name, email, role, company_position } = req.body;
        
        const updates = [];
        const values = [];
        let idx = 1;
        
        if (full_name) { updates.push(`full_name = $${idx}`); values.push(full_name); idx++; }
        if (email !== undefined) { updates.push(`email = $${idx}`); values.push(email); idx++; }
        if (role) { updates.push(`role = $${idx}`); values.push(role); idx++; }
        if (company_position !== undefined) { updates.push(`company_position = $${idx}`); values.push(company_position); idx++; }
        
        if (updates.length === 0) {
            return res.status(400).json({ success: false, message: 'No fields' });
        }
        
        values.push(userId);
        
        const { rows } = await pool.query(
            `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx} RETURNING id, full_name, role, is_active`,
            values
        );
        
        res.json({ success: true, data: rows[0], message: 'User updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Reset password
router.put('/users/:id/reset-password', async (req, res) => {
    try {
        const { new_password } = req.body;
        
        if (!new_password || new_password.length < 8) {
            return res.status(400).json({ success: false, message: 'Password must be 8+ characters' });
        }
        
        const hash = await bcrypt.hash(new_password, 10);
        
        await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.params.id]);
        
        res.json({ success: true, message: 'Password reset' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Verify company
router.put('/companies/:id/verify', async (req, res) => {
    try {
        await pool.query("UPDATE companies SET is_verified = true WHERE id = $1", [req.params.id]);
        res.json({ success: true, message: 'Verified' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get stats
router.get('/stats', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM users) as total_users,
                (SELECT COUNT(*) FROM jobs) as total_jobs,
                (SELECT COUNT(*) FROM companies) as total_companies
        `);
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
