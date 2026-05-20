// P101_increment_counter
// Supabase Dashboard 可直接貼上版：不使用 _shared，不使用 CLI/npx deploy。
// Environment variables required in Supabase Edge Function runtime:
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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse({ error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" }, 500);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const body = await req.json().catch(() => ({}));
    const action = body.action || "increment";

    if (action === "list_counters") {
      const { data, error } = await supabase
        .from("P101_ViewCounters")
        .select("counter_key, project_code, version_code, target_type, title, target_url, view_count, updated_at")
        .order("counter_key", { ascending: true });

      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse({ counters: data || [] });
    }

    if (action !== "increment") {
      return jsonResponse({ error: "Unknown action" }, 400);
    }

    const counterKey = String(body.counter_key || "").trim();
    const targetType = String(body.target_type || "version").trim();
    const referrer = body.referrer ? String(body.referrer).slice(0, 1000) : null;
    const sessionId = body.session_id ? String(body.session_id).slice(0, 120) : null;
    const userAgent = req.headers.get("user-agent");
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;

    if (!counterKey) return jsonResponse({ error: "Missing counter_key" }, 400);
    if (!["page", "version"].includes(targetType)) {
      return jsonResponse({ error: "Invalid target_type" }, 400);
    }

    const { data: current, error: readError } = await supabase
      .from("P101_ViewCounters")
      .select("counter_key, view_count")
      .eq("counter_key", counterKey)
      .single();

    if (readError || !current) {
      return jsonResponse({ error: `Counter not found: ${counterKey}` }, 404);
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

    if (eventError) {
      return jsonResponse({ error: eventError.message }, 500);
    }

    return jsonResponse({ counter: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonResponse({ error: message }, 500);
  }
});
