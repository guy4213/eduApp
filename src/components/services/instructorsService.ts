import { supabase } from "@/integrations/supabase/client";

export async function listInstructorsBasic() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'instructor');
  if (error) {
    console.error('listInstructorsBasic error:', error.message);
    return [];
  }
  return data || [];
}