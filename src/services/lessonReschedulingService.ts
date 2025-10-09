import { supabase } from "@/integrations/supabase/client";
import { isDateBlocked } from "@/utils/scheduleUtils";

export interface RescheduleResult {
  success: boolean;
  newDate?: string;
  message: string;
  error?: string;
}

/**
 * Reschedule a cancelled lesson: keep it in original date (as cancelled) + add it to next available date
 * All subsequent lessons also shift forward by one slot
 * This is called when a lesson is reported as "לא התקיים" in the lesson report
 */
export async function rescheduleSpecificLesson(
  courseInstanceId: string,
  lessonId: string,
  originalDate: string,
  cancellationReason: string
): Promise<RescheduleResult> {
  try {
    // 1. Create cancellation record for the original date
    const { error: cancellationError } = await supabase
      .from('lesson_cancellations')
      .insert({
        course_instance_id: courseInstanceId,
        lesson_id: lessonId,
        original_scheduled_date: originalDate,
        cancellation_reason: cancellationReason,
        is_rescheduled: true
      });

    if (cancellationError) {
      console.error('Error creating cancellation record:', cancellationError);
      return {
        success: false,
        message: 'שגיאה ביצירת רשומת ביטול',
        error: cancellationError.message
      };
    }

    // 2. The schedule generation logic will now automatically:
    //    - Show the cancelled lesson in its original date (marked as cancelled)
    //    - Generate all lessons (including the cancelled one) starting from the next available date
    //    - This effectively adds one more lesson to the total schedule

    return {
      success: true,
      message: `השיעור בוטל בתאריך המקורי ויתוזמן מחדש יחד עם כל השיעורים הבאים`
    };

  } catch (error) {
    console.error('Error in rescheduleSpecificLesson:', error);
    return {
      success: false,
      message: 'שגיאה בתזמון מחדש של השיעור',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Find the next available date for a lesson based on the course schedule pattern
 */
async function findNextAvailableDate(
  scheduleData: any,
  originalDate: string,
  occupiedDates: Set<string>
): Promise<string | null> {
  const { days_of_week, time_slots } = scheduleData;
  const courseEndDate = scheduleData.course_instances?.end_date;
  
  if (!days_of_week?.length || !time_slots?.length) {
    return null;
  }

  // Start searching from the day after the original date
  let currentDate = new Date(originalDate);
  currentDate.setDate(currentDate.getDate() + 1);
  
  const endDate = courseEndDate ? new Date(courseEndDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  const maxIterations = 365; // Safety limit
  let iterations = 0;

  while (currentDate <= endDate && iterations < maxIterations) {
    const dayOfWeek = currentDate.getDay();
    const dateStr = currentDate.toISOString().split('T')[0];
    
    // Check if this day is in the schedule pattern
    if (days_of_week.includes(dayOfWeek)) {
      // Check if date is not blocked, not occupied, and not already cancelled
      const isBlocked = await isDateBlocked(currentDate);
      const isOccupied = occupiedDates.has(dateStr);
      
      if (!isBlocked && !isOccupied) {
        return dateStr;
      }
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
    iterations++;
  }
  
  return null; // No available date found
}

/**
 * Format date for display in Hebrew
 */
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('he-IL');
  } catch (error) {
    return dateStr;
  }
}

/**
 * Get all rescheduled lessons for a course instance
 */
export async function getRescheduledLessons(courseInstanceId: string) {
  try {
    const { data, error } = await supabase
      .from('lesson_cancellations')
      .select(`
        *,
        lessons:lesson_id (
          id,
          title
        )
      `)
      .eq('course_instance_id', courseInstanceId)
      .eq('is_rescheduled', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching rescheduled lessons:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getRescheduledLessons:', error);
    return [];
  }
}