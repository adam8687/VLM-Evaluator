"use strict";
(() => {
  // js/constants.js
  var ERROR_MODES = [
    "Hallucinated Asset",
    "Temporal / Timestamp Error",
    "Perspective Illusion",
    "Missed Root Cause",
    "Context Loss",
    "Other"
  ];
  var STORAGE_KEYS = {
    sessions: "videoLLMSessions",
    legacyEvals: "videoLLMEvals",
    apiKey: "llmApiKey"
  };

  // js/state/store.js
  var store = {
    /** @type {Session[]} */
    allSessions: [],
    /** @type {string|null} */
    currentSessionId: null,
    /** @type {Evaluation[]} live reference to the current session's evaluations */
    evaluations: [],
    // Workbench form state
    currentAccuracy: null,
    groundTruth: null,
    modelPrediction: null,
    currentVideoURL: null,
    // Toast timer handle
    toastTimer: null,
    /** Set when localStorage session data fails to parse */
    storageWarning: null
  };
  function getCurrentSession() {
    return store.allSessions.find((s) => s.id === store.currentSessionId) || store.allSessions[0];
  }
  function makeSession(name) {
    return { id: Date.now().toString() + Math.random().toString(36).slice(2), name, createdAt: (/* @__PURE__ */ new Date()).toISOString(), evaluations: [] };
  }
  function defaultSessionName() {
    const n = store.allSessions.length + 1;
    const d = /* @__PURE__ */ new Date();
    const ds = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const ts = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    return `Session ${n} \xB7 ${ds} ${ts}`;
  }

  // js/services/storage.js
  function loadSessions() {
    let parseFailed = false;
    const raw = localStorage.getItem(STORAGE_KEYS.sessions);
    if (raw) {
      try {
        const data = JSON.parse(raw);
        store.allSessions = data.sessions || [];
        store.currentSessionId = data.currentSessionId || null;
      } catch (e) {
        parseFailed = true;
        console.error("Could not read saved sessions:", e);
        store.storageWarning = "Saved session data could not be read. Your previous data is still in localStorage \u2014 try opening the app the same way you did before, or restore from a JSON export.";
      }
    }
    const legacy = localStorage.getItem(STORAGE_KEYS.legacyEvals);
    if (legacy && store.allSessions.length === 0 && !parseFailed) {
      try {
        const old = JSON.parse(legacy);
        if (old.length > 0) {
          const s = makeSession("Session 1 (migrated)");
          s.evaluations = old;
          store.allSessions = [s];
          store.currentSessionId = s.id;
          saveSessions();
          localStorage.removeItem(STORAGE_KEYS.legacyEvals);
        }
      } catch (e) {
      }
    }
    if (store.allSessions.length === 0 || !store.currentSessionId || !store.allSessions.find((s) => s.id === store.currentSessionId)) {
      const s = makeSession(defaultSessionName());
      store.allSessions = store.allSessions.length ? store.allSessions : [s];
      store.currentSessionId = store.allSessions[store.allSessions.length - 1].id;
      if (!parseFailed) saveSessions();
    }
    store.evaluations = getCurrentSession().evaluations;
  }
  function saveSessions() {
    getCurrentSession().evaluations = store.evaluations;
    localStorage.setItem(STORAGE_KEYS.sessions, JSON.stringify({ currentSessionId: store.currentSessionId, sessions: store.allSessions }));
  }
  function loadApiKey() {
    return localStorage.getItem(STORAGE_KEYS.apiKey) || "";
  }
  function saveApiKey(value) {
    localStorage.setItem(STORAGE_KEYS.apiKey, value);
  }

  // js/utils.js
  function escapeHtml(s) {
    return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function csvEsc(val) {
    const s = String(val || "").replace(/"/g, '""');
    return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s}"` : s;
  }
  function dateStamp() {
    return (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  }
  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1e3);
  }

  // js/ui/log.js
  function renderTable() {
    const evaluations = store.evaluations;
    const tbody = document.getElementById("log-tbody");
    document.getElementById("log-count").textContent = `${evaluations.length} entr${evaluations.length === 1 ? "y" : "ies"}`;
    document.getElementById("tab-log-badge").textContent = evaluations.length;
    if (evaluations.length === 0) {
      tbody.innerHTML = `<tr id="empty-row"><td colspan="10" style="text-align:center;color:var(--text-secondary);padding:48px;font-size:0.82rem;">No evaluations logged yet. Go to the Evaluate tab to get started.</td></tr>`;
      return;
    }
    tbody.innerHTML = evaluations.slice().reverse().map((e, i) => {
      const isNew = i === 0;
      const gtIcon = e.groundTruth === "Success" ? "check-circle" : "x-circle";
      const gtBadge = `<span class="badge ${e.groundTruth === "Success" ? "badge-success" : "badge-failure"}"><i data-lucide="${gtIcon}"></i> ${e.groundTruth}</span>`;
      const predClass = e.modelPrediction === "Success" ? "badge-success" : e.modelPrediction === "Failure" ? "badge-failure" : "badge-truncated";
      const predIcon = e.modelPrediction === "Success" ? "check-circle" : e.modelPrediction === "Failure" ? "x-circle" : "alert-triangle";
      const predBadge = `<span class="badge ${predClass}"><i data-lucide="${predIcon}"></i> ${e.modelPrediction}</span>`;
      const accIcon = e.accuracy === "Accurate" ? "check" : "x";
      const accBadge = `<span class="badge ${e.accuracy === "Accurate" ? "badge-accurate" : "badge-flawed"}"><i data-lucide="${accIcon}"></i> ${e.accuracy}</span>`;
      const tags = e.errorTags.length ? e.errorTags.map((t) => `<span style="font-size:0.65rem;background:rgba(244,91,122,0.12);border:1px solid rgba(244,91,122,0.3);color:var(--red);border-radius:4px;padding:1px 6px;margin-right:3px;white-space:nowrap;">${t}</span>`).join("") : '<span style="color:var(--text-secondary);font-size:0.72rem;">\u2014</span>';
      const modelShort = e.modelName.length > 16 ? e.modelName.slice(0, 14) + "\u2026" : e.modelName;
      return `<tr class="${isNew ? "row-new" : ""}">
      <td style="color:var(--text-secondary);">${e.seq}</td>
      <td>
        <span
          contenteditable="true"
          spellcheck="false"
          title="Click to rename"
          data-id="${e.id}"
          onblur="renameVideoId(this)"
          onkeydown="if(event.key==='Enter'){event.preventDefault();this.blur();}"
          style="display:inline-block;font-weight:600;color:var(--accent);outline:none;border-bottom:1px dashed transparent;border-radius:2px;padding:1px 3px;cursor:text;max-width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:all 0.2s ease;"
          onfocus="this.style.borderBottomColor='var(--accent)';this.style.background='rgba(36,126,199,0.08)'"
          onfocusout="this.style.borderBottomColor='transparent';this.style.background=''"
        >${escapeHtml(e.videoId)}</span>
      </td>
      <td title="${escapeHtml(e.modelName)}">${escapeHtml(modelShort)}</td>
      <td>${gtBadge}</td>
      <td>${predBadge}</td>
      <td>${accBadge}</td>
      <td style="max-width:200px;">${tags}</td>
      <td style="color:var(--text-secondary);font-size:0.72rem;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escapeHtml(e.notes)}">${escapeHtml(e.notes) || "\u2014"}</td>
      <td style="color:var(--text-secondary);white-space:nowrap;font-size:0.72rem;">${e.timestamp}</td>
      <td><button class="btn-danger" onclick="deleteEntry(${e.id})" style="padding:4px 9px;"><i data-lucide="trash-2" class="w-3 h-3"></i></button></td>
    </tr>`;
    }).join("");
    lucide.createIcons();
  }

  // js/lib/metrics.js
  function confusionMatrix(evaluations) {
    let tp = 0, tn = 0, fp = 0, fn = 0;
    evaluations.forEach((e) => {
      const gt = e.groundTruth;
      const pred = e.modelPrediction === "Truncated" ? null : e.modelPrediction;
      if (!pred) return;
      if (gt === "Success" && pred === "Success") tp++;
      else if (gt === "Failure" && pred === "Failure") tn++;
      else if (gt === "Failure" && pred === "Success") fp++;
      else if (gt === "Success" && pred === "Failure") fn++;
    });
    return { tp, tn, fp, fn };
  }
  function accuracyPct(evaluations) {
    const total = evaluations.length;
    if (total === 0) return null;
    const accurate = evaluations.filter((e) => e.accuracy === "Accurate").length;
    return Math.round(accurate / total * 100);
  }

  // js/ui/metrics.js
  function updateMetrics() {
    const evaluations = store.evaluations;
    const total = evaluations.length;
    const accurate = evaluations.filter((e) => e.accuracy === "Accurate").length;
    const flawed = evaluations.filter((e) => e.accuracy === "Flawed").length;
    const truncated = evaluations.filter((e) => e.modelPrediction === "Truncated").length;
    const { tp, tn, fp, fn } = confusionMatrix(evaluations);
    const accPct = accuracyPct(evaluations);
    const circumference = 138.2;
    document.getElementById("m-total").textContent = total;
    document.getElementById("m-accuracy").textContent = accPct !== null ? `${accPct}%` : "\u2014";
    document.getElementById("m-tp").textContent = tp;
    document.getElementById("m-tn").textContent = tn;
    document.getElementById("m-fp").textContent = fp;
    document.getElementById("m-fn").textContent = fn;
    document.getElementById("m-flawed").textContent = flawed;
    document.getElementById("m-truncated").textContent = truncated;
    const offset = accPct !== null ? circumference - circumference * accPct / 100 : circumference;
    document.getElementById("acc-ring").style.strokeDashoffset = offset;
    document.getElementById("acc-ring-text").textContent = accPct !== null ? `${accPct}%` : "0%";
    document.getElementById("acc-progress").style.width = (accPct || 0) + "%";
    const ringColor = accPct === null ? "var(--green)" : accPct >= 70 ? "var(--green)" : accPct >= 40 ? "var(--yellow)" : "var(--red)";
    document.getElementById("acc-ring").style.stroke = ringColor;
    document.getElementById("acc-progress").style.background = `linear-gradient(90deg, ${ringColor}, ${ringColor}99)`;
  }

  // js/lib/insights.js
  function errorBreakdown(evaluations) {
    const counts = {};
    ERROR_MODES.forEach((m) => counts[m] = 0);
    evaluations.forEach((e) => e.errorTags.forEach((t) => {
      if (counts[t] !== void 0) counts[t]++;
    }));
    const flawedTotal = evaluations.filter((e) => e.accuracy === "Flawed").length;
    return Object.entries(counts).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).map(([label, count]) => ({
      label,
      count,
      pct: flawedTotal > 0 ? Math.round(count / flawedTotal * 100) : 0
    }));
  }
  function generateInsights(evaluations) {
    const insights = [];
    const total = evaluations.length;
    if (total === 0) return insights;
    const flawed = evaluations.filter((e) => e.accuracy === "Flawed").length;
    const accurate = total - flawed;
    const accPct = Math.round(accurate / total * 100);
    const byModel = {};
    evaluations.forEach((e) => {
      if (!byModel[e.modelName]) byModel[e.modelName] = { total: 0, accurate: 0, errors: {} };
      byModel[e.modelName].total++;
      if (e.accuracy === "Accurate") byModel[e.modelName].accurate++;
      e.errorTags.forEach((t) => {
        byModel[e.modelName].errors[t] = (byModel[e.modelName].errors[t] || 0) + 1;
      });
    });
    insights.push({ label: "Overall", text: `Across ${total} evaluation${total > 1 ? "s" : ""}, overall model accuracy is <strong>${accPct}%</strong> (${accurate} accurate, ${flawed} flawed).` });
    Object.entries(byModel).forEach(([model, data]) => {
      const mAcc = Math.round(data.accurate / data.total * 100);
      const mFlawed = data.total - data.accurate;
      let txt = `<strong>${escapeHtml(model)}</strong> achieved <strong>${mAcc}%</strong> accuracy on ${data.total} video${data.total > 1 ? "s" : ""}.`;
      if (mFlawed > 0) {
        const topErr = Object.entries(data.errors).sort((a, b) => b[1] - a[1]);
        if (topErr.length > 0) {
          const errPct = Math.round(topErr[0][1] / mFlawed * 100);
          txt += ` Primary failure mode: <strong>${topErr[0][0]}</strong> (${errPct}% of flawed responses).`;
        }
      }
      insights.push({ label: "Model", text: txt });
    });
    const errCounts = {};
    evaluations.forEach((e) => e.errorTags.forEach((t) => errCounts[t] = (errCounts[t] || 0) + 1));
    const topErrors = Object.entries(errCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
    topErrors.forEach(([err, count]) => {
      const pct = flawed > 0 ? Math.round(count / flawed * 100) : 0;
      insights.push({ label: "Error Pattern", text: `<strong>${err}</strong> accounts for <strong>${pct}%</strong> of all flawed responses (${count} occurrence${count > 1 ? "s" : ""}).` });
    });
    const truncated = evaluations.filter((e) => e.modelPrediction === "Truncated").length;
    if (truncated > 0) {
      const tPct = Math.round(truncated / total * 100);
      insights.push({ label: "Truncation", text: `${tPct}% of model responses were truncated (${truncated} of ${total}). Consider increasing max token limits.` });
    }
    const successVids = evaluations.filter((e) => e.groundTruth === "Success").length;
    const failureVids = evaluations.filter((e) => e.groundTruth === "Failure").length;
    if (total >= 2) {
      insights.push({ label: "Dataset", text: `Dataset balance: <strong>${successVids}</strong> success video${successVids !== 1 ? "s" : ""} vs <strong>${failureVids}</strong> failure video${failureVids !== 1 ? "s" : ""}. ${Math.abs(successVids - failureVids) > total * 0.4 ? "Consider balancing the test set." : "Distribution looks reasonable."}` });
    }
    return insights;
  }

  // js/ui/insights.js
  function renderInsights() {
    renderErrorBars();
    renderTextInsights();
  }
  function renderErrorBars() {
    const container = document.getElementById("error-bars");
    const bars = errorBreakdown(store.evaluations);
    if (bars.length === 0) {
      container.innerHTML = '<div style="font-size:0.78rem;color:var(--text-secondary);text-align:center;padding:16px 0;">No errors logged yet</div>';
      return;
    }
    container.innerHTML = bars.map(({ label, count, pct }) => {
      return `<div class="error-bar">
      <div class="error-bar-label" title="${label}">${label}</div>
      <div class="error-bar-track"><div class="error-bar-fill" style="width:${pct}%"></div></div>
      <div class="error-bar-count">${count}</div>
    </div>`;
    }).join("");
  }
  function renderTextInsights() {
    const container = document.getElementById("insights-container");
    if (store.evaluations.length === 0) {
      container.innerHTML = '<div style="font-size:0.78rem;color:var(--text-secondary);text-align:center;padding:16px 0;">Insights will generate after evaluations are logged.</div>';
      return;
    }
    const insights = generateInsights(store.evaluations);
    container.innerHTML = insights.map((i) => `
    <div class="insight-card">
      <div class="insight-label">Insight \xB7 ${i.label}</div>
      <div>${i.text}</div>
    </div>
  `).join("");
  }

  // js/ui/header.js
  function updateSessionIndicator() {
    const s = getCurrentSession();
    if (!s) return;
    const nameEl = document.getElementById("session-name");
    if (nameEl) nameEl.value = s.name;
    const countEl = document.getElementById("session-eval-count");
    if (countEl) countEl.textContent = s.evaluations.length ? `${s.evaluations.length} eval${s.evaluations.length !== 1 ? "s" : ""}` : "empty";
  }
  function updateProviderBadge() {
    const model = (document.getElementById("model-select")?.value || "").toLowerCase();
    const key = document.getElementById("api-key")?.value || "";
    const badge = document.getElementById("provider-badge");
    if (!badge) return;
    if (model.startsWith("gemini")) {
      badge.textContent = "Google";
      badge.className = "api-provider-badge provider-gemini";
    } else if (model.startsWith("qwen")) {
      badge.textContent = "Alibaba";
      badge.className = "api-provider-badge provider-openai";
    } else if (key.startsWith("ghp_") || key.startsWith("github_pat_")) {
      badge.textContent = "GitHub \u2014 free";
      badge.className = "api-provider-badge provider-github";
    } else {
      badge.textContent = "OpenAI";
      badge.className = "api-provider-badge provider-openai";
    }
  }

  // js/ui/sessions.js
  function renderSessionsTab() {
    document.getElementById("tab-sessions-badge").textContent = store.allSessions.length;
    const grid = document.getElementById("sessions-grid");
    if (!grid) return;
    if (store.allSessions.length === 0) {
      grid.innerHTML = '<div style="color:var(--text-secondary);font-size:0.85rem;grid-column:1/-1;text-align:center;padding:40px;">No sessions yet.</div>';
      return;
    }
    grid.innerHTML = store.allSessions.slice().reverse().map((s) => {
      const isActive = s.id === store.currentSessionId;
      const evals = s.evaluations.length;
      const accurate = s.evaluations.filter((e) => e.accuracy === "Accurate").length;
      const accPct = evals > 0 ? Math.round(accurate / evals * 100) : null;
      const flawed = evals - accurate;
      const { tp, tn, fp, fn } = confusionMatrix(s.evaluations);
      const actSucc = tp + fn;
      const succRate = actSucc > 0 ? Math.round(tp / actSucc * 100) + "%" : "N/A";
      const actFail = tn + fp;
      const failRate = actFail > 0 ? Math.round(tn / actFail * 100) + "%" : "N/A";
      const created = new Date(s.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: true });
      return `<div class="session-card${isActive ? " session-card-active" : ""}">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:12px;">
        <div style="flex:1;">
          <div class="session-card-name">${escapeHtml(s.name)}</div>
          <div class="session-card-meta">${created}</div>
        </div>
        ${isActive ? '<span style="font-size:0.65rem;font-weight:700;padding:3px 8px;background:rgba(36,126,199,0.2);color:var(--accent);border-radius:20px;border:1px solid rgba(36,126,199,0.4);white-space:nowrap;">Active</span>' : ""}
      </div>

      <div style="display:flex;gap:16px;padding:12px 0;border-top:1px solid var(--border);border-bottom:1px dashed var(--border);margin-bottom:0;">
        <div><div class="session-stat-val" style="color:var(--accent);">${evals}</div><div class="session-stat-lbl">Evaluations</div></div>
        <div><div class="session-stat-val" style="color:var(--green);">${accPct !== null ? accPct + "%" : "\u2014"}</div><div class="session-stat-lbl">Accuracy</div></div>
        <div><div class="session-stat-val" style="color:var(--red);">${flawed}</div><div class="session-stat-lbl">Flawed</div></div>
      </div>

      <div style="display:flex;gap:16px;padding:12px 0;border-bottom:1px solid var(--border);margin-bottom:14px;">
         <div><div class="session-stat-val" style="font-size:1.1rem; color:var(--blue);">${succRate}</div><div class="session-stat-lbl">Success Det.</div></div>
         <div><div class="session-stat-val" style="font-size:1.1rem; color:var(--yellow);">${failRate}</div><div class="session-stat-lbl">Failure Det.</div></div>
      </div>

      <div style="display:flex;gap:6px;">
        <button class="btn-primary" onclick="loadSession('${s.id}')" style="flex:1;padding:8px 12px;font-size:0.75rem;">${isActive ? '<i data-lucide="check" class="w-3 h-3"></i> Active' : "Load"}</button>
        ${!isActive ? `<button class="btn-secondary" onclick="openCompareModal('${s.id}')" style="flex:1;padding:8px 12px;font-size:0.75rem;" title="Compare with Active Session"><i data-lucide="scale" class="w-3 h-3"></i> Compare</button>` : `<div style="flex:1"></div>`}
        <button class="btn-danger" onclick="deleteSession('${s.id}')" style="padding:8px 12px;font-size:0.75rem;"><i data-lucide="trash-2" class="w-3 h-3"></i></button>
      </div>
    </div>`;
    }).join("");
    updateSessionIndicator();
    lucide.createIcons();
  }

  // js/ui/tabs.js
  function switchTab(name) {
    document.querySelectorAll(".tab-pane").forEach((p) => {
      p.classList.remove("active");
      p.style.animation = "none";
      p.offsetHeight;
      p.style.animation = null;
    });
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    const target = document.getElementById("tab-" + name);
    target.classList.add("active");
    document.querySelector(`.tab-btn[data-tab="${name}"]`).classList.add("active");
  }

  // js/ui/compareModal.js
  function openCompareModal(targetSessionId) {
    const active = getCurrentSession();
    const target = store.allSessions.find((s) => s.id === targetSessionId);
    if (!target) return;
    const matches = [];
    active.evaluations.forEach((eA) => {
      const eB = target.evaluations.find((e) => e.seq === eA.seq);
      if (eB) matches.push({ eA, eB });
    });
    matches.sort((a, b) => a.eA.seq - b.eA.seq);
    const agreements = matches.filter((m) => m.eA.modelPrediction === m.eB.modelPrediction);
    const disagreements = matches.filter((m) => m.eA.modelPrediction !== m.eB.modelPrediction);
    const buildTable = (list, title, color) => {
      if (list.length === 0) return "";
      return `
       <div style="margin-top:24px; padding-bottom:8px; border-bottom:2px solid ${color}; display:flex; justify-content:space-between; align-items:flex-end;">
         <h3 style="font-size:1.1rem; font-weight:700; color:var(--text-primary); margin:0;">${title}</h3>
         <span style="font-size:0.8rem; font-weight:700; color:${color}; background:${color}22; padding:3px 10px; border-radius:12px;">${list.length} Videos</span>
       </div>
       <table class="data-table" style="margin-top:12px; width:100%;">
         <thead>
           <tr>
             <th style="width:40px;">#</th>
             <th>Video ID (Active)</th>
             <th>Ground Truth</th>
             <th style="border-left:1px solid var(--border); padding-left:12px; color:var(--accent);">${escapeHtml(active.name)}</th>
             <th style="border-left:1px solid var(--border); padding-left:12px;">${escapeHtml(target.name)}</th>
             <th style="text-align:right;">Watch</th>
           </tr>
         </thead>
         <tbody>
           ${list.map((m) => {
        const gtIcon = m.eA.groundTruth === "Success" ? "check-circle" : "x-circle";
        const predAIcon = m.eA.modelPrediction === "Success" ? "check-circle" : m.eA.modelPrediction === "Failure" ? "x-circle" : "alert-triangle";
        const predBIcon = m.eB.modelPrediction === "Success" ? "check-circle" : m.eB.modelPrediction === "Failure" ? "x-circle" : "alert-triangle";
        const accAIcon = m.eA.accuracy === "Accurate" ? "check" : "x";
        const accBIcon = m.eB.accuracy === "Accurate" ? "check" : "x";
        return `
             <tr style="cursor:pointer; transition:background 0.15s;" onmouseover="this.style.background='var(--surface-3)'" onmouseout="this.style.background='transparent'" onclick="loadLogToWorkbench('${escapeHtml(m.eA.videoId)}', '${m.eA.groundTruth}')">
               <td style="color:var(--text-secondary);">${m.eA.seq}</td>
               <td style="font-weight:600; color:var(--text-primary);" title="Target ID: ${escapeHtml(m.eB.videoId)}">${escapeHtml(m.eA.videoId)}</td>
               <td><span class="badge ${m.eA.groundTruth === "Success" ? "badge-success" : "badge-failure"}"><i data-lucide="${gtIcon}"></i> ${m.eA.groundTruth}</span></td>

               <td style="border-left:1px solid var(--border); padding-left:12px;">
                 <span class="badge ${m.eA.modelPrediction === "Success" ? "badge-success" : m.eA.modelPrediction === "Failure" ? "badge-failure" : "badge-truncated"}"><i data-lucide="${predAIcon}"></i> ${m.eA.modelPrediction}</span>
                 <span style="display:inline-flex; align-items:center; font-size:0.75rem; font-weight:700; color:${m.eA.accuracy === "Accurate" ? "var(--green)" : "var(--red)"}; margin-left:8px;"><i data-lucide="${accAIcon}" class="w-3 h-3"></i></span>
               </td>

               <td style="border-left:1px solid var(--border); padding-left:12px;">
                 <span class="badge ${m.eB.modelPrediction === "Success" ? "badge-success" : m.eB.modelPrediction === "Failure" ? "badge-failure" : "badge-truncated"}"><i data-lucide="${predBIcon}"></i> ${m.eB.modelPrediction}</span>
                 <span style="display:inline-flex; align-items:center; font-size:0.75rem; font-weight:700; color:${m.eB.accuracy === "Accurate" ? "var(--green)" : "var(--red)"}; margin-left:8px;"><i data-lucide="${accBIcon}" class="w-3 h-3"></i></span>
               </td>

               <td style="text-align:right;">
                 <span style="display:inline-flex; align-items:center; opacity:0.6; transition:color 0.2s;" onmouseover="this.style.color='var(--accent)'" onmouseout="this.style.color=''"><i data-lucide="play-circle" class="w-5 h-5"></i></span>
               </td>
             </tr>
           `;
      }).join("")}
         </tbody>
       </table>
     `;
    };
    document.getElementById("compare-modal-body").innerHTML = `
    ${buildTable(disagreements, "Disagreements (Divergent Predictions)", "var(--yellow)")}
    ${buildTable(agreements, "Agreements (Matched Predictions)", "var(--border)")}
    ${matches.length === 0 ? `<div style="text-align:center; padding:40px; color:var(--text-secondary);">No matching evaluation numbers (#) found between these two sessions. Ensure they were run in the same sequential order.</div>` : ""}
  `;
    document.getElementById("compare-modal").style.display = "flex";
    lucide.createIcons();
    setTimeout(() => {
      document.getElementById("compare-modal").style.opacity = "1";
    }, 10);
  }
  function closeCompareModal() {
    document.getElementById("compare-modal").style.opacity = "0";
    setTimeout(() => {
      document.getElementById("compare-modal").style.display = "none";
    }, 300);
  }

  // js/ui/toast.js
  function showToast(msg, type = "ok", durationMs = 3e3) {
    const toast = document.getElementById("toast");
    const colors = { ok: "var(--green)", warn: "var(--yellow)", info: "var(--blue)" };
    const icon = type === "ok" ? "check-circle" : type === "warn" ? "alert-triangle" : "info";
    toast.style.borderColor = colors[type] || "var(--accent)";
    toast.innerHTML = `<div style="display:flex; align-items:center; gap:8px;"><i data-lucide="${icon}" class="w-4 h-4"></i> ${msg}</div>`;
    lucide.createIcons();
    toast.classList.add("show");
    if (store.toastTimer) clearTimeout(store.toastTimer);
    store.toastTimer = setTimeout(() => toast.classList.remove("show"), durationMs);
  }

  // js/services/video.js
  function seekAndCapture(video, time) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Seek timeout \u2014 try a shorter video or fewer frames")), 8e3);
      const handler = () => {
        clearTimeout(timeout);
        video.removeEventListener("seeked", handler);
        resolve();
      };
      video.addEventListener("seeked", handler);
      video.currentTime = time;
    });
  }
  async function extractFrames(video, numFrames) {
    const canvas = document.createElement("canvas");
    const MAX_DIM = 512;
    const ar = video.videoWidth / video.videoHeight;
    if (ar >= 1) {
      canvas.width = MAX_DIM;
      canvas.height = Math.round(MAX_DIM / ar);
    } else {
      canvas.height = MAX_DIM;
      canvas.width = Math.round(MAX_DIM * ar);
    }
    const ctx = canvas.getContext("2d");
    const dur = video.duration;
    if (!dur || isNaN(dur)) throw new Error("Video duration unavailable \u2014 ensure the file is fully loaded.");
    const frames = [];
    for (let i = 0; i < numFrames; i++) {
      const t = numFrames === 1 ? dur / 2 : dur / (numFrames - 1) * i;
      await seekAndCapture(video, Math.min(Math.max(t, 0), dur - 0.05));
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      frames.push(canvas.toDataURL("image/jpeg", 0.75).split(",")[1]);
    }
    return frames;
  }
  function frameCalculator(durationInSeconds, fpsMultiplier) {
    const mult = parseFloat(fpsMultiplier) || 1;
    return Math.max(4, Math.min(Math.ceil(durationInSeconds * mult), 200));
  }

  // js/lib/inference.js
  function inferGroundTruth(filename) {
    const name = String(filename || "").toLowerCase();
    if (!name) return null;
    const hasSuccess = /(^|[^a-z])(success|successful|passed|pass)($|[^a-z])/.test(name);
    const hasFailure = /(^|[^a-z])(failure|failed|fail|error)($|[^a-z])/.test(name);
    if (hasSuccess && !hasFailure) return "Success";
    if (hasFailure && !hasSuccess) return "Failure";
    return null;
  }
  function inferPrediction(output) {
    const text = String(output || "").trim().toLowerCase();
    if (!text) return null;
    if (text.startsWith("[error]") || /\b(truncated|cut off|incomplete response|max token)\b/.test(text)) return "Truncated";
    const statusMatch = text.match(/final[_\s-]?status[:\s]+([a-z-]+)/);
    if (statusMatch) {
      const s = statusMatch[1];
      if (/success/.test(s)) return "Success";
      if (/fail|inconclusive|truncat/.test(s)) return s.includes("truncat") ? "Truncated" : "Failure";
    }
    const hasSuccess = /\b(success|successful|succeeded|pass|passed|task complete|completed successfully|achieved|correctly placed|locked|closed successfully)\b/.test(text);
    const hasFailure = /\b(failure|failed|fail|failing|unsuccessful|error|not complete|did not|couldn't|could not|dropped|missed|wrong|incorrect|never)\b/.test(text);
    if (hasSuccess && !hasFailure) return "Success";
    if (hasFailure && !hasSuccess) return "Failure";
    if (hasSuccess && hasFailure) return "Failure";
    return null;
  }
  function inferErrorTags(output) {
    const text = String(output || "").toLowerCase();
    const tags = [];
    if (/\b(hallucin|fabricat|invented|non-?existent|not present|doesn't exist|ghost)\b/.test(text)) tags.push("Hallucinated Asset");
    if (/\b(timestamp|time.?step|temporal|frame \d|second|at \d+s|:xx|00:|timing)\b/.test(text)) tags.push("Temporal / Timestamp Error");
    if (/\b(perspective|angle|camera|side.?view|overhead|occlud|depth|parallax|illusion)\b/.test(text)) tags.push("Perspective Illusion");
    if (/\b(root.?cause|why|reason|underlying|misidentif|wrong cause|attributed)\b/.test(text)) tags.push("Missed Root Cause");
    if (/\b(context|earlier|previous|prior frame|forgot|lost track|unaware)\b/.test(text)) tags.push("Context Loss");
    return tags;
  }

  // js/api/detectProvider.js
  function detectProvider(model, apiKey) {
    if (model.toLowerCase().startsWith("gemini")) return "gemini";
    if (model.toLowerCase().startsWith("qwen")) return "qwen";
    if (apiKey.startsWith("ghp_") || apiKey.startsWith("github_pat_")) return "github";
    return "openai";
  }

  // js/api/openai.js
  async function callOpenAI(apiKey, model, prompt, frames) {
    const body = {
      model,
      messages: [{ role: "user", content: [{ type: "text", text: prompt }, ...frames.map((f) => ({ type: "image_url", image_url: { url: `data:image/jpeg;base64,${f}`, detail: "low" } }))] }]
    };
    if (model.includes("gpt-5") || model.startsWith("o")) body.max_completion_tokens = 2048;
    else body.max_tokens = 2048;
    const res = await fetch("https://api.openai.com/v1/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` }, body: JSON.stringify(body) });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "(empty response)";
  }

  // js/api/gemini.js
  async function callGemini(apiKey, model, prompt, frames) {
    const modelId = model.startsWith("models/") ? model : `models/${model}`;
    const parts = [{ text: prompt }, ...frames.map((f) => ({ inline_data: { mime_type: "image/jpeg", data: f } }))];
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/${modelId}:generateContent?key=${apiKey}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts }] }) });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "(empty response)";
  }

  // js/api/github.js
  async function callGitHub(token, model, prompt, frames) {
    const body = {
      model,
      messages: [{ role: "user", content: [{ type: "text", text: prompt }, ...frames.map((f) => ({ type: "image_url", image_url: { url: `data:image/jpeg;base64,${f}`, detail: "low" } }))] }]
    };
    if (model.includes("gpt-5") || model.startsWith("o")) body.max_completion_tokens = 2048;
    else body.max_tokens = 2048;
    const res = await fetch("https://models.inference.ai.azure.com/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }, body: JSON.stringify(body) });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "(empty response)";
  }

  // js/api/qwen.js
  async function callQwen(apiKey, model, prompt, frames) {
    const body = {
      model,
      messages: [{ role: "user", content: [{ type: "text", text: prompt }, ...frames.map((f) => ({ type: "image_url", image_url: { url: `data:image/jpeg;base64,${f}` } }))] }],
      max_tokens: 2048
    };
    const res = await fetch("https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "(empty response)";
  }

  // js/api/runInference.js
  async function runInference({ apiKey, model, prompt, frames, numFrames, vidDuration }) {
    const hiddenContext = `

[SYSTEM CONTEXT: You are analyzing exactly ${numFrames} static frames extracted evenly from a ${vidDuration}-second video. Frame 1 represents 0.0s and Frame ${numFrames} represents ${vidDuration}s. You must mathematically interpolate exact timestamps for any events you describe based on this frame scale.]`;
    const finalPrompt = prompt + hiddenContext;
    const provider = detectProvider(model, apiKey);
    if (provider === "gemini") return callGemini(apiKey, model, finalPrompt, frames);
    if (provider === "github") return callGitHub(apiKey, model, finalPrompt, frames);
    if (provider === "qwen") return callQwen(apiKey, model, finalPrompt, frames);
    return callOpenAI(apiKey, model, finalPrompt, frames);
  }

  // js/ui/evaluate.js
  function initDropZone() {
    const dropZone = document.getElementById("drop-zone");
    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropZone.classList.add("drag-over");
    });
    dropZone.addEventListener("dragleave", () => dropZone.classList.remove("drag-over"));
    dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropZone.classList.remove("drag-over");
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("video/")) loadVideoFile(file);
    });
  }
  function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) loadVideoFile(file);
  }
  function updateFrameCalc() {
    const player = document.getElementById("video-player");
    if (!player.duration || isNaN(player.duration)) return;
    const fpsMultiplier = document.getElementById("fps-select").value;
    document.getElementById("frame-count").value = frameCalculator(player.duration, fpsMultiplier);
  }
  function loadVideoFile(file) {
    if (store.currentVideoURL) URL.revokeObjectURL(store.currentVideoURL);
    store.currentVideoURL = URL.createObjectURL(file);
    const player = document.getElementById("video-player");
    player.onloadedmetadata = function() {
      updateFrameCalc();
      showToast(`Video loaded. Frame count auto-calculated.`, "info");
    };
    player.onerror = function() {
      showToast("Error: Your web browser cannot read this video format or codec. Try converting to H.264/MP4.", "warn");
    };
    player.src = store.currentVideoURL;
    player.style.display = "block";
    const playControls = document.getElementById("video-playback-controls");
    if (playControls) playControls.style.display = "flex";
    document.getElementById("drop-icon").innerHTML = '<i data-lucide="file-video" class="w-8 h-8" style="color:var(--green)"></i>';
    document.getElementById("drop-label").textContent = file.name;
    const fd = document.getElementById("filename-display");
    fd.style.display = "flex";
    document.getElementById("filename-text").textContent = file.name;
    if (!document.getElementById("video-id").value) {
      document.getElementById("video-id").value = file.name;
    }
    applyGroundTruthFromVideoId(file.name);
    lucide.createIcons();
  }
  function clearVideoUpload() {
    const player = document.getElementById("video-player");
    player.pause();
    player.removeAttribute("src");
    player.load();
    player.style.display = "none";
    const playControls = document.getElementById("video-playback-controls");
    if (playControls) playControls.style.display = "none";
    if (store.currentVideoURL) {
      URL.revokeObjectURL(store.currentVideoURL);
      store.currentVideoURL = null;
    }
    document.getElementById("drop-icon").innerHTML = '<i data-lucide="upload-cloud" class="w-8 h-8"></i>';
    document.getElementById("drop-label").textContent = "Drop MP4 here or click to browse";
    document.getElementById("filename-display").style.display = "none";
    document.getElementById("filename-text").textContent = "";
    document.getElementById("file-input").value = "";
    lucide.createIcons();
  }
  function setRadioValue(group, value) {
    const target = document.querySelector(`[data-group="${group}"][data-val="${value}"]`);
    if (!target) return false;
    selectRadio(target, group);
    return true;
  }
  function autoSetAccuracyFromLabels() {
    if (!store.groundTruth || !store.modelPrediction) return;
    if (store.modelPrediction === "Truncated") {
      setAccuracy("Flawed");
      return;
    }
    setAccuracy(store.groundTruth === store.modelPrediction ? "Accurate" : "Flawed");
  }
  function applyGroundTruthFromVideoId(videoId) {
    const inferred = inferGroundTruth(videoId);
    if (!inferred) return;
    if (setRadioValue("gt", inferred)) {
      autoSetAccuracyFromLabels();
    }
  }
  function applyPredictionFromOutput(outputText) {
    const inferred = inferPrediction(outputText);
    if (!inferred) return;
    if (setRadioValue("pred", inferred)) {
      autoSetAccuracyFromLabels();
    }
  }
  function applyErrorTagsFromOutput(outputText) {
    const tags = inferErrorTags(outputText);
    if (store.currentAccuracy === "Accurate") return;
    document.querySelectorAll('#error-checkboxes input[type="checkbox"]').forEach((cb) => {
      const shouldCheck = tags.includes(cb.value);
      if (shouldCheck !== cb.checked) {
        cb.checked = shouldCheck;
        toggleCheckStyle(cb);
      }
    });
  }
  function analyzeModelOutput(text) {
    if (!text.trim()) return;
    applyPredictionFromOutput(text);
    applyErrorTagsFromOutput(text);
    const status = document.getElementById("output-status");
    if (status && status.textContent.includes("awaiting")) {
      status.textContent = "pasted";
      status.style.color = "var(--blue)";
    }
  }
  function selectRadio(el, group) {
    document.querySelectorAll(`[data-group="${group}"]`).forEach((btn) => {
      btn.className = "radio-btn";
    });
    const val = el.dataset.val;
    if (val === "Success") el.classList.add("selected-success");
    else if (val === "Failure") el.classList.add("selected-failure");
    else if (val === "Truncated") el.classList.add("selected-truncated");
    if (group === "gt") store.groundTruth = val;
    if (group === "pred") store.modelPrediction = val;
    autoSetAccuracyFromLabels();
  }
  function setAccuracy(val) {
    store.currentAccuracy = val;
    document.getElementById("btn-accurate").className = "acc-btn" + (val === "Accurate" ? " acc-accurate" : "");
    document.getElementById("btn-flawed").className = "acc-btn" + (val === "Flawed" ? " acc-flawed" : "");
  }
  function toggleCheckStyle(input) {
    const label = input.closest("label");
    if (input.checked) label.classList.add("checked");
    else label.classList.remove("checked");
  }
  function syncPromptPreview() {
    const val = document.getElementById("prompt-text").value.trim();
    const el = document.getElementById("prompt-preview");
    if (!el) return;
    el.innerHTML = val ? `<span style="color:var(--text-primary);">${escapeHtml(val)}</span>` : `<em style="color:var(--surface-4);">Enter a prompt in the left panel\u2026</em>`;
  }
  function loadLogToWorkbench(vidId, gtLabel) {
    if (window.closeCompareModal) window.closeCompareModal();
    switchTab("evaluate");
    document.getElementById("video-id").value = vidId;
    if (gtLabel) {
      setRadioValue("gt", gtLabel);
    }
    const dropZone = document.getElementById("drop-zone");
    dropZone.style.borderColor = "var(--blue)";
    dropZone.style.background = "rgba(56, 189, 248, 0.1)";
    setTimeout(() => {
      dropZone.style.borderColor = "";
      dropZone.style.background = "";
    }, 1500);
    showToast(`Loaded ${vidId}. Drop the original MP4 file into the upload zone above to watch it.`, "info");
  }
  async function runModel() {
    const video = document.getElementById("video-player");
    const apiKey = document.getElementById("api-key").value.trim();
    const model = document.getElementById("model-select").value.trim();
    const userPrompt = document.getElementById("prompt-text").value.trim();
    const numFrames = Math.max(1, Math.min(200, parseInt(document.getElementById("frame-count").value) || 8));
    if (!apiKey) {
      showToast("Enter your API key first.", "warn");
      return;
    }
    if (!model) {
      showToast("Select or type a model name.", "warn");
      return;
    }
    if (!userPrompt) {
      showToast("Write a prompt first.", "warn");
      return;
    }
    if (!video.src || video.readyState < 1) {
      showToast("Upload a video file first.", "warn");
      return;
    }
    setRunLoading(true);
    document.getElementById("model-output").value = "";
    document.getElementById("output-status").innerHTML = '<span style="display:flex; align-items:center; gap:4px;"><i data-lucide="loader-2" class="w-3 h-3 spin"></i> running\u2026</span>';
    document.getElementById("output-status").style.color = "var(--yellow)";
    lucide.createIcons();
    try {
      showToast(`Extracting ${numFrames} frames\u2026`, "info");
      const frames = await extractFrames(video, numFrames);
      const vidDuration = video.duration.toFixed(1);
      showToast(`Calling ${model}\u2026`, "info");
      const output = await runInference({ apiKey, model, prompt: userPrompt, frames, numFrames, vidDuration });
      document.getElementById("model-output").value = output;
      document.getElementById("model-output").scrollTop = 0;
      applyPredictionFromOutput(output);
      document.getElementById("output-status").innerHTML = `<span style="display:flex; align-items:center; gap:4px;"><i data-lucide="check" class="w-3 h-3"></i> Output from ${model}</span>`;
      document.getElementById("output-status").style.color = "var(--green)";
      lucide.createIcons();
      showToast("Response received \u2014 review and score below.", "ok");
    } catch (err) {
      document.getElementById("model-output").value = `[Error] ${err.message}`;
      document.getElementById("output-status").innerHTML = `<span style="display:flex; align-items:center; gap:4px;"><i data-lucide="x" class="w-3 h-3"></i> Error</span>`;
      document.getElementById("output-status").style.color = "var(--red)";
      lucide.createIcons();
      showToast(`${err.message}`, "warn");
    } finally {
      setRunLoading(false);
    }
  }
  function setRunLoading(on) {
    const btn = document.getElementById("run-model-btn");
    btn.disabled = on;
    btn.innerHTML = on ? '<span style="display:flex; align-items:center; gap:6px;"><i data-lucide="loader-2" class="w-4 h-4 spin"></i> Running\u2026</span>' : '<span style="display:flex; align-items:center; gap:6px;"><i data-lucide="play" class="w-4 h-4"></i> Run Model</span>';
    lucide.createIcons();
  }

  // js/services/import.js
  function parseImportFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const data = JSON.parse(e.target.result);
          let importedEvals = [];
          if (Array.isArray(data)) importedEvals = data;
          else if (data && Array.isArray(data.evaluations)) importedEvals = data.evaluations;
          else throw new Error("Invalid JSON format.");
          if (importedEvals.length === 0) {
            reject(new Error("JSON file contains no evaluations."));
            return;
          }
          importedEvals.forEach((ev, i) => ev.seq = i + 1);
          resolve(importedEvals);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error("Could not read file."));
      reader.readAsText(file);
    });
  }

  // js/services/export.js
  function exportEvaluationsJSON(evaluations) {
    const payload = { exportedAt: (/* @__PURE__ */ new Date()).toISOString(), totalEvaluations: evaluations.length, evaluations };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    downloadBlob(blob, `video-llm-eval-${dateStamp()}.json`);
  }
  function exportEvaluationsCSV(evaluations) {
    const headers = ["#", "Video ID", "Model", "Prompt", "Ground Truth", "Model Prediction", "Accuracy", "Error Tags", "Notes", "Timestamp"];
    const rows = evaluations.map((e) => [e.seq, csvEsc(e.videoId), csvEsc(e.modelName), csvEsc(e.promptText), e.groundTruth, e.modelPrediction, e.accuracy, csvEsc(e.errorTags.join("; ")), csvEsc(e.notes), csvEsc(e.timestamp)]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    downloadBlob(blob, `video-llm-eval-${dateStamp()}.csv`);
  }

  // js/state/actions.js
  function renderAll() {
    renderTable();
    updateMetrics();
    renderInsights();
    renderSessionsTab();
  }
  function submitEvaluation() {
    const videoId = document.getElementById("video-id").value.trim();
    const modelName = document.getElementById("model-select").value.trim();
    const promptText = document.getElementById("prompt-text").value.trim();
    const modelOutput = document.getElementById("model-output").value.trim();
    const notes = document.getElementById("reviewer-notes").value.trim();
    if (!videoId) {
      showToast("Please enter a Video ID or filename.", "warn");
      return;
    }
    if (!modelName) {
      showToast("Please enter the Model Name.", "warn");
      return;
    }
    if (!store.groundTruth) {
      showToast("Please select a Ground Truth label.", "warn");
      return;
    }
    if (!store.modelPrediction) {
      showToast("Please select a Model Prediction.", "warn");
      return;
    }
    if (!store.currentAccuracy) {
      showToast("Please set the Final Accuracy Verdict.", "warn");
      return;
    }
    const errorTags = [];
    document.querySelectorAll('#error-checkboxes input[type="checkbox"]:checked').forEach((cb) => {
      errorTags.push(cb.value);
    });
    const entry = {
      id: Date.now(),
      seq: store.evaluations.length + 1,
      videoId,
      modelName,
      promptText,
      modelOutput,
      groundTruth: store.groundTruth,
      modelPrediction: store.modelPrediction,
      accuracy: store.currentAccuracy,
      errorTags,
      notes,
      timestamp: (/* @__PURE__ */ new Date()).toLocaleString()
    };
    store.evaluations.push(entry);
    saveSessions();
    renderAll();
    showToast(`Evaluation #${entry.seq} logged.`, "ok");
    resetForm();
  }
  function resetForm() {
    document.getElementById("video-id").value = "";
    document.getElementById("model-output").value = "";
    document.getElementById("reviewer-notes").value = "";
    const status = document.getElementById("output-status");
    status.textContent = "awaiting run\u2026";
    status.style.color = "";
    store.currentAccuracy = null;
    store.groundTruth = null;
    store.modelPrediction = null;
    document.querySelectorAll("[data-group]").forEach((btn) => btn.className = "radio-btn");
    document.getElementById("btn-accurate").className = "acc-btn";
    document.getElementById("btn-flawed").className = "acc-btn";
    document.querySelectorAll('#error-checkboxes input[type="checkbox"]').forEach((cb) => {
      cb.checked = false;
      cb.closest("label").classList.remove("checked");
    });
  }
  function renameVideoId(el) {
    const id = parseInt(el.dataset.id);
    const newName = el.textContent.trim();
    const entry = store.evaluations.find((e) => e.id === id);
    if (!entry) return;
    if (!newName) {
      el.textContent = entry.videoId;
      return;
    }
    entry.videoId = newName;
    getCurrentSession().evaluations = store.evaluations;
    saveSessions();
  }
  function deleteEntry(id) {
    store.evaluations = store.evaluations.filter((e) => e.id !== id);
    store.evaluations.forEach((e, i) => e.seq = i + 1);
    getCurrentSession().evaluations = store.evaluations;
    saveSessions();
    renderAll();
    showToast("Entry deleted.", "info");
  }
  function newSession() {
    const s = makeSession(defaultSessionName());
    store.allSessions.push(s);
    store.currentSessionId = s.id;
    store.evaluations = s.evaluations;
    saveSessions();
    renderAll();
    updateSessionIndicator();
    resetForm();
    showToast(`Started \u201C${s.name}\u201D`, "ok");
  }
  function loadSession(id) {
    store.currentSessionId = id;
    store.evaluations = getCurrentSession().evaluations;
    saveSessions();
    renderAll();
    updateSessionIndicator();
    switchTab("evaluate");
    showToast(`Loaded \u201C${getCurrentSession().name}\u201D`, "ok");
  }
  function deleteSession(id) {
    if (store.allSessions.length <= 1) {
      showToast("Cannot delete the only session.", "warn");
      return;
    }
    const name = store.allSessions.find((s) => s.id === id)?.name || "session";
    if (!confirm(`Delete \u201C${name}\u201D and all its evaluations? This cannot be undone.`)) return;
    store.allSessions = store.allSessions.filter((s) => s.id !== id);
    if (store.currentSessionId === id) {
      store.currentSessionId = store.allSessions[store.allSessions.length - 1].id;
      store.evaluations = getCurrentSession().evaluations;
    }
    saveSessions();
    renderAll();
    updateSessionIndicator();
    showToast(`\u201C${name}\u201D deleted.`, "info");
  }
  function renameSession(name) {
    if (!name.trim()) return;
    getCurrentSession().name = name.trim();
    saveSessions();
    renderSessionsTab();
  }
  function importJSON(event) {
    const file = event.target.files[0];
    if (!file) return;
    parseImportFile(file).then((importedEvals) => {
      const sessionName = file.name.replace(".json", "") + " (Imported)";
      const s = makeSession(sessionName);
      s.evaluations = importedEvals;
      store.allSessions.push(s);
      store.currentSessionId = s.id;
      store.evaluations = s.evaluations;
      saveSessions();
      renderAll();
      updateSessionIndicator();
      showToast(`Successfully imported ${importedEvals.length} evaluations.`, "ok");
    }).catch((err) => showToast(`Failed to import: ${err.message}`, "warn")).finally(() => {
      event.target.value = "";
    });
  }
  function exportJSON() {
    if (store.evaluations.length === 0) {
      showToast("No data to export yet.", "warn");
      return;
    }
    exportEvaluationsJSON(store.evaluations);
    showToast(`Exported ${store.evaluations.length} evaluations as JSON.`, "ok");
  }
  function exportCSV() {
    if (store.evaluations.length === 0) {
      showToast("No data to export yet.", "warn");
      return;
    }
    exportEvaluationsCSV(store.evaluations);
    showToast(`Exported ${store.evaluations.length} evaluations as CSV.`, "ok");
  }
  function loadSavedApiKey() {
    const saved = loadApiKey();
    if (saved) document.getElementById("api-key").value = saved;
    updateProviderBadge();
  }
  function handleApiKeyInput(value) {
    saveApiKey(value);
    updateProviderBadge();
  }

  // js/main.js
  Object.assign(window, {
    // tabs / header
    switchTab,
    renameSession,
    updateProviderBadge,
    handleApiKeyInput,
    // evaluate workbench
    handleFileUpload,
    updateFrameCalc,
    clearVideoUpload,
    applyGroundTruthFromVideoId,
    analyzeModelOutput,
    selectRadio,
    setAccuracy,
    toggleCheckStyle,
    syncPromptPreview,
    loadLogToWorkbench,
    runModel,
    // evaluation crud
    submitEvaluation,
    resetForm,
    renameVideoId,
    deleteEntry,
    // sessions
    newSession,
    loadSession,
    deleteSession,
    openCompareModal,
    closeCompareModal,
    // import / export
    importJSON,
    exportJSON,
    exportCSV
  });
  function init() {
    lucide.createIcons();
    initDropZone();
    loadSessions();
    loadSavedApiKey();
    renderTable();
    updateMetrics();
    renderInsights();
    renderSessionsTab();
    updateSessionIndicator();
    if (store.storageWarning) showToast(store.storageWarning, "warn", 8e3);
    else if (location.protocol === "file:") {
      showToast(
        "Opened as a local file. Sessions are stored per browser URL \u2014 if data looks missing, open the app the same way you did before (e.g. editor preview) and use Export JSON, or run serve.ps1 for a stable local URL.",
        "info",
        1e4
      );
    }
  }
  init();
})();
