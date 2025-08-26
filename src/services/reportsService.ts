import { supabase } from "@/integrations/supabase/client";

export interface LessonReport {
  id: string;
  created_at: string;
  [key: string]: any;
}

export async function getLessonReportsByDateRange(start: Date, end: Date): Promise<LessonReport[]> {
  const startIso = start.toISOString();
  const endIso = end.toISOString();
  const { data, error } = await supabase
    .from("lesson_reports")
    .select("*")
    .gte("created_at", startIso)
    .lt("created_at", endIso);
  if (error) {
    console.error("getLessonReportsByDateRange error:", error.message);
    return [];
  }
  return data || [];
}

export async function getMonthlyLessonReports(year: number, monthZeroBased: number): Promise<LessonReport[]> {
  const monthStart = new Date(year, monthZeroBased, 1);
  const nextMonthStart = new Date(year, monthZeroBased + 1, 1);
  return getLessonReportsByDateRange(monthStart, nextMonthStart);
}

export async function getCurrentMonthLessonReports(): Promise<LessonReport[]> {
  const now = new Date();
  return getMonthlyLessonReports(now.getFullYear(), now.getMonth());
}

export function filterReportsForCurrentWeek(reports: LessonReport[]): LessonReport[] {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const sundayStart = new Date(now);
  sundayStart.setHours(0, 0, 0, 0);
  sundayStart.setDate(now.getDate() - dayOfWeek);
  const nextSunday = new Date(sundayStart);
  nextSunday.setDate(sundayStart.getDate() + 7);
  return (reports || []).filter((r) => {
    const d = new Date(r.created_at);
    return d >= sundayStart && d < nextSunday;
  });
}