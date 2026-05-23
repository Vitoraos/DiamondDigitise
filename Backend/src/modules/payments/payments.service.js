// src/modules/payments/payments.service.js
// ─────────────────────────────────────────────────────────────
// Payment flow:
//   1. Frontend polls GET /api/payments/poll/:paymentRef every 5s
//   2. pollPaymentStatus() calls Monnify API to check if money arrived
//   3. If paid in full → confirmBooking(), create receipt, start timers
//   4. If paid short   → flag incomplete, trigger refund (amount - ₦50)
//   5. If pending      → return { status: 'pending' } → frontend keeps polling
// ─────────────────────────────────────────────────────────────
'use strict';

const axios = require('axios');
const { supabaseAdmin } = require('../../lib/supabase');
const { AppError } = require('../../middleware/errorHandler');
const config = require('../../config');
const logger = require('../../lib/logger');
const bookingsService    = require('../bookings/bookingsService');
const receiptsService    = require('../receipts/receipts.service');
const timersService      = require('../timers/timersService');
const notificationService = require('../notifications/notificationService');

// ── Monnify auth token cache ──────────────────────────────────
let monnifyToken = null;
let monnifyTokenExpiry = 0;

async function getMonnifyToken() {
  if (monnifyToken && Date.now() < monnifyTokenExpiry) return monnifyToken;

  const credentials = Buffer.from(
    `${config.monnify.apiKey}:${config.monnify.secretKey}`
  ).toString('base64');

  const { data } = await axios.post(
    `${config.monnify.baseUrl}/api/v1/auth/login`,
    {},
    { headers: { Authorization: `Basic ${credentials}` } }
  );

  monnifyToken       = data.responseBody.accessToken;
  monnifyTokenExpiry = Date.now() + (data.responseBody.expiresIn * 1000) - 30_000;

  return monnifyToken;
}

async function monnifyGet(path) {
  const token = await getMonnifyToken();
  const { data } = await axios.get(`${config.monnify.baseUrl}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data.responseBody;
}

async function monnifyPost(path, body) {
  const token = await getMonnifyToken();
  const { data } = await axios.post(`${config.monnify.baseUrl}${path}`, body, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data.responseBody;
}

const paymentsService = {

  /**
   * Called by frontend every 5 seconds.
   * Checks Monnify for a transaction matching this payment_ref.
   * Returns the current state so the frontend can react.
   */
  Untitled
spark
Gemini
Gemini 3.1 Pro Preview
Ran for 20s
point_scan
Explored codebase
lightbulb
Thought for 18 seconds
This error happens because your Supabase Storage bucket (hotel-docs) is protected by Row Level Security (RLS) by default, and currently lacks a policy that allows users (even authenticated ones) to upload files.
To fix this, you need to add an INSERT policy for your storage bucket. You can do this securely from your Supabase Dashboard.
Fix: Add Storage RLS Policy in Supabase
Go to your Supabase Dashboard.
Navigate to Storage on the left menu, then click Policies under Configuration.
Scroll down to Other policies for the storage.objects table.
Click New Policy and choose For full customization.
Set up the policy exactly like this to allow authenticated staff to upload room images:
Policy Name: Allow authenticated uploads to hotel-docs
Allowed Operation: INSERT
Target Roles: authenticated
WITH CHECK expression:
code
SQL
bucket_id = 'hotel-docs'
Click Save Policy.
(Note: You may also want to ensure you have a SELECT policy on the bucket allowing public reads if these images are meant to be loaded on your public guest website. If you don't already have one, create another policy for SELECT, set Target Roles to anon or public, and use the same bucket_id = 'hotel-docs' check.)
Once you save this policy, the client-side upload in your ImageUpload.tsx component will successfully complete without being blocked by security policies!
create the sql code for client image upload and public read
Gemini 3.1 Pro Preview
Ran for 15s
lightbulb
Thought for 15 seconds
Here is the SQL code you need to run in your Supabase SQL Editor to configure the storage bucket properly.
This will create the hotel-docs bucket (if it doesn't exist yet), make it publicly accessible for viewing images, and allow authenticated admin users to upload images securely.
Copy and paste this exact code into your Supabase SQL Editor and click Run:
code
SQL
-- 1. Create the storage bucket and make it public
INSERT INTO storage.buckets (id, name, public)
VALUES ('hotel-docs', 'hotel-docs', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Enable Row Level Security (RLS) on storage objects just in case it's off
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Allow absolutely anyone (public) to read/view the images
CREATE POLICY "Public Read Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'hotel-docs');

-- 4. Allow only logged-in (authenticated) users to upload new images
CREATE POLICY "Authenticated Upload Access" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'hotel-docs');

-- 5. (Optional but recommended) Allow authenticated users to update/delete images if needed
CREATE POLICY "Authenticated Update/Delete Access" 
ON storage.objects FOR ALL 
TO authenticated 
USING (bucket_id = 'hotel-docs');
Why you were getting that error:
By default, Supabase creates storage buckets completely locked down with Row-Level Security (RLS). When your React app tried to upload the image, the database rejected it because there was no explicit policy (FOR INSERT) allowing authenticated users to add rows to the storage.objects table. Running the SQL above adds those permissions!
Error: Failed to run sql query: ERROR: 42501: must be owner of table objects
Gemini 3.1 Pro Preview
Ran for 20s
lightbulb
Thought for 20 seconds
The ERROR: 42501: must be owner of table objects happens because the SQL editor in Supabase sometimes doesn't have the necessary administrative privileges to modify the storage.objects table schema directly.
The easiest and safest way to fix the Row-Level Security (RLS) policy for image uploads is to do it directly through the Supabase Dashboard UI instead of using the SQL editor.
Here is how to allow image uploads and public reads through the UI:
Option 1: Using the Supabase Dashboard (Recommended)
Go to your Supabase Dashboard.
Click on Storage in the left sidebar.
If you haven't already, create a bucket named hotel-docs and make sure the Public toggle is enabled.
Click on Policies in the sidebar under Storage.
Find the hotel-docs bucket in the list and click New Policy.
Select For Full Customization.
Create the following two policies:
Policy 1: Public Read Access (Allows everyone to see the images)
Policy Name: Public Access
Allowed operation: SELECT
Target roles: public (or leave default)
USING expression:
code
SQL
bucket_id = 'hotel-docs'
Click Save policy.
Policy 2: Authenticated Uploads (Allows logged-in staff to upload images)
Policy Name: Staff Uploads
Allowed operation: INSERT
Target roles: authenticated
WITH CHECK expression:
code
SQL
bucket_id = 'hotel-docs'
Click Save policy.
(You can also repeat Policy 2 for UPDATE and DELETE operations if you want staff to be able to edit or delete existing images).
Option 2: Correct SQL (If you still want to use the SQL Editor)
If you still want to run it as a SQL query, try using this specific standard storage policy snippet (make sure not to include any ALTER TABLE or DROP POLICY commands on storage.objects as that triggers the ownership error):
code
SQL
-- 1. Create the bucket if it doesn't exist and set it to public
INSERT INTO storage.buckets (id, name, public)
VALUES ('hotel-docs', 'hotel-docs', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Allow public access to view images
CREATE POLICY "Public view access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'hotel-docs' );

-- 3. Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'hotel-docs' );

-- 4. Allow authenticated users to delete files
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'hotel-docs' );
Let me know if you run into any issues creating the policies from the interface!
It works now but when i want to make payment via monnify the account number doesnt show which files should i check Directory structure:
└── vitoraos-diamonddigitise/
├── Backend/
│ ├── package.json
│ ├── Render.yaml
│ └── src/
│ ├── app.js
│ ├── server.js
│ ├── config/
│ │ └── index.js
│ ├── lib/
│ │ ├── auditLog.js
│ │ ├── logger.js
│ │ ├── queue.js
│ │ ├── refGenerator.js
│ │ └── supabase.js
│ ├── middleware/
│ │ ├── auth.js
│ │ ├── errorHandler.js
│ │ └── validate.js
│ └── modules/
│ ├── admin/
│ │ ├── admin.controller.js
│ │ ├── admin.routes.js
│ │ └── adminService.js
│ ├── bookings/
│ │ ├── bookingsService.js
│ │ ├── controller.js
│ │ └── router.js
│ ├── notifications/
│ │ ├── notificationService.js
│ │ └── router.js
│ ├── payments/
│ │ ├── controller.js
│ │ ├── payments.service.js
│ │ └── router.js
│ ├── receipts/
│ │ ├── controller.js
│ │ ├── receipts.service.js
│ │ └── router.js
│ ├── rooms/
│ │ ├── controller.js
│ │ ├── rooms.service.js
│ │ └── route.js
│ └── timers/
│ ├── startTimerWorker.js
│ └── timersService.js
└── frontendd/
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── app/
│ ├── globals.css
│ ├── layout.tsx
│ ├── (auth)/
│ │ ├── loading.tsx
│ │ └── login/
│ │ └── page.tsx
│ ├── (public)/
│ │ ├── layout.tsx
│ │ ├── page.tsx
│ │ ├── booking/
│ │ │ └── [ref]/
│ │ │ └── page.tsx
│ │ ├── receipt/
│ │ │ └── [bookingId]/
│ │ │ └── page.tsx
│ │ └── room/
│ │ └── [id]/
│ │ └── page.tsx
│ └── admin/
│ ├── layout.tsx
│ ├── page.tsx
│ ├── bookings/
│ │ └── page.tsx
│ ├── dashboard/
│ │ └── page.tsx
│ ├── notifications/
│ │ └── page.tsx
│ ├── payments/
│ │ └── page.tsx
│ ├── receipts/
│ │ └── page.tsx
│ ├── rooms/
│ │ ├── page.tsx
│ │ ├── [id]/
│ │ │ └── edit/
│ │ │ └── page.tsx
│ │ └── new/
│ │ └── page.tsx
│ └── staff/
│ └── page.tsx
├── components/
│ ├── providers.tsx
│ ├── admin/
│ │ ├── DashboardStats.tsx
│ │ ├── ImageUpload.tsx
│ │ ├── RoomForm.tsx
│ │ └── Sidebar.tsx
│ ├── public/
│ │ └── RoomCard.tsx
│ ├── role/
│ │ └── RoleGate.tsx
│ ├── shared/
│ │ └── StatusBadge.tsx
│ └── ui/
│ ├── button.tsx
│ ├── calendar.tsx
│ ├── card.tsx
│ ├── dialog.tsx
│ ├── input.tsx
│ ├── label.tsx
│ ├── select.tsx
│ ├── textarea.tsx
│ ├── toast.tsx
│ ├── toaster.tsx
│ └── use-toast.ts
├── hooks/
│ ├── useAuth.ts
│ ├── useRole.ts
│ └── queries/
│ ├── useBookings.ts
│ ├── useDashboard.ts
│ ├── usePayments.ts
│ └── useRooms.ts
└── lib/
├── api.ts
├── query.ts
├── supabase.ts
└── utils.ts
Gemini 3.1 Pro Preview
Ran for 24s

summarize_auto
Action history
chevron_right
To display the Monnify account number to the user so they can make the payment, you need to check and update two main files in your project:
1. The Frontend Payment Page
File: frontendd/app/(public)/booking/[ref]/page.tsx
Currently, this file only shows a generic message asking the user to make a transfer, but it doesn't render any actual bank details. You need to update the UI to extract and display the Monnify virtual account number (and bank name) from the data returned by the API.
Update your status === "pending" block to look something like this:
code
Tsx
{status === "pending" && (
  <>
    <h1 className="text-2xl font-serif font-bold text-navy-800 mb-4">
      Awaiting Payment
    </h1>
    
    {/* ADD THIS NEW SECTION TO DISPLAY ACCOUNT DETAILS */}
    <div className="bg-white border-2 border-gold-300 p-6 rounded-xl my-6">
      <p className="text-sm text-navy-600 uppercase tracking-wide font-semibold mb-2">
        Transfer to this account
      </p>
      
      {/* Ensure these property names match exactly what your backend returns! */}
      <h2 className="text-4xl font-mono font-bold text-navy-900 tracking-wider my-2">
        {data.accountNumber || "Loading..."}
      </h2>
      <p className="text-lg font-medium text-navy-700">
        Bank: {data.bankName || "Monnify Virtual Bank"}
      </p>
      <p className="text-md text-navy-600 mt-2">
        Amount: ₦{parseInt(data.amount_expected).toLocaleString()}
      </p>
    </div>

    <p className="text-navy-600 mb-6">
      Please make a transfer to the bank details provided above.
      This page will update automatically once your payment is received.
    </p>
    <p className="text-sm text-beige-600 animate-pulse">
      Checking every 5 seconds...
    </p>
  </>
)}
2. The Backend Payment Controller / Service
Files:
Backend/src/modules/payments/controller.js
Backend/src/modules/payments/payments.service.js
Backend/src/modules/bookings/controller.js (Depending on where you initiate the Monnify request)
You need to make sure that the backend actually passes the Monnify virtual account details to the frontend.
When the GET /api/payments/poll/:ref endpoint is hit, check that your backend queries the database for the payment record and includes the accountNumber and bankName generated by Monnify in the JSON response payload.
If those details are stored in your database under a column like payment_metadata, make sure you parse and include them in the data sent back so your frontend data.accountNumber block works properly.
This is the whole code
vitoraos-diamonddigitise-8a5edab282632443 (5).txt
Gemini 3.1 Pro Preview
Ran for 73s

summarize_auto
Action history
chevron_right
Based on the code you shared, the reason your Monnify account number isn't showing is exactly this: The backend holds the bank details in its .env config, but the pollPaymentStatus API endpoint never actually sends them to the frontend, and the frontend payment page was never set up to display them.
To fix this, you only need to modify two files to pass the account details down to your payment screen.
1. Update the Backend Payment Service
Open Backend/src/modules/payments/payments.service.js. Locate the pollPaymentStatus method (around line 52) and modify it to include paymentDetails whenever it returns a pending status.
code
JavaScript
async pollPaymentStatus(paymentRef) {
    // ── Look up our booking by payment_ref ───────────────────
    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .select('id, status, total_amount, payment_ref, num_nights, rooms(room_number), guests(name), payments(id, status, amount_received)')
      .eq('payment_ref', paymentRef)
      .single();

    if (error || !booking) throw new AppError('Booking not found', 404);

    const payment = booking.payments?.[0];

    // ✅ ADD THIS: Bundle the internal Monnify account variables to send to the client
    const paymentDetails = {
      accountNumber: config.monnify.accountNumber,
      bankName: config.monnify.bankName,
      accountName: config.monnify.accountName,
      amount: booking.total_amount
    };

    // ── Already resolved states — return immediately ─────────
    if (booking.status === 'confirmed') {
      return { status: 'confirmed', bookingId: booking.id };
    }
    if (booking.status === 'incomplete_payment') {
      return { status: 'incomplete_payment', bookingId: booking.id };
    }
    if (booking.status === 'cancelled') {
      return { status: 'cancelled' };
    }

    // ── Query Monnify for transactions matching our ref ──────
    let monnifyTx = null;
    try {
      const encoded = encodeURIComponent(paymentRef);
      monnifyTx = await monnifyGet(
        `/api/v2/transactions/search?paymentReference=${encoded}&contractCode=${config.monnify.contractCode}`
      );
    } catch (err) {
      logger.warn('Monnify API unavailable during poll', { error: err.message });
      // ✅ ADD paymentDetails here
      return { status: 'pending', paymentDetails };
    }

    // If no transaction yet — still waiting
    if (!monnifyTx || !monnifyTx.content || monnifyTx.content.length === 0) {
      // ✅ ADD paymentDetails here
      return { status: 'pending', paymentDetails };
    }

    const tx = monnifyTx.content[0];
    const amountReceived = parseFloat(tx.amountPaid || 0);
    const monnifyRef     = tx.transactionReference;

    // ── Not yet paid ─────────────────────────────────────────
    if (tx.paymentStatus !== 'PAID') {
      // ✅ ADD paymentDetails here
      return { status: 'pending', paymentDetails };
    }

    // ... (leave the rest of the file handling the full/incomplete payment exactly as is)
    // ── GUARDRAIL: shortfall check ───────────────────────────
    if (amountReceived < booking.total_amount) {
      await this._handleIncompletePayment(booking, payment, amountReceived, monnifyRef, tx);
      return { status: 'incomplete_payment', bookingId: booking.id };
    }

    // ── Full payment received — confirm booking ───────────────
    await this._handleFullPayment(booking, payment, amountReceived, monnifyRef);
    return { status: 'confirmed', bookingId: booking.id };
  },

  /**
   * Full payment path:
   * - Confirm booking first (so we don't have a half-confirmed state)
   * - Then update payment record
   * - Generate receipt & schedule timers
   */
  async _handleFullPayment(booking, payment, amountReceived, monnifyRef) {
    // 1. Confirm booking (this can throw – payment stays untouched)
    const { checkInAt, checkOutAt, bookingRef } = await bookingsService.confirmBooking(
      booking.id,
      amountReceived,
      monnifyRef
    );

    // 2. Now update payment record
    await supabaseAdmin
      .from('payments')
      .update({
        status:          'confirmed',
        amount_received: amountReceived,
        monnify_ref:     monnifyRef,
        confirmed_at:    new Date().toISOString(),
      })
      .eq('id', payment.id);

    // 3. Generate receipt
    await receiptsService.generateReceipt(booking.id);

    // 4. Schedule timers
    await timersService.scheduleBookingTimers(booking.id, checkOutAt);

    await notificationService.notifyNewBooking({
      bookingRef:  bookingRef,
      guestName:   booking.guests?.name,
      roomNumber:  booking.rooms?.room_number,
      totalAmount: booking.total_amount,
      numNights:   booking.num_nights,
    });

    logger.info('Payment confirmed and booking activated', {
      bookingId: booking.id,
      amountReceived,
    });
  },

  /**
   * Incomplete payment path:
   * - Record payment details and mark booking as incomplete
   * - Attempt refund
   * - If refund succeeds, update payment status to partial_refunded
   */
  async _handleIncompletePayment(booking, payment, amountReceived, monnifyRef, tx) {
    const shortfall    = booking.total_amount - amountReceived;
    const refundFeeNaira = config.monnify.refundFeeKobo / 100;
    const refundAmount = Math.max(0, amountReceived - refundFeeNaira);

    // 1. Save received amount and shortfall (status stays 'incomplete' until refund)
    await supabaseAdmin
      .from('payments')
      .update({
        amount_received: amountReceived,
        shortfall,
        monnify_ref:     monnifyRef,
        monnify_response: tx,
        status:          'incomplete',   // new status to differentiate from pending
      })
      .eq('id', payment.id);

    // 2. Flag booking so guest cannot proceed
    await supabaseAdmin
      .from('bookings')
      .update({ status: 'incomplete_payment' })
      .eq('id', booking.id);

    // 3. Try to refund
    let refundedAt = null;
    try {
      await monnifyPost('/api/v1/refunds/initiate-refund', {
        transactionReference: monnifyRef,
        refundReason:         'Incomplete payment — amount paid is less than booking total',
        refundAmount:         refundAmount,
        contractCode:         config.monnify.contractCode,
        customerNote:         `Your payment of ₦${amountReceived} was less than the required ₦${booking.total_amount}. A refund of ₦${refundAmount} (after ₦${refundFeeNaira} processing fee) has been initiated.`,
      });
      refundedAt = new Date().toISOString();
    } catch (err) {
      // Refund API failure — log and notify, but payment already recorded
      logger.error('Monnify refund failed — manual action required', {
        bookingId:   booking.id,
        monnifyRef,
        amountReceived,
        refundAmount,
        error:       err.message,
      });
      // Do not update payment status – it stays 'incomplete'
    }

    // 4. If refund succeeded, update payment status
    if (refundedAt) {
      await supabaseAdmin
        .from('payments')
        .update({
          status:       'partial_refunded',
          refund_amount: refundAmount,
          refunded_at:  refundedAt,
        })
        .eq('id', payment.id);
    }

    // 5. Notify owner
    await notificationService.notifyIncompletePayment({
      bookingRef:    booking.payment_ref,
      amountExpected: booking.total_amount,
      amountReceived,
      shortfall,
      refundAmount,
    });

    logger.info('Incomplete payment handled', {
      bookingId: booking.id,
      amountReceived,
      shortfall,
      refundAmount,
      refunded: !!refundedAt,
    });
  },

  async listPayments(query = {}) {
    const { data, error } = await supabaseAdmin
      .from('payments')
      .select(`
        id, status, amount_expected, amount_received,
        shortfall, refund_amount, confirmed_at, created_at,
        bookings ( booking_ref, guests(name, phone) )
      `)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) throw new AppError(error.message, 500);
    return data;
  },

  async getPaymentById(id) {
    const { data, error } = await supabaseAdmin
      .from('payments')
      .select('*, bookings(*, guests(*), rooms(*))')
      .eq('id', id)
      .single();

    if (error || !data) throw new AppError('Payment not found', 404);
    return data;
  },
};

module.exports = paymentsService;
