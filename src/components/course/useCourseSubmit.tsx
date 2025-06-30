
import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Task {
  id: string;
  title: string;
  description: string;
  estimated_duration: number;
  is_mandatory: boolean;
  lesson_number: number;
  order_index: number;
}

interface FormData {
  name: string;
  grade_level: string;
  max_participants: string;
  price_per_lesson: string;
  institution_id: string;
  curriculum_id: string;
}

export const useCourseSubmit = (onCourseCreated: () => void, onOpenChange: (open: boolean) => void) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: FormData, tasks: Task[]) => {
    if (!user) {
      toast({
        title: "שגיאה",
        description: "יש להתחבר כדי ליצור קורס",
        variant: "destructive"
      });
      return;
    }

    if (!formData.name.trim()) {
      toast({
        title: "שגיאה",
        description: "יש להזין שם קורס",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Create course
      const courseData = {
        name: formData.name.trim(),
        grade_level: formData.grade_level.trim() || null,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
        price_per_lesson: formData.price_per_lesson ? parseFloat(formData.price_per_lesson) : null,
        institution_id: formData.institution_id || null,
        curriculum_id: formData.curriculum_id || null,
        instructor_id: user.id
      };

      const { data: courseResult, error: courseError } = await supabase
        .from('courses')
        .insert([courseData])
        .select()
        .single();

      if (courseError) throw courseError;

      // Create tasks if any and curriculum is selected
      if (tasks.length > 0 && formData.curriculum_id) {
        // Check if curriculum already has tasks
        const { data: existingTasks, error: checkError } = await supabase
          .from('curriculum_tasks')
          .select('id')
          .eq('curriculum_id', formData.curriculum_id)
          .limit(1);

        if (checkError) {
          console.error('Error checking existing tasks:', checkError);
        }

        // Only insert tasks if curriculum doesn't have tasks yet
        if (!existingTasks || existingTasks.length === 0) {
          const tasksData = tasks.map(task => ({
            title: task.title,
            description: task.description,
            estimated_duration: task.estimated_duration,
            is_mandatory: task.is_mandatory,
            lesson_number: task.lesson_number,
            order_index: task.order_index,
            curriculum_id: formData.curriculum_id
          }));

          const { error: tasksError } = await supabase
            .from('curriculum_tasks')
            .insert(tasksData);

          if (tasksError) {
            console.error('Error creating tasks:', tasksError);
            toast({
              title: "אזהרה",
              description: "הקורס נוצר בהצלחה אך חלק מהמשימות לא נשמרו",
              variant: "destructive"
            });
          }
        } else {
          console.log('Curriculum already has tasks, skipping task creation');
        }
      }

      toast({
        title: "הצלחה",
        description: "הקורס נוצר בהצלחה" + (tasks.length > 0 ? ` עם ${tasks.length} משימות` : ""),
        variant: "default"
      });

      onCourseCreated();
      onOpenChange(false);

    } catch (error) {
      console.error('Error creating course:', error);
      toast({
        title: "שגיאה",
        description: error instanceof Error ? error.message : "אירעה שגיאה ביצירת הקורס",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    handleSubmit
  };
};
