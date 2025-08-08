import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CreateClientRequest {
  clientName: string;
  ownerName: string;
  ownerEmail: string;
  phone?: string;
  address?: string;
  brandColor?: string;
  logoUrl?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: CreateClientRequest = await req.json();
    const { clientName, ownerName, ownerEmail, phone, address, brandColor, logoUrl } = body;

    if (!clientName || !ownerName || !ownerEmail) {
      return new Response(
        JSON.stringify({ error: "clientName, ownerName and ownerEmail are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization") || "" } },
    });

    // 1) Validate admin
    const { data: isAdmin, error: adminErr } = await supabaseAuth.rpc("is_admin");
    if (adminErr) throw adminErr;
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Access denied" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // 2) Create client
    const { data: clientRow, error: clientErr } = await supabaseAdmin
      .from("clients")
      .insert([{ name: clientName, email: ownerEmail, phone, address }])
      .select("id")
      .single();
    if (clientErr) throw clientErr;

    const clientId = clientRow.id as string;

    // 3) Create org/group linked to client
    const { data: groupRow, error: groupErr } = await supabaseAdmin
      .from("groups")
      .insert([{ name: clientName, client_id: clientId }])
      .select("id")
      .single();
    if (groupErr) throw groupErr;
    const groupId = groupRow.id as string;

    // 4) Create main location for the group
    const slug = clientName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const { data: locationRow, error: locErr } = await supabaseAdmin
      .from("locations")
      .insert([{ name: clientName, group_id: groupId, address, slug, is_main: true }])
      .select("id")
      .single();
    if (locErr) throw locErr;
    const locationId = locationRow.id as string;

    // 5) Create owner user in Auth
    const { data: newUser, error: userErr } = await supabaseAdmin.auth.admin.createUser({
      email: ownerEmail,
      email_confirm: false,
      user_metadata: { name: ownerName, role: "owner" },
    });
    if (userErr || !newUser?.user) throw (userErr || new Error("Failed to create user"));
    const ownerId = newUser.user.id;

    // 6) Assign role and org context
    const { error: roleErr } = await supabaseAdmin.from("user_roles").insert({ user_id: ownerId, role: "owner" });
    if (roleErr) throw roleErr;

    // Update public.users with group and location (best-effort)
    const { error: usersUpdateErr } = await supabaseAdmin
      .from("users")
      .update({ group_id: groupId, location_id: locationId })
      .eq("id", ownerId);
    if (usersUpdateErr) {
      console.warn("users table update failed (non-fatal):", usersUpdateErr);
    }

    // 7) Create cafe linked to owner
    const { data: cafeRow, error: cafeErr } = await supabaseAdmin
      .from("cafes")
      .insert([{ name: clientName, owner_id: ownerId, address, brand_color: brandColor, logo_url: logoUrl }])
      .select("id")
      .single();
    if (cafeErr) throw cafeErr;
    const cafeId = cafeRow.id as string;

    // 8) Generate invitation token and store
    const { data: tokenData, error: tokenErr } = await supabaseAdmin.rpc("generate_invitation_token");
    if (tokenErr) throw tokenErr;
    const token = tokenData as string;

    const { error: invErr } = await supabaseAdmin.from("invitation_tokens").insert({
      token,
      email: ownerEmail,
      role: "owner",
      cafe_id: cafeId,
      user_id: ownerId,
    });
    if (invErr) throw invErr;

    // 9) Send invitation email
    const { data: emailResp, error: emailErr } = await supabaseAdmin.functions.invoke("send-owner-invitation", {
      body: {
        userEmail: ownerEmail,
        userName: ownerName,
        cafeName: clientName,
        token,
      },
    });
    if (emailErr) throw emailErr;

    return new Response(
      JSON.stringify({
        success: true,
        clientId,
        groupId,
        locationId,
        ownerId,
        cafeId,
        email: emailResp,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("create-client-and-owner error", error);
    return new Response(JSON.stringify({ error: error.message || "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
