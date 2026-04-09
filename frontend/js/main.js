/* ══════════════════════════════════
   TK'S MAKEOVER — main.js
   ══════════════════════════════════ */

// ── HAMBURGER MENU ──
function toggleMenu() {
  const navLinks  = document.getElementById('nav-links');
  const hamburger = document.getElementById('hamburger');
  navLinks.classList.toggle('open');
  hamburger.classList.toggle('open');
}

// Close menu when a link is clicked
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
      document.getElementById('nav-links').classList.remove('open');
      document.getElementById('hamburger').classList.remove('open');
    });
  });
});

// ── NAVBAR SCROLL EFFECT ──
const navbar = document.getElementById('navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  });
}

// ── SCROLL FADE-IN ANIMATION ──
const fadeEls = document.querySelectorAll('.fade-in');
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, i * 120);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

fadeEls.forEach(el => observer.observe(el));

// ── GALLERY FILTER ──
function filterGallery(category) {
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');

  document.querySelectorAll('.gallery-item').forEach(item => {
    if (category === 'all' || item.dataset.category === category) {
      item.classList.remove('hidden');
    } else {
      item.classList.add('hidden');
    }
  });
}

// ── APPOINTMENT FORM SUBMIT ──
// ── APPOINTMENT FORM SUBMIT ──
async function submitBooking() {
  const name    = document.getElementById('name').value.trim();
  const phone   = document.getElementById('phone').value.trim();
  const service = document.getElementById('service').value;
  const date    = document.getElementById('date').value;
  const time    = document.getElementById('time').value;
  const notes   = document.getElementById('notes').value.trim();

  // Basic validation
  if (!name || !phone || !service || !date || !time) {
    alert('Please fill in all required fields before submitting.');
    return;
  }

  // Disable button while submitting
  const btn = document.getElementById('submit-btn');
  btn.textContent = 'Submitting...';
  btn.disabled = true;

  try {
    const response = await fetch('http://localhost:5000/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, service, date, time, notes })
    });

    const result = await response.json();

    if (response.ok) {
      // Show success message
      document.getElementById('success-message').style.display = 'block';
      btn.textContent = 'Appointment Requested ✓';
      btn.style.background = 'linear-gradient(135deg, #27ae60, #2ecc71)';
      document.getElementById('success-message').scrollIntoView({ behavior: 'smooth' });
    } else {
      alert(result.error || 'Something went wrong. Please try again.');
      btn.textContent = 'Confirm Appointment';
      btn.disabled = false;
    }

  } catch (error) {
    alert('Cannot connect to server. Please try again later.');
    btn.textContent = 'Confirm Appointment';
    btn.disabled = false;
  }
}

// ── ADD FADE-IN TO SERVICE ITEMS ──
document.querySelectorAll('.service-category, .contact-card, .gallery-item').forEach(el => {
  el.classList.add('fade-in');
  observer.observe(el);
});