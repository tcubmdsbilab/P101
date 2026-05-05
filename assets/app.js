const PROJECTS = [
  {
    code: "P101",
    title: "校園空間查詢系統",
    desc: "提供校園空間快速查詢，協助新生、訪客與師生辨識空間名稱、位置與用途。",
    latestVersion: "V02",
    versions: [
      { version: "V01", label: "初版展示", url: "#", counterKey: "P101_VERSION_V01" },
      { version: "V02", label: "最新版", url: "https://liu-ming-yi.github.io/CampusMap01", counterKey: "P101_VERSION_V02" }
    ]
  }
];

const PAGE_COUNTER_KEY = "P101_MAIN_PAGE";
const counters = new Map();
let supabaseClient = null;

function getSessionId() {
  const key = "sbi_lab_session_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2);
    localStorage.setItem(key, id);
  }
  return id;
}

function setStatus(message) {
  const el = document.querySelector("#status");
  if (el) el.textContent = message || "";
}

function initSupabase() {
  if (!window.SBI_CONFIG || !window.SBI_CONFIG.SUPABASE_URL || window.SBI_CONFIG.SUPABASE_URL.includes("YOUR_PROJECT_ID")) {
    setStatus("尚未設定 Supabase。請複製 config.example.js 為 config.js，並填入 SUPABASE_URL 與 SUPABASE_ANON_KEY。");
    return null;
  }
  supabaseClient = window.supabase.createClient(window.SBI_CONFIG.SUPABASE_URL, window.SBI_CONFIG.SUPABASE_ANON_KEY);
  return supabaseClient;
}

async function incrementCounter(counterKey) {
  if (!supabaseClient) return null;
  const rpcName = window.SBI_CONFIG.COUNTER_RPC || "p101_increment_counter";
  const { data, error } = await supabaseClient.rpc(rpcName, {
    p_counter_key: counterKey,
    p_session_id: getSessionId(),
    p_referrer: document.referrer || null
  });
  if (error) {
    console.error("P101 RPC error:", error);
    const detail = [error.message, error.details, error.hint, error.code].filter(Boolean).join("｜");
    setStatus("點閱數更新失敗：" + detail);
    return null;
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (row && row.counter_key) {
    counters.set(row.counter_key, Number(row.view_count || 0));
    updateCounterDisplay(row.counter_key, row.view_count);
  }
  return row;
}

async function loadCounters() {
  if (!supabaseClient) return;
  const keys = [PAGE_COUNTER_KEY, ...PROJECTS.flatMap(p => p.versions.map(v => v.counterKey))];
  const { data, error } = await supabaseClient
    .from("TblP101ViewCounters")
    .select("counter_key, view_count")
    .in("counter_key", keys);

  if (error) {
    console.error("P101 load counter error:", error);
    const detail = [error.message, error.details, error.hint, error.code].filter(Boolean).join("｜");
    setStatus("點閱數讀取失敗：" + detail);
    return;
  }
  data.forEach(row => {
    counters.set(row.counter_key, Number(row.view_count || 0));
    updateCounterDisplay(row.counter_key, row.view_count);
  });
}

function updateCounterDisplay(counterKey, value) {
  document.querySelectorAll(`[data-counter="${counterKey}"]`).forEach(el => {
    el.textContent = Number(value || 0).toLocaleString("zh-TW");
  });
}

function renderProjects() {
  const root = document.querySelector("#projects");
  root.innerHTML = PROJECTS.map(project => {
    const latest = project.versions.find(v => v.version === project.latestVersion);
    return `
      <article class="project-card">
        <div class="project-visual" aria-hidden="true"></div>
        <div class="project-body">
          <div class="project-code">${project.code}</div>
          <h3 class="project-title">${project.title}</h3>
          <p class="project-desc">${project.desc}</p>
          <div class="actions">
            <a class="btn primary js-track-link" href="${latest.url}" data-counter-key="${latest.counterKey}" target="_blank" rel="noopener noreferrer">
              開啟最新版 ${latest.version}
            </a>
          </div>
          <div class="version-list">
            ${project.versions.map(v => `
              <div class="version-row">
                <a class="js-track-link" href="${v.url}" data-counter-key="${v.counterKey}" target="_blank" rel="noopener noreferrer">
                  ${v.version}｜${v.label}
                </a>
                <span class="small-counter">點閱 <span data-counter="${v.counterKey}">0</span> 次</span>
              </div>
            `).join("")}
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function bindTrackLinks() {
  document.querySelectorAll(".js-track-link").forEach(link => {
    link.addEventListener("click", async event => {
      const url = link.getAttribute("href");
      const counterKey = link.dataset.counterKey;
      if (!url || url === "#") {
        event.preventDefault();
        setStatus("此版本尚未設定正式網址。若要啟用，請在 assets/app.js 填入 URL。 ");
        return;
      }
      event.preventDefault();
      await incrementCounter(counterKey);
      window.open(url, "_blank", "noopener,noreferrer");
    });
  });
}

async function main() {
  renderProjects();
  bindTrackLinks();
  initSupabase();
  await loadCounters();
  await incrementCounter(PAGE_COUNTER_KEY);
}

document.addEventListener("DOMContentLoaded", main);
