import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

interface TimeSlot {
  day: number;
  start_time: string;
  end_time: string;
  [key: string]: Json | undefined;
}

interface CourseInstanceSchedule {
  id: string;
  course_instance_id: string;
  days_of_week: number[];
  time_slots: TimeSlot[];
  total_lessons?: number;
  lesson_duration_minutes?: number;
}

interface GeneratedLessonSchedule {
  id: string;
  course_instance_id: string;
  lesson_id: string;
  scheduled_start: string;
  scheduled_end: string;
  lesson_number: number;
  course_instances?: any;
  lesson?: any;
}

/**
 * Generates lesson schedules from course instance schedule patterns
 */
// export const generateLessonSchedulesFromPattern = (
//   courseInstanceSchedule: CourseInstanceSchedule,
//   lessons: any[],
//   courseStartDate: string,
//   courseEndDate?: string
// ): GeneratedLessonSchedule[] => {
//   const generatedSchedules: GeneratedLessonSchedule[] = [];
//   const { days_of_week, time_slots, total_lessons } = courseInstanceSchedule;
  
//   if (!days_of_week.length || !time_slots.length || !lessons.length || !courseStartDate) {
//     return generatedSchedules;
//   }

//   const startDateTime = new Date(courseStartDate);
//   const endDateTime = courseEndDate ? new Date(courseEndDate) : null;
//   const maxLessons = total_lessons || lessons.length;
  
//   let currentDate = new Date(startDateTime);
//   let lessonCount = 0;
//   let lessonIndex = 0;

//   while (lessonCount < maxLessons && lessonIndex < lessons.length) {
//     const dayOfWeek = currentDate.getDay();
    
//     if (days_of_week.includes(dayOfWeek)) {
//       // Find the time slot for this day
//       const timeSlot = time_slots.find(ts => ts.day === dayOfWeek);
      
//       if (timeSlot && timeSlot.start_time && timeSlot.end_time) {
//         // Check if we're within the end date (if specified)
//         if (endDateTime && currentDate > endDateTime) {
//           break;
//         }

//         const dateStr = currentDate.toISOString().split('T')[0];
//         const scheduledStart = `${dateStr}T${timeSlot.start_time}:00`;
//         const scheduledEnd = `${dateStr}T${timeSlot.end_time}:00`;

//         generatedSchedules.push({
//           id: `generated-${courseInstanceSchedule.course_instance_id}-${lessonCount}`,
//           course_instance_id: courseInstanceSchedule.course_instance_id,
//           lesson_id: lessons[lessonIndex].id,
//           scheduled_start: scheduledStart,
//           scheduled_end: scheduledEnd,
//           lesson_number: lessonCount + 1,
//           lesson: lessons[lessonIndex],
//         });

//         lessonCount++;
//         lessonIndex = (lessonIndex + 1) % lessons.length; // Cycle through lessons if needed
//       }
//     }

//     // Move to next day
//     currentDate.setDate(currentDate.getDate() + 1);
    
//     // Safety check to prevent infinite loop
//     if (currentDate.getTime() - startDateTime.getTime() > 365 * 24 * 60 * 60 * 1000) {
//       console.warn('Schedule generation stopped: exceeded 1 year from start date');
//       break;
//     }
//   }

//   return generatedSchedules;
// };


export const generateLessonSchedulesFromPattern = (
  courseInstanceSchedule: CourseInstanceSchedule,
  lessons: any[],
  courseStartDate: string,
  courseEndDate?: string
): GeneratedLessonSchedule[] => {
  const generatedSchedules: GeneratedLessonSchedule[] = [];
  const { days_of_week, time_slots, total_lessons } = courseInstanceSchedule;
  
  if (!days_of_week.length || !time_slots.length || !lessons.length) {
    return generatedSchedules;
  }

  const endDateTime = courseEndDate ? new Date(courseEndDate) : null;
  const maxLessons = total_lessons || lessons.length;
  
  let lessonCount = 0;
  let lessonIndex = 0;

  // מיון ימי השבוע וחריצי הזמן
  const sortedDays = [...days_of_week].sort();
  
  for (const dayOfWeek of sortedDays) {
    if (lessonCount >= maxLessons || lessonIndex >= lessons.length) break;
    
    const timeSlot = time_slots.find(ts => ts.day === dayOfWeek);
    if (!timeSlot || !timeSlot.start_time || !timeSlot.end_time) continue;

    // השתמש בתאריך שכבר חושב עם הדילוג
    let currentDate: Date;
    
    if (timeSlot.first_lesson_date) {
      // אם יש תאריך מותאם, השתמש בו
      currentDate = new Date(timeSlot.first_lesson_date);
    } else {
      // אחרת, חזור ללוגיקה הישנה
      currentDate = new Date(courseStartDate);
      while (currentDate.getDay() !== dayOfWeek) {
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    // יצירת שיעורים עבור היום הזה בשבוע
    while (lessonCount < maxLessons && lessonIndex < lessons.length) {
      // בדיקת תאריך סיום
      if (endDateTime && currentDate > endDateTime) {
        break;
      }

      const dateStr = currentDate.toISOString().split('T')[0];
      const scheduledStart = `${dateStr}T${timeSlot.start_time}:00`;
      const scheduledEnd = `${dateStr}T${timeSlot.end_time}:00`;

      generatedSchedules.push({
        id: `generated-${courseInstanceSchedule.course_instance_id}-${lessonCount}`,
        course_instance_id: courseInstanceSchedule.course_instance_id,
        lesson_id: lessons[lessonIndex].id,
        scheduled_start: scheduledStart,
        scheduled_end: scheduledEnd,
        lesson_number: lessonCount + 1,
        lesson: lessons[lessonIndex],
      });

      lessonCount++;
      lessonIndex++;
      
      // מעבר לשבוע הבא באותו יום
      currentDate.setDate(currentDate.getDate() + 7);
    }
  }

  return generatedSchedules;
};
/**
 * Fetches course instance schedules and generates lesson schedules
 */
export const fetchAndGenerateSchedules = async (
  courseInstanceId?: string
): Promise<GeneratedLessonSchedule[]> => {
  try {
    // Build query for course instance schedules
    let query = supabase
      .from('course_instance_schedules')
      .select(`
        *,
        course_instances:course_instance_id (
          id,
          course_id,
          start_date,
          end_date,
          course:course_id (
            id,
            name
          ),
          institution:institution_id (
            id,
            name
          ),
          instructor:instructor_id (
            id,
            full_name
          )
        )
      `);

    if (courseInstanceId) {
      query = query.eq('course_instance_id', courseInstanceId);
    }

    const { data: schedules, error: schedulesError } = await query;

    if (schedulesError) {
      console.error('Error fetching course instance schedules:', schedulesError);
      return [];
    }

    if (!schedules || schedules.length === 0) {
      return [];
    }

    const allGeneratedSchedules: GeneratedLessonSchedule[] = [];

    // For each course instance schedule, generate lesson schedules
    for (const schedule of schedules) {
      if (!schedule.course_instances) continue;

      // Fetch lessons for this course
      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('id, title, course_id, order_index')
        .eq('course_id', schedule.course_instances.course_id)
        .order('order_index');

      if (lessonsError) {
        console.error('Error fetching lessons:', lessonsError);
        continue;
      }

      if (!lessons || lessons.length === 0) {
        continue;
      }

      // Generate schedules for this course instance
      const generatedSchedules = generateLessonSchedulesFromPattern(
        {
          id: schedule.id,
          course_instance_id: schedule.course_instance_id,
          days_of_week: schedule.days_of_week,
          time_slots: schedule.time_slots as TimeSlot[],
          total_lessons: schedule.total_lessons,
          lesson_duration_minutes: schedule.lesson_duration_minutes,
        },
        lessons,
        schedule.course_instances.start_date,
        schedule.course_instances.end_date
      );

      // Add course instance data to each generated schedule
      const schedulesWithCourseData = generatedSchedules.map(genSchedule => ({
        ...genSchedule,
        course_instances: schedule.course_instances,
      }));

      allGeneratedSchedules.push(...schedulesWithCourseData);
    }

    return allGeneratedSchedules;
  } catch (error) {
    console.error('Error in fetchAndGenerateSchedules:', error);
    return [];
  }
};

/**
 * Combines legacy lesson_schedules with new generated schedules
 */
export const fetchCombinedSchedules = async (
  courseInstanceId?: string
): Promise<any[]> => {
  try {
    // Fetch legacy lesson schedules
    let legacyQuery = supabase
      .from('lesson_schedules')
      .select(`
        id,
        scheduled_start,
        scheduled_end,
        lesson_number,
        lesson:lesson_id (
          id,
          title,
          order_index
        ),
        course_instances:course_instance_id (
          id,
          course:course_id (
            id,
            name
          ),
          institution:institution_id (
            id,
            name
          ),
          instructor:instructor_id (
            id,
            full_name
          )
        )
      `);

    if (courseInstanceId) {
      legacyQuery = legacyQuery.eq('course_instance_id', courseInstanceId);
    }

    const { data: legacySchedules, error: legacyError } = await legacyQuery;

    if (legacyError) {
      console.error('Error fetching legacy schedules:', legacyError);
    }

    // Fetch new generated schedules
    const generatedSchedules = await fetchAndGenerateSchedules(courseInstanceId);

    // Combine both types of schedules
    const combinedSchedules = [
      ...(legacySchedules || []),
      ...generatedSchedules,
    ];

    // Sort by scheduled_start
    combinedSchedules.sort((a, b) => 
      new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime()
    );

    return combinedSchedules;
  } catch (error) {
    console.error('Error in fetchCombinedSchedules:', error);
    return [];
  }
};

/**
 * Filters schedules by date
 */
export const filterSchedulesByDate = (schedules: any[], targetDate: Date): any[] => {
  const targetDateStr = targetDate.toISOString().split('T')[0];
  
  return schedules.filter(schedule => {
    if (!schedule.scheduled_start) return false;
    const scheduleDate = new Date(schedule.scheduled_start).toISOString().split('T')[0];
    return scheduleDate === targetDateStr;
  });
};

/**
 * Filters schedules by date range
 */
export const filterSchedulesByDateRange = (
  schedules: any[], 
  startDate: Date, 
  endDate: Date
): any[] => {
  return schedules.filter(schedule => {
    if (!schedule.scheduled_start) return false;
    const scheduleDate = new Date(schedule.scheduled_start);
    return scheduleDate >= startDate && scheduleDate <= endDate;
  });
};