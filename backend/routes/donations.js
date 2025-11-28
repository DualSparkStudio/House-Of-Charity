const express = require('express');
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('../middleware/auth');
const { 
  useMockDb, 
  findUserById, 
  createDonation: createMockDonation, 
  mockDonations, 
  updateDonation: updateMockDonation,
} = require('../services/mockData');
const { isMockDb, useSupabase } = require('../utils/dbMode');
const {
  notifyDonationReceived,
  notifyDonationRequestAgain,
  notifyDonationDeliveryReminder,
} = require('../services/notificationService');

let supabaseAdapter = null;
if (useSupabase()) {
  supabaseAdapter = require('../services/supabaseAdapter');
}
const router = express.Router();

const isMockDbMode = () => isMockDb();
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

const mapSupabaseDonation = (donation) => {
  if (!donation) return null;
  const { donor, ngo, ...rest } = donation;
  const amount =
    rest.amount !== null && rest.amount !== undefined
      ? Number(rest.amount)
      : rest.amount;
  const quantity =
    rest.quantity !== null && rest.quantity !== undefined
      ? Number(rest.quantity)
      : rest.quantity;
  return {
    ...rest,
    amount,
    quantity,
    donor_name: donor?.name || null,
    donor_email: donor?.email || null,
    ngo_name: ngo?.name || null,
    display_name: rest.anonymous ? 'Anonymous' : donor?.name || null,
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
      details,
      service_details,
    } = req.body;

    const donor_id = req.user.id;

    // Normalize donation_type: 'essentials' -> 'daily_essentials' for database compatibility
    let normalizedType = donation_type || 'money';
    if (normalizedType === 'essentials') {
      normalizedType = 'daily_essentials';
    }

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

    if (isMockDbMode()) {
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

      await notifyDonationReceived({
        ngoId: ngo_id,
        donationId: donation.id,
        donorName: donor.name,
        donationType: normalizedType,
        amount: normalizedType === 'money' ? Number(amount) : null,
        currency: currency || 'USD',
        anonymous: !!anonymous,
      });

      return res.status(201).json({
        message: 'Donation created successfully',
        donation: enrichDonation(donation),
      });
    }

    if (useSupabase()) {
      try {
        if (req.user.user_type && req.user.user_type !== 'donor') {
          return res.status(403).json({ error: 'Only donors can create donations' });
        }

        const ngo = await supabaseAdapter.findUserById(ngo_id);
        if (!ngo || ngo.type !== 'ngo') {
          return res.status(404).json({ error: 'NGO not found' });
        }

        const donor = await supabaseAdapter.findUserById(donor_id);
        if (!donor || donor.type !== 'donor') {
          return res.status(404).json({ error: 'Donor not found' });
        }

        const payload = {
          donor_id,
          ngo_id,
          donation_type: normalizedType,
          amount: normalizedType === 'money' ? Number(amount) : 0,
          currency: currency || 'INR',
          quantity: normalizedType === 'money' ? null : Number(quantity),
          unit: normalizedType === 'money' ? null : unit,
          essential_type: normalizedType === 'daily_essentials' ? essential_type || null : null,
          service_details: normalizedType === 'services' ? (message || details || null) : service_details || null,
          details: details || null,
          delivery_date: delivery_date || null,
          payment_method: normalizedType === 'money' ? payment_method || null : null,
          transaction_id: normalizedType === 'money' ? transaction_id || null : null,
          anonymous: !!anonymous,
          message: message || null,
        };

        const donation = await supabaseAdapter.createDonation(payload);

        await notifyDonationReceived({
          ngoId: ngo_id,
          donationId: donation.id,
          donorName: donation?.donor?.name,
          donationType: payload.donation_type,
          amount:
            payload.donation_type === 'money' && payload.amount != null
              ? Number(payload.amount)
              : null,
          currency: payload.currency || 'INR',
          anonymous: !!payload.anonymous,
        });

        return res.status(201).json({
          message: 'Donation created successfully',
          donation: mapSupabaseDonation(donation),
        });
      } catch (error) {
        console.error('Error creating Supabase donation:', error);
        const message = error?.message || 'Internal server error';
        return res.status(500).json({ error: message });
      }
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

    if (isMockDbMode()) {
      if (req.user.id !== donorId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const donations = mockDonations
        .filter((donation) => donation.donor_id === donorId)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .map(enrichDonation);

      return res.json({ donations });
    }

    if (useSupabase()) {
      if (req.user.id !== donorId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      try {
        const donations = await supabaseAdapter.listDonations({ donor_id: donorId });
        return res.json({ donations: donations.map(mapSupabaseDonation) });
      } catch (error) {
        console.error('Error fetching Supabase donor donations:', error);
        const message = error?.message || 'Internal server error';
        return res.status(500).json({ error: message });
      }
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

    if (isMockDbMode()) {
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

    if (useSupabase()) {
      try {
        const ngo = await supabaseAdapter.findUserById(ngoId);
        if (!ngo || ngo.type !== 'ngo') {
          return res.status(404).json({ error: 'NGO not found' });
        }

        const donations = await supabaseAdapter.listDonations({ ngo_id: ngoId });
        return res.json({ donations: donations.map(mapSupabaseDonation) });
      } catch (error) {
        console.error('Error fetching Supabase NGO donations:', error);
        const message = error?.message || 'Internal server error';
        return res.status(500).json({ error: message });
      }
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
    if (isMockDbMode()) {
      const donations = mockDonations
        .filter((donation) => donation.status === 'completed')
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 50)
        .map(enrichDonation);

      return res.json({ donations });
    }

    if (useSupabase()) {
      try {
        const donations = await supabaseAdapter.listDonations({
          status: 'completed',
          limit: 50,
        });
        return res.json({ donations: donations.map(mapSupabaseDonation) });
      } catch (error) {
        console.error('Error fetching Supabase donations:', error);
        const message = error?.message || 'Internal server error';
        return res.status(500).json({ error: message });
      }
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

    if (isMockDbMode()) {
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

    if (useSupabase()) {
      const validStatuses = ['pending', 'confirmed', 'completed', 'failed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      try {
        const donation = await supabaseAdapter.findDonationById(id);
        if (!donation) {
          return res.status(404).json({ error: 'Donation not found' });
        }

        if (req.user.id !== donation.donor_id && req.user.id !== donation.ngo_id) {
          return res.status(403).json({ error: 'Access denied' });
        }

        await supabaseAdapter.updateDonation(id, { status });

        // If status is 'confirmed' and donation has delivery_date, schedule reminder notification
        if (status === 'confirmed' && donation.delivery_date) {
          const deliveryDate = new Date(donation.delivery_date);
          const now = new Date();
          const daysUntilDelivery = Math.ceil((deliveryDate - now) / (1000 * 60 * 60 * 24));
          
          // Send reminder if delivery is 1-2 days away
          if (daysUntilDelivery >= 1 && daysUntilDelivery <= 2) {
            await notifyDonationDeliveryReminder({
              donorId: donation.donor_id,
              donationId: id,
              ngoName: (donation.ngo && donation.ngo.name) || (donation.ngo_name) || 'NGO',
              donationType: donation.donation_type,
              amount: donation.amount,
              currency: donation.currency || 'INR',
              deliveryDate: donation.delivery_date,
            });
          }
        }

        return res.json({ message: 'Donation status updated successfully' });
      } catch (error) {
        console.error('Error updating Supabase donation status:', error);
        const message = error?.message || 'Internal server error';
        return res.status(500).json({ error: message });
      }
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

    if (isMockDbMode()) {
      const donation = mockDonations.find((item) => item.id === id);

      if (!donation) {
        return res.status(404).json({ error: 'Donation not found' });
      }

      if (req.user.id !== donation.donor_id && req.user.id !== donation.ngo_id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      return res.json({ donation: enrichDonation(donation) });
    }

    if (useSupabase()) {
      try {
        const donation = await supabaseAdapter.findDonationById(id);
        if (!donation) {
          return res.status(404).json({ error: 'Donation not found' });
        }

        if (req.user.id !== donation.donor_id && req.user.id !== donation.ngo_id) {
          return res.status(403).json({ error: 'Access denied' });
        }

        return res.json({ donation: mapSupabaseDonation(donation) });
      } catch (error) {
        console.error('Error fetching Supabase donation:', error);
        const message = error?.message || 'Internal server error';
        return res.status(500).json({ error: message });
      }
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

// Request donation again (for NGOs when delivery date has passed)
router.post('/:id/request-again', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { new_delivery_date } = req.body;

    if (isMockDbMode()) {
      const donation = mockDonations.find((item) => item.id === id);
      if (!donation) {
        return res.status(404).json({ error: 'Donation not found' });
      }

      // Only NGO can request again
      if (req.user.id !== donation.ngo_id) {
        return res.status(403).json({ error: 'Only the NGO can request a donation again' });
      }

      // Check if donation is pending/confirmed and delivery date has passed
      if (donation.status === 'completed' || donation.status === 'cancelled') {
        return res.status(400).json({ error: 'Cannot request completed or cancelled donations again' });
      }

      if (!donation.delivery_date) {
        return res.status(400).json({ error: 'Donation does not have a delivery date' });
      }

      const deliveryDate = new Date(donation.delivery_date);
      const now = new Date();
      if (deliveryDate > now) {
        return res.status(400).json({ error: 'Delivery date has not passed yet' });
      }

      // Set new delivery date (7 days from now or use provided date)
      const futureDate = new_delivery_date 
        ? new Date(new_delivery_date)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      if (futureDate <= now) {
        return res.status(400).json({ error: 'New delivery date must be in the future' });
      }

      // Update donation
      updateMockDonation(id, {
        delivery_date: futureDate.toISOString(),
        status: 'pending',
      });

      // Get NGO info for notification
      const ngo = findUserById(donation.ngo_id);
      
      // Notify donor
      await notifyDonationRequestAgain({
        donorId: donation.donor_id,
        donationId: id,
        ngoName: ngo?.name || 'An NGO',
        donationType: donation.donation_type,
        amount: donation.amount,
        currency: donation.currency || 'INR',
        newDeliveryDate: futureDate.toISOString(),
      });

      return res.json({ 
        message: 'Donation request sent successfully',
        donation: enrichDonation({ ...donation, delivery_date: futureDate.toISOString(), status: 'pending' })
      });
    }

    if (useSupabase()) {
      try {
        const donation = await supabaseAdapter.findDonationById(id);
        if (!donation) {
          return res.status(404).json({ error: 'Donation not found' });
        }

        // Only NGO can request again
        if (req.user.id !== donation.ngo_id) {
          return res.status(403).json({ error: 'Only the NGO can request a donation again' });
        }

        // Check if donation is pending/confirmed and delivery date has passed
        if (donation.status === 'completed' || donation.status === 'cancelled') {
          return res.status(400).json({ error: 'Cannot request completed or cancelled donations again' });
        }

        if (!donation.delivery_date) {
          return res.status(400).json({ error: 'Donation does not have a delivery date' });
        }

        const deliveryDate = new Date(donation.delivery_date);
        const now = new Date();
        if (deliveryDate > now) {
          return res.status(400).json({ error: 'Delivery date has not passed yet' });
        }

        // Set new delivery date (7 days from now or use provided date)
        const futureDate = new_delivery_date 
          ? new Date(new_delivery_date)
          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        if (futureDate <= now) {
          return res.status(400).json({ error: 'New delivery date must be in the future' });
        }

        // Update donation
        await supabaseAdapter.updateDonation(id, {
          delivery_date: futureDate.toISOString(),
          status: 'pending',
        });

        // Get NGO info for notification
        const ngo = await supabaseAdapter.findUserById(donation.ngo_id);
        
        // Notify donor
        await notifyDonationRequestAgain({
          donorId: donation.donor_id,
          donationId: id,
          ngoName: ngo?.name || 'An NGO',
          donationType: donation.donation_type,
          amount: donation.amount,
          currency: donation.currency || 'INR',
          newDeliveryDate: futureDate.toISOString(),
        });

        const updatedDonation = await supabaseAdapter.findDonationById(id);
        return res.json({ 
          message: 'Donation request sent successfully',
          donation: mapSupabaseDonation(updatedDonation)
        });
      } catch (error) {
        console.error('Error requesting donation again:', error);
        const message = error?.message || 'Internal server error';
        return res.status(500).json({ error: message });
      }
    }

    // MySQL fallback
    const [donations] = await db.execute(
      'SELECT * FROM donations WHERE id = ?',
      [id]
    );

    if (donations.length === 0) {
      return res.status(404).json({ error: 'Donation not found' });
    }

    const donation = donations[0];

    // Only NGO can request again
    if (req.user.id !== donation.ngo_id) {
      return res.status(403).json({ error: 'Only the NGO can request a donation again' });
    }

    // Check if donation is pending/confirmed and delivery date has passed
    if (donation.status === 'completed' || donation.status === 'cancelled') {
      return res.status(400).json({ error: 'Cannot request completed or cancelled donations again' });
    }

    if (!donation.delivery_date) {
      return res.status(400).json({ error: 'Donation does not have a delivery date' });
    }

    const deliveryDate = new Date(donation.delivery_date);
    const now = new Date();
    if (deliveryDate > now) {
      return res.status(400).json({ error: 'Delivery date has not passed yet' });
    }

    // Set new delivery date (7 days from now or use provided date)
    const futureDate = new_delivery_date 
      ? new Date(new_delivery_date)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    if (futureDate <= now) {
      return res.status(400).json({ error: 'New delivery date must be in the future' });
    }

    // Update donation
    await db.execute(
      'UPDATE donations SET delivery_date = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [futureDate.toISOString(), 'pending', id]
    );

    res.json({ message: 'Donation request sent successfully' });
  } catch (error) {
    console.error('Error requesting donation again:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
