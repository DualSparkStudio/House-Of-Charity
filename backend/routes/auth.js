const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { useMockDb, findUserByEmail, findUserById, createUser } = require('../services/mockData');
const { isMockDb, useSupabase } = require('../utils/dbMode');

let supabaseAdapter = null;
if (useSupabase()) {
  // Lazy-load to avoid requiring when Supabase mode is enabled
  supabaseAdapter = require('../services/supabaseAdapter');
}
const router = express.Router();

const isMockDbMode = () => isMockDb();

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { email, password, userData } = req.body;

    if (isMockDbMode()) {
      const existingUser = findUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const mockUser = createUser({
        email,
        password: hashedPassword,
        user_type: userData.user_type,
        name: userData.name || null,
        phone: userData.phone || null,
        address: userData.address || null,
        city: userData.city || null,
        state: userData.state || null,
        country: userData.country || 'USA',
        pincode: userData.pincode || null,
        description: userData.description || null,
        website: userData.website || null,
        verified: !!userData.verified,
      });

      const token = jwt.sign({ id: mockUser.id, email }, process.env.JWT_SECRET, { expiresIn: '24h' });
      const { password: _password, ...safeUser } = mockUser;

      return res.status(201).json({
        message: 'User registered successfully',
        token,
        user: safeUser,
      });
    }

    if (useSupabase()) {
      try {
        const existing = await supabaseAdapter.findUserByEmail(email);
        if (existing) {
          return res.status(400).json({ error: 'User with this email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const basePayload = {
          email,
          password_hash: hashedPassword,
          name: userData.name || null,
          phone_number: userData.phone || null,
          address: userData.address || null,
          city: userData.city || null,
          state: userData.state || null,
          country: userData.country || 'India',
          pincode: userData.pincode || null,
          description: userData.description || null,
          website: userData.website || null,
          logo_url: userData.logo_url || null,
          verified: !!userData.verified,
        };

        if (userData.user_type === 'ngo') {
          basePayload.works_done = userData.works_done || null;
          basePayload.awards_received = userData.awards_received || null;
        }

        const result = await supabaseAdapter.createUser(userData.user_type, basePayload);
        const token = jwt.sign(
          { id: result.mapped.id, email, user_type: userData.user_type },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );

        return res.status(201).json({
          message: 'User registered successfully',
          token,
          user: result.mapped,
        });
      } catch (error) {
        console.error('Supabase registration error:', error);
        const message = error?.message || 'Failed to register user';
        return res.status(500).json({ error: message });
      }
    }

    // Check if user already exists (MySQL)
    const [existingUsers] = await db.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Generate UUID for user
    const userId = uuidv4();

    // Insert user into database
    await db.execute(
      `INSERT INTO users (id, email, user_type, name, phone, address, city, state, country, pincode, description, website, verified) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        email,
        userData.user_type,
        userData.name || null,
        userData.phone || null,
        userData.address || null,
        userData.city || null,
        userData.state || null,
        userData.country || 'India',
        userData.pincode || null,
        userData.description || null,
        userData.website || null,
        false
      ]
    );

    // Generate JWT token
    const token = jwt.sign({ id: userId, email }, process.env.JWT_SECRET, { expiresIn: '24h' });

    // Get the created user
    const [newUser] = await db.execute(
      'SELECT id, email, user_type, name, phone, city, state, description FROM users WHERE id = ?',
      [userId]
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: newUser[0]
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (isMockDbMode()) {
      const user = findUserByEmail(email);

      if (!user) {
        return res.status(400).json({ error: 'Invalid email or password' });
      }

      if (user.password) {
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          return res.status(400).json({ error: 'Invalid email or password' });
        }
      }

      const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '24h' });
      const { password: _password, ...safeUser } = user;

      return res.json({
        message: 'Login successful',
        token,
        user: safeUser,
      });
    }

    if (useSupabase()) {
      try {
        const result = await supabaseAdapter.findUserByEmail(email);

        if (!result) {
          return res.status(400).json({ error: 'Invalid email or password' });
        }

        const isValidPassword = await bcrypt.compare(password, result.record.password_hash);
        if (!isValidPassword) {
          return res.status(400).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign(
          { id: result.mapped.id, email: result.mapped.email, user_type: result.mapped.user_type },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );

        return res.json({
          message: 'Login successful',
          token,
          user: result.mapped,
        });
      } catch (error) {
        console.error('Supabase login error:', error);
        const message = error?.message || 'Internal server error during login';
        return res.status(500).json({ error: message });
      }
    }

    // Find user by email
    const [users] = await db.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const user = users[0];

    if (user.password) {
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ error: 'Invalid email or password' });
      }
    }

    // Generate JWT token
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '24h' });

    // Remove sensitive data
    const { id, user_type, name, phone, city, state, description } = user;

    res.json({
      message: 'Login successful',
      token,
      user: { id, email: user.email, user_type, name, phone, city, state, description }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// Verify token endpoint
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (isMockDbMode()) {
      const user = findUserById(decoded.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const { password: _password, ...safeUser } = user;
      return res.json({ user: safeUser });
    }

    if (useSupabase()) {
      try {
        const result = await supabaseAdapter.findUserById(decoded.id);
        if (!result) {
          return res.status(404).json({ error: 'User not found' });
        }

        return res.json({ user: result.mapped });
      } catch (error) {
        console.error('Supabase token verification error:', error);
        return res.status(500).json({ error: 'Failed to verify token' });
      }
    }

    // Get user data from database
    const [users] = await db.execute(
      'SELECT id, email, user_type, name, phone, city, state, description FROM users WHERE id = ?',
      [decoded.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: users[0] });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(403).json({ error: 'Invalid token' });
  }
});

module.exports = router;
