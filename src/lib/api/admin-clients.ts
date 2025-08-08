import { supabase } from "@/integrations/supabase/client";

export interface ClientRow {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  created_at?: string;
}

export interface CreateClientPayload {
  clientName: string;
  ownerName: string;
  ownerEmail: string;
  phone?: string;
  address?: string;
  brandColor?: string;
  logoUrl?: string;
}

export async function fetchClients(limit = 50): Promise<ClientRow[]> {
  const { data, error } = await supabase
    .from("clients")
    .select("id, name, email, phone, address, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function createClientAndOwner(payload: CreateClientPayload) {
  const { data, error } = await supabase.functions.invoke("create-client-and-owner", {
    body: payload,
  });
  if (error) throw error;
  return data;
}
