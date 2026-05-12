// src/modules/admin/admin.service.js
'use strict';

const { supabaseAdmin } = require('../../lib/supabase');
const { AppError } = require('../../middleware/errorHandler');
const { writeAuditLog } = require('../../lib/auditLog');

// Roles the owner is allowed to assign to other people.
// 'owner' is intentionally excluded — there can only be one owner,
// set by the bootstrap SQL INSERT. Nobody can be promoted to owner
// through the app.
const ASSIGNABLE_ROLES = ['manager', 'front_desk'];

const adminService = {

  async getDashboardStats() {
    const [rooms, bookings, payments] = await Promise.all([
      supabaseAdmin.from('rooms').select('status'),
      supabaseAdmin.from('bookings').select('status').gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      supabaseAdmin.from('payments').select('amount_received, status').eq('status', 'confirmed'),
    ]);

    const roomStats = (rooms.data || []).reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {});

    const totalRevenue = (payments.data || []).reduce(
      (sum, p) => sum + parseFloat(p.amount_received || 0), 0
    );

    return {
      rooms: roomStats,
      bookingsLast30Days: bookings.data?.length || 0,
      revenueConfirmed: totalRevenue,
    };
  },

  async listAdminUsers() {
    const { data, error } = await supabaseAdmin
      .from('admin_users')
      .select('id, full_name, role, is_active, created_at')
      .order('created_at', { ascending: true });

    if (error) throw new AppError(error.message, 500);
    return data;
  },

  async createAdminUser({ email, fullName, role }, actor) {
    if (!email || !fullName || !role) {
      throw new AppError('email, fullName, and role are required', 400);
    }

    // Only manager and front_desk can be assigned through the app.
    if (!ASSIGNABLE_ROLES.includes(role)) {
      throw new AppError(
        `Invalid role. Assignable roles are: ${ASSIGNABLE_ROLES.join(', ')}`,
        400,
        'INVALID_ROLE'
      );
    }

    // Create Supabase auth user (sends invite email) — duplicate detection is built-in
    const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(email);
    if (authErr) {
      // If it's a duplicate, Supabase returns a specific message
      if (authErr.message?.includes('email already exists')) {
        throw new AppError('A user with this email already exists', 409, 'USER_EXISTS');
      }
      throw new AppError(`Failed to invite user: ${authErr.message}`, 500);
    }

    const { data, error } = await supabaseAdmin
      .from('admin_users')
      .insert({ id: authUser.user.id, full_name: fullName, role })
      .select()
      .single();

    if (error) throw new AppError(error.message, 500);

    await writeAuditLog({
      actorId: actor.id, actorRole: actor.role,
      action: 'create_admin_user',
      entity: 'admin_users', entityId: data.id,
      payload: { email, role },
    });

    return data;
  },

  async updateAdminUser(id, { role, isActive, fullName }, actor) {
    const updates = {};

    if (role !== undefined) {
      if (!ASSIGNABLE_ROLES.includes(role)) {
        throw new AppError(
          `Invalid role. Assignable roles are: ${ASSIGNABLE_ROLES.join(', ')}`,
          400,
          'INVALID_ROLE'
        );
      }
      updates.role = role;
    }

    // Prevent the owner from deactivating themselves
    if (isActive === false && id === actor.id) {
      throw new AppError('You cannot deactivate your own account', 400, 'SELF_DEACTIVATION');
    }

    if (fullName)               updates.full_name = fullName;
    if (isActive !== undefined) updates.is_active = isActive;

    const { data, error } = await supabaseAdmin
      .from('admin_users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) throw new AppError('User not found', 404);

    await writeAuditLog({
      actorId: actor.id, actorRole: actor.role,
      action: 'update_admin_user',
      entity: 'admin_users', entityId: id,
      payload: updates,
    });

    return data;
  },

  /**
   * Deactivate a staff member — immediate lockout on next request.
   * Their Supabase auth account is NOT deleted (audit trail preserved),
   * but is_active = false means requireAuth rejects them instantly.
   * Owner only. Cannot deactivate self.
   */
  async deactivateUser(id, actor) {
    if (id === actor.id) {
      throw new AppError('You cannot deactivate your own account', 400, 'SELF_DEACTIVATION');
    }

    // Confirm target is not the owner
    const { data: target } = await supabaseAdmin
      .from('admin_users')
      .select('role, full_name')
      .eq('id', id)
      .single();

    if (!target) throw new AppError('User not found', 404);
    if (target.role === 'owner') {
      throw new AppError('Owner accounts cannot be deactivated through the app', 403);
    }

    const { data, error } = await supabaseAdmin
      .from('admin_users')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) throw new AppError('Failed to deactivate user', 500);

    await writeAuditLog({
      actorId:   actor.id,
      actorRole: actor.role,
      action:    'deactivate_admin_user',
      entity:    'admin_users',
      entityId:  id,
      payload:   { targetName: target.full_name, targetRole: target.role },
    });

    return data;
  },
};

module.exports = adminService;
