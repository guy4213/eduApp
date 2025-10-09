import { supabase } from "@/integrations/supabase/client";
import { clearSystemCache } from "@/utils/scheduleUtils";

export interface LessonCancellation {
  id: string;
  course_instance_id: string;
  lesson_id: string;
  original_scheduled_date: string;
  cancellation_reason?: string;
  cancelled_by?: string;
  cancelled_at: string;
  is_rescheduled: boolean;
  rescheduled_to_date?: string;
  created_at: string;
  updated_at: string;
}

export interface CancellationHistoryItem {
  cancellation_id: string;
  lesson_title: string;
  original_date: string;
  cancellation_reason?: string;
  cancelled_by_name?: string;
  cancelled_at: string;
  is_rescheduled: boolean;
  rescheduled_to_date?: string;
}

export interface CancelLessonRequest {
  courseInstanceId: string;
  lessonId: string;
  originalDate: string;
  cancellationReason?: string;
}

export interface CancelLessonResponse {
  success: boolean;
  cancellation_id?: string;
  message: string;
  error?: string;
  affected_lessons?: number;
}

/**
 * Cancel a lesson and mark it for rescheduling
 */
export async function cancelLesson(request: CancelLessonRequest): Promise<CancelLessonResponse> {
  try {
    // Validate that we have a proper UUID for lesson_id
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(request.lessonId)) {
      return {
        success: false,
        message: 'מזהה השיעור אינו תקין',
        error: 'Invalid lesson ID format'
      };
    }

    const { data, error } = await supabase.rpc('cancel_lesson_and_reschedule', {
      p_course_instance_id: request.courseInstanceId,
      p_lesson_id: request.lessonId,
      p_original_date: request.originalDate,
      p_cancellation_reason: request.cancellationReason || null
    });

    if (error) {
      console.error('Error cancelling lesson:', error);
      return {
        success: false,
        message: 'שגיאה בביטול השיעור',
        error: error.message
      };
    }

    return data as CancelLessonResponse;
  } catch (error) {
    console.error('Error in cancelLesson:', error);
    return {
      success: false,
      message: 'שגיאה בביטול השיעור',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get cancellation history for a course instance
 */
export async function getCancellationHistory(courseInstanceId: string): Promise<CancellationHistoryItem[]> {
  try {
    const { data, error } = await supabase.rpc('get_cancellation_history', {
      p_course_instance_id: courseInstanceId
    });

    if (error) {
      console.error('Error fetching cancellation history:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getCancellationHistory:', error);
    return [];
  }
}

/**
 * Get all cancellations for a course instance
 */
export async function getLessonCancellations(courseInstanceId: string): Promise<LessonCancellation[]> {
  try {
    const { data, error } = await supabase
      .from('lesson_cancellations')
      .select('*')
      .eq('course_instance_id', courseInstanceId)
      .order('cancelled_at', { ascending: false });

    if (error) {
      console.error('Error fetching lesson cancellations:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getLessonCancellations:', error);
    return [];
  }
}

/**
 * Check if a specific lesson is cancelled on a specific date
 */
export async function isLessonCancelled(
  courseInstanceId: string, 
  lessonId: string, 
  scheduledDate: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('lesson_cancellations')
      .select('id')
      .eq('course_instance_id', courseInstanceId)
      .eq('lesson_id', lessonId)
      .eq('original_scheduled_date', scheduledDate)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking lesson cancellation:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error in isLessonCancelled:', error);
    return false;
  }
}

/**
 * Mark a cancellation as rescheduled
 */
export async function markCancellationAsRescheduled(
  cancellationId: string, 
  newDate?: string
): Promise<boolean> {
  try {
    const updateData: any = {
      is_rescheduled: true,
      updated_at: new Date().toISOString()
    };

    if (newDate) {
      updateData.rescheduled_to_date = newDate;
    }

    const { error } = await supabase
      .from('lesson_cancellations')
      .update(updateData)
      .eq('id', cancellationId);

    if (error) {
      console.error('Error marking cancellation as rescheduled:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in markCancellationAsRescheduled:', error);
    return false;
  }
}

/**
 * Get cancelled lessons for a specific date range
 */
export async function getCancelledLessonsInDateRange(
  courseInstanceId: string,
  startDate: string,
  endDate: string
): Promise<LessonCancellation[]> {
  try {

    const { data, error } = await supabase
      .from('lesson_cancellations')
      .select('*')
      .eq('course_instance_id', courseInstanceId)
      .gte('original_scheduled_date', startDate)
      .lte('original_scheduled_date', endDate)
      .order('original_scheduled_date', { ascending: true });

    if (error) {
      console.error('Error fetching cancelled lessons in date range:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getCancelledLessonsInDateRange:', error);
    return [];
  }
}

/**
 * Alternative cancellation method that works with generated schedules
 * by adding the date to blocked dates instead of creating a lesson cancellation record
 */
export async function cancelGeneratedLesson(
  courseInstanceId: string,
  lessonId: string,
  originalDate: string,
  cancellationReason: string
): Promise<CancelLessonResponse> {
  try {

    // Directly insert into lesson_cancellations table with rescheduling flag
    const { data, error } = await supabase
      .from('lesson_cancellations')
      .insert({
        course_instance_id: courseInstanceId,
        lesson_id: lessonId,
        original_scheduled_date: originalDate,
        cancellation_reason: cancellationReason,
        cancelled_by: (await supabase.auth.getUser()).data.user?.id,
        is_rescheduled: true // Mark as rescheduled from the start
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating cancellation record:', error);
      return {
        success: false,
        message: 'שגיאה בביטול השיעור',
        error: error.message
      };
    }

    // Clear the schedule cache to force regeneration
    clearSystemCache();

    return {
      success: true,
      cancellation_id: data.id,
      message: 'השיעור בוטל בהצלחה. השיעורים הבאים יתוזמנו מחדש אוטומטית.'
    };
  } catch (error) {
    console.error('Error in cancelGeneratedLesson:', error);
    return {
      success: false,
      message: 'שגיאה בביטול השיעור',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}