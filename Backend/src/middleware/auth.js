// src/middleware/auth.js
// ─────────────────────────────────────────────────────────────
// Express middleware for authenticating admin users.
//
// requireAuth        — any logged-in admin
// requireRole(...r)  — specific roles only
//
// Verifies the Supabase JWT then fetches the admin_users record
// to confirm the role. Both checks must pass.
// ─────────────────────────────────────────────────────────────
'use strict';

const { supabaseAnon, supabaseAdmin } = require('../lib/supabase');
const logger = require('../lib/logger');

/**
 * Verify bearer token, attach user + role to req.
 */
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return res.status(401).json({ error: 'Missing authentication token' });
    }

    // Verify JWT with Supabase
    const { data: { user }, error } = await supabaseAnon.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Fetch admin role from our table
    const { data: adminUser, error: roleError } = await supabaseAdmin
      .from('admin_users')
      .select('id, role, full_name, is_active')
      .eq('id', user.id)
      .single();

    if (roleError || !adminUser) {
      return res.status(403).json({ error: 'User is not an admin' });
    }

    if (!adminUser.is_active) {
      return res.status(403).json({ error: 'Account is inactive' });
    }

    // Attach to request for downstream use
    req.user = {
      id: user.id,
      email: user.email,
      role: adminUser.role,
      fullName: adminUser.full_name,
    };

    next();
  } catch (err) {
    logger.error('Auth middleware error', { error: err.message });
    return res.status(500).json({ error: 'Authentication error' });
  }
}

/**
 * Role guard — use after requireAuth.
 * Example: router.patch('/status', requireAuth, requireRole('owner', 'manager'), handler)
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required roles: ${roles.join(', ')}`,
      });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
