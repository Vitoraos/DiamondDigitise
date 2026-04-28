// src/lib/auditLog.js
// ─────────────────────────────────────────────────────────────
// Audit logging utility for tracking admin actions.
// Writes to the audit_log table in Supabase.
// ─────────────────────────────────────────────────────────────
'use strict';

const { supabaseAdmin } = require('./supabase');
const logger = require('./logger');

/**
 * Write an audit log entry.
 * @param {{ actorId, actorRole, action, entity, entityId, payload? }} params
 */
async function writeAuditLog({ actorId, actorRole, action, entity, entityId, payload = {} }) {
  const { error } = await supabaseAdmin
    .from('audit_log')
    .insert({
      actor_id:   actorId,
      actor_role: actorRole,
      action,
      entity,
      entity_id:  entityId,
      payload,
    });

  if (error) {
    logger.error('Failed to write audit log', { error, action, entity, entityId });
    throw new Error('Audit logging failed');
  }

  logger.info('Audit log written', { action, entity, entityId, actorId });
}

module.exports = { writeAuditLog };
