const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { isMockDb, useSupabase } = require('../utils/dbMode');
const {
  listNotificationsForUser: listMockNotifications,
  markNotificationsRead: markMockNotifications,
} = require('../services/mockData');

let supabaseAdapter = null;
if (useSupabase()) {
  supabaseAdapter = require('../services/supabaseAdapter');
}

const router = express.Router();

const isMockDbMode = () => isMockDb();

router.get('/', authenticateToken, async (req, res) => {
  const { unreadOnly, limit } = req.query || {};
  const options = {
    unreadOnly: unreadOnly === 'true',
  };
  if (limit) {
    const parsed = Number(limit);
    if (!Number.isNaN(parsed) && parsed > 0) {
      options.limit = parsed;
    }
  }

  try {
    if (isMockDbMode()) {
      const notifications = listMockNotifications(req.user.id, options);
      return res.json({
        notifications,
        unreadCount: notifications.filter((item) => !item.read).length,
      });
    }

    if (useSupabase()) {
      try {
        const notifications = await supabaseAdapter.listNotificationsForUser(
          req.user.id,
          options
        );
        const unreadCount = notifications.filter((item) => !item.read).length;
        return res.json({ notifications, unreadCount });
      } catch (error) {
        console.error('Supabase notifications fetch error:', error);
        const message = error?.message || 'Unable to load notifications';
        return res.status(500).json({ error: message });
      }
    }

    return res
      .status(501)
      .json({ error: 'Notifications are unavailable for this database mode' });
  } catch (error) {
    console.error('Notifications fetch error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/mark-read', authenticateToken, async (req, res) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids : null;

  try {
    if (isMockDbMode()) {
      const updated = markMockNotifications(req.user.id, ids);
      const unreadCount = listMockNotifications(req.user.id, {
        unreadOnly: true,
      }).length;
      return res.json({ updated, unreadCount });
    }

    if (useSupabase()) {
      try {
        const updated = await supabaseAdapter.markNotificationsRead(
          req.user.id,
          ids
        );
        const remaining = await supabaseAdapter.listNotificationsForUser(
          req.user.id,
          { unreadOnly: true }
        );
        return res.json({ updated, unreadCount: remaining.length });
      } catch (error) {
        console.error('Supabase mark notifications error:', error);
        const message = error?.message || 'Unable to update notifications';
        return res.status(500).json({ error: message });
      }
    }

    return res
      .status(501)
      .json({ error: 'Notifications are unavailable for this database mode' });
  } catch (error) {
    console.error('Notifications update error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

