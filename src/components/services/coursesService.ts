import { supabase } from "@/integrations/supabase/client";

export async function getAllCourses() {
  const { data, error } = await supabase
    .from("courses")
    .select("id, name, created_at");
  if (error) {
    console.error("getAllCourses error:", error.message);
    return [];
  }
  return data || [];
}

export async function getLessonsForCourses(courseIds: string[]) {
  if (!courseIds.length) return [];
  const { data, error } = await supabase
    .from("lessons")
    .select("*")
    .in("course_id", courseIds)
    .order("order_index");
  if (error) {
    console.error("getLessonsForCourses error:", error.message);
    return [];
  }
  return data || [];
}

export async function getTasksForLessons(lessonIds: string[]) {
  if (!lessonIds.length) return [];
  const { data, error } = await supabase
    .from("lesson_tasks")
    .select("*")
    .in("lesson_id", lessonIds)
    .order("order_index");
  if (error) {
    console.error("getTasksForLessons error:", error.message);
    return [];
  }
  return data || [];
}

export async function getInstructors() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "instructor");
  if (error) {
    console.error("getInstructors error:", error.message);
    return [];
  }
  return data || [];
}

export async function getCourseInstances() {
  const { data, error } = await supabase
    .from("course_instances")
    .select("*");
  if (error) {
    console.error("getCourseInstances error:", error.message);
    return [];
  }
  return data || [];
}