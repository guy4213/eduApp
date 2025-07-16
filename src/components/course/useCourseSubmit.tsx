// useCourseSubmit.ts
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { Lesson } from './CourseLessonsSection';

export function useCourseSubmit(onCourseCreated: () => void, onClose: (open: boolean) => void) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: any, lessons: Lesson[], editCourseId?: string) => {
    setLoading(true);
    try {

      
      let courseId = editCourseId;
console.log("INSTANCE   ",editCourseId)
      if (editCourseId) {
    // שלב 1: עדכון טבלת course_instances עם הנתונים ששייכים לה
    const { data: updatedInstance, error: instanceError } = await supabase
      .from('course_instances') // עדכן את הטבלה הנכונה
      .update({
        // שדות שרלוונטיים לטבלת course_instances
        grade_level: formData.grade_level,
     
      })
      .eq('id', editCourseId) // כאן ה-ID מתאים
      .select('id, course_id, instructor_id') // בקש את ה-ID של הקורס המקורי (course_id)
      .single();

    // עצור אם יש שגיאה בשלב הראשון
    if (instanceError) throw instanceError;

    // שלב 2: עדכון טבלת courses עם הנתונים ששייכים לה
    const { error: courseError } = await supabase
      .from('courses')
      .update({
        // שדות שרלוונטיים לטבלת courses
          grade_level: '',
        start_date: formData.start_date || null,
        approx_end_date: formData.approx_end_date || null,
        name: formData.name,
        max_participants: parseInt(formData.max_participants) || null,
        price_per_lesson: parseFloat(formData.price_per_lesson) || null,
      })
      .eq('id', courseId); // השתמש ב-ID הנכון (course_id) שקיבלנו מהשלב הקודם

    // עצור אם יש שגיאה בשלב השני
    if (courseError) throw courseError;
    
    // קריאה לפונקציות ההמשך עם ה-ID הנכון של הקורס (לא של המופע)
    courseId = updatedInstance.course_id; 
    console.log("ORIGINAL",courseId)
    await updateExistingLessonsAndTasks(courseId, lessons, updatedInstance.instructor_id);

} else {
        const { data: savedCourse, error: courseError } = await supabase
          .from('courses')
          .insert({
            name: formData.name,
            grade_level: formData.grade_level,
            max_participants: parseInt(formData.max_participants) || null,
            price_per_lesson: parseFloat(formData.price_per_lesson) || null,
            start_date: formData.start_date || null,
            approx_end_date: formData.approx_end_date || null,
          })
          .select('id')
          .single();

        if (courseError) throw courseError;
        courseId = savedCourse.id;

        await createNewLessonsAndTasks(courseId, lessons);
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

  const updateExistingLessonsAndTasks = async (courseId: string, lessons: Lesson[], instructorId?: string) => {
    const { data: existingLessons } = await supabase
      .from('lessons')
      .select(`id, title, lesson_tasks (id, title, description, estimated_duration, is_mandatory, order_index)`)  
      .eq('course_id', courseId);

    const existingLessonsMap = new Map(existingLessons.map(lesson => [lesson.title, lesson]));
    const processedLessonTitles = new Set<string>();

    for (const lesson of lessons) {
      const existingLesson = existingLessonsMap.get(lesson.title);
      processedLessonTitles.add(lesson.title);

      if (existingLesson) {
        await supabase.from('lessons').update({ title: lesson.title }).eq('id', existingLesson.id);
        await updateTasksForLesson(existingLesson.id, lesson.tasks, existingLesson.lesson_tasks);
      } else {
        const { data: savedLesson, error: lessonError } = await supabase
          .from('lessons')
          .insert({
            course_id: courseId,
            title: lesson.title,
            scheduled_start: new Date().toISOString(),
            scheduled_end: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            status: 'scheduled',
            instructor_id: instructorId || null,
          })
          .select('id')
          .single();

        if (lessonError) throw lessonError;

        if (lesson.tasks.length > 0) {
          const tasksToInsert = lesson.tasks.map(task => ({
            lesson_id: savedLesson.id,
            title: task.title,
            description: task.description,
            estimated_duration: task.estimated_duration,
            is_mandatory: task.is_mandatory,
            order_index: task.order_index,
          }));
          
          console.log('Inserting tasks for new lesson:', tasksToInsert);
          const { data: insertedTasks, error: tasksError } = await supabase.from('lesson_tasks').insert(tasksToInsert);
          
          if (tasksError) {
            console.error('Error inserting tasks for new lesson:', tasksError);
            throw tasksError;
          }
          console.log('Tasks for new lesson inserted successfully:', insertedTasks);
        }
      }
    }

    const lessonsToDelete = existingLessons
      .filter(lesson => !processedLessonTitles.has(lesson.title))
      .map(lesson => lesson.id);

    if (lessonsToDelete.length > 0) {
      await supabase.from('lesson_tasks').delete().in('lesson_id', lessonsToDelete);
      await supabase.from('lessons').delete().in('id', lessonsToDelete);
    }
  };

  const updateTasksForLesson = async (lessonId: string, newTasks: any[], existingTasks: any[]) => {
    const existingTasksMap = new Map(existingTasks.map(task => [task.title, task]));
    const processedTaskTitles = new Set<string>();

    for (const newTask of newTasks) {
      const existingTask = existingTasksMap.get(newTask.title);
      processedTaskTitles.add(newTask.title);

      if (existingTask) {
        await supabase
          .from('lesson_tasks')
          .update({
            title: newTask.title,
            description: newTask.description,
            estimated_duration: newTask.estimated_duration,
            is_mandatory: newTask.is_mandatory,
            order_index: newTask.order_index,
          })
          .eq('id', existingTask.id);
      } else {
        console.log('Inserting new task for lesson:', lessonId, newTask);
        const { data: insertedTask, error: insertError } = await supabase.from('lesson_tasks').insert({
          lesson_id: lessonId,
          title: newTask.title,
          description: newTask.description,
          estimated_duration: newTask.estimated_duration,
          is_mandatory: newTask.is_mandatory,
          order_index: newTask.order_index,
        });
        
        if (insertError) {
          console.error('Error inserting new task:', insertError);
          throw insertError;
        }
        console.log('New task inserted successfully:', insertedTask);
      }
    }

    const tasksToDelete = existingTasks
      .filter(task => !processedTaskTitles.has(task.title))
      .map(task => task.id);

    if (tasksToDelete.length > 0) {
      await supabase.from('lesson_tasks').delete().in('id', tasksToDelete);
    }
  };

  const createNewLessonsAndTasks = async (courseId: string, lessons: Lesson[]) => {
    for (const lesson of lessons) {
      const { data: savedLesson, error: lessonError } = await supabase
        .from('lessons')
        .insert({
          course_id: courseId,
          title: lesson.title,
          scheduled_start: new Date().toISOString(),
          scheduled_end: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          status: 'scheduled'
        })
        .select('id')
        .single();

      if (lessonError) throw lessonError;

      if (lesson.tasks.length > 0) {
        const tasksToInsert = lesson.tasks.map(task => ({
          lesson_id: savedLesson.id,
          title: task.title,
          description: task.description,
          estimated_duration: task.estimated_duration,
          is_mandatory: task.is_mandatory,
          order_index: task.order_index,
        }));
        
        console.log('Inserting tasks:', tasksToInsert);
        const { data: insertedTasks, error: tasksError } = await supabase
          .from('lesson_tasks')
          .insert(tasksToInsert);
          
        if (tasksError) {
          console.error('Error inserting tasks:', tasksError);
          throw tasksError;
        }
        console.log('Tasks inserted successfully:', insertedTasks);
      }
    }
  };

  return { loading, handleSubmit };
}
