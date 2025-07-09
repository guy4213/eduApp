import { supabase } from '@/integrations/supabase/client';
import  { useState } from 'react';

export function useCourseSubmit(onCourseCreated: () => void, onClose: (open: boolean) => void) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: any, tasks: any) => {
    setLoading(true);
    try {
      // שמירת הקורס
      const { data: savedCourse, error: courseError } = await supabase
        .from('courses')
        .insert({
          name: formData.name,
          grade_level: formData.grade_level,
          max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
          price_per_lesson: formData.price_per_lesson ? parseFloat(formData.price_per_lesson) : null,
          institution_id: formData.institution_id || null,
        })
        .select('id')
        .single();

      if (courseError) throw courseError;
      const courseId = savedCourse.id;

      // שמירת המשימות עם course_id
      if (tasks.length > 0) {
        // התאמת משימות עם course_id
        const tasksToInsert = tasks.map(task => ({
          course_id: courseId,
          title: task.title,
          description: task.description,
          estimated_duration: task.estimated_duration,
          is_mandatory: task.is_mandatory,
          lesson_number: task.lesson_number,
          order_index: task.order_index,
        }));

        const { error: tasksError } = await supabase.from('lesson_tasks').insert(tasksToInsert);
        if (tasksError) throw tasksError;
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
