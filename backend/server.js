/* ══════════════════════════════════
   TK'S MAKEOVER — server.js
   ══════════════════════════════════ */

const express  = require('express');
const cors     = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── SUPABASE CLIENT ──
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// ── EMAIL TRANSPORTER ──
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.OWNER_EMAIL,
    pass: process.env.EMAIL_PASSWORD
  }
});

// ── MIDDLEWARE ──
app.use(cors());
app.use(express.json());

// ── HEALTH CHECK ──
app.get('/', (req, res) => {
  res.json({ message: "Tk's Makeover API is running ✅" });
});

// ══════════════════════════════════
// CUSTOMER ROUTES
// ══════════════════════════════════

// POST /api/appointments — Save a new booking
app.post('/api/appointments', async (req, res) => {
  const { name, phone, service, date, time, notes } = req.body;

  // Basic validation
  if (!name || !phone || !service || !date || !time) {
    return res.status(400).json({ error: 'Please fill in all required fields.' });
  }

  // Save to Supabase
  const { data, error } = await supabase
    .from('appointments')
    .insert([{ name, phone, service, date, time, notes, status: 'pending' }]);

  if (error) {
    console.error('Supabase error:', error);
    return res.status(500).json({ error: 'Failed to save appointment.' });
  }

  // Send email notification to owner
  const mailOptions = {
    from: process.env.OWNER_EMAIL,
    to: process.env.OWNER_EMAIL,
    subject: `📅 New Appointment Request — ${name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #f9f9f9; border-radius: 12px; overflow: hidden;">
        <div style="background: #ff2d55; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 1.4rem;">✂ Tk's Makeover</h1>
          <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 0.9rem;">New Appointment Request</p>
        </div>
        <div style="padding: 28px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; color: #888; font-size: 0.85rem; width: 120px;">Customer</td>
              <td style="padding: 10px 0; font-weight: 600; color: #333;">${name}</td>
            </tr>
            <tr style="background: #f0f0f0;">
              <td style="padding: 10px 8px; color: #888; font-size: 0.85rem;">Phone</td>
              <td style="padding: 10px 8px; font-weight: 600; color: #333;">${phone}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #888; font-size: 0.85rem;">Service</td>
              <td style="padding: 10px 0; font-weight: 600; color: #333;">${service}</td>
            </tr>
            <tr style="background: #f0f0f0;">
              <td style="padding: 10px 8px; color: #888; font-size: 0.85rem;">Date</td>
              <td style="padding: 10px 8px; font-weight: 600; color: #333;">${date}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #888; font-size: 0.85rem;">Time</td>
              <td style="padding: 10px 0; font-weight: 600; color: #333;">${time}</td>
            </tr>
            <tr style="background: #f0f0f0;">
              <td style="padding: 10px 8px; color: #888; font-size: 0.85rem;">Notes</td>
              <td style="padding: 10px 8px; font-weight: 600; color: #333;">${notes || 'None'}</td>
            </tr>
          </table>
          <div style="margin-top: 24px; padding: 14px; background: #fff3cd; border-radius: 8px; border-left: 4px solid #ff2d55;">
            <p style="margin: 0; font-size: 0.88rem; color: #555;">⚠️ This appointment is <strong>pending</strong>. Please log into your admin dashboard to approve or reject it.</p>
          </div>
        </div>
        <div style="padding: 16px; text-align: center; background: #eee;">
          <p style="margin: 0; font-size: 0.78rem; color: #999;">© 2025 Tk's Makeover Admin Notifications</p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('📧 Email notification sent!');
  } catch (emailError) {
    console.error('Email error:', emailError.message);
    // Don't fail the request if email fails
  }

  res.status(201).json({ message: 'Appointment booked successfully!', data });
});

// ══════════════════════════════════
// ADMIN ROUTES
// ══════════════════════════════════

// GET /api/admin/appointments — Get all bookings
app.get('/api/admin/appointments', async (req, res) => {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: 'Failed to fetch appointments.' });
  res.json(data);
});

// PATCH /api/admin/appointments/:id — Approve or reject
app.patch('/api/admin/appointments/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Status must be approved or rejected.' });
  }

  const { data, error } = await supabase
    .from('appointments')
    .update({ status })
    .eq('id', id);

  if (error) return res.status(500).json({ error: 'Failed to update appointment.' });
  res.json({ message: `Appointment ${status} successfully.`, data });
});

// ── START SERVER ──
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});