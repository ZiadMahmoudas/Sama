// ==============================
// sima-dynamic.js
// ضيفه قبل </body> في index.html
// ==============================

const SUPABASE_URL = 'https://idmluizpqhrnugxcmxyx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_x--Apb0gcUKy-S8D-pyHoQ_iCcthmu9';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================
// SERVICES — إيقونات ثابتة
// ============================
const SERVICE_ICONS = [
  `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2V6a2 2 0 012-2h4a2 2 0 012 2v2z"/></svg>`,
  `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/></svg>`,
  `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>`,
  `<svg viewBox="0 0 24 24" fill="none"><path d="M6 7C6 5.11438 6 4.17157 6.58579 3.58579C7.17157 3 8.11438 3 10 3H12H14C15.8856 3 16.8284 3 17.4142 3.58579C18 4.17157 18 5.11438 18 7V12V17C18 18.8856 18 19.8284 17.4142 20.4142C16.8284 21 15.8856 21 14 21H12H10C8.11438 21 7.17157 21 6.58579 20.4142C6 19.8284 6 18.8856 6 17V12V7Z" stroke="#ffffff" stroke-width="2" stroke-linejoin="round"/><path d="M11.5 18H12.5" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/></svg>`,
  `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>`,
  `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>`,
];

async function loadServices() {
  const { data } = await db.from('services').select('*').eq('enabled', true).order('sort_order');
  if (!data || !data.length) return;

  const grid = document.querySelector('.services-grid');
  if (!grid) return;

  grid.innerHTML = data.map((s, i) => `
    <div class="service-card reveal">
      <span class="number">${s.number || String(i+1).padStart(2,'0')}</span>
      <div class="service-icon">
        ${SERVICE_ICONS[i % SERVICE_ICONS.length]}
      </div>
      <h3>${s.title}</h3>
      <p>${s.description}</p>
      <div class="service-features">
        ${(s.features || []).map(f => `<span>${f}</span>`).join('')}
      </div>
    </div>
  `).join('');

  // re-observe reveal animations
  reObserveReveal();
}

// ============================
// PRICING
// ============================
async function loadPricing() {
  const { data } = await db.from('pricing').select('*').eq('enabled', true).order('sort_order');
  if (!data || !data.length) return;

  const grid = document.querySelector('.pricing-grid');
  if (!grid) return;

  grid.innerHTML = data.map(p => `
    <div class="pricing-card ${p.is_featured ? 'featured' : ''} reveal">
      ${p.is_featured ? '<div class="popular-badge">⭐ الأكثر طلباً</div>' : ''}
      <h3>${p.name}</h3>
      <p class="subtitle">${p.subtitle}</p>
      <div class="price">
        <span class="amount">${p.amount}</span>
        <span class="period">${p.period}</span>
      </div>
      <ul class="pricing-features">
        ${(p.features || []).map(f => `
          <li>
            <div class="check">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            ${f}
          </li>
        `).join('')}
      </ul>
      <a href="#contact" class="pricing-btn ${p.is_featured ? 'primary' : 'secondary'}">ابدأ الآن</a>
    </div>
  `).join('');

  reObserveReveal();
}

// ============================
// FAQ
// ============================
async function loadFaq() {
  const { data } = await db.from('faq').select('*').eq('enabled', true).order('sort_order');
  if (!data || !data.length) return;

  const container = document.querySelector('.faq-container');
  if (!container) return;

  container.innerHTML = data.map((f, i) => `
    <div class="faq-item ${i === 0 ? 'active' : ''} reveal">
      <button class="faq-question">
        <span>${f.question}</span>
        <div class="faq-toggle">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </div>
      </button>
      <div class="faq-answer">
        <p>${f.answer}</p>
      </div>
    </div>
  `).join('');

  // re-init accordion
  container.querySelectorAll('.faq-item').forEach(item => {
    item.querySelector('.faq-question').addEventListener('click', () => {
      const wasActive = item.classList.contains('active');
      container.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
      if (!wasActive) item.classList.add('active');
    });
  });

  reObserveReveal();
}

// ============================
// PORTFOLIO
// ============================
async function loadPortfolio() {
  const { data } = await db.from('portfolio').select('*').eq('enabled', true).order('sort_order');
  if (!data || !data.length) return;

  const grid = document.querySelector('.portfolio-grid');
  if (!grid) return;

  grid.innerHTML = data.map(p => `
    <div class="portfolio-item reveal">
      <div class="portfolio-default">
        <h4>${p.title}</h4>
        <p>${p.description}</p>
        <div class="tags">
          ${(p.tags || []).map(t => `<span class="tag">${t}</span>`).join('')}
        </div>
      </div>
      <div class="portfolio-hover">
        <div class="hover-img" style="background: ${p.image_url ? `url('${p.image_url}') center/cover no-repeat, ` : ''}${p.gradient || 'linear-gradient(145deg,rgba(139,92,246,0.5),rgba(109,40,217,0.4))'}"></div>
        <a href="${p.link_url || '#contact'}" class="hover-link">انظر هنا ←</a>
      </div>
    </div>
  `).join('');

  reObserveReveal();
}

// ============================
// LOGOS
// ============================
async function loadLogos() {
  const CACHE_KEY = 'mysite_logos_v1';
  const CACHE_TTL = 60 * 60 * 1000; 

  // ← جرب الـ cache الأول فوراً
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    applyLogos(data); // ← يطبق اللوجو فوراً بدون انتظار

    // لو الـ cache قديم، جيب جديد في الخلفية
    if (Date.now() - timestamp < CACHE_TTL) return;
  }

  // ← جيب من الداتابيز (في الخلفية لو في cache)
  const { data } = await db.from('site_logos').select('*');
  if (!data || !data.length) return;

  localStorage.setItem(CACHE_KEY, JSON.stringify({
    data,
    timestamp: Date.now()
  }));

  applyLogos(data);
}

function applyLogos(data) {
  const map = {};
  data.forEach(l => map[l.key] = l.url);

  document.querySelectorAll('.navbar .logo img, .nav-logo').forEach(img => {
    if (map.navbar) img.src = map.navbar;
  });
  const preloaderLogo = document.querySelector('.loader-logo');
  if (preloaderLogo && map.preloader) preloaderLogo.src = map.preloader;
  const heroLogo = document.querySelector('.hero-logo');
  if (heroLogo && map.hero) heroLogo.src = map.hero;
  document.querySelectorAll('footer .logo img').forEach(img => {
    if (map.footer) img.src = map.footer;
  });
}

// ============================
// RE-OBSERVE REVEAL
// ============================
function reObserveReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), index * 100);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal:not(.visible)').forEach(el => observer.observe(el));
}

// ============================
// INIT — load everything
// ============================
document.addEventListener('DOMContentLoaded', () => {
  loadServices();
  loadPricing();
  loadFaq();
  loadPortfolio();
  loadLogos();
});
loadLogos();