import { supabase } from "@/integrations/supabase/client";

export async function getStudentsByCourseInstance(courseInstanceId: string) {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('course_instance_id', courseInstanceId)
    .order('full_name');

  if (error) {
    console.error('getStudentsByCourseInstance error:', error.message);
    return [];
  }

  return data || [];
}