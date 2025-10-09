// // // import { supabase } from "@/integrations/supabase/client";
// // // import type { Json } from "@/integrations/supabase/types";

// // // interface TimeSlot {
// // //   day: number;
// // //   start_time: string;
// // //   end_time: string;
// // //   [key: string]: Json | undefined;
// // // }

// // // interface CourseInstanceSchedule {
// // //   id: string;
// // //   course_instance_id: string;
// // //   days_of_week: number[];
// // //   time_slots: TimeSlot[];
// // //   total_lessons?: number;
// // //   lesson_duration_minutes?: number;
// // // }

// // // interface GeneratedLessonSchedule {
// // //   id: string;
// // //   course_instance_id: string;
// // //   lesson_id: string;
// // //   scheduled_start: string;
// // //   scheduled_end: string;
// // //   lesson_number: number;
// // //   course_instances?: any;
// // //   lesson?: any;
// // // }

// // // /**
// // //  * Generates lesson schedules from course instance schedule patterns
// // //  */
// // // // export const generateLessonSchedulesFromPattern = (
// // // //   courseInstanceSchedule: CourseInstanceSchedule,
// // // //   lessons: any[],
// // // //   courseStartDate: string,
// // // //   courseEndDate?: string
// // // // ): GeneratedLessonSchedule[] => {
// // // //   const generatedSchedules: GeneratedLessonSchedule[] = [];
// // // //   const { days_of_week, time_slots, total_lessons } = courseInstanceSchedule;
  
// // // //   if (!days_of_week.length || !time_slots.length || !lessons.length || !courseStartDate) {
// // // //     return generatedSchedules;
// // // //   }

// // // //   const startDateTime = new Date(courseStartDate);
// // // //   const endDateTime = courseEndDate ? new Date(courseEndDate) : null;
// // // //   const maxLessons = total_lessons || lessons.length;
  
// // // //   let currentDate = new Date(startDateTime);
// // // //   let lessonCount = 0;
// // // //   let lessonIndex = 0;

// // // //   while (lessonCount < maxLessons && lessonIndex < lessons.length) {
// // // //     const dayOfWeek = currentDate.getDay();
    
// // // //     if (days_of_week.includes(dayOfWeek)) {
// // // //       // Find the time slot for this day
// // // //       const timeSlot = time_slots.find(ts => ts.day === dayOfWeek);
      
// // // //       if (timeSlot && timeSlot.start_time && timeSlot.end_time) {
// // // //         // Check if we're within the end date (if specified)
// // // //         if (endDateTime && currentDate > endDateTime) {
// // // //           break;
// // // //         }

// // // //         const dateStr = currentDate.toISOString().split('T')[0];
// // // //         const scheduledStart = `${dateStr}T${timeSlot.start_time}:00`;
// // // //         const scheduledEnd = `${dateStr}T${timeSlot.end_time}:00`;

// // // //         generatedSchedules.push({
// // // //           id: `generated-${courseInstanceSchedule.course_instance_id}-${lessonCount}`,
// // // //           course_instance_id: courseInstanceSchedule.course_instance_id,
// // // //           lesson_id: lessons[lessonIndex].id,
// // // //           scheduled_start: scheduledStart,
// // // //           scheduled_end: scheduledEnd,
// // // //           lesson_number: lessonCount + 1,
// // // //           lesson: lessons[lessonIndex],
// // // //         });

// // // //         lessonCount++;
// // // //         lessonIndex = (lessonIndex + 1) % lessons.length; // Cycle through lessons if needed
// // // //       }
// // // //     }

// // // //     // Move to next day
// // // //     currentDate.setDate(currentDate.getDate() + 1);
    
// // // //     // Safety check to prevent infinite loop
// // // //     if (currentDate.getTime() - startDateTime.getTime() > 365 * 24 * 60 * 60 * 1000) {
// // // //       console.warn('Schedule generation stopped: exceeded 1 year from start date');
// // // //       break;
// // // //     }
// // // //   }

// // // //   return generatedSchedules;
// // // // };


// // // export const generateLessonSchedulesFromPattern = (
// // //   courseInstanceSchedule: CourseInstanceSchedule,
// // //   lessons: any[],
// // //   courseStartDate: string,
// // //   courseEndDate?: string
// // // ): GeneratedLessonSchedule[] => {
// // //   const generatedSchedules: GeneratedLessonSchedule[] = [];
// // //   const { days_of_week, time_slots, total_lessons } = courseInstanceSchedule;
  
// // //   if (!days_of_week.length || !time_slots.length || !lessons.length) {
// // //     return generatedSchedules;
// // //   }

// // //   const endDateTime = courseEndDate ? new Date(courseEndDate) : null;
// // //   const maxLessons = total_lessons || lessons.length;
  
// // //   let lessonCount = 0;
// // //   let lessonIndex = 0;

// // //   // מיון ימי השבוע וחריצי הזמן
// // //   const sortedDays = [...days_of_week].sort();
  
// // //   for (const dayOfWeek of sortedDays) {
// // //     if (lessonCount >= maxLessons || lessonIndex >= lessons.length) break;
    
// // //     const timeSlot = time_slots.find(ts => ts.day === dayOfWeek);
// // //     if (!timeSlot || !timeSlot.start_time || !timeSlot.end_time) continue;

// // //     // השתמש בתאריך שכבר חושב עם הדילוג
// // //     let currentDate: Date;
    
// // //     if (timeSlot.first_lesson_date) {
// // //       // אם יש תאריך מותאם, השתמש בו
// // //       currentDate = new Date(timeSlot.first_lesson_date);
// // //     } else {
// // //       // אחרת, חזור ללוגיקה הישנה
// // //       currentDate = new Date(courseStartDate);
// // //       while (currentDate.getDay() !== dayOfWeek) {
// // //         currentDate.setDate(currentDate.getDate() + 1);
// // //       }
// // //     }

// // //     // יצירת שיעורים עבור היום הזה בשבוע
// // //     while (lessonCount < maxLessons && lessonIndex < lessons.length) {
// // //       // בדיקת תאריך סיום
// // //       if (endDateTime && currentDate > endDateTime) {
// // //         break;
// // //       }

// // //       const dateStr = currentDate.toISOString().split('T')[0];
// // //       const scheduledStart = `${dateStr}T${timeSlot.start_time}:00`;
// // //       const scheduledEnd = `${dateStr}T${timeSlot.end_time}:00`;

// // //       generatedSchedules.push({
// // //         id: `generated-${courseInstanceSchedule.course_instance_id}-${lessonCount}`,
// // //         course_instance_id: courseInstanceSchedule.course_instance_id,
// // //         lesson_id: lessons[lessonIndex].id,
// // //         scheduled_start: scheduledStart,
// // //         scheduled_end: scheduledEnd,
// // //         lesson_number: lessonCount + 1,
// // //         lesson: lessons[lessonIndex],
// // //       });

// // //       lessonCount++;
// // //       lessonIndex++;
      
// // //       // מעבר לשבוע הבא באותו יום
// // //       currentDate.setDate(currentDate.getDate() + 7);
// // //     }
// // //   }

// // //   return generatedSchedules;
// // // };
// // // /**
// // //  * Fetches course instance schedules and generates lesson schedules
// // //  */
// // // export const fetchAndGenerateSchedules = async (
// // //   courseInstanceId?: string
// // // ): Promise<GeneratedLessonSchedule[]> => {
// // //   try {
// // //     // Build query for course instance schedules
// // //     let query = supabase
// // //       .from('course_instance_schedules')
// // //       .select(`
// // //         *,
// // //         course_instances:course_instance_id (
// // //           id,
// // //           course_id,
// // //           start_date,
// // //           end_date,
// // //           course:course_id (
// // //             id,
// // //             name
// // //           ),
// // //           institution:institution_id (
// // //             id,
// // //             name
// // //           ),
// // //           instructor:instructor_id (
// // //             id,
// // //             full_name
// // //           )
// // //         )
// // //       `);

// // //     if (courseInstanceId) {
// // //       query = query.eq('course_instance_id', courseInstanceId);
// // //     }

// // //     const { data: schedules, error: schedulesError } = await query;

// // //     if (schedulesError) {
// // //       console.error('Error fetching course instance schedules:', schedulesError);
// // //       return [];
// // //     }

// // //     if (!schedules || schedules.length === 0) {
// // //       return [];
// // //     }

// // //     const allGeneratedSchedules: GeneratedLessonSchedule[] = [];

// // //     // For each course instance schedule, generate lesson schedules
// // //     for (const schedule of schedules) {
// // //       if (!schedule.course_instances) continue;

// // //       // Fetch lessons for this course
// // //       const { data: lessons, error: lessonsError } = await supabase
// // //         .from('lessons')
// // //         .select('id, title, course_id, order_index')
// // //         .eq('course_id', schedule.course_instances.course_id)
// // //         .order('order_index');

// // //       if (lessonsError) {
// // //         console.error('Error fetching lessons:', lessonsError);
// // //         continue;
// // //       }

// // //       if (!lessons || lessons.length === 0) {
// // //         continue;
// // //       }

// // //       // Generate schedules for this course instance
// // //       const generatedSchedules = generateLessonSchedulesFromPattern(
// // //         {
// // //           id: schedule.id,
// // //           course_instance_id: schedule.course_instance_id,
// // //           days_of_week: schedule.days_of_week,
// // //           time_slots: schedule.time_slots as TimeSlot[],
// // //           total_lessons: schedule.total_lessons,
// // //           lesson_duration_minutes: schedule.lesson_duration_minutes,
// // //         },
// // //         lessons,
// // //         schedule.course_instances.start_date,
// // //         schedule.course_instances.end_date
// // //       );

// // //       // Add course instance data to each generated schedule
// // //       const schedulesWithCourseData = generatedSchedules.map(genSchedule => ({
// // //         ...genSchedule,
// // //         course_instances: schedule.course_instances,
// // //       }));

// // //       allGeneratedSchedules.push(...schedulesWithCourseData);
// // //     }

// // //     return allGeneratedSchedules;
// // //   } catch (error) {
// // //     console.error('Error in fetchAndGenerateSchedules:', error);
// // //     return [];
// // //   }
// // // };

// // // /**
// // //  * Combines legacy lesson_schedules with new generated schedules
// // //  */
// // // export const fetchCombinedSchedules = async (
// // //   courseInstanceId?: string
// // // ): Promise<any[]> => {
// // //   try {
// // //     // Fetch legacy lesson schedules
// // //     let legacyQuery = supabase
// // //       .from('lesson_schedules')
// // //       .select(`
// // //         id,
// // //         scheduled_start,
// // //         scheduled_end,
// // //         lesson_number,
// // //         lesson:lesson_id (
// // //           id,
// // //           title,
// // //           order_index
// // //         ),
// // //         course_instances:course_instance_id (
// // //           id,
// // //           course:course_id (
// // //             id,
// // //             name
// // //           ),
// // //           institution:institution_id (
// // //             id,
// // //             name
// // //           ),
// // //           instructor:instructor_id (
// // //             id,
// // //             full_name
// // //           )
// // //         )
// // //       `);

// // //     if (courseInstanceId) {
// // //       legacyQuery = legacyQuery.eq('course_instance_id', courseInstanceId);
// // //     }

// // //     const { data: legacySchedules, error: legacyError } = await legacyQuery;

// // //     if (legacyError) {
// // //       console.error('Error fetching legacy schedules:', legacyError);
// // //     }

// // //     // Fetch new generated schedules
// // //     const generatedSchedules = await fetchAndGenerateSchedules(courseInstanceId);

// // //     // Combine both types of schedules
// // //     const combinedSchedules = [
// // //       ...(legacySchedules || []),
// // //       ...generatedSchedules,
// // //     ];

// // //     // Sort by scheduled_start
// // //     combinedSchedules.sort((a, b) => 
// // //       new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime()
// // //     );

// // //     return combinedSchedules;
// // //   } catch (error) {
// // //     console.error('Error in fetchCombinedSchedules:', error);
// // //     return [];
// // //   }
// // // };

// // // /**
// // //  * Filters schedules by date
// // //  */
// // // export const filterSchedulesByDate = (schedules: any[], targetDate: Date): any[] => {
// // //   const targetDateStr = targetDate.toISOString().split('T')[0];
  
// // //   return schedules.filter(schedule => {
// // //     if (!schedule.scheduled_start) return false;
// // //     const scheduleDate = new Date(schedule.scheduled_start).toISOString().split('T')[0];
// // //     return scheduleDate === targetDateStr;
// // //   });
// // // };

// // // /**
// // //  * Filters schedules by date range
// // //  */
// // // export const filterSchedulesByDateRange = (
// // //   schedules: any[], 
// // //   startDate: Date, 
// // //   endDate: Date
// // // ): any[] => {
// // //   return schedules.filter(schedule => {
// // //     if (!schedule.scheduled_start) return false;
// // //     const scheduleDate = new Date(schedule.scheduled_start);
// // //     return scheduleDate >= startDate && scheduleDate <= endDate;
// // //   });
// // // };



// // import { supabase } from "@/integrations/supabase/client";
// // import type { Json } from "@/integrations/supabase/types";

// // interface TimeSlot {
// //   day: number;
// //   start_time: string;
// //   end_time: string;
// //   first_lesson_date?: string;
// //   [key: string]: Json | undefined;
// // }

// // interface CourseInstanceSchedule {
// //   id: string;
// //   course_instance_id: string;
// //   days_of_week: number[];
// //   time_slots: TimeSlot[];
// //   total_lessons?: number;
// //   lesson_duration_minutes?: number;
// // }

// // interface GeneratedLessonSchedule {
// //   id: string;
// //   course_instance_id: string;
// //   lesson_id: string;
// //   scheduled_start: string;
// //   scheduled_end: string;
// //   lesson_number: number;
// //   course_instances?: any;
// //   lesson?: any;
// // }

// // /**
// //  * Generates lesson schedules from course instance schedule patterns
// //  * Fixed version that properly handles lesson additions
// //  */
// // export const generateLessonSchedulesFromPattern = async (
// //   courseInstanceSchedule: CourseInstanceSchedule,
// //   lessons: any[],
// //   courseStartDate: string,
// //   courseEndDate?: string
// // ): Promise<GeneratedLessonSchedule[]> => {
// //   const generatedSchedules: GeneratedLessonSchedule[] = [];
// //   const { days_of_week, time_slots, total_lessons, course_instance_id } = courseInstanceSchedule;
  
// //   if (!days_of_week.length || !time_slots.length || !lessons.length) {
// //     return generatedSchedules;
// //   }

// //   // בדיקה אם יש כבר שיעורים מתוזמנים להקצאה זו
// //   const { data: existingSchedules } = await supabase
// //     .from('lesson_schedules')
// //     .select('*')
// //     .eq('course_instance_id', course_instance_id)
// //     .order('scheduled_start', { ascending: true });

// //   const { data: existingReports } = await supabase
// //     .from('reported_lesson_instances')
// //     .select('lesson_id, lesson_number')
// //     .eq('course_instance_id', course_instance_id);

// //   // יצירת מפה של שיעורים שכבר תוזמנו
// //   const scheduledLessonIds = new Set(existingSchedules?.map(s => s.lesson_id) || []);
// //   const reportedLessonIds = new Set(existingReports?.map(r => r.lesson_id) || []);
  
// //   // סינון שיעורים שטרם תוזמנו
// //   const unscheduledLessons = lessons.filter(lesson => 
// //     !scheduledLessonIds.has(lesson.id) && !reportedLessonIds.has(lesson.id)
// //   );

// //   if (unscheduledLessons.length === 0) {
// //     console.log('All lessons are already scheduled');
// //     return generatedSchedules;
// //   }

// //   // מציאת התאריך האחרון של שיעור מתוזמן
// //   let startFromDate = new Date(courseStartDate);
  
// //   if (existingSchedules && existingSchedules.length > 0) {
// //     const lastScheduledDate = new Date(existingSchedules[existingSchedules.length - 1].scheduled_end);
// //     // התחל מהשבוע הבא אחרי השיעור האחרון
// //     startFromDate = new Date(lastScheduledDate);
// //     startFromDate.setDate(startFromDate.getDate() + 1);
// //   }

// //   const endDateTime = courseEndDate ? new Date(courseEndDate) : null;
// //   const maxLessons = total_lessons || lessons.length;
  
// //   // מספר השיעורים שכבר תוזמנו
// //   const existingLessonCount = existingSchedules?.length || 0;
  
// //   // התחלת מספור השיעורים מהמספר הבא
// //   let lessonCount = existingLessonCount;
// //   let currentDate = new Date(startFromDate);
// //   let scheduledCount = 0;

// //   // מיון ימי השבוע
// //   const sortedDays = [...days_of_week].sort();
  
// //   // מחזור על השיעורים שטרם תוזמנו
// //   while (scheduledCount < unscheduledLessons.length && lessonCount < maxLessons) {
// //     const dayOfWeek = currentDate.getDay();
    
// //     if (sortedDays.includes(dayOfWeek)) {
// //       const timeSlot = time_slots.find(ts => ts.day === dayOfWeek);
      
// //       if (timeSlot && timeSlot.start_time && timeSlot.end_time) {
// //         // בדיקת תאריך סיום
// //         if (endDateTime && currentDate > endDateTime) {
// //           break;
// //         }

// //         const dateStr = currentDate.toISOString().split('T')[0];
// //         const scheduledStart = `${dateStr}T${timeSlot.start_time}:00`;
// //         const scheduledEnd = `${dateStr}T${timeSlot.end_time}:00`;

// //         // וודא שאין התנגשות עם שיעור קיים באותו זמן
// //         const hasConflict = existingSchedules?.some(existing => {
// //           const existingStart = new Date(existing.scheduled_start);
// //           const existingEnd = new Date(existing.scheduled_end);
// //           const newStart = new Date(scheduledStart);
// //           const newEnd = new Date(scheduledEnd);
          
// //           return (newStart >= existingStart && newStart < existingEnd) ||
// //                  (newEnd > existingStart && newEnd <= existingEnd) ||
// //                  (newStart <= existingStart && newEnd >= existingEnd);
// //         });

// //         if (!hasConflict) {
// //           generatedSchedules.push({
// //             id: `generated-${course_instance_id}-${lessonCount}`,
// //             course_instance_id: course_instance_id,
// //             lesson_id: unscheduledLessons[scheduledCount].id,
// //             scheduled_start: scheduledStart,
// //             scheduled_end: scheduledEnd,
// //             lesson_number: lessonCount + 1,
// //             lesson: unscheduledLessons[scheduledCount],
// //           });

// //           scheduledCount++;
// //           lessonCount++;
// //         }
// //       }
// //     }

// //     // מעבר ליום הבא
// //     currentDate.setDate(currentDate.getDate() + 1);
    
// //     // בדיקת בטיחות למניעת לולאה אינסופית
// //     if (currentDate.getTime() - startFromDate.getTime() > 365 * 24 * 60 * 60 * 1000) {
// //       console.warn('Schedule generation stopped: exceeded 1 year from start date');
// //       break;
// //     }
// //   }

// //   console.log(`Generated ${generatedSchedules.length} new schedules for unscheduled lessons`);
// //   return generatedSchedules;
// // };

// // /**
// //  * Fetches course instance schedules and generates lesson schedules
// //  * Updated to handle async properly
// //  */
// // export const fetchAndGenerateSchedules = async (
// //   courseInstanceId?: string
// // ): Promise<GeneratedLessonSchedule[]> => {
// //   try {
// //     // Build query for course instance schedules
// //     let query = supabase
// //       .from('course_instance_schedules')
// //       .select(`
// //         *,
// //         course_instances:course_instance_id (
// //           id,
// //           course_id,
// //           start_date,
// //           end_date,
// //           course:course_id (
// //             id,
// //             name
// //           ),
// //           institution:institution_id (
// //             id,
// //             name
// //           ),
// //           instructor:instructor_id (
// //             id,
// //             full_name
// //           )
// //         )
// //       `);

// //     if (courseInstanceId) {
// //       query = query.eq('course_instance_id', courseInstanceId);
// //     }

// //     const { data: schedules, error: schedulesError } = await query;

// //     if (schedulesError) {
// //       console.error('Error fetching course instance schedules:', schedulesError);
// //       return [];
// //     }

// //     if (!schedules || schedules.length === 0) {
// //       return [];
// //     }

// //     const allGeneratedSchedules: GeneratedLessonSchedule[] = [];

// //     // For each course instance schedule, generate lesson schedules
// //     for (const schedule of schedules) {
// //       if (!schedule.course_instances) continue;

// //       // Fetch lessons for this course
// //       const { data: lessons, error: lessonsError } = await supabase
// //         .from('lessons')
// //         .select('id, title, course_id, order_index')
// //         .eq('course_id', schedule.course_instances.course_id)
// //         .order('order_index');

// //       if (lessonsError) {
// //         console.error('Error fetching lessons:', lessonsError);
// //         continue;
// //       }

// //       if (!lessons || lessons.length === 0) {
// //         continue;
// //       }

// //       // Generate schedules for this course instance - now async
// //       const generatedSchedules = await generateLessonSchedulesFromPattern(
// //         {
// //           id: schedule.id,
// //           course_instance_id: schedule.course_instance_id,
// //           days_of_week: schedule.days_of_week,
// //           time_slots: schedule.time_slots as TimeSlot[],
// //           total_lessons: schedule.total_lessons,
// //           lesson_duration_minutes: schedule.lesson_duration_minutes,
// //         },
// //         lessons,
// //         schedule.course_instances.start_date,
// //         schedule.course_instances.end_date
// //       );

// //       // Add course instance data to each generated schedule
// //       const schedulesWithCourseData = generatedSchedules.map(genSchedule => ({
// //         ...genSchedule,
// //         course_instances: schedule.course_instances,
// //       }));

// //       allGeneratedSchedules.push(...schedulesWithCourseData);
// //     }

// //     return allGeneratedSchedules;
// //   } catch (error) {
// //     console.error('Error in fetchAndGenerateSchedules:', error);
// //     return [];
// //   }
// // };

// // /**
// //  * Combines legacy lesson_schedules with new generated schedules
// //  * Fixed to handle duplicates properly
// //  */
// // export const fetchCombinedSchedules = async (
// //   courseInstanceId?: string
// // ): Promise<any[]> => {
// //   try {
// //     // Fetch legacy lesson schedules
// //     let legacyQuery = supabase
// //       .from('lesson_schedules')
// //       .select(`
// //         id,
// //         scheduled_start,
// //         scheduled_end,
// //         lesson_number,
// //         lesson_id,
// //         course_instance_id,
// //         lesson:lesson_id (
// //           id,
// //           title,
// //           order_index
// //         ),
// //         course_instances:course_instance_id (
// //           id,
// //           course:course_id (
// //             id,
// //             name
// //           ),
// //           institution:institution_id (
// //             id,
// //             name
// //           ),
// //           instructor:instructor_id (
// //             id,
// //             full_name
// //           )
// //         )
// //       `);

// //     if (courseInstanceId) {
// //       legacyQuery = legacyQuery.eq('course_instance_id', courseInstanceId);
// //     }

// //     const { data: legacySchedules, error: legacyError } = await legacyQuery;

// //     if (legacyError) {
// //       console.error('Error fetching legacy schedules:', legacyError);
// //     }

// //     // Fetch new generated schedules
// //     const generatedSchedules = await fetchAndGenerateSchedules(courseInstanceId);

// //     // יצירת מפה למניעת כפילויות - מפתח משולב של course_instance_id + lesson_id
// //     const scheduleMap = new Map<string, any>();
    
// //     // הוספת לוחות זמנים קיימים (legacy) למפה - הם מקבלים עדיפות
// //     legacySchedules?.forEach(schedule => {
// //       const key = `${schedule.course_instance_id}_${schedule.lesson_id || schedule.lesson?.id}`;
// //       scheduleMap.set(key, schedule);
// //     });
    
// //     // הוספת לוחות זמנים שנוצרו רק אם אין כבר לוח זמנים לאותו שיעור
// //     generatedSchedules.forEach(schedule => {
// //       const key = `${schedule.course_instance_id}_${schedule.lesson_id}`;
// //       if (!scheduleMap.has(key)) {
// //         scheduleMap.set(key, schedule);
// //       }
// //     });

// //     // המרה חזרה למערך
// //     const combinedSchedules = Array.from(scheduleMap.values());

// //     // Sort by scheduled_start
// //     combinedSchedules.sort((a, b) => {
// //       const dateA = a.scheduled_start ? new Date(a.scheduled_start).getTime() : 0;
// //       const dateB = b.scheduled_start ? new Date(b.scheduled_start).getTime() : 0;
// //       return dateA - dateB;
// //     });

// //     console.log(`Combined schedules: ${legacySchedules?.length || 0} legacy, ${generatedSchedules.length} generated, ${combinedSchedules.length} total`);

// //     return combinedSchedules;
// //   } catch (error) {
// //     console.error('Error in fetchCombinedSchedules:', error);
// //     return [];
// //   }
// // };

// // /**
// //  * Filters schedules by date
// //  */
// // export const filterSchedulesByDate = (schedules: any[], targetDate: Date): any[] => {
// //   const targetDateStr = targetDate.toISOString().split('T')[0];
  
// //   return schedules.filter(schedule => {
// //     if (!schedule.scheduled_start) return false;
// //     const scheduleDate = new Date(schedule.scheduled_start).toISOString().split('T')[0];
// //     return scheduleDate === targetDateStr;
// //   });
// // };

// // /**
// //  * Filters schedules by date range
// //  */
// // export const filterSchedulesByDateRange = (
// //   schedules: any[], 
// //   startDate: Date, 
// //   endDate: Date
// // ): any[] => {
// //   return schedules.filter(schedule => {
// //     if (!schedule.scheduled_start) return false;
// //     const scheduleDate = new Date(schedule.scheduled_start);
// //     return scheduleDate >= startDate && scheduleDate <= endDate;
// //   });
// // };




// import { supabase } from "@/integrations/supabase/client";
// import type { Json } from "@/integrations/supabase/types";

// interface TimeSlot {
//   day: number;
//   start_time: string;
//   end_time: string;
//   first_lesson_date?: string;
//   [key: string]: Json | undefined;
// }

// interface CourseInstanceSchedule {
//   id: string;
//   course_instance_id: string;
//   days_of_week: number[];
//   time_slots: TimeSlot[];
//   total_lessons?: number;
//   lesson_duration_minutes?: number;
// }

// interface GeneratedLessonSchedule {
//   id: string;
//   course_instance_id: string;
//   lesson_id: string;
//   scheduled_start: string;
//   scheduled_end: string;
//   lesson_number: number;
//   course_instances?: any;
//   lesson?: any;
// }

// // === NEW SYSTEM CONFIGURATION INTERFACES ===
// export interface SystemDefaults {
//   id?: string;
//   default_lesson_duration: number;
//   default_task_duration: number;
//   default_break_duration: number;
//   created_at?: string;
//   updated_at?: string;
// }

// export interface BlockedDate {
//   id: string;
//   date?: string; // Single date (legacy)
//   start_date?: string; // Range start
//   end_date?: string; // Range end
//   reason?: string;
//   created_at?: string;
//   created_by?: string;
// }

// // Cache for better performance
// let systemDefaultsCache: SystemDefaults | null = null;
// let blockedDatesCache: BlockedDate[] | null = null;
// let cacheTimestamp: number = 0;
// const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// // === SYSTEM DEFAULTS FUNCTIONS ===

// /**
//  * Fetches system defaults from database with caching
//  */

// export const formatDateLocal=(date: Date): string => {
//   return (
//     date.getFullYear() +
//     "-" +
//     String(date.getMonth() + 1).padStart(2, "0") +
//     "-" +
//     String(date.getDate()).padStart(2, "0")
//   );
// };
// export const getSystemDefaults = async (forceRefresh: boolean = false): Promise<SystemDefaults> => {
//   const now = Date.now();
  
//   // Return cached data if available and not expired
//   if (!forceRefresh && systemDefaultsCache && (now - cacheTimestamp) < CACHE_DURATION) {
//     return systemDefaultsCache;
//   }

//   try {
//     const { data, error } = await supabase
//       .from('system_defaults')
//       .select('*')
//       .single();
    
//     if (error && error.code === 'PGRST116') {
//       // No defaults exist, create default values
//       const defaultValues: SystemDefaults = {
//         default_lesson_duration: 45,
//         default_task_duration: 15,
//         default_break_duration: 10
//       };
      
//       const { data: newDefaults, error: insertError } = await supabase
//         .from('system_defaults')
//         .insert([defaultValues])
//         .select()
//         .single();
      
//       if (insertError) throw insertError;
      
//       systemDefaultsCache = newDefaults;
//       cacheTimestamp = now;
//       return newDefaults;
//     }
    
//     if (error) throw error;
    
//     systemDefaultsCache = data;
//     cacheTimestamp = now;
//     return data;
//   } catch (error) {
//     console.error('Error fetching system defaults:', error);
//     // Return fallback defaults
//     return {
//       default_lesson_duration: 45,
//       default_task_duration: 15,
//       default_break_duration: 10
//     };
//   }
// };

// /**
//  * Updates system defaults in database
//  */
// export const updateSystemDefaults = async (defaults: Partial<SystemDefaults>): Promise<boolean> => {
//   try {
//     const current = await getSystemDefaults();
//     const { error } = await supabase
//       .from('system_defaults')
//       .update({
//         ...defaults,
//         updated_at: new Date().toISOString()
//       })
//       .eq('id', current.id);
    
//     if (error) throw error;
    
//     // Clear cache to force refresh
//     systemDefaultsCache = null;
//     return true;
//   } catch (error) {
//     console.error('Error updating system defaults:', error);
//     return false;
//   }
// };

// // === BLOCKED DATES FUNCTIONS ===

// /**
//  * Fetches all blocked dates from database with caching
//  */
// export const getBlockedDates = async (forceRefresh: boolean = false): Promise<BlockedDate[]> => {
//   const now = Date.now();
  
//   // Return cached data if available and not expired
//   if (!forceRefresh && blockedDatesCache && (now - cacheTimestamp) < CACHE_DURATION) {
//     return blockedDatesCache;
//   }

//   try {
//     const { data, error } = await supabase
//       .from('blocked_dates')
//       .select('*')
//       .order('created_at', { ascending: false });
    
//     if (error) throw error;
    
//     blockedDatesCache = data || [];
//     cacheTimestamp = now;
//     return data || [];
//   } catch (error) {
//     console.error('Error fetching blocked dates:', error);
//     return [];
//   }
// };

// /**
//  * Checks if a specific date is blocked
//  */
// export const isDateBlocked = async (targetDate: Date | string): Promise<boolean> => {
//   const blockedDates = await getBlockedDates();
//   const targetDateStr = typeof targetDate === 'string' 
//     ? targetDate 
//     : targetDate.toISOString().split('T')[0];
  
//   return blockedDates.some(blockedDate => {
//     // Check single date (legacy format)
//     if (blockedDate.date) {
//       return blockedDate.date === targetDateStr;
//     }
    
//     // Check date range
//     if (blockedDate.start_date && blockedDate.end_date) {
//       return targetDateStr >= blockedDate.start_date && targetDateStr <= blockedDate.end_date;
//     }
    
//     return false;
//   });
// };

// /**
//  * Get disabled dates for calendar components
//  */
// export const getDisabledDatesForCalendar = async (additionalDisabledDates?: Date[]): Promise<Date[]> => {
//   const blockedDates = await getBlockedDates();
//   const disabledDates: Date[] = [...(additionalDisabledDates || [])];
  
//   blockedDates.forEach(blockedDate => {
//     if (blockedDate.date) {
//       // Single date
//       disabledDates.push(new Date(blockedDate.date));
//     } else if (blockedDate.start_date && blockedDate.end_date) {
//       // Date range
//       const start = new Date(blockedDate.start_date);
//       const end = new Date(blockedDate.end_date);
//       const current = new Date(start);
      
//       while (current <= end) {
//         disabledDates.push(new Date(current));
//         current.setDate(current.getDate() + 1);
//       }
//     }
//   });
  
//   return disabledDates;
// };

// /**
//  * Clear all cached data (useful after admin changes)
//  */
// export const clearSystemCache = (): void => {
//   systemDefaultsCache = null;
//   blockedDatesCache = null;
//   cacheTimestamp = 0;
// };

// /**
//  * Enhanced version of generateLessonSchedulesFromPattern that respects blocked dates
//  */
// export const generateLessonSchedulesFromPattern = async (
//   courseInstanceSchedule: CourseInstanceSchedule,
//   lessons: any[],
//   courseStartDate: string,
//   courseEndDate?: string
// ): Promise<GeneratedLessonSchedule[]> => {
//   const generatedSchedules: GeneratedLessonSchedule[] = [];
//   const { days_of_week, time_slots, total_lessons, course_instance_id } = courseInstanceSchedule;
  
//   if (!days_of_week.length || !time_slots.length || !lessons.length) {
//     return generatedSchedules;
//   }

//   // בדיקה אם יש כבר שיעורים מתוזמנים להקצאה זו
//   const { data: existingSchedules } = await supabase
//     .from('lesson_schedules')
//     .select('*')
//     .eq('course_instance_id', course_instance_id)
//     .order('scheduled_start', { ascending: true });

//   const { data: existingReports } = await supabase
//     .from('reported_lesson_instances')
//     .select('lesson_id, lesson_number')
//     .eq('course_instance_id', course_instance_id);

//   // יצירת מפה של שיעורים שכבר תוזמנו
//   const scheduledLessonIds = new Set(existingSchedules?.map(s => s.lesson_id) || []);
//   const reportedLessonIds = new Set(existingReports?.map(r => r.lesson_id) || []);
  
//   // סינון שיעורים שטרם תוזמנו
//   const unscheduledLessons = lessons.filter(lesson => 
//     !scheduledLessonIds.has(lesson.id) && !reportedLessonIds.has(lesson.id)
//   );

//   if (unscheduledLessons.length === 0) {
//     console.log('All lessons are already scheduled');
//     return generatedSchedules;
//   }

//   // מציאת התאריך האחרון של שיעור מתוזמן
//   let startFromDate = new Date(courseStartDate);
  
//   if (existingSchedules && existingSchedules.length > 0) {
//     const lastScheduledDate = new Date(existingSchedules[existingSchedules.length - 1].scheduled_end);
//     // התחל מהשבוע הבא אחרי השיעור האחרון
//     startFromDate = new Date(lastScheduledDate);
//     startFromDate.setDate(startFromDate.getDate() + 1);
//   }

//   const endDateTime = courseEndDate ? new Date(courseEndDate) : null;
//   const maxLessons = total_lessons || lessons.length;
  
//   // מספר השיעורים שכבר תוזמנו
//   const existingLessonCount = existingSchedules?.length || 0;
  
//   // התחלת מספור השיעורים מהמספר הבא
//   let lessonCount = existingLessonCount;
//   let currentDate = new Date(startFromDate);
//   let scheduledCount = 0;

//   // מיון ימי השבוע
//   const sortedDays = [...days_of_week].sort();
  
//   // מחזור על השיעורים שטרם תוזמנו
//   while (scheduledCount < unscheduledLessons.length && lessonCount < maxLessons) {
//     const dayOfWeek = currentDate.getDay();
    
//     if (sortedDays.includes(dayOfWeek)) {
//       const timeSlot = time_slots.find(ts => ts.day === dayOfWeek);
      
//       if (timeSlot && timeSlot.start_time && timeSlot.end_time) {
//         // *** NEW: Check if date is blocked ***
//         const isBlocked = await isDateBlocked(currentDate);
        
//         if (!isBlocked) {
//           // בדיקת תאריך סיום
//           if (endDateTime && currentDate > endDateTime) {
//             break;
//           }

//           const dateStr = currentDate.toISOString().split('T')[0];
//           const scheduledStart = `${dateStr}T${timeSlot.start_time}:00`;
//           const scheduledEnd = `${dateStr}T${timeSlot.end_time}:00`;

//           // וודא שאין התנגשות עם שיעור קיים באותו זמן
//           const hasConflict = existingSchedules?.some(existing => {
//             const existingStart = new Date(existing.scheduled_start);
//             const existingEnd = new Date(existing.scheduled_end);
//             const newStart = new Date(scheduledStart);
//             const newEnd = new Date(scheduledEnd);
            
//             return (newStart >= existingStart && newStart < existingEnd) ||
//                    (newEnd > existingStart && newEnd <= existingEnd) ||
//                    (newStart <= existingStart && newEnd >= existingEnd);
//           });

//           if (!hasConflict) {
//             generatedSchedules.push({
//               id: `generated-${course_instance_id}-${lessonCount}`,
//               course_instance_id: course_instance_id,
//               lesson_id: unscheduledLessons[scheduledCount].id,
//               scheduled_start: scheduledStart,
//               scheduled_end: scheduledEnd,
//               lesson_number: lessonCount + 1,
//               lesson: unscheduledLessons[scheduledCount],
//             });

//             scheduledCount++;
//             lessonCount++;
//           }
//         } else {
//           // Log blocked date skip
//           console.log(`Skipping blocked date: ${currentDate.toISOString().split('T')[0]}`);
//         }
//       }
//     }

//     // מעבר ליום הבא
//     currentDate.setDate(currentDate.getDate() + 1);
    
//     // בדיקת בטיחות למניעת לולאה אינסופית
//     if (currentDate.getTime() - startFromDate.getTime() > 365 * 24 * 60 * 60 * 1000) {
//       console.warn('Schedule generation stopped: exceeded 1 year from start date');
//       break;
//     }
//   }

//   console.log(`Generated ${generatedSchedules.length} schedules, respecting blocked dates`);
//   return generatedSchedules;
// };

// /**
//  * Fetches course instance schedules and generates lesson schedules
//  * Updated to handle async properly
//  */
// // export const fetchAndGenerateSchedules = async (
// //   courseInstanceId?: string
// // ): Promise<GeneratedLessonSchedule[]> => {
// //   try {
// //     // Build query for course instance schedules
// //     let query = supabase
// //       .from('course_instance_schedules')
// //       .select(`
// //         *,
// //         course_instances:course_instance_id (
// //           id,
// //           course_id,
// //           start_date,
// //           end_date,
// //           course:course_id (
// //             id,
// //             name
// //           ),
// //           institution:institution_id (
// //             id,
// //             name
// //           ),
// //           instructor:instructor_id (
// //             id,
// //             full_name
// //           )
// //         )
// //       `);

// //     if (courseInstanceId) {
// //       query = query.eq('course_instance_id', courseInstanceId);
// //     }

// //     const { data: schedules, error: schedulesError } = await query;

// //     if (schedulesError) {
// //       console.error('Error fetching course instance schedules:', schedulesError);
// //       return [];
// //     }

// //     if (!schedules || schedules.length === 0) {
// //       return [];
// //     }

// //     const allGeneratedSchedules: GeneratedLessonSchedule[] = [];

// //     // For each course instance schedule, generate lesson schedules
// //     for (const schedule of schedules) {
// //       if (!schedule.course_instances) continue;

// //       // Fetch lessons for this course
// //       const { data: lessons, error: lessonsError } = await supabase
// //         .from('lessons')
// //         .select('id, title, course_id, order_index')
// //         .eq('course_id', schedule.course_instances.course_id)
// //         .order('order_index');

// //       if (lessonsError) {
// //         console.error('Error fetching lessons:', lessonsError);
// //         continue;
// //       }

// //       if (!lessons || lessons.length === 0) {
// //         continue;
// //       }

// //       // Generate schedules for this course instance - now async
// //       const generatedSchedules = await generateLessonSchedulesFromPattern(
// //         {
// //           id: schedule.id,
// //           course_instance_id: schedule.course_instance_id,
// //           days_of_week: schedule.days_of_week,
// //           time_slots: schedule.time_slots as TimeSlot[],
// //           total_lessons: schedule.total_lessons,
// //           lesson_duration_minutes: schedule.lesson_duration_minutes,
// //         },
// //         lessons,
// //         schedule.course_instances.start_date,
// //         schedule.course_instances.end_date
// //       );

// //       // Add course instance data to each generated schedule
// //       const schedulesWithCourseData = generatedSchedules.map(genSchedule => ({
// //         ...genSchedule,
// //         course_instances: schedule.course_instances,
// //       }));

// //       allGeneratedSchedules.push(...schedulesWithCourseData);
// //     }

// //     return allGeneratedSchedules;
// //   } catch (error) {
// //     console.error('Error in fetchAndGenerateSchedules:', error);
// //     return [];
// //   }
// // };

// export const fetchAndGenerateSchedules = async (
//   courseInstanceId?: string
// ): Promise<GeneratedLessonSchedule[]> => {
//   try {
//     // Build query for course instance schedules
//     let query = supabase
//       .from('course_instance_schedules')
//       .select(`
//         *,
//         course_instances:course_instance_id (
//           id,
//           course_id,
//           start_date,
//           end_date,
//           course:course_id (
//             id,
//             name
//           ),
//           institution:institution_id (
//             id,
//             name
//           ),
//           instructor:instructor_id (
//             id,
//             full_name
//           )
//         )
//       `);

//     if (courseInstanceId) {
//       query = query.eq('course_instance_id', courseInstanceId);
//     }

//     const { data: schedules, error: schedulesError } = await query;

//     if (schedulesError) {
//       console.error('Error fetching course instance schedules:', schedulesError);
//       return [];
//     }

//     if (!schedules || schedules.length === 0) {
//       return [];
//     }

//     const allGeneratedSchedules: GeneratedLessonSchedule[] = [];

//     // For each course instance schedule, generate lesson schedules
//     for (const schedule of schedules) {
//       if (!schedule.course_instances) continue;

//       // Fetch lessons for this course
//       const { data: lessons, error: lessonsError } = await supabase
//         .from('lessons')
//         .select('id, title, course_id, order_index')
//         .eq('course_id', schedule.course_instances.course_id)
//         .order('order_index');

//       if (lessonsError) {
//         console.error('Error fetching lessons:', lessonsError);
//         continue;
//       }

//       if (!lessons || lessons.length === 0) {
//         continue;
//       }

//       // *** FIXED: Use the async version that handles blocked dates ***
//       const generatedSchedules = await generateLessonSchedulesFromPattern(
//         {
//           id: schedule.id,
//           course_instance_id: schedule.course_instance_id,
//           days_of_week: schedule.days_of_week,
//           time_slots: schedule.time_slots as TimeSlot[],
//           total_lessons: schedule.total_lessons,
//           lesson_duration_minutes: schedule.lesson_duration_minutes,
//         },
//         lessons,
//         schedule.course_instances.start_date,
//         schedule.course_instances.end_date
//       );

//       // Add course instance data to each generated schedule
//       const schedulesWithCourseData = generatedSchedules.map(genSchedule => ({
//         ...genSchedule,
//         course_instances: schedule.course_instances,
//       }));

//       allGeneratedSchedules.push(...schedulesWithCourseData);
//     }

//     console.log(`Generated ${allGeneratedSchedules.length} total schedules, blocked dates were automatically skipped`);
//     return allGeneratedSchedules;
//   } catch (error) {
//     console.error('Error in fetchAndGenerateSchedules:', error);
//     return [];
//   }
// };

// /**
//  * Combines legacy lesson_schedules with new generated schedules
//  * Fixed to handle duplicates properly
//  */
// export const fetchCombinedSchedules = async (
//   courseInstanceId?: string
// ): Promise<any[]> => {
//   try {
//     // Fetch legacy lesson schedules
//     let legacyQuery = supabase
//       .from('lesson_schedules')
//       .select(`
//         id,
//         scheduled_start,
//         scheduled_end,
//         lesson_number,
//         lesson_id,
//         course_instance_id,
//         lesson:lesson_id (
//           id,
//           title,
//           order_index
//         ),
//         course_instances:course_instance_id (
//           id,
//           course:course_id (
//             id,
//             name
//           ),
//           institution:institution_id (
//             id,
//             name
//           ),
//           instructor:instructor_id (
//             id,
//             full_name
//           )
//         )
//       `);

//     if (courseInstanceId) {
//       legacyQuery = legacyQuery.eq('course_instance_id', courseInstanceId);
//     }

//     const { data: legacySchedules, error: legacyError } = await legacyQuery;

//     if (legacyError) {
//       console.error('Error fetching legacy schedules:', legacyError);
//     }

//     // Fetch new generated schedules
//     const generatedSchedules = await fetchAndGenerateSchedules(courseInstanceId);

//     // יצירת מפה למניעת כפילויות - מפתח משולב של course_instance_id + lesson_id
//     const scheduleMap = new Map<string, any>();
    
//     // הוספת לוחות זמנים קיימים (legacy) למפה - הם מקבלים עדיפות
//     legacySchedules?.forEach(schedule => {
//       const key = `${schedule.course_instance_id}_${schedule.lesson_id || schedule.lesson?.id}`;
//       scheduleMap.set(key, schedule);
//     });
    
//     // הוספת לוחות זמנים שנוצרו רק אם אין כבר לוח זמנים לאותו שיעור
//     generatedSchedules.forEach(schedule => {
//       const key = `${schedule.course_instance_id}_${schedule.lesson_id}`;
//       if (!scheduleMap.has(key)) {
//         scheduleMap.set(key, schedule);
//       }
//     });

//     // המרה חזרה למערך
//     const combinedSchedules = Array.from(scheduleMap.values());

//     // Sort by scheduled_start
//     combinedSchedules.sort((a, b) => {
//       const dateA = a.scheduled_start ? new Date(a.scheduled_start).getTime() : 0;
//       const dateB = b.scheduled_start ? new Date(b.scheduled_start).getTime() : 0;
//       return dateA - dateB;
//     });

//     console.log(`Combined schedules: ${legacySchedules?.length || 0} legacy, ${generatedSchedules.length} generated, ${combinedSchedules.length} total`);

//     return combinedSchedules;
//   } catch (error) {
//     console.error('Error in fetchCombinedSchedules:', error);
//     return [];
//   }
// };

// /**
//  * Filters schedules by date
//  */
// export const filterSchedulesByDate = (schedules: any[], targetDate: Date): any[] => {
//   const targetDateStr = targetDate.toISOString().split('T')[0];
  
//   return schedules.filter(schedule => {
//     if (!schedule.scheduled_start) return false;
//     const scheduleDate = new Date(schedule.scheduled_start).toISOString().split('T')[0];
//     return scheduleDate === targetDateStr;
//   });
// };

// /**
//  * Filters schedules by date range
//  */
// export const filterSchedulesByDateRange = (
//   schedules: any[], 
//   startDate: Date, 
//   endDate: Date
// ): any[] => {
//   return schedules.filter(schedule => {
//     if (!schedule.scheduled_start) return false;
//     const scheduleDate = new Date(schedule.scheduled_start);
//     return scheduleDate >= startDate && scheduleDate <= endDate;
//   });
// };

import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { getCancelledLessonsInDateRange } from "@/services/cancellationService";

interface TimeSlot {
  day: number;
  start_time: string;
  end_time: string;
  first_lesson_date?: string;
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
  is_generated?: boolean; // להבדיל בין generated ל-saved
}

// === NEW SYSTEM CONFIGURATION INTERFACES ===
export interface SystemDefaults {
  id?: string;
  default_lesson_duration: number;
  default_task_duration: number;
  default_break_duration: number;
  created_at?: string;
  updated_at?: string;
}

export interface BlockedDate {
  id: string;
  date?: string;
  start_date?: string;
  end_date?: string;
  reason?: string;
  created_at?: string;
  created_by?: string;
}

// Cache for better performance
let systemDefaultsCache: SystemDefaults | null = null;
let blockedDatesCache: BlockedDate[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const formatDateLocal = (date: Date): string => {
  return (
    date.getFullYear() +
    "-" +
    String(date.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(date.getDate()).padStart(2, "0")
  );
};

export const getSystemDefaults = async (forceRefresh: boolean = false): Promise<SystemDefaults> => {
  const now = Date.now();
  
  if (!forceRefresh && systemDefaultsCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return systemDefaultsCache;
  }

  try {
    const { data, error } = await supabase
      .from('system_defaults')
      .select('*')
      .single();
    
    if (error && error.code === 'PGRST116') {
      const defaultValues: SystemDefaults = {
        default_lesson_duration: 45,
        default_task_duration: 15,
        default_break_duration: 10
      };
      
      const { data: newDefaults, error: insertError } = await supabase
        .from('system_defaults')
        .insert([defaultValues])
        .select()
        .single();
      
      if (insertError) throw insertError;
      
      systemDefaultsCache = newDefaults;
      cacheTimestamp = now;
      return newDefaults;
    }
    
    if (error) throw error;
    
    systemDefaultsCache = data;
    cacheTimestamp = now;
    return data;
  } catch (error) {
    console.error('Error fetching system defaults:', error);
    return {
      default_lesson_duration: 45,
      default_task_duration: 15,
      default_break_duration: 10
    };
  }
};

export const updateSystemDefaults = async (defaults: Partial<SystemDefaults>): Promise<boolean> => {
  try {
    const current = await getSystemDefaults();
    const { error } = await supabase
      .from('system_defaults')
      .update({
        ...defaults,
        updated_at: new Date().toISOString()
      })
      .eq('id', current.id);
    
    if (error) throw error;
    
    systemDefaultsCache = null;
    return true;
  } catch (error) {
    console.error('Error updating system defaults:', error);
    return false;
  }
};

export const getBlockedDates = async (forceRefresh: boolean = false): Promise<BlockedDate[]> => {
  const now = Date.now();
  
  if (!forceRefresh && blockedDatesCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return blockedDatesCache;
  }

  try {
    const { data, error } = await supabase
      .from('blocked_dates')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    blockedDatesCache = data || [];
    cacheTimestamp = now;
    return data || [];
  } catch (error) {
    console.error('Error fetching blocked dates:', error);
    return [];
  }
};

export const isDateBlocked = async (targetDate: Date | string): Promise<boolean> => {
  const blockedDates = await getBlockedDates();
  const targetDateStr = typeof targetDate === 'string' 
    ? targetDate 
    : targetDate.toISOString().split('T')[0];
  
  return blockedDates.some(blockedDate => {
    if (blockedDate.date) {
      return blockedDate.date === targetDateStr;
    }
    
    if (blockedDate.start_date && blockedDate.end_date) {
      return targetDateStr >= blockedDate.start_date && targetDateStr <= blockedDate.end_date;
    }
    
    return false;
  });
};

export const getDisabledDatesForCalendar = async (additionalDisabledDates?: Date[]): Promise<Date[]> => {
  const blockedDates = await getBlockedDates();
  const disabledDates: Date[] = [...(additionalDisabledDates || [])];
  
  blockedDates.forEach(blockedDate => {
    if (blockedDate.date) {
      disabledDates.push(new Date(blockedDate.date));
    } else if (blockedDate.start_date && blockedDate.end_date) {
      const start = new Date(blockedDate.start_date);
      const end = new Date(blockedDate.end_date);
      const current = new Date(start);
      
      while (current <= end) {
        disabledDates.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
    }
  });
  
  return disabledDates;
};

export const clearSystemCache = (): void => {
  systemDefaultsCache = null;
  blockedDatesCache = null;
  cacheTimestamp = 0;
};

/**
 * Enhanced version that doesn't exclude reported lessons from generation
 * Only excludes lessons that have actual saved schedules
 */
export const generateLessonSchedulesFromPattern = async (
  courseInstanceSchedule: CourseInstanceSchedule,
  lessons: any[],
  courseStartDate: string,
  courseEndDate?: string
): Promise<GeneratedLessonSchedule[]> => {
  const generatedSchedules: GeneratedLessonSchedule[] = [];
  const { days_of_week, time_slots, total_lessons, course_instance_id } = courseInstanceSchedule;
  
  if (!days_of_week.length || !time_slots.length || !lessons.length) {
    return generatedSchedules;
  }

  // בדיקת שיעורים מדווחים
  const { data: existingReports } = await supabase
    .from('reported_lesson_instances')
    .select('lesson_id, lesson_number, scheduled_date')
    .eq('course_instance_id', course_instance_id)
    .order('lesson_number', { ascending: true });

  // בדיקת שיעורים שתוזמנו מחדש
  const { data: rescheduledLessons } = await supabase
    .from('lesson_cancellations')
    .select('lesson_id, original_scheduled_date, rescheduled_to_date')
    .eq('course_instance_id', course_instance_id)
    .eq('is_rescheduled', true);

  // יצירת מפה של שיעורים מדווחים
  const reportedLessonsMap = new Map();
  const reportedLessonIds = new Set();
  
  existingReports?.forEach(report => {
    reportedLessonIds.add(report.lesson_id);
    reportedLessonsMap.set(report.lesson_id, {
      lesson_number: report.lesson_number,
      scheduled_date: report.scheduled_date
    });
  });

  // יצירת מפה של שיעורים מתוזמנים מחדש
  const rescheduledLessonsMap = new Map();
  const cancelledDatesSet = new Set<string>();
  
  console.log('Rescheduled lessons data:', rescheduledLessons);
  
  rescheduledLessons?.forEach(reschedule => {
    rescheduledLessonsMap.set(reschedule.lesson_id, {
      original_date: reschedule.original_scheduled_date,
      new_date: reschedule.rescheduled_to_date
    });
    cancelledDatesSet.add(reschedule.original_scheduled_date);
    
    console.log('Added to rescheduled map:', {
      lessonId: reschedule.lesson_id,
      originalDate: reschedule.original_scheduled_date,
      newDate: reschedule.rescheduled_to_date
    });
  });
  
  // כל השיעורים יקבלו תזמון
  const allLessons = lessons;

  // מציאת התאריך ההתחלתי לתזמון
  let currentDate = new Date(courseStartDate);
  
  // מצא את היום הראשון המתאים בפטרן
  while (!days_of_week.includes(currentDate.getDay())) {
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const endDateTime = courseEndDate ? new Date(courseEndDate) : null;
  const maxLessons = total_lessons || lessons.length;
  
  let lessonIndex = 0;
  let lessonNumber = 1;
  const sortedDays = [...days_of_week].sort();
  
  // יצירת תזמון לכל השיעורים עם התחשבות בביטולים
  while (lessonIndex < allLessons.length && lessonNumber <= maxLessons) {
    const dayOfWeek = currentDate.getDay();
    
    if (sortedDays.includes(dayOfWeek)) {
      const timeSlot = time_slots.find(ts => ts.day === dayOfWeek);
      
      if (timeSlot && timeSlot.start_time && timeSlot.end_time) {
        const isBlocked = await isDateBlocked(currentDate);
        
        if (!isBlocked) {
          if (endDateTime && currentDate > endDateTime) {
            break;
          }

          const dateStr = currentDate.toISOString().split('T')[0];
          const scheduledStart = `${dateStr}T${timeSlot.start_time}:00`;
          const scheduledEnd = `${dateStr}T${timeSlot.end_time}:00`;
          
          // בדוק אם יש שיעור מבוטל בתאריך הזה
          const cancelledLessonForThisDate = Array.from(rescheduledLessonsMap.entries())
            .find(([lessonId, info]) => info.original_date === dateStr);
          
          if (cancelledLessonForThisDate) {
            // הוסף את השיעור המבוטל בתאריך המקורי (מוצג כמבוטל)
            const [cancelledLessonId, cancelInfo] = cancelledLessonForThisDate;
            const cancelledLesson = allLessons.find(l => l.id === cancelledLessonId);
            
            if (cancelledLesson) {
              generatedSchedules.push({
                id: `cancelled-${course_instance_id}-${cancelledLessonId}-${dateStr}`,
                course_instance_id: course_instance_id,
                lesson_id: cancelledLesson.id,
                scheduled_start: scheduledStart,
                scheduled_end: scheduledEnd,
                lesson_number: lessonNumber,
                lesson: cancelledLesson,
                is_generated: true,
                is_reported: reportedLessonIds.has(cancelledLesson.id),
                is_cancelled: true
              });
            }
            
            // לא מתקדמים ב-lessonIndex כי השיעור המבוטל יוצג שוב בתאריך הבא
          } else {
            // הוסף שיעור רגיל
            if (lessonIndex < allLessons.length) {
              const currentLesson = allLessons[lessonIndex];
              
              // בדוק אם השיעור כבר דווח
              const isReported = reportedLessonIds.has(currentLesson.id);
              
              // בדוק אם זה שיעור שנדחה (יש לו ביטול אבל הוא מוצג בתאריך חדש)
              const isRescheduledInstance = rescheduledLessonsMap.has(currentLesson.id);
              
              // Debug logging for rescheduled lessons
              if (isRescheduledInstance) {
                console.log('Creating rescheduled lesson:', {
                  lessonTitle: currentLesson.title,
                  lessonId: currentLesson.id,
                  newDate: dateStr,
                  originalDate: rescheduledLessonsMap.get(currentLesson.id)?.original_date,
                  isRescheduled: true
                });
              }
              
              generatedSchedules.push({
                id: `generated-${course_instance_id}-${lessonNumber}`,
                course_instance_id: course_instance_id,
                lesson_id: currentLesson.id,
                scheduled_start: scheduledStart,
                scheduled_end: scheduledEnd,
                lesson_number: lessonNumber,
                lesson: currentLesson,
                is_generated: true,
                is_reported: isReported && !isRescheduledInstance, // אם השיעור נדחה, הוא לא נחשב כדווח
                is_cancelled: false,
                is_rescheduled: isRescheduledInstance
              });

              lessonIndex++;
            }
          }
          
          lessonNumber++;
        } else {
          console.log(`Skipping blocked date: ${dateStr}`);
        }
      }
    }

    currentDate.setDate(currentDate.getDate() + 1);
    
    if (currentDate.getTime() - new Date(courseStartDate).getTime() > 365 * 24 * 60 * 60 * 1000) {
      console.warn('Schedule generation stopped: exceeded 1 year from start date');
      break;
    }
  }

  console.log(`Generated ${generatedSchedules.length} schedules (including reported lessons)`);
  return generatedSchedules;
};

// export const fetchAndGenerateSchedules = async (
//   courseInstanceId?: string
// ): Promise<GeneratedLessonSchedule[]> => {
//   try {
//     let query = supabase
//       .from('course_instance_schedules')
//       .select(`
//         *,
//         course_instances:course_instance_id (
//           id,
//           course_id,
//           start_date,
//           end_date,
//           grade_level,
//           course:course_id (
//             id,
//             name
//           ),
//           institution:institution_id (
//             id,
//             name
//           ),
//           instructor:instructor_id (
//             id,
//             full_name
//           )
//         )
//       `);

//     if (courseInstanceId) {
//       query = query.eq('course_instance_id', courseInstanceId);
//     }

//     const { data: schedules, error: schedulesError } = await query;

//     if (schedulesError) {
//       console.error('Error fetching course instance schedules:', schedulesError);
//       return [];
//     }

//     if (!schedules || schedules.length === 0) {
//       return [];
//     }

//     const allGeneratedSchedules: GeneratedLessonSchedule[] = [];

//     for (const schedule of schedules) {
//       if (!schedule.course_instances) continue;

//       // const { data: lessons, error: lessonsError } = await supabase
//       //   .from('lessons')
//       //   .select('id, title, course_id, order_index')
//       //   .eq('course_id', schedule.course_instances.course_id)
//       //   .order('order_index');
//       const { data: lessons, error: lessonsError } = await supabase
//         .from('lessons')
//         .select('id, title, course_id, order_index, course_instance_id')
//         .eq('course_id', schedule.course_instances.course_id)
//         .or(`course_instance_id.is.null,course_instance_id.eq.${schedule.course_instance_id}`)
//         .order('order_index');
//       if (lessonsError) {
//         console.error('Error fetching lessons:', lessonsError);
//         continue;
//       }

//       if (!lessons || lessons.length === 0) {
//         continue;
//       }

//       const generatedSchedules = await generateLessonSchedulesFromPattern(
//         {
//           id: schedule.id,
//           course_instance_id: schedule.course_instance_id,
//           days_of_week: schedule.days_of_week,
//           time_slots: schedule.time_slots as TimeSlot[],
//           total_lessons: schedule.total_lessons,
//           lesson_duration_minutes: schedule.lesson_duration_minutes,
//         },
//         lessons,
//         schedule.course_instances.start_date,
//         schedule.course_instances.end_date
//       );

//       const schedulesWithCourseData = generatedSchedules.map(genSchedule => ({
//         ...genSchedule,
//         course_instances: schedule.course_instances,
//       }));

//       allGeneratedSchedules.push(...schedulesWithCourseData);
//     }

//     console.log(`Generated ${allGeneratedSchedules.length} total schedules`);
//     return allGeneratedSchedules;
//   } catch (error) {
//     console.error('Error in fetchAndGenerateSchedules:', error);
//     return [];
//   }
// };



export const fetchAndGenerateSchedules = async (
  courseInstanceId?: string
): Promise<GeneratedLessonSchedule[]> => {
  try {
    let query = supabase
      .from('course_instance_schedules')
      .select(`
        *,
        course_instances:course_instance_id (
          id,
          course_id,
          start_date,
          end_date,
          grade_level,
          lesson_mode,
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

    for (const schedule of schedules) {
      if (!schedule.course_instances) continue;

      // קבל את lesson_mode של ההקצאה (ברירת מחדל: template)
      const lessonMode = schedule.course_instances.lesson_mode || 'template';
      
      console.log(`Processing instance ${schedule.course_instance_id} with lesson_mode: ${lessonMode}`);

      // שלוף שיעורים ייחודיים
      const { data: instanceLessons, error: instanceError } = await supabase
        .from('lessons')
        .select('id, title, course_id, order_index, course_instance_id')
        .eq('course_instance_id', schedule.course_instance_id)
        .order('order_index');

      if (instanceError) {
        console.error('Error fetching instance lessons:', instanceError);
      }

      // שלוף שיעורי תבנית
      const { data: templateLessons, error: templateError } = await supabase
        .from('lessons')
        .select('id, title, course_id, order_index, course_instance_id')
        .eq('course_id', schedule.course_instances.course_id)
        .is('course_instance_id', null)
        .order('order_index');

      if (templateError) {
        console.error('Error fetching template lessons:', templateError);
      }

      let lessons: any[] = [];

      // *** החלטה לפי lesson_mode ***
      switch (lessonMode) {
        case 'custom_only':
          // רק שיעורים ייחודיים
          lessons = instanceLessons || [];
          console.log(`Using ${lessons.length} custom-only lessons`);
          break;
          
        case 'combined':
          // שני הסוגים ביחד - ממוינים לפי order_index
          const combined = [
            ...(templateLessons || []),
            ...(instanceLessons || [])
          ].sort((a, b) => a.order_index - b.order_index);
          lessons = combined;
          console.log(`Using ${templateLessons?.length || 0} template + ${instanceLessons?.length || 0} custom lessons (total: ${combined.length})`);
          break;
          
        case 'template':
        default:
          // רק שיעורי תבנית (ברירת מחדל)
          lessons = templateLessons || [];
          console.log(`Using ${lessons.length} template lessons`);
          break;
      }

      if (!lessons || lessons.length === 0) {
        console.log(`No lessons found for course instance ${schedule.course_instance_id}`);
        continue;
      }

      const generatedSchedules = await generateLessonSchedulesWithCancellations(
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

      const schedulesWithCourseData = generatedSchedules.map(genSchedule => ({
        ...genSchedule,
        course_instances: schedule.course_instances,
      }));

      allGeneratedSchedules.push(...schedulesWithCourseData);
    }

    console.log(`Generated ${allGeneratedSchedules.length} total schedules`);
    return allGeneratedSchedules;
  } catch (error) {
    console.error('Error in fetchAndGenerateSchedules:', error);
    return [];
  }
};
export const fetchCombinedSchedules = async (
  courseInstanceId?: string
): Promise<any[]> => {
  try {
    // Fetch generated schedules מה-pattern
    const generatedSchedules = await fetchAndGenerateSchedules(courseInstanceId);

    // הלוחות זמנים כבר ממוינים ומסודרים
    console.log(`Generated ${generatedSchedules.length} schedules from pattern`);

    return generatedSchedules;
  } catch (error) {
    console.error('Error in fetchCombinedSchedules:', error);
    return [];
  }
};

/**
 * Helper function - not needed in new architecture
 * @deprecated The new system doesn't use lesson_schedules table
 */
export const saveGeneratedScheduleToDatabase = async (
  courseInstanceId: string,
  lessonId: string,
  scheduledStart: string,
  scheduledEnd: string,
  lessonNumber: number
): Promise<string | null> => {
  console.warn('saveGeneratedScheduleToDatabase is deprecated - new architecture uses course_instance_schedules pattern');
  return null;
};

export const filterSchedulesByDate = (schedules: any[], targetDate: Date): any[] => {
  const targetDateStr = targetDate.toISOString().split('T')[0];
  
  return schedules.filter(schedule => {
    if (!schedule.scheduled_start) return false;
    const scheduleDate = new Date(schedule.scheduled_start).toISOString().split('T')[0];
    return scheduleDate === targetDateStr;
  });
};

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

/**
 * Enhanced version that handles cancellations and rescheduling properly:
 * 1. Shows cancelled lessons in their original dates (marked as cancelled)
 * 2. Shows rescheduled lessons in their new dates (marked as rescheduled)
 * 3. Continues the schedule from after the cancelled date, effectively adding one more lesson
 */
export const generateLessonSchedulesWithCancellations = async (
  courseInstanceSchedule: CourseInstanceSchedule,
  lessons: any[],
  courseStartDate: string,
  courseEndDate?: string
): Promise<GeneratedLessonSchedule[]> => {
  const generatedSchedules: GeneratedLessonSchedule[] = [];
  const { days_of_week, time_slots, total_lessons, course_instance_id } = courseInstanceSchedule;
  
  if (!days_of_week.length || !time_slots.length || !lessons.length) {
    return generatedSchedules;
  }

  // Get cancelled lessons for this course instance
  const startDateStr = courseStartDate;
  const endDateStr = courseEndDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const cancelledLessons = await getCancelledLessonsInDateRange(
    course_instance_id,
    startDateStr,
    endDateStr
  );

  // Create maps for cancelled lessons
  const cancelledDatesMap = new Map();
  const rescheduledLessonsMap = new Map();
  
  cancelledLessons.forEach(cancellation => {
    cancelledDatesMap.set(cancellation.original_scheduled_date, {
      lesson_id: cancellation.lesson_id,
      reason: cancellation.cancellation_reason,
      is_rescheduled: cancellation.is_rescheduled
    });
    
    // If this lesson is rescheduled, add it to the rescheduled map
    if (cancellation.is_rescheduled) {
      rescheduledLessonsMap.set(cancellation.lesson_id, {
        original_date: cancellation.original_scheduled_date,
        new_date: cancellation.rescheduled_to_date,
        reason: cancellation.cancellation_reason
      });
    }
  });

  console.log('Cancelled lessons data:', cancelledLessons);
  console.log('Rescheduled lessons map:', rescheduledLessonsMap);

  // בדיקת שיעורים מדווחים
  const { data: existingReports } = await supabase
    .from('reported_lesson_instances')
    .select('lesson_id, lesson_number, scheduled_date')
    .eq('course_instance_id', course_instance_id)
    .order('lesson_number', { ascending: true });

  const reportedLessonsMap = new Map();
  const reportedLessonIds = new Set();
  
  existingReports?.forEach(report => {
    reportedLessonIds.add(report.lesson_id);
    reportedLessonsMap.set(report.lesson_id, {
      lesson_number: report.lesson_number,
      scheduled_date: report.scheduled_date
    });
  });

  // מציאת התאריך ההתחלתי לתזמון
  let currentDate = new Date(courseStartDate);
  
  // מצא את היום הראשון המתאים בפטרן
  while (!days_of_week.includes(currentDate.getDay())) {
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const endDateTime = courseEndDate ? new Date(courseEndDate) : null;
  // Add extra lessons for each cancellation to accommodate rescheduling
  const maxLessons = (total_lessons || lessons.length) + cancelledLessons.length;
  
  let lessonIndex = 0;
  let lessonNumber = 1;
  const sortedDays = [...days_of_week].sort();
  
  // יצירת תזמון לכל השיעורים
  while (lessonIndex < lessons.length && lessonNumber <= maxLessons) {
    const dayOfWeek = currentDate.getDay();
    
    if (sortedDays.includes(dayOfWeek)) {
      const timeSlot = time_slots.find(ts => ts.day === dayOfWeek);
      
      if (timeSlot && timeSlot.start_time && timeSlot.end_time) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const isBlocked = await isDateBlocked(currentDate);
        const cancelledLesson = cancelledDatesMap.get(dateStr);
        
        if (!isBlocked) {
          if (endDateTime && currentDate > endDateTime) {
            break;
          }

          const scheduledStart = `${dateStr}T${timeSlot.start_time}:00`;
          const scheduledEnd = `${dateStr}T${timeSlot.end_time}:00`;
          
          if (cancelledLesson) {
            // This date has a cancelled lesson - show it as cancelled
            const cancelledLessonData = lessons.find(l => l.id === cancelledLesson.lesson_id);
            if (cancelledLessonData) {
              generatedSchedules.push({
                id: `cancelled-${course_instance_id}-${dateStr}`,
                course_instance_id: course_instance_id,
                lesson_id: cancelledLessonData.id,
                scheduled_start: scheduledStart,
                scheduled_end: scheduledEnd,
                lesson_number: lessonNumber,
                lesson: cancelledLessonData,
                is_generated: true,
                is_reported: true,
                is_cancelled: true,
                cancellation_reason: cancelledLesson.reason
              });
            }
          } else {
            // Regular lesson
            const currentLesson = lessons[lessonIndex];
            const isReported = reportedLessonIds.has(currentLesson.id);
            
            // Check if this lesson is rescheduled
            const isRescheduled = rescheduledLessonsMap.has(currentLesson.id);
            
            // Debug logging for rescheduled lessons
            if (isRescheduled) {
              console.log('Creating rescheduled lesson:', {
                lessonTitle: currentLesson.title,
                lessonId: currentLesson.id,
                newDate: dateStr,
                originalDate: rescheduledLessonsMap.get(currentLesson.id)?.original_date,
                isRescheduled: true
              });
            }
            
            generatedSchedules.push({
              id: `generated-${course_instance_id}-${lessonNumber}`,
              course_instance_id: course_instance_id,
              lesson_id: currentLesson.id,
              scheduled_start: scheduledStart,
              scheduled_end: scheduledEnd,
              lesson_number: lessonNumber,
              lesson: currentLesson,
              is_generated: true,
              is_reported: isReported && !isRescheduled, // If rescheduled, it's not considered reported
              is_cancelled: false,
              is_rescheduled: isRescheduled
            });

            lessonIndex++;
          }
          
          lessonNumber++;
        } else {
          console.log(`Skipping blocked date: ${dateStr}`);
        }
      }
    }

    currentDate.setDate(currentDate.getDate() + 1);
    
    if (currentDate.getTime() - new Date(courseStartDate).getTime() > 365 * 24 * 60 * 60 * 1000) {
      console.warn('Schedule generation stopped: exceeded 1 year from start date');
      break;
    }
  }

  // Add rescheduled lessons to the schedule
  // This ensures that cancelled lessons appear again in the new schedule
  for (const [lessonId, rescheduleInfo] of rescheduledLessonsMap.entries()) {
    const rescheduledLesson = lessons.find(l => l.id === lessonId);
    if (rescheduledLesson) {
      // Find the next available date for this rescheduled lesson
      let rescheduleDate = new Date(rescheduleInfo.original_date);
      rescheduleDate.setDate(rescheduleDate.getDate() + 1);
      
      // Find the next available slot
      while (rescheduleDate <= (endDateTime || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000))) {
        const dayOfWeek = rescheduleDate.getDay();
        const dateStr = rescheduleDate.toISOString().split('T')[0];
        
        if (sortedDays.includes(dayOfWeek)) {
          const timeSlot = time_slots.find(ts => ts.day === dayOfWeek);
          const isBlocked = await isDateBlocked(rescheduleDate);
          const isAlreadyScheduled = generatedSchedules.some(s => 
            s.scheduled_start?.startsWith(dateStr) && s.course_instance_id === course_instance_id
          );
          
          if (timeSlot && timeSlot.start_time && timeSlot.end_time && !isBlocked && !isAlreadyScheduled) {
            const scheduledStart = `${dateStr}T${timeSlot.start_time}:00`;
            const scheduledEnd = `${dateStr}T${timeSlot.end_time}:00`;
            
            generatedSchedules.push({
              id: `rescheduled-${course_instance_id}-${lessonId}`,
              course_instance_id: course_instance_id,
              lesson_id: lessonId,
              scheduled_start: scheduledStart,
              scheduled_end: scheduledEnd,
              lesson_number: generatedSchedules.length + 1,
              lesson: rescheduledLesson,
              is_generated: true,
              is_reported: false, // Rescheduled lessons are not considered reported
              is_cancelled: false,
              is_rescheduled: true
            });
            
            console.log('Added rescheduled lesson to schedule:', {
              lessonTitle: rescheduledLesson.title,
              lessonId: lessonId,
              newDate: dateStr,
              originalDate: rescheduleInfo.original_date
            });
            
            break; // Found a slot, move to next rescheduled lesson
          }
        }
        
        rescheduleDate.setDate(rescheduleDate.getDate() + 1);
      }
    }
  }

  // Sort the generated schedules by scheduled_start to ensure proper order
  generatedSchedules.sort((a, b) => {
    const dateA = new Date(a.scheduled_start).getTime();
    const dateB = new Date(b.scheduled_start).getTime();
    return dateA - dateB;
  });

  // Update lesson numbers to be sequential
  generatedSchedules.forEach((schedule, index) => {
    schedule.lesson_number = index + 1;
  });

  console.log(`Generated ${generatedSchedules.length} schedules with proper cancellation and rescheduling handling`);
  console.log('Final schedules:', generatedSchedules.map(s => ({
    id: s.id,
    lesson_title: s.lesson?.title,
    lesson_number: s.lesson_number,
    scheduled_start: s.scheduled_start,
    is_rescheduled: s.is_rescheduled,
    is_cancelled: s.is_cancelled
  })));
  return generatedSchedules;
};

/**
 * Reschedule all lessons after a specific cancelled date
 * This function regenerates the schedule pattern starting from the cancellation date
 */
export const rescheduleAfterCancellation = async (
  courseInstanceId: string,
  cancellationDate: string
): Promise<boolean> => {
  try {
    console.log(`Rescheduling lessons after cancellation on ${cancellationDate} for course instance ${courseInstanceId}`);
    
    // The rescheduling is automatically handled by the generateLessonSchedulesWithCancellations function
    // When lessons are generated, cancelled dates are skipped and subsequent lessons are automatically moved forward
    
    // Trigger a refresh of the schedule cache if needed
    clearSystemCache();
    
    return true;
  } catch (error) {
    console.error('Error in rescheduleAfterCancellation:', error);
    return false;
  }
};

/**
 * Get the next available lesson date after cancellations
 */
export const getNextAvailableLessonDate = async (
  courseInstanceSchedule: CourseInstanceSchedule,
  afterDate: Date
): Promise<Date | null> => {
  const { days_of_week, course_instance_id } = courseInstanceSchedule;
  
  if (!days_of_week.length) {
    return null;
  }

  // Get cancelled lessons to avoid them
  const endDateStr = new Date(afterDate.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const cancelledLessons = await getCancelledLessonsInDateRange(
    course_instance_id,
    afterDate.toISOString().split('T')[0],
    endDateStr
  );

  const cancelledDates = new Set(
    cancelledLessons.map(cancellation => cancellation.original_scheduled_date)
  );

  let currentDate = new Date(afterDate);
  currentDate.setDate(currentDate.getDate() + 1); // Start from the day after
  
  const sortedDays = [...days_of_week].sort();
  
  // Find the next available date
  for (let i = 0; i < 365; i++) { // Safety limit of 1 year
    const dayOfWeek = currentDate.getDay();
    const dateStr = currentDate.toISOString().split('T')[0];
    
    if (sortedDays.includes(dayOfWeek)) {
      const isBlocked = await isDateBlocked(currentDate);
      const isCancelled = cancelledDates.has(dateStr);
      
      if (!isBlocked && !isCancelled) {
        return currentDate;
      }
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return null; // No available date found within a year
};