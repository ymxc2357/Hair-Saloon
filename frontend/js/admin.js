/* ══════════════════════════════════
   TK'S MAKEOVER — admin.js
   ══════════════════════════════════ */

const BACKEND = 'http://localhost:5000';
const ADMIN_PASSWORD = 'tks2025admin'; // Change this to your own password!

let allAppointments = [];

// ── LOGIN ──
function adminLogin() {
  const entered = document.getElementById('admin-password').value;
  if (entered === ADMIN_PASSWORD) {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('dashboard').style.display = 'flex';
    loadAppointments();
  } else {
    document.getElementById('login-error').textContent = '❌ Incorrect password. Try again.';
  }
}

function adminLogout() {
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('dashboard').style.display = 'none';
  document.getElementById('admin-password').value = '';
  document.getElementById('login-error').textContent = '';
}

// ── TABS ──
function showTab(tab) {
  document.getElementById('tab-appointments').style.display = tab === 'appointments' ? 'block' : 'none';
  document.getElementById('tab-services').style.display    = tab === 'services'     ? 'block' : 'none';
  document.getElementById('stats-row').style.display       = tab === 'appointments' ? 'grid'  : 'none';
  document.getElementById('refresh-btn').style.display     = tab === 'appointments' ? 'block' : 'none';

  document.getElementById('tab-title').textContent    = tab === 'appointments' ? 'Appointments' : 'Edit Services';
  document.getElementById('tab-subtitle').textContent = tab === 'appointments' ? 'Manage all customer bookings' : 'Update service prices anytime';

  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  event.target.classList.add('active');
}

// ── LOAD APPOINTMENTS ──
async function loadAppointments() {
  const tbody = document.getElementById('appointments-tbody');
  tbody.innerHTML = '<tr><td colspan="8" class="table-loading">Loading...</td></tr>';

  try {
    const res  = await fetch(`${BACKEND}/api/admin/appointments`);
    const data = await res.json();
    allAppointments = data;
    updateStats(data);
    renderTable(data);
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="8" class="table-loading">⚠️ Could not connect to server.</td></tr>';
  }
}

// ── UPDATE STATS ──
function updateStats(data) {
  document.getElementById('stat-total').textContent    = data.length;
  document.getElementById('stat-pending').textContent  = data.filter(a => a.status === 'pending').length;
  document.getElementById('stat-approved').textContent = data.filter(a => a.status === 'approved').length;
  document.getElementById('stat-rejected').textContent = data.filter(a => a.status === 'rejected').length;
}

// ── RENDER TABLE ──
function renderTable(data) {
  const tbody = document.getElementById('appointments-tbody');

  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="table-loading">No appointments found.</td></tr>';
    return;
  }

  tbody.innerHTML = data.map(a => `
    <tr id="row-${a.id}">
      <td><strong>${a.name}</strong></td>
      <td>${a.phone}</td>
      <td>${a.service}</td>
      <td>${a.date}</td>
      <td>${a.time}</td>
      <td>${a.notes || '—'}</td>
      <td><span class="badge badge-${a.status}">${a.status}</span></td>
      <td>
        ${a.status === 'pending' ? `
          <button class="action-btn action-approve" onclick="updateStatus(${a.id}, 'approved')">✓ Approve</button>
          <button class="action-btn action-reject"  onclick="updateStatus(${a.id}, 'rejected')">✗ Reject</button>
        ` : '—'}
      </td>
    </tr>
  `).join('');
}

// ── FILTER BY STATUS ──
function filterByStatus(status, btn) {
  document.querySelectorAll('.filter-row .filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const filtered = status === 'all'
    ? allAppointments
    : allAppointments.filter(a => a.status === status);
  renderTable(filtered);
}

// ── APPROVE / REJECT ──
// ── APPROVE / REJECT ──
async function updateStatus(id, status) {
  try {
    const res = await fetch(`${BACKEND}/api/admin/appointments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });

    if (res.ok) {
      // Update locally without full reload
      allAppointments = allAppointments.map(a =>
        a.id === id ? { ...a, status } : a
      );
      updateStats(allAppointments);

      // Update the row directly
      const row = document.getElementById(`row-${id}`);
      row.querySelector('.badge').className = `badge badge-${status}`;
      row.querySelector('.badge').textContent = status;
      row.querySelector('td:last-child').innerHTML = '—';

      // Send WhatsApp notification to customer
      const appointment = allAppointments.find(a => a.id === id);
      sendWhatsAppNotification(appointment, status);
    }
  } catch (err) {
    alert('Failed to update. Please try again.');
  }
}

// ── WHATSAPP NOTIFICATION ──
function sendWhatsAppNotification(appointment, status) {
  const phone = appointment.phone
    .replace(/\D/g, '')         // remove non-digits
    .replace(/^0/, '91');       // replace leading 0 with India code

  // Add 91 if no country code
  const fullPhone = phone.startsWith('91') ? phone : `91${phone}`;

  let message = '';

  if (status === 'approved') {
    message =
      `✅ *Appointment Confirmed!*\n\n` +
      `Hi ${appointment.name}! 🎉\n\n` +
      `Your appointment at *Tk's Makeover* has been *confirmed*.\n\n` +
      `📋 *Details:*\n` +
      `• Service: ${appointment.service}\n` +
      `• Date: ${appointment.date}\n` +
      `• Time: ${appointment.time}\n\n` +
      `Please arrive 5 minutes early. See you soon! ✂️`;
  } else {
    message =
      `❌ *Appointment Update*\n\n` +
      `Hi ${appointment.name},\n\n` +
      `Unfortunately your appointment request for *${appointment.service}* ` +
      `on *${appointment.date}* at *${appointment.time}* could not be confirmed.\n\n` +
      `Please contact us to reschedule:\n` +
      `📞 Call or WhatsApp us anytime.\n\n` +
      `Sorry for the inconvenience! 🙏`;
  }

  const encodedMessage = encodeURIComponent(message);
  const whatsappURL = `https://wa.me/${fullPhone}?text=${encodedMessage}`;

  // Open WhatsApp in new tab
  window.open(whatsappURL, '_blank');
}

// ── SAVE SERVICES ──
function saveServices() {
  // For now saves to localStorage
  // Later can be connected to Supabase
  const prices = {
    'womens-haircut':   document.getElementById('price-womens-haircut').value,
    'mens-haircut':     document.getElementById('price-mens-haircut').value,
    'kids-haircut':     document.getElementById('price-kids-haircut').value,
    'global-colour':    document.getElementById('price-global-colour').value,
    'highlights':       document.getElementById('price-highlights').value,
    'balayage':         document.getElementById('price-balayage').value,
    'keratin':          document.getElementById('price-keratin').value,
    'hair-spa':         document.getElementById('price-hair-spa').value,
    'deep-conditioning':document.getElementById('price-deep-conditioning').value,
    'blow-dry':         document.getElementById('price-blow-dry').value,
    'straightening':    document.getElementById('price-straightening').value,
    'bridal-updo':      document.getElementById('price-bridal-updo').value,
  };

  localStorage.setItem('tks-prices', JSON.stringify(prices));
  document.getElementById('save-msg').textContent = '✅ Prices saved successfully!';
  setTimeout(() => {
    document.getElementById('save-msg').textContent = '';
  }, 3000);
}