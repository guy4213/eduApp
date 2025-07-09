import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { Lesson } from './CourseLessonsSection';

export function useCourseSubmit(onCourseCreated: () => void, onClose: (open: boolean) => void) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: any, lessons: Lesson[]) => {
    setLoading(true);
    try {
      // שמירת הקורס
      const { data: savedCourse, error: courseError } = await supabase
        .from('courses')
        .insert({
          institution_id  : formData.institution_id || null, // אם יש מוסד
          //insturctor_id: formData.instructor_id || null, // אם יש מדריך
          name: formData.name,
          grade_level: formData.grade_level,
          max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
          price_per_lesson: formData.price_per_lesson ? parseFloat(formData.price_per_lesson) : null,
          start_date: new Date().toISOString(), // זמני placeholder
          approx_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // זמני placeholder 
        })
        .select('id')
        .single();

      if (courseError) throw courseError;
      const courseId = savedCourse.id;

      // שמירת השיעורים והמשימות
      if (lessons.length > 0) {
        for (const lesson of lessons) {
          // שמירת השיעור
          const { data: savedLesson, error: lessonError } = await supabase
            .from('lessons')
            .insert({
              course_id: courseId,
              title: lesson.title,
              scheduled_start: new Date().toISOString(), // זמני placeholder
              scheduled_end: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // זמני placeholder
              status: 'scheduled'
            })
            .select('id')
            .single();

          if (lessonError) throw lessonError;
          const lessonId = savedLesson.id;

          // שמירת המשימות לשיעור
          if (lesson.tasks.length > 0) {
            const tasksToInsert = lesson.tasks.map(task => ({
              lesson_id: lessonId,
              title: task.title,
              description: task.description,
              estimated_duration: task.estimated_duration,
              is_mandatory: task.is_mandatory,
              order_index: task.order_index,
            }));

            const { error: tasksError } = await supabase.from('lesson_tasks').insert(tasksToInsert);
            if (tasksError) throw tasksError;
          }
        }
      }

      onCourseCreated();
      onClose(false);
    } catch (error) {
      console.error('Error saving course and tasks:', error);
      alert('אירעה שגיאה בשמירת הקורס והמשימות.');
    } finally {
      setLoading(false);
    }
  };

  return { loading, handleSubmit };
}
