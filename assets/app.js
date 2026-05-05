(function(){
  const COUNTER_KEYS = ["P101_MAIN_PAGE", "P101_V01", "P101_V02"];
  const KEY_LABELS = {
    P101_MAIN_PAGE: "主頁",
    P101_V01: "P101 V01",
    P101_V02: "P101 V02"
  };

  const statusEl = document.getElementById("systemStatus");
  const sessionId = getOrCreateSessionId();

  function setStatus(message, type){
    if(!statusEl) return;
    statusEl.textContent = message;
    statusEl.classList.remove("ok", "error");
    if(type) statusEl.classList.add(type);
  }

  function getOrCreateSessionId(){
    const key = "SBI_LAB_SESSION_ID";
    let value = localStorage.getItem(key);
    if(!value){
      value = (crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2);
      localStorage.setItem(key, value);
    }
    return value;
  }

  function getClient(){
    if(!window.SBI_CONFIG){
      throw new Error("找不到 config.js 或 window.SBI_CONFIG。請確認已將 config.example.js 複製為 config.js。 ");
    }
    const url = window.SBI_CONFIG.SUPABASE_URL;
    const key = window.SBI_CONFIG.SUPABASE_ANON_KEY;
    if(!url || !key || url.includes("YOUR_PROJECT_ID") || key.includes("YOUR_SUPABASE")){
      throw new Error("config.js 尚未填入 Supabase URL 或 anon key。 ");
    }
    if(!window.supabase || !window.supabase.createClient){
      throw new Error("Supabase JS CDN 尚未載入。請確認網路可連到 jsdelivr。 ");
    }
    return window.supabase.createClient(url, key);
  }

  async function loadCounts(client){
    const { data, error } = await client
      .from("TblP101Counters")
      .select("counter_key, view_count")
      .in("counter_key", COUNTER_KEYS);

    if(error) throw error;
    updateCountUI(data || []);
  }

  function updateCountUI(rows){
    const map = new Map(rows.map(r => [r.counter_key, r.view_count]));
    setText("mainPageCount", map.get("P101_MAIN_PAGE") ?? 0);
    setText("count-P101_V01", map.get("P101_V01") ?? 0);
    setText("count-P101_V02", map.get("P101_V02") ?? 0);
    const total = Number(map.get("P101_V01") ?? 0) + Number(map.get("P101_V02") ?? 0);
    setText("p101TotalCount", total);
  }

  function setText(id, value){
    const el = document.getElementById(id);
    if(el) el.textContent = value;
  }

  async function increment(client, counterKey){
    const { data, error } = await client.rpc("p101_increment_counter", {
      p_counter_key: counterKey,
      p_referrer: document.referrer || null,
      p_session_id: sessionId
    });
    if(error) throw error;
    if(Array.isArray(data) && data.length > 0){
      await loadCounts(client);
    }
  }

  async function init(){
    try{
      setStatus("SBI Lab counter v4 clean 已載入，正在連線 Supabase……");
      const client = getClient();
      await increment(client, "P101_MAIN_PAGE");
      await loadCounts(client);
      setStatus("點閱數系統已正常連線。", "ok");

      document.querySelectorAll(".version-item[data-counter-key]").forEach(link => {
        link.addEventListener("click", async function(event){
          event.preventDefault();
          const counterKey = this.dataset.counterKey;
          const externalUrl = this.dataset.externalUrl;
          try{
            setStatus(`正在記錄 ${KEY_LABELS[counterKey] || counterKey} 點閱……`);
            await increment(client, counterKey);
            setStatus(`${KEY_LABELS[counterKey] || counterKey} 點閱已記錄。`, "ok");
            if(externalUrl && externalUrl !== "#"){
              window.open(externalUrl, "_blank", "noopener");
            }
          }catch(err){
            console.error(err);
            setStatus("點閱數更新失敗：" + formatError(err), "error");
            if(externalUrl && externalUrl !== "#"){
              window.open(externalUrl, "_blank", "noopener");
            }
          }
        });
      });
    }catch(err){
      console.error(err);
      setStatus("點閱數初始化失敗：" + formatError(err), "error");
    }
  }

  function formatError(err){
    if(!err) return "未知錯誤";
    const parts = [err.message, err.details, err.hint, err.code].filter(Boolean);
    return parts.join("｜") || String(err);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
