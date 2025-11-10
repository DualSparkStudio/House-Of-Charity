const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { 
  useMockDb, 
  findUserById, 
  createDonation: createMockDonation, 
  mockDonations, 
  updateDonation: updateMockDonation 
} = require('../services/mockData');
const router = express.Router();

const isMockDb = () => useMockDb();
const enrichDonation = (donation) => {
  const donor = donation ? findUserById(donation.donor_id) : null;
  const ngo = donation ? findUserById(donation.ngo_id) : null;

  return {
    ...donation,
    donor_name: donor?.name || null,
    donor_email: donor?.email || null,
    ngo_name: ngo?.name || null,
    display_name: donation?.anonymous ? 'Anonymous' : donor?.name || null,
  };
};

// Create a new donation
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      ngo_id,
      amount,
      currency,
      payment_method,
      transaction_id,
      message,
      anonymous,
      donation_type,
      quantity,
      unit,
      delivery_date,
      essential_type,
    } = req.body;

    const donor_id = req.user.id;

    const normalizedType = donation_type || 'money';

    if (!ngo_id) {
      return res.status(400).json({ error: 'NGO ID is required' });
    }

    if (normalizedType === 'money' && (!amount || Number(amount) <= 0)) {
      return res.status(400).json({ error: 'Amount is required for money donations' });
    }

    if (normalizedType !== 'money') {
      if (!quantity || Number(quantity) <= 0) {
        return res.status(400).json({ error: 'Quantity is required for non-monetary donations' });
      }
      if (!unit) {
        return res.status(400).json({ error: 'Unit is required for non-monetary donations' });
      }
    }

    if (isMockDb()) {
      const ngo = findUserById(ngo_id);
      if (!ngo || ngo.user_type !== 'ngo') {
        return res.status(404).json({ error: 'NGO not found' });
      }

      const donor = findUserById(donor_id);
      if (!donor) {
        return res.status(404).json({ error: 'Donor not found' });
      }

      const donation = createMockDonation({
        donor_id,
        ngo_id,
        amount: normalizedType === 'money' ? Number(amount) : 0,
        currency: currency || 'USD',
        payment_method: payment_method || null,
        transaction_id: transaction_id || null,
        message: message || null,
        anonymous: !!anonymous,
        donation_type: normalizedType,
        quantity: normalizedType === 'money' ? null : Number(quantity),
        unit: normalizedType === 'money' ? null : unit,
        delivery_date: delivery_date || null,
        essential_type: normalizedType === 'essentials' ? essential_type || null : null,
      });

      return res.status(201).json({
        message: 'Donation created successfully',
        donation: enrichDonation(donation),
      });
    }

    // Validate required fields
    // Check if NGO exists
    const [ngos] = await db.execute(
      'SELECT id FROM users WHERE id = ? AND user_type = "ngo"',
      [ngo_id]
    );

    if (ngos.length === 0) {
      return res.status(404).json({ error: 'NGO not found' });
    }

    // Generate donation ID
    const donationId = uuidv4();

    let storedAmount = Number(amount) || 0;
    let storedMessage = message || null;

    if (normalizedType !== 'money') {
      storedAmount = 0;
      const details = [
        `Type: ${normalizedType}`,
        quantity ? `Quantity: ${quantity}` : null,
        unit ? `Unit: ${unit}` : null,
        essential_type ? `Essential: ${essential_type}` : null,
        delivery_date ? `Delivery: ${delivery_date}` : null,
        message ? `Note: ${message}` : null,
      ]
        .filter(Boolean)
        .join(' | ');
      storedMessage = details;
    }

    // Insert donation
    await db.execute(
      `INSERT INTO donations (id, donor_id, ngo_id, amount, currency, payment_method, transaction_id, status, message, anonymous) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        donationId,
        donor_id,
        ngo_id,
        storedAmount,
        currency || 'INR',
        payment_method || null,
        transaction_id || null,
        'pending',
        storedMessage,
        anonymous || false
      ]
    );

    // Get the created donation with user details
    const [newDonations] = await db.execute(
      `SELECT d.*, 
              donor.name as donor_name, 
              ngo.name as ngo_name
       FROM donations d
       JOIN users donor ON d.donor_id = donor.id
       JOIN users ngo ON d.ngo_id = ngo.id
       WHERE d.id = ?`,
      [donationId]
    );

    res.status(201).json({
      message: 'Donation created successfully',
      donation: newDonations[0]
    });

  } catch (error) {
    console.error('Error creating donation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get donations by donor
router.get('/donor/:donorId', authenticateToken, async (req, res) => {
  try {
    const { donorId } = req.params;

    if (isMockDb()) {
      if (req.user.id !== donorId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const donations = mockDonations
        .filter((donation) => donation.donor_id === donorId)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .map(enrichDonation);

      return res.json({ donations });
    }

    // Check if user can access these donations
    if (req.user.id !== donorId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [donations] = await db.execute(
      `SELECT d.*, 
              ngo.name as ngo_name, 
              ngo.description as ngo_description,
              ngo.email as ngo_email
       FROM donations d
       JOIN users ngo ON d.ngo_id = ngo.id
       WHERE d.donor_id = ?
       ORDER BY d.created_at DESC`,
      [donorId]
    );

    res.json({ donations });
  } catch (error) {
    console.error('Error fetching donor donations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get donations by NGO
router.get('/ngo/:ngoId', authenticateToken, async (req, res) => {
  try {
    const { ngoId } = req.params;

    if (isMockDb()) {
      const ngo = findUserById(ngoId);
      if (!ngo || ngo.user_type !== 'ngo') {
        return res.status(404).json({ error: 'NGO not found' });
      }

      const donations = mockDonations
        .filter((donation) => donation.ngo_id === ngoId)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .map(enrichDonation);

      return res.json({ donations });
    }

    // Check if user can access these donations (NGO owner or donor)
    const [ngos] = await db.execute(
      'SELECT id FROM users WHERE id = ? AND user_type = "ngo"',
      [ngoId]
    );

    if (ngos.length === 0) {
      return res.status(404).json({ error: 'NGO not found' });
    }

    const [donations] = await db.execute(
      `SELECT d.*, 
              donor.name as donor_name,
              donor.email as donor_email,
              CASE WHEN d.anonymous = 1 THEN 'Anonymous' ELSE donor.name END as display_name
       FROM donations d
       JOIN users donor ON d.donor_id = donor.id
       WHERE d.ngo_id = ?
       ORDER BY d.created_at DESC`,
      [ngoId]
    );

    res.json({ donations });
  } catch (error) {
    console.error('Error fetching NGO donations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all donations (admin or for public display)
router.get('/', async (req, res) => {
  try {
    if (isMockDb()) {
      const donations = mockDonations
        .filter((donation) => donation.status === 'completed')
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 50)
        .map(enrichDonation);

      return res.json({ donations });
    }

    const [donations] = await db.execute(
      `SELECT d.*, 
              donor.name as donor_name,
              donor.email as donor_email,
              ngo.name as ngo_name,
              CASE WHEN d.anonymous = 1 THEN 'Anonymous' ELSE donor.name END as display_name
       FROM donations d
       JOIN users donor ON d.donor_id = donor.id
       JOIN users ngo ON d.ngo_id = ngo.id
       WHERE d.status = 'completed'
       ORDER BY d.created_at DESC
       LIMIT 50`
    );

    res.json({ donations });
  } catch (error) {
    console.error('Error fetching donations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update donation status
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (isMockDb()) {
      const validStatuses = ['pending', 'completed', 'failed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      const donation = mockDonations.find((item) => item.id === id);
      if (!donation) {
        return res.status(404).json({ error: 'Donation not found' });
      }

      if (req.user.id !== donation.donor_id && req.user.id !== donation.ngo_id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      updateMockDonation(id, { status });

      return res.json({ message: 'Donation status updated successfully' });
    }

    // Validate status
    const validStatuses = ['pending', 'completed', 'failed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Check if donation exists and user has permission to update
    const [donations] = await db.execute(
      'SELECT donor_id, ngo_id FROM donations WHERE id = ?',
      [id]
    );

    if (donations.length === 0) {
      return res.status(404).json({ error: 'Donation not found' });
    }

    const donation = donations[0];
    
    // Only donor or NGO can update status
    if (req.user.id !== donation.donor_id && req.user.id !== donation.ngo_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update donation status
    await db.execute(
      'UPDATE donations SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );

    res.json({ message: 'Donation status updated successfully' });
  } catch (error) {
    console.error('Error updating donation status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get donation by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (isMockDb()) {
      const donation = mockDonations.find((item) => item.id === id);

      if (!donation) {
        return res.status(404).json({ error: 'Donation not found' });
      }

      if (req.user.id !== donation.donor_id && req.user.id !== donation.ngo_id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      return res.json({ donation: enrichDonation(donation) });
    }

    const [donations] = await db.execute(
      `SELECT d.*, 
              donor.name as donor_name,
              ngo.name as ngo_name
       FROM donations d
       JOIN users donor ON d.donor_id = donor.id
       JOIN users ngo ON d.ngo_id = ngo.id
       WHERE d.id = ?`,
      [id]
    );

    if (donations.length === 0) {
      return res.status(404).json({ error: 'Donation not found' });
    }

    const donation = donations[0];

    // Check if user can access this donation
    if (req.user.id !== donation.donor_id && req.user.id !== donation.ngo_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ donation });
  } catch (error) {
    console.error('Error fetching donation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
