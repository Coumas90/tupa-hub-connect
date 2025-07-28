import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.0";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CreateBaristaRequest {
  fullName: string;
  email: string;
  role: string;
  phone?: string;
  createdBy: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fullName, email, role, phone, createdBy }: CreateBaristaRequest = await req.json();

    console.log(`Creating barista: ${fullName} (${email}) with role ${role}`);

    // 1. Get creator's location/cafe info
    const { data: creatorProfile, error: creatorError } = await supabase
      .from('users')
      .select('location_id, group_id')
      .eq('id', createdBy)
      .single();

    if (creatorError) {
      console.error('Error getting creator profile:', creatorError);
      throw new Error('No se pudo obtener la información del creador');
    }

    // 2. Get cafe name
    const { data: cafeData, error: cafeError } = await supabase
      .from('cafes')
      .select('name')
      .eq('id', creatorProfile.group_id)
      .single();

    if (cafeError) {
      console.error('Error getting cafe data:', cafeError);
      throw new Error('No se pudo obtener la información de la cafetería');
    }

    // 3. Create user in Supabase Auth with admin privileges
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      user_metadata: {
        full_name: fullName,
        phone: phone || ''
      },
      email_confirm: false // User will confirm when activating account
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      throw new Error(`Error al crear usuario: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error('No se pudo crear el usuario en el sistema de autenticación');
    }

    console.log(`Auth user created with ID: ${authData.user.id}`);

    // 4. Create user profile
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        location_id: creatorProfile.location_id,
        group_id: creatorProfile.group_id,
        created_by: createdBy
      });

    if (profileError) {
      console.error('Error creating user profile:', profileError);
      // Try to cleanup auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw new Error('Error al crear el perfil del usuario');
    }

    console.log('User profile created successfully');

    // 5. Assign role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        role: role
      });

    if (roleError) {
      console.error('Error assigning role:', roleError);
      // Cleanup on error
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw new Error('Error al asignar el rol');
    }

    console.log(`Role ${role} assigned successfully`);

    // 6. Generate invitation token
    const { data: tokenData, error: tokenError } = await supabase.rpc('generate_invitation_token');
    
    if (tokenError || !tokenData) {
      console.error('Error generating token:', tokenError);
      throw new Error('No se pudo generar el token de invitación');
    }

    console.log(`Invitation token generated: ${tokenData}`);

    // 7. Create invitation token record
    const { error: tokenRecordError } = await supabase
      .from('invitation_tokens')
      .insert({
        token: tokenData,
        email: email,
        user_id: authData.user.id,
        cafe_id: creatorProfile.group_id,
        role: role,
        created_by: createdBy
      });

    if (tokenRecordError) {
      console.error('Error creating token record:', tokenRecordError);
      throw new Error('Error al guardar el token de invitación');
    }

    console.log('Invitation token record created');

    // 8. Send invitation email
    const { error: emailError } = await supabase.functions.invoke('send-barista-invitation', {
      body: {
        userEmail: email,
        userName: fullName,
        cafeName: cafeData.name || 'Tu Cafetería',
        token: tokenData
      }
    });

    let emailStatus = 'sent';
    if (emailError) {
      console.error('Error sending email:', emailError);
      emailStatus = 'failed';
    }

    console.log(`Email status: ${emailStatus}`);

    return new Response(JSON.stringify({ 
      success: true,
      userId: authData.user.id,
      email: email,
      emailStatus: emailStatus,
      message: emailStatus === 'sent' 
        ? `Invitación enviada exitosamente a ${email}`
        : `Usuario creado pero falló el envío del email a ${email}`
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in create-barista function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Error interno del servidor",
        success: false 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);