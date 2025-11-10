const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { 
  useMockDb, 
  findUserById, 
  addRequirement: addMockRequirement, 
  mockRequirements, 
  updateRequirement: updateMockRequirement, 
  deleteRequirement: deleteMockRequirement 
} = require('../services/mockData');
const router = express.Router();

const isMockDb = () => useMockDb();
const enrichRequirement = (requirement) => {
  const ngo = requirement ? findUserById(requirement.ngo_id) : null;

  return {
    ...requirement,
    ngo_name: ngo?.name || null,
    ngo_description: ngo?.description || null,
    city: ngo?.city || null,
    state: ngo?.state || null,
    website: ngo?.website || null,
  };
};

// Create a new requirement
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, category, amount_needed, currency, priority, deadline } = req.body;
    const ngo_id = req.user.id;

    if (isMockDb()) {
      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }

      const ngo = findUserById(ngo_id);
      if (!ngo || ngo.user_type !== 'ngo') {
        return res.status(403).json({ error: 'Only NGOs can create requirements' });
      }

      const requirement = addMockRequirement({
        ngo_id,
        title,
        description: description || null,
        category: category || null,
        amount_needed: amount_needed || null,
        currency: currency || 'USD',
        priority: priority || 'medium',
        deadline: deadline || null,
      });

      return res.status(201).json({
        message: 'Requirement created successfully',
        requirement: enrichRequirement(requirement),
      });
    }

    // Validate required fields
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    // Check if user is an NGO
    const [users] = await db.execute(
      'SELECT user_type FROM users WHERE id = ?',
      [ngo_id]
    );

    if (users.length === 0 || users[0].user_type !== 'ngo') {
      return res.status(403).json({ error: 'Only NGOs can create requirements' });
    }

    // Generate requirement ID
    const requirementId = uuidv4();

    // Insert requirement
    await db.execute(
      `INSERT INTO requirements (id, ngo_id, title, description, category, amount_needed, currency, priority, status, deadline) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        requirementId,
        ngo_id,
        title,
        description || null,
        category || null,
        amount_needed || null,
        currency || 'INR',
        priority || 'medium',
        'active',
        deadline || null
      ]
    );

    // Get the created requirement with NGO details
    const [newRequirements] = await db.execute(
      `SELECT r.*, 
              ngo.name as ngo_name, 
              ngo.description as ngo_description
       FROM requirements r
       JOIN users ngo ON r.ngo_id = ngo.id
       WHERE r.id = ?`,
      [requirementId]
    );

    res.status(201).json({
      message: 'Requirement created successfully',
      requirement: newRequirements[0]
    });

  } catch (error) {
    console.error('Error creating requirement:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all active requirements (public endpoint)
router.get('/', async (req, res) => {
  try {
    if (isMockDb()) {
      const requirements = mockRequirements
        .filter((requirement) => requirement.status === 'active')
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .map(enrichRequirement);

      return res.json({ requirements });
    }

    const [requirements] = await db.execute(
      `SELECT r.*, 
              ngo.name as ngo_name, 
              ngo.description as ngo_description,
              ngo.city,
              ngo.state
       FROM requirements r
       JOIN users ngo ON r.ngo_id = ngo.id
       WHERE r.status = 'active'
       ORDER BY 
         CASE r.priority 
           WHEN 'urgent' THEN 1 
           WHEN 'high' THEN 2 
           WHEN 'medium' THEN 3 
           WHEN 'low' THEN 4 
         END,
         r.created_at DESC`
    );

    res.json({ requirements });
  } catch (error) {
    console.error('Error fetching requirements:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get requirements by NGO
router.get('/ngo/:ngoId', async (req, res) => {
  try {
    const { ngoId } = req.params;

    if (isMockDb()) {
      const requirements = mockRequirements
        .filter((requirement) => requirement.ngo_id === ngoId)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .map(enrichRequirement);

      return res.json({ requirements });
    }

    const [requirements] = await db.execute(
      `SELECT r.*, 
              ngo.name as ngo_name, 
              ngo.description as ngo_description
       FROM requirements r
       JOIN users ngo ON r.ngo_id = ngo.id
       WHERE r.ngo_id = ?
       ORDER BY r.created_at DESC`,
      [ngoId]
    );

    res.json({ requirements });
  } catch (error) {
    console.error('Error fetching NGO requirements:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get requirement by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isMockDb()) {
      const requirement = mockRequirements.find((item) => item.id === id);
      if (!requirement) {
        return res.status(404).json({ error: 'Requirement not found' });
      }

      return res.json({ requirement: enrichRequirement(requirement) });
    }

    const [requirements] = await db.execute(
      `SELECT r.*, 
              ngo.name as ngo_name, 
              ngo.description as ngo_description,
              ngo.city,
              ngo.state,
              ngo.website
       FROM requirements r
       JOIN users ngo ON r.ngo_id = ngo.id
       WHERE r.id = ?`,
      [id]
    );

    if (requirements.length === 0) {
      return res.status(404).json({ error: 'Requirement not found' });
    }

    res.json({ requirement: requirements[0] });
  } catch (error) {
    console.error('Error fetching requirement:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update requirement
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (isMockDb()) {
      const requirement = mockRequirements.find((item) => item.id === id);
      if (!requirement) {
        return res.status(404).json({ error: 'Requirement not found' });
      }

      if (req.user.id !== requirement.ngo_id) {
        return res.status(403).json({ error: 'You can only update your own requirements' });
      }

      const allowedFields = ['title', 'description', 'category', 'amount_needed', 'currency', 'priority', 'status', 'deadline'];
      const sanitizedUpdates = {};

      allowedFields.forEach(field => {
        if (updates[field] !== undefined) {
          sanitizedUpdates[field] = updates[field];
        }
      });

      if (Object.keys(sanitizedUpdates).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      const updatedRequirement = updateMockRequirement(id, sanitizedUpdates);

      return res.json({
        message: 'Requirement updated successfully',
        requirement: enrichRequirement(updatedRequirement),
      });
    }

    // Check if requirement exists and user owns it
    const [requirements] = await db.execute(
      'SELECT ngo_id FROM requirements WHERE id = ?',
      [id]
    );

    if (requirements.length === 0) {
      return res.status(404).json({ error: 'Requirement not found' });
    }

    if (req.user.id !== requirements[0].ngo_id) {
      return res.status(403).json({ error: 'You can only update your own requirements' });
    }

    // Build dynamic update query
    const allowedFields = ['title', 'description', 'category', 'amount_needed', 'currency', 'priority', 'status', 'deadline'];
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

    const query = `UPDATE requirements SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    
    await db.execute(query, updateValues);

    // Get updated requirement
    const [updatedRequirements] = await db.execute(
      `SELECT r.*, 
              ngo.name as ngo_name, 
              ngo.description as ngo_description
       FROM requirements r
       JOIN users ngo ON r.ngo_id = ngo.id
       WHERE r.id = ?`,
      [id]
    );

    res.json({
      message: 'Requirement updated successfully',
      requirement: updatedRequirements[0]
    });

  } catch (error) {
    console.error('Error updating requirement:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete requirement
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (isMockDb()) {
      const requirement = mockRequirements.find((item) => item.id === id);
      if (!requirement) {
        return res.status(404).json({ error: 'Requirement not found' });
      }

      if (req.user.id !== requirement.ngo_id) {
        return res.status(403).json({ error: 'You can only delete your own requirements' });
      }

      deleteMockRequirement(id);

      return res.json({ message: 'Requirement deleted successfully' });
    }

    // Check if requirement exists and user owns it
    const [requirements] = await db.execute(
      'SELECT ngo_id FROM requirements WHERE id = ?',
      [id]
    );

    if (requirements.length === 0) {
      return res.status(404).json({ error: 'Requirement not found' });
    }

    if (req.user.id !== requirements[0].ngo_id) {
      return res.status(403).json({ error: 'You can only delete your own requirements' });
    }

    // Delete requirement
    await db.execute('DELETE FROM requirements WHERE id = ?', [id]);

    res.json({ message: 'Requirement deleted successfully' });
  } catch (error) {
    console.error('Error deleting requirement:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get requirements by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;

    if (isMockDb()) {
      const requirements = mockRequirements
        .filter((requirement) => requirement.category === category && requirement.status === 'active')
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .map(enrichRequirement);

      return res.json({ requirements });
    }

    const [requirements] = await db.execute(
      `SELECT r.*, 
              ngo.name as ngo_name, 
              ngo.description as ngo_description,
              ngo.city,
              ngo.state
       FROM requirements r
       JOIN users ngo ON r.ngo_id = ngo.id
       WHERE r.category = ? AND r.status = 'active'
       ORDER BY 
         CASE r.priority 
           WHEN 'urgent' THEN 1 
           WHEN 'high' THEN 2 
           WHEN 'medium' THEN 3 
           WHEN 'low' THEN 4 
         END,
         r.created_at DESC`,
      [category]
    );

    res.json({ requirements });
  } catch (error) {
    console.error('Error fetching requirements by category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
