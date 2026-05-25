// src/modules/receipts/receipts.service.js
'use strict';

const PDFDocument = require('pdfkit');
const { supabaseAdmin } = require('../../lib/supabase');
const { AppError } = require('../../middleware/errorHandler');
const { generateReceiptNumber } = require('../../lib/refGenerator');
const logger = require('../../lib/logger');

const receiptsService = {

  /**
   * Generate a PDF receipt for a confirmed booking and store it
   * in Supabase Storage. Saves receipt record in DB.
   *
   * @param {string} bookingId
   * @returns {object} receipt record
   */
  async generateReceipt(bookingId) {
    // Fetch booking with all related data
    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .select(`
        id, booking_ref, num_nights, total_amount, price_per_night,
        check_in_at, check_out_at, created_at,
        guests ( name, phone, email ),
        rooms ( room_number, floor ),
        categories ( name ),
        payments ( amount_received, confirmed_at )
      `)
      .eq('id', bookingId)
      .single();

    if (error || !booking) throw new AppError('Booking not found', 404);

    const receiptNumber = generateReceiptNumber();
    const pdfBuffer = await this._generatePDF(booking, receiptNumber);

    // Upload to Supabase Storage
    const fileName = `receipts/${booking.booking_ref}.pdf`;
    const { error: uploadErr } = await supabaseAdmin
      .storage
      .from('hotel-docs')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadErr) {
      logger.error('PDF upload failed', { error: uploadErr.message, bookingId });
      // Don't throw — receipt record still created without URL
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin
      .storage
      .from('hotel-docs')
      .getPublicUrl(fileName);

    // Save receipt record
    const { data: receipt, error: receiptErr } = await supabaseAdmin
      .from('receipts')
      .insert({
        booking_id:     bookingId,
        receipt_number: receiptNumber,
        pdf_url:        urlData?.publicUrl || null,
      })
      .select()
      .single();

    if (receiptErr) throw new AppError('Failed to save receipt', 500);

    logger.info('Receipt generated', { bookingId, receiptNumber });
    return receipt;
  },

    async listReceipts() {
    const { data, error } = await supabaseAdmin
      .from('receipts')
      .select('*, bookings(booking_ref, total_amount, num_nights, check_in_at, guests(name), rooms(room_number))')
      .order('issued_at', { ascending: false })
      .limit(100);
    if (error) throw new AppError(error.message, 500);
    return data;
  },
  
  async getReceiptByBookingId(bookingId) {
    const { data, error } = await supabaseAdmin
      .from('receipts')
      .select('*, bookings(booking_ref, total_amount, num_nights, check_in_at, check_out_at, guests(name), rooms(room_number), categories(name))')
      .eq('booking_id', bookingId)
      .single();

    if (error || !data) throw new AppError('Receipt not found', 404);
    return data;
  },

  /**
   * Build the PDF in memory and return a Buffer.
   */
  async _generatePDF(booking, receiptNumber) {
    return new Promise((resolve, reject) => {
      const doc    = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data',  (chunk) => chunks.push(chunk));
      doc.on('end',   () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const payment = booking.payments?.[0];
      const guest   = booking.guests;
      const room    = booking.rooms;

      // ── Header ────────────────────────────────────────────
      doc.fontSize(22).font('Helvetica-Bold').text('HOTEL RECEIPT', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica').fillColor('#666666')
        .text(receiptNumber, { align: 'center' });
      doc.moveDown(1);

      // ── Divider ───────────────────────────────────────────
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#CCCCCC');
      doc.moveDown(1);

      // ── Booking details ───────────────────────────────────
      const rows = [
        ['Booking Reference', booking.booking_ref],
        ['Guest Name',        guest.name],
        ['Phone',             guest.phone],
        ['Room',              `${room.room_number} (${booking.categories.name})`],
        ['Number of Nights',  String(booking.num_nights)],
        ['Price per Night',   `₦${parseFloat(booking.price_per_night).toLocaleString()}`],
        ['Check-in',          new Date(booking.check_in_at).toLocaleString('en-NG')],
        ['Check-out',         new Date(booking.check_out_at).toLocaleString('en-NG')],
        ['Amount Paid',       `₦${parseFloat(payment?.amount_received || booking.total_amount).toLocaleString()}`],
        ['Payment Time',      payment?.confirmed_at ? new Date(payment.confirmed_at).toLocaleString('en-NG') : 'N/A'],
      ];

      doc.fillColor('#000000').font('Helvetica');
      for (const [label, value] of rows) {
        const y = doc.y;
        doc.fontSize(10).font('Helvetica-Bold').text(label, 50, y, { width: 200 });
        doc.fontSize(10).font('Helvetica').text(value, 270, y, { width: 275 });
        doc.moveDown(0.6);
      }

      doc.moveDown(1);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#CCCCCC');
      doc.moveDown(1);

      // ── Total ─────────────────────────────────────────────
      doc.fontSize(14).font('Helvetica-Bold')
        .text(`TOTAL PAID: ₦${parseFloat(booking.total_amount).toLocaleString()}`, { align: 'right' });

      doc.moveDown(2);
      doc.fontSize(9).font('Helvetica').fillColor('#999999')
        .text('Present this receipt to the front desk to collect your room key.', { align: 'center' });
      doc.text('Thank you for your stay.', { align: 'center' });

      doc.end();
    });
  },
};

module.exports = receiptsService;
