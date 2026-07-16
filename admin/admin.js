(() => {
  "use strict";

  const cfg = window.SAMA_CONFIG || {};
  const configured =
    typeof cfg.supabaseUrl === "string" &&
    cfg.supabaseUrl.startsWith("https://") &&
    !cfg.supabaseUrl.includes("YOUR_PROJECT_REF") &&
    typeof cfg.supabasePublishableKey === "string" &&
    !cfg.supabasePublishableKey.includes("REPLACE_ME") &&
    window.supabase?.createClient;

  const setupAlert = document.getElementById("setupAlert");
  if (!configured) {
    setupAlert.hidden = false;
    document.getElementById("loginButton").disabled = true;
    return;
  }

  const sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabasePublishableKey);
  const bucket = cfg.storageBucket || "media";

  const loginView = document.getElementById("loginView");
  const dashboardView = document.getElementById("dashboardView");
  const contentArea = document.getElementById("contentArea");
  const pageTitle = document.getElementById("pageTitle");
  const currentUser = document.getElementById("currentUser");
  const modal = document.getElementById("modal");
  const modalTitle = document.getElementById("modalTitle");
  const editorForm = document.getElementById("editorForm");
  const toast = document.getElementById("toast");
  const messagesBadge = document.getElementById("messagesBadge");

  let activeSection = "overview";
  let currentSession = null;
  let modalContext = null;

  const collections = {
    services: {
      label: "الخدمات",
      singular: "خدمة",
      description: "إدارة الخدمات الظاهرة في قسم خدماتنا.",
      titleField: "title",
      subtitleField: "description",
      tagField: "features",
      fields: [
        { name: "number", label: "الرقم", type: "text", placeholder: "01" },
        { name: "title", label: "اسم الخدمة", type: "text", required: true },
        { name: "description", label: "الوصف", type: "textarea", required: true, full: true },
        { name: "features", label: "المميزات", type: "array", help: "ميزة في كل سطر", full: true },
        { name: "icon_url", label: "أيقونة الخدمة", type: "url", upload: true, accept: "image/*,.svg" },
        { name: "sort_order", label: "الترتيب", type: "number" },
        { name: "enabled", label: "ظاهر في الموقع", type: "checkbox", default: true },
      ],
    },
    pricing: {
      label: "الباقات",
      singular: "باقة",
      description: "الأسعار والمميزات والباقة المميزة.",
      titleField: "name",
      subtitleField: "subtitle",
      tagField: "features",
      fields: [
        { name: "name", label: "اسم الباقة", type: "text", required: true },
        { name: "subtitle", label: "الوصف المختصر", type: "text" },
        { name: "amount", label: "السعر", type: "text", placeholder: "1,500" },
        { name: "period", label: "المدة", type: "text", placeholder: "ر.س/شهر" },
        { name: "features", label: "مميزات الباقة", type: "array", help: "ميزة في كل سطر", full: true },
        { name: "is_featured", label: "الأكثر طلباً", type: "checkbox" },
        { name: "enabled", label: "ظاهرة في الموقع", type: "checkbox", default: true },
        { name: "sort_order", label: "الترتيب", type: "number" },
      ],
    },
    portfolio: {
      label: "الأعمال",
      singular: "مشروع",
      description: "نماذج الأعمال وروابطها وصورها.",
      titleField: "title",
      subtitleField: "description",
      tagField: "tags",
      fields: [
        { name: "title", label: "اسم المشروع", type: "text", required: true },
        { name: "description", label: "وصف المشروع", type: "textarea", required: true, full: true },
        { name: "tags", label: "التصنيفات", type: "array", help: "تصنيف في كل سطر", full: true },
        { name: "image_url", label: "صورة المشروع", type: "url", upload: true, accept: "image/*" },
        { name: "link_url", label: "رابط المشروع", type: "url", placeholder: "https://..." },
        { name: "gradient", label: "التدرج الاحتياطي", type: "text", placeholder: "linear-gradient(...)" },
        { name: "enabled", label: "ظاهر في الموقع", type: "checkbox", default: true },
        { name: "sort_order", label: "الترتيب", type: "number" },
      ],
    },
    faq: {
      label: "الأسئلة الشائعة",
      singular: "سؤال",
      description: "الأسئلة والإجابات الظاهرة للزوار.",
      titleField: "question",
      subtitleField: "answer",
      fields: [
        { name: "question", label: "السؤال", type: "text", required: true, full: true },
        { name: "answer", label: "الإجابة", type: "textarea", required: true, full: true },
        { name: "enabled", label: "ظاهر في الموقع", type: "checkbox", default: true },
        { name: "sort_order", label: "الترتيب", type: "number" },
      ],
    },
    process_steps: {
      label: "خطوات العمل",
      singular: "خطوة",
      description: "المراحل التي تشرح طريقة تنفيذ المشاريع.",
      titleField: "title",
      subtitleField: "description",
      fields: [
        { name: "number", label: "رقم الخطوة", type: "text", placeholder: "1" },
        { name: "title", label: "عنوان الخطوة", type: "text", required: true },
        { name: "description", label: "الوصف", type: "textarea", required: true, full: true },
        { name: "enabled", label: "ظاهرة في الموقع", type: "checkbox", default: true },
        { name: "sort_order", label: "الترتيب", type: "number" },
      ],
    },
    testimonials: {
      label: "آراء العملاء",
      singular: "رأي عميل",
      description: "تقييمات العملاء المعروضة في الصفحة الرئيسية.",
      titleField: "name",
      subtitleField: "quote",
      fields: [
        { name: "name", label: "اسم العميل", type: "text", required: true },
        { name: "role", label: "الصفة / الشركة", type: "text" },
        { name: "quote", label: "الرأي", type: "textarea", required: true, full: true },
        { name: "rating", label: "التقييم من 5", type: "number", min: 1, max: 5, default: 5 },
        { name: "avatar_text", label: "حرف الصورة", type: "text", placeholder: "أ" },
        { name: "enabled", label: "ظاهر في الموقع", type: "checkbox", default: true },
        { name: "sort_order", label: "الترتيب", type: "number" },
      ],
    },
    site_logos: {
      label: "الشعارات",
      singular: "شعار",
      description: "شعارات النافبار والتحميل والـHero والفوتر.",
      titleField: "key",
      subtitleField: "url",
      noToggle: true,
      noDelete: true,
      fields: [
        {
          name: "key",
          label: "مكان الشعار",
          type: "select",
          required: true,
          options: [
            ["navbar", "النافبار"],
            ["preloader", "شاشة التحميل"],
            ["hero", "Hero"],
            ["footer", "الفوتر"],
          ],
        },
        { name: "url", label: "رابط الشعار", type: "url", required: true, upload: true, accept: "image/*,.svg", full: true },
      ],
    },
  };

  const settingsFields = [
    ["محتوى الـHero", [
      { name: "hero_badge", label: "الشارة العلوية" },
      { name: "hero_title", label: "العنوان الرئيسي" },
      { name: "hero_highlight", label: "الجزء الملوّن من العنوان" },
      { name: "hero_description", label: "وصف الـHero", type: "textarea", full: true },
      { name: "primary_cta_text", label: "نص الزر الأول" },
      { name: "secondary_cta_text", label: "نص الزر الثاني" },
    ]],
    ["الإحصائيات", [
      { name: "stat_1_value", label: "قيمة الإحصائية 1" }, { name: "stat_1_label", label: "عنوان الإحصائية 1" },
      { name: "stat_2_value", label: "قيمة الإحصائية 2" }, { name: "stat_2_label", label: "عنوان الإحصائية 2" },
      { name: "stat_3_value", label: "قيمة الإحصائية 3" }, { name: "stat_3_label", label: "عنوان الإحصائية 3" },
      { name: "stat_4_value", label: "قيمة الإحصائية 4" }, { name: "stat_4_label", label: "عنوان الإحصائية 4" },
    ]],
    ["التواصل والسوشيال", [
      { name: "contact_phone_display", label: "رقم الهاتف الظاهر" },
      { name: "contact_phone_href", label: "رقم الهاتف للرابط", placeholder: "+966500000000" },
      { name: "contact_email", label: "البريد الإلكتروني", type: "email" },
      { name: "whatsapp_url", label: "رابط واتساب", type: "url" },
      { name: "twitter_url", label: "رابط X / Twitter", type: "url" },
      { name: "instagram_url", label: "رابط Instagram", type: "url" },
      { name: "linkedin_url", label: "رابط LinkedIn", type: "url" },
      { name: "footer_description", label: "وصف الفوتر", type: "textarea", full: true },
    ]],
    ["الشريط المتحرك", [
      { name: "marquee_items", label: "عبارات الشريط", type: "array", help: "عبارة في كل سطر", full: true },
    ]],
  ];

  function escapeHtml(value = "") {
    return String(value).replace(/[&<>'"]/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
    })[char]);
  }

  function formatDate(value) {
    if (!value) return "—";
    try {
      return new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
    } catch {
      return value;
    }
  }

  function showToast(message, type = "success") {
    toast.textContent = message;
    toast.className = `toast ${type === "error" ? "error" : ""} show`;
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 3200);
  }

  function setLoading() {
    contentArea.innerHTML = '<div class="loading">جارٍ تحميل البيانات...</div>';
  }

  async function isAdmin() {
    const { data, error } = await sb.rpc("is_admin");
    if (error) throw error;
    return data === true;
  }

  async function showDashboard(session) {
    currentSession = session;
    const allowed = await isAdmin();
    if (!allowed) {
      await sb.auth.signOut();
      throw new Error("هذا الحساب ليس ضمن قائمة مديري الموقع.");
    }
    loginView.hidden = true;
    dashboardView.hidden = false;
    currentUser.textContent = session.user.email || "Admin";
    await updateMessagesBadge();
    await navigate(activeSection);
  }

  function showLogin(message = "") {
    dashboardView.hidden = true;
    loginView.hidden = false;
    document.getElementById("loginError").textContent = message;
  }

  document.getElementById("loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = document.getElementById("loginButton");
    const errorEl = document.getElementById("loginError");
    button.disabled = true;
    button.textContent = "جارٍ تسجيل الدخول...";
    errorEl.textContent = "";
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
      errorEl.textContent = "البريد أو كلمة المرور غير صحيحة.";
    } else {
      try {
        await showDashboard(data.session);
      } catch (err) {
        errorEl.textContent = err.message || "غير مصرح لهذا الحساب.";
      }
    }
    button.disabled = false;
    button.textContent = "دخول لوحة التحكم";
  });

  document.getElementById("logoutButton").addEventListener("click", async () => {
    await sb.auth.signOut();
    showLogin();
  });

  document.querySelectorAll(".nav-item").forEach((button) => {
    button.addEventListener("click", () => navigate(button.dataset.section));
  });

  async function navigate(section) {
    activeSection = section;
    document.querySelectorAll(".nav-item").forEach((button) => {
      button.classList.toggle("active", button.dataset.section === section);
    });
    const labels = {
      overview: "نظرة عامة",
      messages: "رسائل العملاء",
      settings: "إعدادات الموقع",
      ...Object.fromEntries(Object.entries(collections).map(([key, value]) => [key, value.label])),
    };
    pageTitle.textContent = labels[section] || section;
    setLoading();
    try {
      if (section === "overview") await renderOverview();
      else if (section === "messages") await renderMessages();
      else if (section === "settings") await renderSettings();
      else await renderCollection(section);
    } catch (error) {
      console.error(error);
      contentArea.innerHTML = `<div class="empty-state">تعذر تحميل البيانات.<br><small>${escapeHtml(error.message || "خطأ غير معروف")}</small></div>`;
    }
  }

  async function countTable(table, filter) {
    let query = sb.from(table).select("*", { count: "exact", head: true });
    if (filter) query = query.eq(filter.field, filter.value);
    const { count, error } = await query;
    if (error) throw error;
    return count || 0;
  }

  async function renderOverview() {
    const [services, pricing, portfolio, unread, latest] = await Promise.all([
      countTable("services"), countTable("pricing"), countTable("portfolio"),
      countTable("contact_messages", { field: "status", value: "new" }),
      sb.from("contact_messages").select("id,name,email,message,status,created_at").order("created_at", { ascending: false }).limit(5),
    ]);
    if (latest.error) throw latest.error;
    contentArea.innerHTML = `
      <div class="stats-grid">
        ${statCard("الخدمات", services)}${statCard("الباقات", pricing)}${statCard("المشاريع", portfolio)}${statCard("رسائل جديدة", unread)}
      </div>
      <div class="overview-grid">
        <section class="panel"><h3>أحدث الرسائل</h3><div class="quick-list">
          ${(latest.data || []).length ? latest.data.map((m) => `<button class="quick-row" data-open-messages type="button"><span>${escapeHtml(m.name)} — ${escapeHtml(m.message.slice(0, 70))}${m.message.length > 70 ? "..." : ""}</span><small>${formatDate(m.created_at)}</small></button>`).join("") : '<div class="empty-state">لا توجد رسائل حتى الآن.</div>'}
        </div></section>
        <section class="panel"><h3>اختصارات</h3><div class="quick-list">
          <button class="quick-row" data-go="services" type="button"><span>إضافة خدمة جديدة</span><b>←</b></button>
          <button class="quick-row" data-go="portfolio" type="button"><span>إضافة مشروع</span><b>←</b></button>
          <button class="quick-row" data-go="settings" type="button"><span>تعديل بيانات التواصل</span><b>←</b></button>
          <a class="quick-row" href="../index.html" target="_blank"><span>معاينة الموقع</span><b>↗</b></a>
        </div></section>
      </div>`;
    contentArea.querySelectorAll("[data-go]").forEach((b) => b.addEventListener("click", () => navigate(b.dataset.go)));
    contentArea.querySelectorAll("[data-open-messages]").forEach((b) => b.addEventListener("click", () => navigate("messages")));
  }

  function statCard(label, number) {
    return `<article class="stat-card"><span>${escapeHtml(label)}</span><strong>${Number(number).toLocaleString("ar-EG")}</strong></article>`;
  }

  async function renderCollection(table) {
    const config = collections[table];
    if (!config) throw new Error("قسم غير معروف");
    const orderColumn = table === "site_logos" ? "key" : "sort_order";
    const { data, error } = await sb.from(table).select("*").order(orderColumn, { ascending: true });
    if (error) throw error;
    contentArea.innerHTML = `
      <div class="section-toolbar"><div><h2>${escapeHtml(config.label)}</h2><p>${escapeHtml(config.description)}</p></div><button id="addItemButton" class="primary-button" type="button">+ إضافة ${escapeHtml(config.singular)}</button></div>
      <div class="cards-list">${(data || []).length ? data.map((item) => renderContentCard(table, config, item)).join("") : '<div class="empty-state">لا توجد عناصر بعد.</div>'}</div>`;
    document.getElementById("addItemButton").addEventListener("click", () => openEditor(table));
    bindCardActions(table, config);
  }

  function renderContentCard(table, config, item) {
    const title = item[config.titleField] || "بدون عنوان";
    const subtitle = item[config.subtitleField] || "";
    const tags = config.tagField && Array.isArray(item[config.tagField]) ? item[config.tagField] : [];
    const disabled = "enabled" in item && !item.enabled;
    return `<article class="content-card ${disabled ? "disabled" : ""}" data-id="${escapeHtml(item.id)}">
      <div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(String(subtitle).slice(0, 240))}</p>${tags.length ? `<div class="meta-line">${tags.slice(0,8).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>` : ""}</div>
      <div class="card-actions">
        ${!config.noToggle && "enabled" in item ? `<button class="toggle ${item.enabled ? "on" : ""}" data-action="toggle" type="button" aria-label="إظهار أو إخفاء"></button>` : ""}
        <button class="icon-button" data-action="edit" type="button" aria-label="تعديل">✎</button>
        ${config.noDelete ? "" : '<button class="icon-button" data-action="delete" type="button" aria-label="حذف">🗑</button>'}
      </div>
    </article>`;
  }

  function bindCardActions(table, config) {
    contentArea.querySelectorAll(".content-card").forEach((card) => {
      const id = card.dataset.id;
      card.querySelector('[data-action="edit"]')?.addEventListener("click", () => openEditor(table, id));
      card.querySelector('[data-action="toggle"]')?.addEventListener("click", async () => {
        const current = card.querySelector(".toggle").classList.contains("on");
        const { error } = await sb.from(table).update({ enabled: !current }).eq("id", id);
        if (error) return showToast(error.message, "error");
        showToast(current ? "تم إخفاء العنصر" : "تم إظهار العنصر");
        renderCollection(table);
      });
      card.querySelector('[data-action="delete"]')?.addEventListener("click", async () => {
        if (!window.confirm(`هل تريد حذف هذا الـ${config.singular} نهائياً؟`)) return;
        const { error } = await sb.from(table).delete().eq("id", id);
        if (error) return showToast(error.message, "error");
        showToast("تم الحذف بنجاح");
        renderCollection(table);
      });
    });
  }

  async function nextSortOrder(table) {
    const { data } = await sb.from(table).select("sort_order").order("sort_order", { ascending: false }).limit(1);
    return (data?.[0]?.sort_order || 0) + 1;
  }

  async function openEditor(table, id = null) {
    const config = collections[table];
    let item = {};
    if (id) {
      const { data, error } = await sb.from(table).select("*").eq("id", id).single();
      if (error) return showToast(error.message, "error");
      item = data;
    } else {
      for (const field of config.fields) if (field.default !== undefined) item[field.name] = field.default;
      if (config.fields.some((field) => field.name === "sort_order")) item.sort_order = await nextSortOrder(table);
    }
    modalContext = { table, id, config };
    modalTitle.textContent = id ? `تعديل ${config.singular}` : `إضافة ${config.singular}`;
    editorForm.innerHTML = config.fields.map((field) => fieldMarkup(field, item[field.name])).join("") + `
      <div class="form-actions"><button id="cancelEditor" class="soft-button" type="button">إلغاء</button><button class="primary-button" type="submit">حفظ التغييرات</button></div>`;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    bindUploadInputs();
    document.getElementById("cancelEditor").addEventListener("click", closeModal);
  }

  function fieldMarkup(field, value) {
    const classes = `field ${field.full ? "full" : ""}`;
    const required = field.required ? "required" : "";
    const current = value ?? "";
    if (field.type === "checkbox") {
      return `<label class="checkbox-field ${field.full ? "full" : ""}"><input name="${field.name}" type="checkbox" ${current ? "checked" : ""}/><span>${escapeHtml(field.label)}</span></label>`;
    }
    if (field.type === "textarea" || field.type === "array") {
      const text = field.type === "array" && Array.isArray(current) ? current.join("\n") : current;
      return `<label class="${classes}"><span>${escapeHtml(field.label)}</span><textarea name="${field.name}" ${required}>${escapeHtml(text)}</textarea>${field.help ? `<small class="field-help">${escapeHtml(field.help)}</small>` : ""}</label>`;
    }
    if (field.type === "select") {
      return `<label class="${classes}"><span>${escapeHtml(field.label)}</span><select name="${field.name}" ${required}>${field.options.map(([optionValue, optionLabel]) => `<option value="${escapeHtml(optionValue)}" ${String(current) === String(optionValue) ? "selected" : ""}>${escapeHtml(optionLabel)}</option>`).join("")}</select></label>`;
    }
    const type = ["url", "email", "number"].includes(field.type) ? field.type : "text";
    const min = field.min !== undefined ? `min="${field.min}"` : "";
    const max = field.max !== undefined ? `max="${field.max}"` : "";
    const input = `<input name="${field.name}" type="${type}" value="${escapeHtml(current)}" placeholder="${escapeHtml(field.placeholder || "")}" ${required} ${min} ${max}/>`;
    if (field.upload) {
      return `<label class="${classes}"><span>${escapeHtml(field.label)}</span><div class="upload-row">${input}<label class="soft-button upload-button">رفع ملف<input type="file" data-upload-for="${field.name}" accept="${escapeHtml(field.accept || "image/*")}"/></label></div><small class="field-help" data-upload-status="${field.name}"></small></label>`;
    }
    return `<label class="${classes}"><span>${escapeHtml(field.label)}</span>${input}${field.help ? `<small class="field-help">${escapeHtml(field.help)}</small>` : ""}</label>`;
  }

  function bindUploadInputs() {
    editorForm.querySelectorAll("[data-upload-for]").forEach((input) => {
      input.addEventListener("change", async () => {
        const file = input.files?.[0];
        if (!file) return;
        const fieldName = input.dataset.uploadFor;
        const status = editorForm.querySelector(`[data-upload-status="${fieldName}"]`);
        status.textContent = "جارٍ رفع الملف...";
        try {
          const url = await uploadFile(file, modalContext.table);
          editorForm.elements[fieldName].value = url;
          status.textContent = "✓ تم الرفع بنجاح";
        } catch (error) {
          status.textContent = `فشل الرفع: ${error.message}`;
        }
      });
    });
  }

  async function uploadFile(file, folder) {
    const ext = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
    const base = file.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 45) || "file";
    const path = `${folder}/${Date.now()}-${base}.${ext}`;
    const { error } = await sb.storage.from(bucket).upload(path, file, { cacheControl: "3600", upsert: false });
    if (error) throw error;
    const { data } = sb.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  editorForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!modalContext) return;
    const { table, id, config } = modalContext;
    const payload = {};
    for (const field of config.fields) {
      const control = editorForm.elements[field.name];
      if (!control) continue;
      if (field.type === "checkbox") payload[field.name] = control.checked;
      else if (field.type === "number") payload[field.name] = control.value === "" ? null : Number(control.value);
      else if (field.type === "array") payload[field.name] = control.value.split(/\n|,/).map((x) => x.trim()).filter(Boolean);
      else payload[field.name] = control.value.trim() || null;
    }
    const submit = editorForm.querySelector('button[type="submit"]');
    submit.disabled = true;
    submit.textContent = "جارٍ الحفظ...";
    let result;
    if (table === "site_logos") {
      result = await sb.from(table).upsert(payload, { onConflict: "key" });
    } else if (id) {
      result = await sb.from(table).update(payload).eq("id", id);
    } else {
      result = await sb.from(table).insert(payload);
    }
    submit.disabled = false;
    submit.textContent = "حفظ التغييرات";
    if (result.error) return showToast(result.error.message, "error");
    closeModal();
    showToast("تم حفظ التغييرات بنجاح");
    renderCollection(table);
  });

  function closeModal() {
    modal.hidden = true;
    modalContext = null;
    editorForm.innerHTML = "";
    document.body.style.overflow = "";
  }

  document.getElementById("modalClose").addEventListener("click", closeModal);
  modal.addEventListener("click", (event) => { if (event.target === modal) closeModal(); });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !modal.hidden) closeModal(); });

  async function renderSettings() {
    const { data, error } = await sb.from("site_settings").select("*").eq("id", 1).maybeSingle();
    if (error) throw error;
    const settings = data || { id: 1 };
    contentArea.innerHTML = `<form id="settingsForm" class="settings-form">
      ${settingsFields.map(([title, fields]) => `<section class="form-section"><h3>${escapeHtml(title)}</h3><div class="form-grid">${fields.map((field) => settingsFieldMarkup(field, settings[field.name])).join("")}</div></section>`).join("")}
      <button class="primary-button" type="submit">حفظ إعدادات الموقع</button>
    </form>`;
    document.getElementById("settingsForm").addEventListener("submit", saveSettings);
  }

  function settingsFieldMarkup(field, value) {
    const full = field.full ? "full" : "";
    const text = field.type === "array" && Array.isArray(value) ? value.join("\n") : (value ?? "");
    if (field.type === "textarea" || field.type === "array") {
      return `<label class="field ${full}"><span>${escapeHtml(field.label)}</span><textarea name="${field.name}">${escapeHtml(text)}</textarea>${field.help ? `<small class="field-help">${escapeHtml(field.help)}</small>` : ""}</label>`;
    }
    return `<label class="field ${full}"><span>${escapeHtml(field.label)}</span><input name="${field.name}" type="${field.type || "text"}" value="${escapeHtml(text)}" placeholder="${escapeHtml(field.placeholder || "")}"/></label>`;
  }

  async function saveSettings(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = { id: 1 };
    settingsFields.flatMap(([, fields]) => fields).forEach((field) => {
      const value = form.elements[field.name].value.trim();
      payload[field.name] = field.type === "array" ? value.split(/\n/).map((x) => x.trim()).filter(Boolean) : (value || null);
    });
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    const { error } = await sb.from("site_settings").upsert(payload, { onConflict: "id" });
    button.disabled = false;
    if (error) return showToast(error.message, "error");
    showToast("تم حفظ إعدادات الموقع");
  }

  async function updateMessagesBadge() {
    const unread = await countTable("contact_messages", { field: "status", value: "new" });
    messagesBadge.textContent = unread;
    messagesBadge.hidden = unread === 0;
  }

  async function renderMessages() {
    const { data, error } = await sb.from("contact_messages").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    contentArea.innerHTML = `<div class="section-toolbar"><div><h2>رسائل العملاء</h2><p>كل الرسائل المرسلة من نموذج التواصل.</p></div><button id="refreshMessages" class="soft-button" type="button">تحديث</button></div>
      <div class="cards-list">${(data || []).length ? data.map(renderMessageCard).join("") : '<div class="empty-state">لا توجد رسائل حتى الآن.</div>'}</div>`;
    document.getElementById("refreshMessages").addEventListener("click", renderMessages);
    contentArea.querySelectorAll(".message-card").forEach((card) => {
      const id = card.dataset.id;
      card.querySelector("select").addEventListener("change", async (event) => {
        const { error: updateError } = await sb.from("contact_messages").update({ status: event.target.value }).eq("id", id);
        if (updateError) return showToast(updateError.message, "error");
        showToast("تم تحديث حالة الرسالة");
        await updateMessagesBadge();
        renderMessages();
      });
      card.querySelector('[data-action="delete"]').addEventListener("click", async () => {
        if (!window.confirm("هل تريد حذف الرسالة نهائياً؟")) return;
        const { error: deleteError } = await sb.from("contact_messages").delete().eq("id", id);
        if (deleteError) return showToast(deleteError.message, "error");
        showToast("تم حذف الرسالة");
        await updateMessagesBadge();
        renderMessages();
      });
    });
  }

  function renderMessageCard(message) {
    const statusOptions = [["new", "جديدة"], ["read", "تمت القراءة"], ["contacted", "تم التواصل"], ["closed", "مغلقة"]];
    return `<article class="content-card message-card ${message.status === "new" ? "unread" : ""}" data-id="${message.id}">
      <div><div class="message-head"><h3>${escapeHtml(message.name)}</h3><small>${formatDate(message.created_at)}</small>${message.plan ? `<span class="tag">${escapeHtml(message.plan)}</span>` : ""}</div>
      <div class="message-contact"><a href="mailto:${escapeHtml(message.email)}">${escapeHtml(message.email)}</a>${message.phone ? `<a href="tel:${escapeHtml(message.phone)}">${escapeHtml(message.phone)}</a>` : ""}</div>
      <p class="message-body">${escapeHtml(message.message)}</p></div>
      <div class="card-actions"><select aria-label="حالة الرسالة">${statusOptions.map(([value,label]) => `<option value="${value}" ${message.status === value ? "selected" : ""}>${label}</option>`).join("")}</select><button class="icon-button" data-action="delete" type="button">🗑</button></div>
    </article>`;
  }

  async function boot() {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return showLogin();
    try {
      await showDashboard(session);
    } catch (error) {
      showLogin(error.message || "تعذر فتح لوحة التحكم.");
    }
  }

  sb.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT") showLogin();
    currentSession = session;
  });

  boot();
})();
