// ===== CONFIG (Supabase is filled in later) =====
const CONFIG = {
  SUPABASE_URL: "https://lxsyrserfuighwxuymgb.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4c3lyc2VyZnVpZ2h3eHV5bWdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5NDUwNDgsImV4cCI6MjA5MDUyMTA0OH0.6SgyPJZ_TKeKJoC_E4mIQhd373UMP8-K1VMSZJJacsM",  // anon / publishable key ONLY, never service_role
  TABLE: "site_leads",
  REG_URL: "https://reffpa.com/L?tag=d_5266895m_2528c_&site=5266895&ad=2528"
};

(function () {
  const dlg = document.getElementById("lead-form");
  if (!dlg) return;
  const form = dlg.querySelector("form");
  const err = form.querySelector(".lf-error");
  const submit = form.querySelector(".lf-submit");
  const geo = form.elements.geo;
  if (form.dataset.geoDefault) geo.value = form.dataset.geoDefault;

  document.querySelectorAll("[data-open-form]").forEach(function (b) {
    b.addEventListener("click", function () {
      err.hidden = true;
      if (typeof dlg.showModal === "function") dlg.showModal();
      else window.location.href = CONFIG.REG_URL;
      setTimeout(function () { form.elements.contact.focus(); }, 50);
    });
  });

  dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });

  function saveLead(data) {
    if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_ANON_KEY) return Promise.resolve();
    const ctrl = new AbortController();
    const t = setTimeout(function () { ctrl.abort(); }, 4000);
    return fetch(CONFIG.SUPABASE_URL.replace(/\/$/, "") + "/rest/v1/" + CONFIG.TABLE, {
      method: "POST",
      headers: {
        "apikey": CONFIG.SUPABASE_ANON_KEY,
        "Authorization": "Bearer " + CONFIG.SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
      },
      body: JSON.stringify(data),
      signal: ctrl.signal
    }).catch(function () {}).finally(function () { clearTimeout(t); });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (e.submitter && e.submitter.value === "cancel") { dlg.close(); return; }
    // honeypot: bots fill it, humans don't see it
    if (form.elements.website.value) { window.location.href = CONFIG.REG_URL; return; }

    const data = {
      contact_method: form.querySelector('input[name="contact_method"]:checked').value,
      contact: form.elements.contact.value.trim(),
      traffic_type: form.elements.traffic_type.value,
      geo: form.elements.geo.value.trim(),
      page: window.location.pathname
    };
    if (data.contact.length < 3 || !data.traffic_type || !data.geo) {
      err.textContent = form.dataset.required;
      err.hidden = false;
      return;
    }
    submit.disabled = true;
    submit.textContent = form.dataset.sending;
    saveLead(data).then(function () { window.location.href = CONFIG.REG_URL; });
  });

  form.querySelector(".lf-close").addEventListener("click", function (e) {
    e.preventDefault(); dlg.close();
  });
})();
