const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { useMockDb, findUserByEmail, findUserById, createUser } = require('../services/mockData');
const router = express.Router();

const isMockDb = () => useMockDb();

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { email, password, userData } = req.body;

    if (isMockDb()) {
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

    if (isMockDb()) {
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

    if (isMockDb()) {
      const user = findUserById(decoded.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const { password: _password, ...safeUser } = user;
      return res.json({ user: safeUser });
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
