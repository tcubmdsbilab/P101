const config = window.P101_CONFIG || {};
const sessionId = getOrCreateSessionId();
let loadedCounters = new Map();

function getOrCreateSessionId() {
  const key = "P101_SBI_SESSION_ID";
  let existing = localStorage.getItem(key);
  if (!existing) {
    existing = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(key, existing);
  }
  return existing;
}

async function apiCall(action, payload = {}) {
  if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) {
    throw new Error("尚未設定 config.js，請由 config.sample.js 複製並填入 Supabase URL 與 anon key。");
  }

  const functionName = config.COUNTER_FUNCTION || "P101_increment_counter";
  const endpoint = `${config.SUPABASE_URL.replace(/\/$/, "")}/functions/v1/${functionName}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${config.SUPABASE_ANON_KEY}`,
      "apikey": config.SUPABASE_ANON_KEY
    },
    body: JSON.stringify({ action, ...payload })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.error) {
    throw new Error(data.error || data.message || `HTTP ${response.status}`);
  }
  return data;
}

function normalizeProjects(projects = [], counters = []) {
  loadedCounters = new Map((counters || []).map(row => [row.counter_key, row.view_count]));
  return projects.map(project => ({
    ...project,
    versions: (project.versions || []).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  })).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

function getLatestVersion(project) {
  return (project.versions || []).find(v => v.is_latest) || (project.versions || [])[0] || null;
}

function counterValue(counterKey) {
  const value = loadedCounters.get(counterKey);
  return Number(value || 0).toLocaleString("zh-Hant-TW");
}

function updateCounterDisplay(counterKeyValue, value) {
  loadedCounters.set(counterKeyValue, value);
  document.querySelectorAll(`[data-counter="${counterKeyValue}"]`).forEach(el => {
    el.textContent = Number(value || 0).toLocaleString("zh-Hant-TW");
  });
}

function renderProjects(projects) {
  const list = document.getElementById("projectList");
  if (!projects.length) {
    list.innerHTML = `<div class="loading-card">目前尚無啟用中的學生作品。</div>`;
    return;
  }

  list.innerHTML = projects.map(project => {
    const latest = getLatestVersion(project);
    const latestUrl = latest?.target_url || "#";
    const latestCounterKey = latest?.counter_key || `${project.project_code}_V01`;
    const titleText = `${project.project_code} ${project.project_name}`;
    const versions = project.versions || [];
    const historyLabel = project.history_label || "目前為第一版";

    const versionsHtml = versions.map(v => `
      <div class="version-row">
        <a href="${v.target_url || '#'}" data-track-link data-counter-key="${v.counter_key}" target="_blank" rel="noopener noreferrer">
          ${v.version_label || v.version_code} ${project.project_code} ${project.project_name}
        </a>
        <span class="version-note">${v.version_note || ""}</span>
        <span class="version-count">點閱數：<strong data-counter="${v.counter_key}">${counterValue(v.counter_key)}</strong></span>
      </div>
    `).join("");

    return `
      <article class="project-item">
        <div class="project-header">
          <div class="project-title-wrap">
            <span class="project-code">${project.project_code}</span>
            <a class="project-title" href="${latestUrl}" data-track-link data-counter-key="${latestCounterKey}" target="_blank" rel="noopener noreferrer">
              ${project.project_name}
            </a>
          </div>
          <span class="counter-pill">點閱數：<strong data-counter="${latestCounterKey}">${counterValue(latestCounterKey)}</strong></span>
        </div>
        <p class="project-description">${project.short_description || ""}</p>
        <details class="version-details">
          <summary>歷史版本</summary>
          <div class="version-list">
            <div class="version-row"><span class="version-note">${historyLabel}</span></div>
            ${versionsHtml}
          </div>
        </details>
      </article>
    `;
  }).join("");
}

async function loadProjects() {
  const list = document.getElementById("projectList");
  try {
    const data = await apiCall("list_projects");
    const projects = normalizeProjects(data.projects || [], data.counters || []);
    renderProjects(projects);
    bindTrackingLinks();
  } catch (error) {
    console.error("讀取學生作品失敗：", error);
    list.innerHTML = `<div class="loading-card">讀取學生作品失敗：${error.message}</div>`;
  }
}

async function incrementCounter(counterKeyValue, targetType) {
  const data = await apiCall("increment", {
    counter_key: counterKeyValue,
    target_type: targetType,
    referrer: document.referrer || null,
    session_id: sessionId
  });
  if (data.counter) updateCounterDisplay(data.counter.counter_key, data.counter.view_count);
}

function bindTrackingLinks() {
  document.querySelectorAll("[data-track-link]").forEach(link => {
    link.addEventListener("click", async event => {
      const url = link.getAttribute("href");
      const key = link.dataset.counterKey;
      event.preventDefault();
      try {
        await incrementCounter(key, "version");
      } catch (error) {
        alert(`點閱數更新失敗：${error.message}`);
      } finally {
        if (url && url !== "#") window.open(url, "_blank", "noopener,noreferrer");
      }
    });
  });
}

async function init() {
  await loadProjects();
  try {
    await incrementCounter("P101_MAIN_PAGE", "page");
  } catch (error) {
    console.warn("主頁點閱更新失敗：", error.message);
  }
}

init();
