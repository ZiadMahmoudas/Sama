(() => {
  "use strict";

  const cfg = window.SAMA_CONFIG || {};
  const isConfigured =
    typeof cfg.supabaseUrl === "string" &&
    cfg.supabaseUrl.startsWith("https://") &&
    !cfg.supabaseUrl.includes("YOUR_PROJECT_REF") &&
    typeof cfg.supabasePublishableKey === "string" &&
    !cfg.supabasePublishableKey.includes("REPLACE_ME");

  if (!isConfigured || !window.supabase?.createClient) {
    console.warn(
      "SAMA: Supabase غير مُعد بعد. عدّل ملف supabase-config.js وسيظل المحتوى الثابت ظاهراً كنسخة احتياطية.",
    );
    return;
  }

  const db = window.supabase.createClient(
    cfg.supabaseUrl,
    cfg.supabasePublishableKey,
  );

  const SERVICE_ICONS = [
    `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2V6a2 2 0 012-2h4a2 2 0 012 2v2z"/></svg>`,
    `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/></svg>`,
    `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>`,
    `<svg viewBox="0 0 24 24" fill="none"><path d="M6 7C6 5.114 6 4.172 6.586 3.586 7.172 3 8.114 3 10 3h4c1.886 0 2.828 0 3.414.586C18 4.172 18 5.114 18 7v10c0 1.886 0 2.828-.586 3.414C16.828 21 15.886 21 14 21h-4c-1.886 0-2.828 0-3.414-.586C6 19.828 6 18.886 6 17V7Z" stroke="currentColor" stroke-width="2"/><path d="M11.5 18h1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
    `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>`,
    `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>`,
  ];

  const STAR = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;

  const escapeHtml = (value = "") =>
    String(value).replace(
      /[&<>'"]/g,
      (char) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          "'": "&#39;",
          '"': "&quot;",
        })[char],
    );

  const safeUrl = (value, fallback = "#") => {
    if (!value) return fallback;
    const url = String(value).trim();
    if (/^(https?:|mailto:|tel:|#|\/|\.\.?\/)/i.test(url) || /^[a-z0-9_./-]+$/i.test(url)) return url;
    return fallback;
  };

  const safeBackground = (value) => {
    const v = String(value || "").trim();
    if (/^(linear-gradient|radial-gradient)\(/i.test(v)) return v;
    if (/^#[0-9a-f]{3,8}$/i.test(v)) return v;
    return "linear-gradient(145deg,rgba(139,92,246,.5),rgba(109,40,217,.4))";
  };

  async function fetchEnabled(table) {
    const { data, error } = await db
      .from(table)
      .select("*")
      .eq("enabled", true)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return data || [];
  }

  function reObserveReveal() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            setTimeout(() => entry.target.classList.add("visible"), index * 70);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 },
    );
    document
      .querySelectorAll(".reveal:not(.visible)")
      .forEach((el) => observer.observe(el));
  }

  async function loadServices() {
    const data = await fetchEnabled("services");
    const grid = document.querySelector(".services-grid");
    if (!grid || !data.length) return;
    grid.innerHTML = data
      .map((s, i) => {
        const icon = s.icon_url
          ? `<img src="${escapeHtml(safeUrl(s.icon_url, ""))}" alt="" loading="lazy" style="width:32px;height:32px;object-fit:contain"/>`
          : SERVICE_ICONS[i % SERVICE_ICONS.length];
        return `<article class="service-card reveal">
          <span class="number">${escapeHtml(s.number || String(i + 1).padStart(2, "0"))}</span>
          <div class="service-icon">${icon}</div>
          <h3>${escapeHtml(s.title)}</h3>
          <p>${escapeHtml(s.description)}</p>
          <div class="service-features">${(s.features || []).map((f) => `<span>${escapeHtml(f)}</span>`).join("")}</div>
        </article>`;
      })
      .join("");
    reObserveReveal();
  }

  async function loadPricing() {
    const data = await fetchEnabled("pricing");
    const grid = document.querySelector(".pricing-grid");
    if (!grid || !data.length) return;
    grid.innerHTML = data
      .map(
        (p) => `<article class="pricing-card ${p.is_featured ? "featured" : ""} reveal">
          ${p.is_featured ? '<div class="popular-badge">⭐ الأكثر طلباً</div>' : ""}
          <h3>${escapeHtml(p.name)}</h3>
          <p class="subtitle">${escapeHtml(p.subtitle)}</p>
          <div class="price"><span class="amount">${escapeHtml(p.amount)}</span><span class="period">${escapeHtml(p.period)}</span></div>
          <ul class="pricing-features">${(p.features || [])
            .map(
              (f) => `<li><div class="check"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg></div>${escapeHtml(f)}</li>`,
            )
            .join("")}</ul>
          <a href="#contact" class="pricing-btn ${p.is_featured ? "primary" : "secondary"}" data-plan="${escapeHtml(p.name)}">ابدأ الآن</a>
        </article>`,
      )
      .join("");

    const select = document.querySelector('#contactForm select[name="plan"]');
    if (select) {
      select.innerHTML = `<option value="">اختر الباقة</option>${data
        .map((p) => `<option value="${escapeHtml(p.name)}">${escapeHtml(p.name)}</option>`)
        .join("")}<option value="custom">باقة مخصصة</option>`;
    }
    document.querySelectorAll("[data-plan]").forEach((button) => {
      button.addEventListener("click", () => {
        if (select) select.value = button.dataset.plan || "";
      });
    });
    reObserveReveal();
  }

  async function loadFaq() {
    const data = await fetchEnabled("faq");
    const container = document.querySelector(".faq-container");
    if (!container || !data.length) return;
    container.innerHTML = data
      .map(
        (f, i) => `<article class="faq-item ${i === 0 ? "active" : ""} reveal">
          <button class="faq-question" type="button"><span>${escapeHtml(f.question)}</span><div class="faq-toggle"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg></div></button>
          <div class="faq-answer"><p>${escapeHtml(f.answer)}</p></div>
        </article>`,
      )
      .join("");
    container.querySelectorAll(".faq-item").forEach((item) => {
      item.querySelector(".faq-question")?.addEventListener("click", () => {
        const wasActive = item.classList.contains("active");
        container.querySelectorAll(".faq-item").forEach((x) => x.classList.remove("active"));
        if (!wasActive) item.classList.add("active");
      });
    });
    reObserveReveal();
  }

  async function loadPortfolio() {
    const data = await fetchEnabled("portfolio");
    const grid = document.querySelector(".portfolio-grid");
    if (!grid || !data.length) return;
    grid.innerHTML = data
      .map((p) => {
        const image = p.image_url
          ? `url('${escapeHtml(safeUrl(p.image_url, ""))}') center/cover no-repeat, `
          : "";
        return `<article class="portfolio-item reveal">
          <div class="portfolio-default"><h4>${escapeHtml(p.title)}</h4><p>${escapeHtml(p.description)}</p><div class="tags">${(p.tags || []).map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("")}</div></div>
          <div class="portfolio-hover"><div class="hover-img" style="background:${image}${safeBackground(p.gradient)}"></div><a target="_blank" rel="noopener" href="${escapeHtml(safeUrl(p.link_url, "#contact"))}" class="hover-link">انظر هنا ←</a></div>
        </article>`;
      })
      .join("");
    reObserveReveal();
  }

  async function loadProcessSteps() {
    const data = await fetchEnabled("process_steps");
    const grid = document.querySelector(".process-grid");
    if (!grid || !data.length) return;
    grid.innerHTML = data
      .map(
        (s, i) => `<article class="process-step reveal"><div class="process-number">${escapeHtml(s.number || i + 1)}</div><h3>${escapeHtml(s.title)}</h3><p>${escapeHtml(s.description)}</p></article>`,
      )
      .join("");
    reObserveReveal();
  }

  async function loadTestimonials() {
    const data = await fetchEnabled("testimonials");
    const grid = document.querySelector(".testimonials-grid");
    if (!grid || !data.length) return;
    grid.innerHTML = data
      .map((t) => {
        const rating = Math.max(1, Math.min(5, Number(t.rating) || 5));
        return `<article class="testimonial-card reveal"><div class="quote">&quot;</div><div class="stars">${STAR.repeat(rating)}</div><p>${escapeHtml(t.quote)}</p><div class="testimonial-author"><div class="avatar">${escapeHtml(t.avatar_text || String(t.name || "س").trim().charAt(0))}</div><div><h4>${escapeHtml(t.name)}</h4><span>${escapeHtml(t.role)}</span></div></div></article>`;
      })
      .join("");
    reObserveReveal();
  }

  async function loadLogos() {
    const { data, error } = await db.from("site_logos").select("*");
    if (error) throw error;
    const map = Object.fromEntries((data || []).map((logo) => [logo.key, logo.url]));
    document.querySelectorAll(".navbar .logo img, .nav-logo").forEach((img) => {
      if (map.navbar) img.src = safeUrl(map.navbar, img.src);
    });
    const preloader = document.querySelector(".loader-logo");
    if (preloader && map.preloader) preloader.src = safeUrl(map.preloader, preloader.src);
    const hero = document.querySelector(".hero-logo");
    if (hero && map.hero) hero.src = safeUrl(map.hero, hero.src);
    document.querySelectorAll("footer .logo img").forEach((img) => {
      if (map.footer) img.src = safeUrl(map.footer, img.src);
    });
  }

  function setText(selector, value) {
    if (value === null || value === undefined || value === "") return;
    const el = document.querySelector(selector);
    if (el) el.textContent = value;
  }

  function setHref(selector, value) {
    const el = document.querySelector(selector);
    if (el && value) el.href = safeUrl(value, el.getAttribute("href") || "#");
  }

  async function loadSettings() {
    const { data, error } = await db.from("site_settings").select("*").eq("id", 1).maybeSingle();
    if (error) throw error;
    if (!data) return;

    setText(".hero-badge span", data.hero_badge);
    const heroTitle = document.querySelector(".hero-text h1");
    if (heroTitle && (data.hero_title || data.hero_highlight)) {
      heroTitle.innerHTML = `${escapeHtml(data.hero_title || "نمنح مشروعك")}<br><span class="highlight text-gradient">${escapeHtml(data.hero_highlight || "سِمته الخاصة")}</span>`;
    }
    setText(".hero-text > p", data.hero_description);
    setText(".hero-buttons .btn-primary span", data.primary_cta_text);
    setText(".hero-buttons .btn-secondary span", data.secondary_cta_text);

    const stats = [1, 2, 3, 4];
    stats.forEach((n) => {
      setText(`.stats-grid .stat-item:nth-child(${n}) .stat-number`, data[`stat_${n}_value`]);
      setText(`.stats-grid .stat-item:nth-child(${n}) .stat-label`, data[`stat_${n}_label`]);
    });

    setText("footer .footer-brand p", data.footer_description);
    const phoneHref = data.contact_phone_href || data.contact_phone_display;
    document.querySelectorAll('a[href^="tel:"]').forEach((a) => {
      if (phoneHref) a.href = `tel:${String(phoneHref).replace(/^tel:/, "")}`;
      if (data.contact_phone_display) a.textContent = data.contact_phone_display;
    });
    document.querySelectorAll('a[href^="mailto:"]').forEach((a) => {
      if (data.contact_email) {
        a.href = `mailto:${data.contact_email}`;
        a.textContent = data.contact_email;
      }
    });
    setHref('.social-links a[aria-label="Twitter"]', data.twitter_url);
    setHref('.social-links a[aria-label="Instagram"]', data.instagram_url);
    setHref('.social-links a[aria-label="LinkedIn"]', data.linkedin_url);
    setHref('.social-links a[aria-label="WhatsApp"]', data.whatsapp_url);
    setHref(".whatsapp-btn", data.whatsapp_url);

    const track = document.getElementById("marqueeTrack");
    if (track && Array.isArray(data.marquee_items) && data.marquee_items.length) {
      const items = Array.from({ length: 4 }, () => data.marquee_items)
        .flat()
        .map((item) => `<div class="marquee-item"><span class="dot">✦</span>${escapeHtml(item)}</div>`)
        .join("");
      track.innerHTML = items;
    }
  }

  function ensureFormStatus(form) {
    let status = form.querySelector(".form-status");
    if (!status) {
      status = document.createElement("p");
      status.className = "form-status";
      status.setAttribute("role", "status");
      status.style.marginTop = "12px";
      status.style.textAlign = "center";
      form.appendChild(status);
    }
    return status;
  }

  function initContactForm() {
    const form = document.getElementById("contactForm");
    if (!form || form.dataset.supabaseBound === "true") return;
    form.dataset.supabaseBound = "true";
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const button = form.querySelector(".submit-btn");
      const status = ensureFormStatus(form);
      const originalText = button?.textContent || "أرسل رسالتك ✨";
      const fd = new FormData(form);
      if (String(fd.get("website") || "").trim()) {
        form.reset();
        status.textContent = "✓ تم إرسال رسالتك بنجاح، وسنتواصل معك قريباً.";
        status.style.color = "#22c55e";
        return;
      }

      const payload = {
        name: String(fd.get("name") || "").trim(),
        email: String(fd.get("email") || "").trim(),
        phone: String(fd.get("phone") || "").trim() || null,
        plan: String(fd.get("plan") || "").trim() || null,
        message: String(fd.get("message") || "").trim(),
        source: window.location.href.slice(0, 500),
      };

      if (!payload.name || !payload.email || !payload.message) {
        status.textContent = "من فضلك أكمل الاسم والبريد والرسالة.";
        status.style.color = "#ef4444";
        return;
      }

      if (button) {
        button.disabled = true;
        button.textContent = "جارٍ الإرسال...";
      }
      status.textContent = "";

      const { error } = await db.from("contact_messages").insert(payload);
      if (error) {
        console.error("SAMA contact error", error);
        status.textContent = "تعذر إرسال الرسالة حالياً. حاول مرة أخرى.";
        status.style.color = "#ef4444";
      } else {
        status.textContent = "✓ تم إرسال رسالتك بنجاح، وسنتواصل معك قريباً.";
        status.style.color = "#22c55e";
        form.reset();
      }
      if (button) {
        button.disabled = false;
        button.textContent = originalText;
      }
    });
  }

  async function init() {
    initContactForm();
    const tasks = [
      loadSettings(),
      loadLogos(),
      loadServices(),
      loadPricing(),
      loadFaq(),
      loadPortfolio(),
      loadProcessSteps(),
      loadTestimonials(),
    ];
    const results = await Promise.allSettled(tasks);
    results.forEach((result) => {
      if (result.status === "rejected") console.error("SAMA dynamic load error", result.reason);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
