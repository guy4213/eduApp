import { supabase } from "@/integrations/supabase/client";

export interface LessonStatus {
  lessonId: string;
  lessonNumber: number;
  lessonTitle: string;
  status: 'completed' | 'not_completed' | 'issues' | 'not_reported';
  isCompleted: boolean;
  isLessonOk: boolean | null;
  feedback?: string;
  reportDate?: string;
  participantsCount?: number;
  totalStudents?: number;
  completedTasksCount?: number;
  totalTasksCount?: number;
}

export interface CourseLessonStatus {
  courseInstanceId: string;
  courseName: string;
  instructorName: string;
  institutionName: string;
  lessons: LessonStatus[];
}

/**
 * Fetches lesson status for a specific course instance
 */
export async function getCourseLessonStatus(courseInstanceId: string): Promise<CourseLessonStatus | null> {
  try {
    // First, get the course instance details
    const { data: courseInstance, error: instanceError } = await supabase
      .from('course_instances')
      .select(`
        id,
        grade_level,
        course:course_id (
          id,
          name
        ),
        instructor:instructor_id (
          id,
          full_name
        ),
        institution:institution_id (
          id,
          name
        )
      `)
      .eq('id', courseInstanceId)
      .single();

    if (instanceError || !courseInstance) {
      console.error('Error fetching course instance:', instanceError);
      return null;
    }

    // Get all lessons for this course
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select(`
        id,
        title,
        order_index,
        lesson_tasks (
          id,
          title
        )
      `)
      .eq('course_id', courseInstance.course.id)
      .order('order_index');

    if (lessonsError) {
      console.error('Error fetching lessons:', lessonsError);
      return null;
    }

    // Get all lesson reports for this course instance
    const { data: reports, error: reportsError } = await supabase
      .from('lesson_reports')
      .select(`
        id,
        lesson_id,
        lesson_title,
        is_completed,
        is_lesson_ok,
        feedback,
        participants_count,
        completed_task_ids,
        created_at,
        reported_lesson_instances (
          lesson_number
        )
      `)
      .eq('course_instance_id', courseInstanceId)
      .order('created_at', { ascending: false });

    if (reportsError) {
      console.error('Error fetching lesson reports:', reportsError);
      return null;
    }

    // Get total students count for this course instance
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id')
      .eq('course_instance_id', courseInstanceId);

    if (studentsError) {
      console.error('Error fetching students:', studentsError);
    }

    const totalStudents = students?.length || 0;

    // Process lessons and their status
    const lessonStatuses: LessonStatus[] = lessons.map(lesson => {
      const lessonNumber = lesson.order_index + 1;
      
      // Find the most recent report for this lesson
      const lessonReport = reports.find(report => 
        report.lesson_id === lesson.id
      );

      if (!lessonReport) {
        return {
          lessonId: lesson.id,
          lessonNumber,
          lessonTitle: lesson.title,
          status: 'not_reported',
          isCompleted: false,
          isLessonOk: null,
          totalTasksCount: lesson.lesson_tasks?.length || 0,
          completedTasksCount: 0,
          totalStudents
        };
      }

      // Determine status based on report data
      let status: LessonStatus['status'];
      if (!lessonReport.is_completed) {
        status = 'not_completed';
      } else if (lessonReport.is_lesson_ok === false) {
        status = 'issues';
      } else {
        status = 'completed';
      }

      return {
        lessonId: lesson.id,
        lessonNumber,
        lessonTitle: lessonReport.lesson_title || lesson.title,
        status,
        isCompleted: lessonReport.is_completed,
        isLessonOk: lessonReport.is_lesson_ok,
        feedback: lessonReport.feedback,
        reportDate: lessonReport.created_at,
        participantsCount: lessonReport.participants_count,
        totalStudents,
        completedTasksCount: lessonReport.completed_task_ids?.length || 0,
        totalTasksCount: lesson.lesson_tasks?.length || 0
      };
    });

    return {
      courseInstanceId,
      courseName: courseInstance.course.name,
      instructorName: courseInstance.instructor.full_name,
      institutionName: courseInstance.institution.name,
      lessons: lessonStatuses
    };

  } catch (error) {
    console.error('Error in getCourseLessonStatus:', error);
    return null;
  }
}

/**
 * Fetches lesson status for multiple course instances
 */
export async function getMultipleCourseLessonStatus(courseInstanceIds: string[]): Promise<CourseLessonStatus[]> {
  const results = await Promise.all(
    courseInstanceIds.map(id => getCourseLessonStatus(id))
  );
  
  return results.filter((result): result is CourseLessonStatus => result !== null);
}

/**
 * Gets lesson status summary for a course instance
 */
export function getLessonStatusSummary(lessonStatuses: LessonStatus[]) {
  const total = lessonStatuses.length;
  const completed = lessonStatuses.filter(l => l.status === 'completed').length;
  const notCompleted = lessonStatuses.filter(l => l.status === 'not_completed').length;
  const issues = lessonStatuses.filter(l => l.status === 'issues').length;
  const notReported = lessonStatuses.filter(l => l.status === 'not_reported').length;

  return {
    total,
    completed,
    notCompleted,
    issues,
    notReported,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
  };
}