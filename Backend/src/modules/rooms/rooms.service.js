// src/modules/rooms/rooms.service.js
// ─────────────────────────────────────────────────────────────
// All room business logic lives here.
// ─────────────────────────────────────────────────────────────
'use strict';

const { supabaseAdmin } = require('../../lib/supabase');
const { AppError } = require('../../middleware/errorHandler');
const logger = require('../../lib/logger');
const timersService = require('../timers/timersService');

const VALID_STATUSES = ['available', 'occupied', 'cleaning', 'maintenance'];

const roomsService = {
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
        image_urls,
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

  async getCategories() {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('id, name, price_per_night, description, display_order')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw new AppError(error.message, 500);
    return data;
  },

  async getRoomById(id) {
    const { data, error } = await supabaseAdmin
      .from('rooms')
      .select(`
        id,
        room_number,
        floor,
        status,
        cleaning_started_at,
        cleaning_eta_minutes,
        notes,
        image_urls,
        categories (
          id,
          name,
          price_per_night,
          description
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw new AppError('Room not found', 404);
    return data;
  },

  async createRoom(body) {
    const { room_number, category_id, floor, notes, image_urls } = body;

    if (!room_number || !category_id) {
      throw new AppError('room_number and category_id are required', 400);
    }

    const insertData = { room_number, category_id, floor, notes };

    if (Array.isArray(image_urls)) {
      insertData.image_urls = image_urls;
    }

    const { data, error } = await supabaseAdmin
      .from('rooms')
      .insert(insertData)
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

  async updateRoom(id, body) {
    const allowed = ['floor', 'notes', 'cleaning_eta_minutes', 'image_urls'];

    const updates = Object.fromEntries(
      Object.entries(body).filter(([key]) => allowed.includes(key))
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

  async updateRoomStatus(id, newStatus, cleaningEtaMinutes, actor) {
    if (newStatus === 'cleaning') {
      throw new AppError(
        'Room cleaning is triggered automatically on guest checkout. It cannot be set manually.',
        400,
        'CLEANING_AUTO_ONLY'
      );
    }

    if (!VALID_STATUSES.includes(newStatus)) {
      throw new AppError(
        `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
        400
      );
    }

    const updates = { status: newStatus };

    if (newStatus === 'available') {
      updates.cleaning_started_at = null;
    }

    const { data, error } = await supabaseAdmin
      .from('rooms')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (
        error.code === 'P0001' ||
        error.message?.includes('Invalid room status transition')
      ) {
        throw new AppError(error.message, 422, 'INVALID_TRANSITION');
      }

      if (error.code === '23505') {
        throw new AppError('Room number already exists', 409);
      }

      throw new AppError(error.message, 500);
    }

    logger.info('Room status updated', {
      roomId: id,
      newStatus,
      actor: actor?.fullName,
    });

    return data;
  },

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
