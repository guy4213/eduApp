import { supabase } from "@/integrations/supabase/client";

export async function listSalesLeads() {
  const { data, error } = await supabase
    .from('sales_leads')
    .select(`*, instructor:profiles(id, full_name, phone)`) // keep shape similar to Rewards
    .order('created_at', { ascending: false });
  if (error) {
    console.error('listSalesLeads error:', error.message);
    return [];
  }
  return data || [];
}

export async function updateSalesLeadStatus(id: string, status: string) {
  const { error } = await supabase
    .from('sales_leads')
    .update({ status, ...(status.startsWith('closed_') ? { closed_at: new Date().toISOString() } : {}) })
    .eq('id', id);
  if (error) {
    console.error('updateSalesLeadStatus error:', error.message);
    throw error;
  }
}

export async function updateSalesLeadValue(id: string, potentialValue: number) {
  const { error } = await supabase
    .from('sales_leads')
    .update({ potential_value: potentialValue })
    .eq('id', id);
  if (error) {
    console.error('updateSalesLeadValue error:', error.message);
    throw error;
  }
}

export async function getInstructorsForLeads() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone')
    .eq('role', 'instructor')
    .order('full_name');
  if (error) {
    console.error('getInstructorsForLeads error:', error.message);
    return [];
  }
  return data || [];
}

export async function getInstitutions() {
  const { data, error } = await supabase
    .from('educational_institutions')
    .select('id, name, contact_person, contact_phone, address, contact_email')
    .order('name');
  if (error) {
    console.error('getInstitutions error:', error.message);
    return [];
  }
  return data || [];
}

export async function findInstitutionByName(name: string) {
  const { data, error } = await supabase
    .from('educational_institutions')
    .select('id, name')
    .eq('name', name)
    .maybeSingle();
  if (error) {
    console.error('findInstitutionByName error:', error.message);
  }
  return data || null;
}

export async function createInstitution(payload: { name: string; address?: string | null; contact_email?: string | null; contact_person?: string | null; contact_phone?: string | null; }) {
  const { data, error } = await supabase
    .from('educational_institutions')
    .insert([payload])
    .select('id, name')
    .single();
  if (error) {
    console.error('createInstitution error:', error.message);
    throw error;
  }
  return data;
}

export async function createSalesLead(payload: any) {
  const { data, error } = await supabase
    .from('sales_leads')
    .insert([payload])
    .select('*')
    .single();
  if (error) {
    console.error('createSalesLead error:', error.message);
    throw error;
  }
  return data;
}