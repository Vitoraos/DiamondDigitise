// src/modules/rooms/rooms.service.js
// ─────────────────────────────────────────────────────────────
// All room business logic lives here.
// Controllers call this. Nothing else touches the DB directly.
// ─────────────────────────────────────────────────────────────
'use strict';

const { supabaseAdmin } = require('../../lib/supabase');
const { AppError } = require('../../middleware/errorHandler');
const logger = require('../../lib/logger');
const timersService = require('../timers/timersService');

const VALID_STATUSES = ['available', 'in_use', 'cleaning'];

const roomsService = {

  /**
   * Return all rooms joined with their category data.
   * Includes cleaning_started_at and cleaning_eta_minutes
   * so the frontend can compute the countdown timer.
   */
  async getAllRooms() {
    const { data, error } = await supabaseAdmin
      .from('rooms')
      .select(`
        id,
        room_number,
        floor,
        status,
        cleaning_started_at,
        cleaning_eta_minutes,
        categories (
          id,
          name,
          price_per_night,
          description,
          display_order
        )
      `)
      .order('floor', { ascending: true })
      .order('room_number', { ascending: true });

    if (error) throw new AppError(error.message, 500);
    return data;
  },

  /**
   * Return active categories with prices, ordered for UI display.
   */
  async getCategories() {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('id, name, price_per_night, description, display_order')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw new AppError(error.message, 500);
    return data;
  },

  /**
   * Return a single room by UUID.
   */
  async getRoomById(id) {
    const { data, error } = await supabaseAdmin
      .from('rooms')
      .select(`
        id, room_number, floor, status,
        cleaning_started_at, cleaning_eta_minutes, notes,
        categories ( id, name, price_per_night, description )
      `)
      .eq('id', id)
      .single();

    if (error) throw new AppError('Room not found', 404);
    return data;
  },

  /**
   * Create a new room.
   * @param {{ room_number, category_id, floor?, notes? }} body
   */
  async createRoom(body) {
    const { room_number, category_id, floor, notes } = body;

    if (!room_number || !category_id) {
      throw new AppError('room_number and category_id are required', 400);
    }

    const { data, error } = await supabaseAdmin
      .from('rooms')
      .insert({ room_number, category_id, floor, notes })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new AppError(`Room number ${room_number} already exists`, 409);
      }
      throw new AppError(error.message, 500);
    }

    logger.info('Room created', { roomNumber: room_number });
    return data;
  },

  /**
   * Update room details (not status — use updateRoomStatus for that).
   */
  async updateRoom(id, body) {
    const allowed = ['floor', 'notes', 'cleaning_eta_minutes'];
    const updates = Object.fromEntries(
      Object.entries(body).filter(([k]) => allowed.includes(k))
    );

    if (Object.keys(updates).length === 0) {
      throw new AppError('No valid fields to update', 400);
    }

    const { data, error } = await supabaseAdmin
      .from('rooms')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new AppError(error.message, 500);
    return data;
  },

  /**
   * Transition room to a new status.
   * The DB trigger enforces valid transitions — we pre-validate here
   * to return a helpful error message before hitting the DB.
   *
   * When setting to 'cleaning', records cleaning_started_at.
   * When setting to 'available' from cleaning, clears cleaning_started_at.
   *
   * @param {string} id - room UUID
   * @param {string} newStatus - target status
   * @param {number|null} cleaningEtaMinutes - override ETA if setting to cleaning
   * @param {{ id, role, fullName }} actor - admin performing the action
   */
  async updateRoomStatus(id, newStatus, cleaningEtaMinutes, actor) {
    if (!VALID_STATUSES.includes(newStatus)) {
      throw new AppError(
        `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
        400
      );
    }

    // Build update payload
    const updates = { status: newStatus };

    if (newStatus === 'cleaning') {
      updates.cleaning_started_at = new Date().toISOString();
      if (cleaningEtaMinutes) updates.cleaning_eta_minutes = cleaningEtaMinutes;
    }

    if (newStatus === 'available') {
      updates.cleaning_started_at = null;
    }

    const { data, error } = await supabaseAdmin
      .from('rooms')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    // DB trigger will throw on invalid transition
    if (error) {
      if (error.message.includes('Invalid room status transition')) {
        throw new AppError(error.message, 422, 'INVALID_TRANSITION');
      }
      throw new AppError(error.message, 500);
    }

    logger.info('Room status updated', {
      roomId: id,
      newStatus,
      actor: actor?.fullName,
      role: actor?.role,
    });

    return data;
  },

  /**
   * Delete a room. Will fail at DB level if active bookings exist
   * (foreign key with ON DELETE RESTRICT).
   */
  async deleteRoom(id) {
    const { error } = await supabaseAdmin
      .from('rooms')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === '23503') {
        throw new AppError('Cannot delete room with active bookings', 409);
      }
      throw new AppError(error.message, 500);
    }
  },
};

module.exports = roomsService;
