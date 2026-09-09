import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const headers = { ...corsHeaders, "Content-Type": "application/json" };
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);
  const token = authHeader.replace("Bearer ", "");
  const { data: claims, error: authError } = await admin.auth.getUser(token);
  if (authError || !claims.user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });
  const { data: caller } = await admin.from("profiles").select("role").eq("id", claims.user.id).single();
  if (caller?.role !== "ops_admin") return new Response(JSON.stringify({ error: "Admin access required" }), { status: 403, headers });

  try {
    if (req.method === "GET") {
      const { data: users, error } = await admin.auth.admin.listUsers();
      if (error) throw error;
      const { data: profiles } = await admin.from("profiles").select("id, full_name, role, warehouse, created_at");
      const rows = users.users.map((user) => ({ ...profiles?.find((profile) => profile.id === user.id), id: user.id, email: user.email }));
      return new Response(JSON.stringify(rows), { headers });
    }

    const body = await req.json();
    if (req.method === "POST") {
      if (!body.email || !body.password || !body.full_name || !body.role) throw new Error("Missing required account fields");
      if (body.role === "warehouse_staff" && !body.warehouse) throw new Error("Warehouse is required for staff");
      const { data, error } = await admin.auth.admin.createUser({ email: body.email, password: body.password, email_confirm: true, user_metadata: { full_name: body.full_name, role: body.role, warehouse: body.warehouse || null } });
      if (error) throw error;
      return new Response(JSON.stringify({ id: data.user.id }), { status: 201, headers });
    }

    if (req.method === "PATCH") {
      if (body.role === "warehouse_staff" && !body.warehouse) throw new Error("Warehouse is required for staff");
      await admin.from("profiles").update({ full_name: body.full_name, role: body.role, warehouse: body.role === "ops_admin" ? null : body.warehouse }).eq("id", body.id);
      const authChanges: { email?: string; password?: string } = {};
      if (body.email) authChanges.email = body.email;
      if (body.password) authChanges.password = body.password;
      if (Object.keys(authChanges).length) await admin.auth.admin.updateUserById(body.id, authChanges);
      return new Response(JSON.stringify({ ok: true }), { headers });
    }

    if (req.method === "DELETE") {
      const id = new URL(req.url).searchParams.get("id");
      if (!id || id === claims.user.id) throw new Error("Invalid account deletion");
      const { error } = await admin.auth.admin.deleteUser(id);
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true }), { headers });
    }
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers });
  } catch (error) {
    console.error("[admin-users] request failed", { message: error instanceof Error ? error.message : String(error) });
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Request failed" }), { status: 400, headers });
  }
});
