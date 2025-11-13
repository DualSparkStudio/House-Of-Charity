const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const {
  useMockDb,
  getNGOs,
  findUserById,
  updateUser: updateMockUser,
  mockDonations,
  mockRequirements,
  linkDonorNgo: linkMockDonorNgo,
  unlinkDonorNgo: unlinkMockDonorNgo,
} = require('../services/mockData');
const { isMockDb, useSupabase } = require('../utils/dbMode');

let supabaseAdapter = null;
if (useSupabase()) {
  supabaseAdapter = require('../services/supabaseAdapter');
}
const router = express.Router();

const isMockDbMode = () => isMockDb();
const sanitizeUser = (user) => {
  if (!user) return null;
  const { password, password_hash, ...rest } = user;
  return rest;
};

// Get all NGOs (public endpoint)
router.get('/ngos', async (req, res) => {
  try {
    if (isMockDbMode()) {
      const ngos = getNGOs().map(sanitizeUser);
      return res.json({ ngos });
    }

    if (useSupabase()) {
      const ngos = await supabaseAdapter.listNgos();
      return res.json({ ngos });
    }

    const [ngos] = await db.execute(
      `SELECT id, name, description, city, state, country, website, logo_url, verified, created_at 
       FROM users 
       WHERE user_type = 'ngo' 
       ORDER BY created_at DESC`
    );

    res.json({ ngos });
  } catch (error) {
    console.error('Error fetching NGOs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Manage donor <-> NGO connections
router.post('/connections', authenticateToken, async (req, res) => {
  try {
    const { donorId, ngoId } = req.body || {};

    if (!donorId || !ngoId) {
      return res.status(400).json({ error: 'donorId and ngoId are required' });
    }

    if (req.user.id !== donorId) {
      return res.status(403).json({ error: 'You can only manage your own connections' });
    }

    if (isMockDbMode()) {
      try {
        const result = linkMockDonorNgo(donorId, ngoId);
        return res.json({
          message: 'Connection created successfully',
          donor: result.donor,
          ngo: result.ngo,
        });
      } catch (error) {
        console.error('Mock connection error:', error);
        return res.status(400).json({ error: error.message || 'Unable to create connection' });
      }
    }

    if (useSupabase()) {
      try {
        const result = await supabaseAdapter.linkDonorNgo(donorId, ngoId);
        return res.json({
          message: 'Connection created successfully',
          donor: result.donor,
          ngo: result.ngo,
        });
      } catch (error) {
        console.error('Supabase connection error:', error);
        const message = error?.message || 'Unable to create connection';
        return res.status(500).json({ error: message });
      }
    }

    return res.status(501).json({ error: 'Connection management not available for this database mode' });
  } catch (error) {
    console.error('Connection creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/connections', authenticateToken, async (req, res) => {
  try {
    const { donorId, ngoId } = req.body || {};

    if (!donorId || !ngoId) {
      return res.status(400).json({ error: 'donorId and ngoId are required' });
    }

    if (req.user.id !== donorId) {
      return res.status(403).json({ error: 'You can only manage your own connections' });
    }

    if (isMockDbMode()) {
      try {
        const result = unlinkMockDonorNgo(donorId, ngoId);
        return res.json({
          message: 'Connection removed successfully',
          donor: result.donor,
          ngo: result.ngo,
        });
      } catch (error) {
        console.error('Mock disconnection error:', error);
        return res.status(400).json({ error: error.message || 'Unable to remove connection' });
      }
    }

    if (useSupabase()) {
      try {
        const result = await supabaseAdapter.unlinkDonorNgo(donorId, ngoId);
        return res.json({
          message: 'Connection removed successfully',
          donor: result.donor,
          ngo: result.ngo,
        });
      } catch (error) {
        console.error('Supabase disconnection error:', error);
        const message = error?.message || 'Unable to remove connection';
        return res.status(500).json({ error: message });
      }
    }

    return res.status(501).json({ error: 'Connection management not available for this database mode' });
  } catch (error) {
    console.error('Connection deletion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (isMockDbMode()) {
      if (req.user.id !== id) {
        return res.status(403).json({ error: 'You can only view your own profile in mock mode' });
      }

      const user = findUserById(id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.json({ user: sanitizeUser(user) });
    }

    if (useSupabase()) {
      try {
        if (req.user.id !== id) {
          return res.status(403).json({ error: 'You can only view your own profile' });
        }

        const result = await supabaseAdapter.findUserById(id);
        if (!result) {
          return res.status(404).json({ error: 'User not found' });
        }

        return res.json({ user: result.mapped });
      } catch (error) {
        console.error('Error fetching Supabase user:', error);
        const message = error?.message || 'Internal server error';
        return res.status(500).json({ error: message });
      }
    }

    const [users] = await db.execute(
      'SELECT id, email, user_type, name, phone, address, city, state, country, pincode, description, website, logo_url, verified, created_at FROM users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: users[0] });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (isMockDbMode()) {
      if (req.user.id !== id) {
        return res.status(403).json({ error: 'You can only update your own profile' });
      }

      const allowedFields = ['name', 'phone', 'address', 'city', 'state', 'country', 'pincode', 'description', 'website', 'logo_url'];
      const sanitizedUpdates = {};

      allowedFields.forEach(field => {
        if (updates[field] !== undefined) {
          sanitizedUpdates[field] = updates[field];
        }
      });

      if (Object.keys(sanitizedUpdates).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      const updatedUser = updateMockUser(id, sanitizedUpdates);
      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.json({
        message: 'Profile updated successfully',
        user: sanitizeUser(updatedUser),
      });
    }

    if (useSupabase()) {
      try {
        const existing = await supabaseAdapter.findUserById(id);
        if (!existing) {
          return res.status(404).json({ error: 'User not found' });
        }

        if (req.user.id !== id) {
          return res.status(403).json({ error: 'You can only update your own profile' });
        }

        const baseAllowed = ['name', 'phone', 'address', 'city', 'state', 'country', 'pincode', 'description', 'website', 'logo_url', 'verified'];
        const ngoExtras = [
          'works_done',
          'awards_received',
          'about',
          'gallery',
          'current_requirements',
          'future_plans',
          'awards_and_recognition',
          'recent_activities',
        ];
        const allowedFields = existing.type === 'ngo' ? [...baseAllowed, ...ngoExtras] : baseAllowed;

        const columnMap = {
          phone: 'phone_number',
          address: 'address',
          city: 'city',
          state: 'state',
          country: 'country',
          pincode: 'pincode',
          description: 'description',
          website: 'website',
          logo_url: 'logo_url',
          verified: 'verified',
          works_done: 'works_done',
          awards_received: 'awards_received',
          about: 'about',
          gallery: 'gallery',
          current_requirements: 'current_requirements',
          future_plans: 'future_plans',
          awards_and_recognition: 'awards_and_recognition',
          recent_activities: 'recent_activities',
          name: 'name',
        };

        const updatePayload = {};
        allowedFields.forEach((field) => {
          if (updates[field] !== undefined) {
            updatePayload[columnMap[field] || field] = updates[field];
          }
        });

        if (Object.keys(updatePayload).length === 0) {
          return res.status(400).json({ error: 'No valid fields to update' });
        }

        const result = await supabaseAdapter.updateUser(existing.type, id, updatePayload);

        return res.json({
          message: 'Profile updated successfully',
          user: result.mapped,
        });
      } catch (error) {
        console.error('Error updating Supabase user:', error);
        const message = error?.message || 'Internal server error';
        return res.status(500).json({ error: message });
      }
    }

    // Check if user exists and user is updating their own profile
    if (req.user.id !== id) {
      return res.status(403).json({ error: 'You can only update your own profile' });
    }

    // Build dynamic update query
    const allowedFields = ['name', 'phone', 'address', 'city', 'state', 'country', 'pincode', 'description', 'website', 'logo_url'];
    const updateFields = [];
    const updateValues = [];

    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        updateValues.push(updates[field]);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updateValues.push(id);

    const query = `UPDATE users SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    
    await db.execute(query, updateValues);

    // Get updated user
    const [updatedUsers] = await db.execute(
      'SELECT id, email, user_type, name, phone, address, city, state, country, pincode, description, website, logo_url, verified, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );

    res.json({
      message: 'Profile updated successfully',
      user: updatedUsers[0]
    });

  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user statistics
router.get('/:id/stats', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (isMockDbMode()) {
      const user = findUserById(id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      let stats = {};

      if (user.user_type === 'donor') {
        const donations = mockDonations.filter((donation) => donation.donor_id === id);
        const totalAmount = donations.reduce((sum, donation) => sum + (Number(donation.amount) || 0), 0);
        const completed = donations.filter((donation) => donation.status === 'completed');

        stats = {
          total_donations: donations.length,
          total_amount: totalAmount,
          average_amount: donations.length ? totalAmount / donations.length : 0,
          completed_donations: completed.length,
        };
      } else if (user.user_type === 'ngo') {
        const donations = mockDonations.filter((donation) => donation.ngo_id === id && donation.status === 'completed');
        const requirements = mockRequirements.filter((requirement) => requirement.ngo_id === id);

        const totalAmount = donations.reduce((sum, donation) => sum + (Number(donation.amount) || 0), 0);

        stats = {
          total_donations_received: donations.length,
          total_amount_received: totalAmount,
          average_donation: donations.length ? totalAmount / donations.length : 0,
          total_requirements: requirements.length,
          active_requirements: requirements.filter((req) => req.status === 'active').length,
          fulfilled_requirements: requirements.filter((req) => req.status === 'fulfilled').length,
        };
      }

      return res.json({ stats });
    }

    if (useSupabase()) {
      try {
        const result = await supabaseAdapter.findUserById(id);
        if (!result) {
          return res.status(404).json({ error: 'User not found' });
        }

        if (result.type === 'donor') {
          const stats = await supabaseAdapter.getDonorStats(id);
          return res.json({ stats });
        }

        const stats = await supabaseAdapter.getNgoStats(id);
        return res.json({ stats });
      } catch (error) {
        console.error('Error fetching Supabase user stats:', error);
        const message = error?.message || 'Internal server error';
        return res.status(500).json({ error: message });
      }
    }

    // Check if user exists
    const [users] = await db.execute('SELECT user_type FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userType = users[0].user_type;
    let stats = {};

    if (userType === 'donor') {
      // Get donor statistics
      const [donationStats] = await db.execute(
        `SELECT 
           COUNT(*) as total_donations,
           SUM(amount) as total_amount,
           AVG(amount) as average_amount,
           COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_donations
         FROM donations 
         WHERE donor_id = ?`,
        [id]
      );
      stats = donationStats[0];
    } else if (userType === 'ngo') {
      // Get NGO statistics
      const [donationStats] = await db.execute(
        `SELECT 
           COUNT(*) as total_donations_received,
           SUM(amount) as total_amount_received,
           AVG(amount) as average_donation
         FROM donations 
         WHERE ngo_id = ? AND status = 'completed'`,
        [id]
      );

      const [requirementStats] = await db.execute(
        `SELECT 
           COUNT(*) as total_requirements,
           COUNT(CASE WHEN status = 'active' THEN 1 END) as active_requirements,
           COUNT(CASE WHEN status = 'fulfilled' THEN 1 END) as fulfilled_requirements
         FROM requirements 
         WHERE ngo_id = ?`,
        [id]
      );

      stats = {
        ...donationStats[0],
        ...requirementStats[0]
      };
    }

    res.json({ stats });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
