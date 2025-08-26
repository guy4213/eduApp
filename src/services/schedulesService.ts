import { fetchCombinedSchedules } from "@/utils/scheduleUtils";

export interface CombinedScheduleItem {
  id: string;
  scheduled_start: string;
  scheduled_end: string;
  course_instance_id?: string;
  course_instances?: any;
  lesson?: any;
}

export async function getAllCombinedSchedules(): Promise<CombinedScheduleItem[]> {
  const combined = await fetchCombinedSchedules();
  return combined as CombinedScheduleItem[];
}

export async function getCombinedSchedulesForCourseInstances(courseInstanceIds: string[]): Promise<CombinedScheduleItem[]> {
  const all = await getAllCombinedSchedules();
  return all.filter((s) => courseInstanceIds.includes((s as any).course_instance_id || s?.course_instances?.id));
}

export function filterSchedulesToMonth(items: CombinedScheduleItem[], year: number, monthZeroBased: number): CombinedScheduleItem[] {
  const start = new Date(year, monthZeroBased, 1);
  const end = new Date(year, monthZeroBased + 1, 0, 23, 59, 59, 999);
  return (items || []).filter((s) => {
    const d = new Date(s.scheduled_start);
    return d >= start && d <= end;
  });
}

export async function getCurrentMonthSchedulesForCourses(courseInstanceIds: string[]): Promise<CombinedScheduleItem[]> {
  const now = new Date();
  const allForCourses = await getCombinedSchedulesForCourseInstances(courseInstanceIds);
  return filterSchedulesToMonth(allForCourses, now.getFullYear(), now.getMonth());
}