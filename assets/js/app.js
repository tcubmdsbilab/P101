const projects = [
  {
    code: "P101",
    title: "校園空間查詢系統",
    description: "協助新生、訪客與校內成員快速查詢校園空間資訊，作為經營管理與空間服務設計的學生專題成果。",
    latest: "V01",
    url: "https://liu-ming-yi.github.io/CampusMap01",
    versions: [
      { version: "目前為第一版", url: "https://liu-ming-yi.github.io/CampusMap01", note: "P101 校園空間查詢系統" }
    ]
  },
  {
    code: "P104",
    title: "WhisperTour",
    description: "用於須小聲導覽的空間。導遊和遊客都使用自己的手機，掃描 QRCode 即可開始連線導覽。",
    latest: "V01",
    url: "https://bagilu.github.io/P104/",
    versions: [
      { version: "目前為第一版", url: "https://bagilu.github.io/P104/", note: "P104 WhisperTour" }
    ]
  },
  {
    code: "P02",
    title: "腦力激盪系統",
    description: "教師可隨時出題，請同學回答，教師可依需求選擇同學匿名或顯示姓名，降低同學的發言壓力。",
    latest: "V01",
    url: "https://bagilu.github.io/P02V3/",
    versions: [
      { version: "目前為第一版", url: "https://bagilu.github.io/P02V3/", note: "P02 腦力激盪系統" }
    ]
  }
];

const config = window.P101_CONFIG || {};
const sessionId = getOrCreateSessionId();

function getOrCreateSessionId() {
  const key = "P101_SBI_SESSION_ID";
  let existing = localStorage.getItem(key);
  if (!existing) {
    existing = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(key, existing);
  }
  return existing;
}

function counterKey(projectCode, version) {
  return `${projectCode}_${version}`;
}

function renderProjects() {
  const list = document.getElementById("projectGrid");
  list.innerHTML = projects.map(project => {
    const latest = project.versions.find(v => v.version === "目前為第一版") || project.versions.at(-1);
    const latestKey = counterKey(project.code, project.latest);
    const panelId = `history-${project.code}`;
    const versionsHtml = project.versions.map(v => {
      return `
        <div class="version-row">
          <a href="${v.url}" data-track-link data-counter-key="${latestKey}" target="_blank" rel="noopener noreferrer">${v.version}</a>
          <span class="version-note">${v.note}</span>
        </div>`;
    }).join("");

    return `
      <article class="project-list-item">
        <div class="project-title-line">
          <h3><span class="project-code">${project.code}</span> <a href="${project.url}" data-track-link data-counter-key="${latestKey}" target="_blank" rel="noopener noreferrer">${project.title}</a></h3>
          <span class="counter-pill">點閱數：<strong data-counter="${latestKey}">—</strong></span>
        </div>
        <p class="project-description">${project.description}</p>
        <details class="history-details" id="${panelId}">
          <summary>歷史版本</summary>
          <div class="version-list">${versionsHtml}</div>
        </details>
      </article>`;
  }).join("");
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

function updateCounterDisplay(counterKeyValue, value) {
  document.querySelectorAll(`[data-counter="${counterKeyValue}"]`).forEach(el => {
    el.textContent = Number(value || 0).toLocaleString("zh-Hant-TW");
  });
}

async function loadCounters() {
  try {
    const data = await apiCall("list_counters");
    (data.counters || []).forEach(row => updateCounterDisplay(row.counter_key, row.view_count));
  } catch (error) {
    console.warn("讀取點閱數失敗：", error.message);
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
  renderProjects();
  bindTrackingLinks();
  await loadCounters();
  try {
    await incrementCounter("P101_MAIN_PAGE", "page");
  } catch (error) {
    console.warn("主頁點閱更新失敗：", error.message);
  }
}

init();
