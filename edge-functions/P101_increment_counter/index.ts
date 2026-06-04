// P101_increment_counter
// Supabase Dashboard 可直接貼上版：不使用 _shared，不使用 CLI/npx deploy。
// Required Edge Function secrets:
// SUPABASE_URL
// SUPABASE_SERVICE_ROLE_KEY

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

function createAdminClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const supabase = createAdminClient();
    const body = await req.json().catch(() => ({}));
    const action = body.action || "increment";

    if (action === "list_projects") {
      const { data: projects, error: projectError } = await supabase
        .from("P101_Projects")
        .select("project_code, project_name, short_description, history_label, sort_order, is_active")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (projectError) return jsonResponse({ error: projectError.message }, 500);

      const { data: versions, error: versionError } = await supabase
        .from("P101_ProjectVersions")
        .select("version_key, project_code, version_code, version_label, version_note, target_url, counter_key, is_latest, sort_order, is_active")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (versionError) return jsonResponse({ error: versionError.message }, 500);

      const { data: counters, error: counterError } = await supabase
        .from("P101_ViewCounters")
        .select("counter_key, view_count");

      if (counterError) return jsonResponse({ error: counterError.message }, 500);

      const versionGroups = new Map<string, unknown[]>();
      for (const version of versions || []) {
        const list = versionGroups.get(version.project_code) || [];
        list.push(version);
        versionGroups.set(version.project_code, list);
      }

      const merged = (projects || []).map((project) => ({
        ...project,
        versions: versionGroups.get(project.project_code) || [],
      }));

      return jsonResponse({ projects: merged, counters: counters || [] });
    }

    if (action === "list_counters") {
      const { data, error } = await supabase
        .from("P101_ViewCounters")
        .select("counter_key, project_code, version_key, target_type, title, target_url, view_count, updated_at")
        .order("counter_key", { ascending: true });

      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse({ counters: data || [] });
    }

    if (action !== "increment") return jsonResponse({ error: "Unknown action" }, 400);

    const counterKey = String(body.counter_key || "").trim();
    const targetType = String(body.target_type || "version").trim();
    const referrer = body.referrer ? String(body.referrer).slice(0, 1000) : null;
    const sessionId = body.session_id ? String(body.session_id).slice(0, 120) : null;
    const userAgent = req.headers.get("user-agent");
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;

    if (!counterKey) return jsonResponse({ error: "Missing counter_key" }, 400);
    if (!["page", "version"].includes(targetType)) return jsonResponse({ error: "Invalid target_type" }, 400);

    let { data: current, error: readError } = await supabase
      .from("P101_ViewCounters")
      .select("counter_key, project_code, version_key, target_type, title, target_url, view_count")
      .eq("counter_key", counterKey)
      .maybeSingle();

    if (readError) return jsonResponse({ error: readError.message }, 500);

    // 防呆：如果未來新增版本時忘記先建立 counter，系統會自動建立基本 counter。
    if (!current) {
      const { data: inserted, error: insertCounterError } = await supabase
        .from("P101_ViewCounters")
        .insert({
          counter_key: counterKey,
          project_code: counterKey.split("_")[0] || "P101",
          version_key: null,
          target_type: targetType,
          title: counterKey,
          target_url: null,
          view_count: 0,
        })
        .select("counter_key, project_code, version_key, target_type, title, target_url, view_count")
        .single();

      if (insertCounterError) return jsonResponse({ error: insertCounterError.message }, 500);
      current = inserted;
    }

    const nextCount = Number(current.view_count || 0) + 1;

    const { data: updated, error: updateError } = await supabase
      .from("P101_ViewCounters")
      .update({ view_count: nextCount, updated_at: new Date().toISOString() })
      .eq("counter_key", counterKey)
      .select("counter_key, view_count")
      .single();

    if (updateError) return jsonResponse({ error: updateError.message }, 500);

    const { error: eventError } = await supabase
      .from("P101_ViewEvents")
      .insert({
        counter_key: counterKey,
        target_type: targetType,
        referrer,
        session_id: sessionId,
        user_agent: userAgent,
        ip_address: ipAddress,
      });

    // 點閱數已更新；事件紀錄若失敗，只回傳 warning，不讓前端整體失敗。
    if (eventError) {
      return jsonResponse({ counter: updated, warning: eventError.message });
    }

    return jsonResponse({ counter: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonResponse({ error: message }, 500);
  }
});
