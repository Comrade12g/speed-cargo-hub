import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const allowedOrigins = new Set(["https://speedcargogh.com", "https://www.speedcargogh.com"]);
const attempts = new Map<string, { count: number; resetAt: number }>();

function corsHeaders(origin: string | null) {
  const allowed = origin && (allowedOrigins.has(origin) || origin.startsWith("http://localhost:") || origin.endsWith(".dyad.app"));
  return {
    "Access-Control-Allow-Origin": allowed ? origin : "https://speedcargogh.com",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Vary": "Origin",
  };
}

serve(async (req) => {
  const origin = req.headers.get("Origin");
  const headers = { ...corsHeaders(origin), "Content-Type": "application/json" };
  if (req.method === "OPTIONS") return new Response(null, { headers });
  if (req.method !== "GET") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const current = attempts.get(ip);
  if (!current || current.resetAt <= now) attempts.set(ip, { count: 1, resetAt: now + 60_000 });
  else if (current.count >= 30) {
    console.warn("[track] rate limit exceeded", { ip });
    return new Response(JSON.stringify({ error: "Too many tracking requests. Please try again shortly." }), { status: 429, headers });
  } else current.count += 1;

  const entryNumber = new URL(req.url).searchParams.get("entry_number")?.trim().toUpperCase();
  if (!entryNumber) return new Response(JSON.stringify({ error: "An entry number is required." }), { status: 400, headers });

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data, error } = await supabase.rpc("track_entry", { p_entry_number: entryNumber });
  if (error) {
    console.error("[track] lookup failed", { message: error.message });
    return new Response(JSON.stringify({ error: "Unable to retrieve tracking information." }), { status: 500, headers });
  }
  if (!data) return new Response(JSON.stringify({ error: `No shipment found for ${entryNumber}.` }), { status: 404, headers });

  console.info("[track] shipment lookup completed", { entryNumber });
  return new Response(JSON.stringify(data), { status: 200, headers });
});
