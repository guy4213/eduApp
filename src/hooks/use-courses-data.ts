import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';

interface Task {
  id: string;
  title: string;
  description: string;
  estimated_duration: number;
  is_mandatory: boolean;
  lesson_number: number;
  lesson_title?: string;
  order_index: number;
  scheduled_start?: string;
  scheduled_end?: string;
}

interface Course {
  id: string;
  instance_id: string;
  name: string;
  grade_level: string;
  max_participants: number;
  price_per_lesson: number;
  institution_name: string;
  instructor_name: string;
  lesson_count: number;
  tasks: Task[];
  start_date: string;
  approx_end_date: string;
  is_assigned: boolean;
}

export const useCoursesData = () => {
  const { user } = useAuth();

  const fetchCourses = async (): Promise<Course[]> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      // Fetch all courses for templates
      const { data: allCoursesData, error: coursesError } = await supabase
        .from("courses")
        .select(`
          id,
          name,
          created_at
        `);

      if (coursesError) throw coursesError;

      // Fetch lessons and tasks for template courses
      const allCourseIds = allCoursesData?.map((course) => course.id) || [];
      let lessonsData: any[] = [];
      let tasksData: any[] = [];

      if (allCourseIds.length > 0) {
        // Fetch lessons
        const { data: lessons, error: lessonsError } = await supabase
          .from("lessons")
          .select("*")
          .in("course_id", allCourseIds)
          .order("order_index");

        if (lessonsError) {
          console.error("Error fetching lessons:", lessonsError);
          throw lessonsError;
        } else {
          lessonsData = lessons || [];
        }

        // Fetch tasks for all lessons
        const lessonIds = lessonsData
          .map((lesson) => lesson.id)
          .filter(Boolean);
        if (lessonIds.length > 0) {
          const { data: tasks, error: tasksError } = await supabase
            .from("lesson_tasks")
            .select("*")
            .in("lesson_id", lessonIds)
            .order("order_index");

          if (tasksError) {
            console.error("Error fetching tasks:", tasksError);
            throw tasksError;
          } else {
            tasksData = tasks || [];
          }
        }
      }

      // Fetch instructors data
      const { data: instructorsData, error: instructorsError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("role", "instructor");

      if (instructorsError) {
        console.error("Error fetching instructors:", instructorsError);
        // Don't throw error for instructors, just log it
      }

      // Helper function to format template course data
      const formatCourseData = (course: any): Course => {
        const courseLessons = lessonsData.filter(
          (lesson) => lesson.course_id === course.id
        );
        const allCourseTasks = courseLessons.flatMap((lesson) => {
          const lessonTasks = tasksData.filter(
            (task) => task.lesson_id === lesson.id
          );

          return lessonTasks.map((task) => ({
            ...task,
            lesson_title: lesson.title,
            lesson_number:
              courseLessons.findIndex((l) => l.id === lesson.id) + 1,
          }));
        });

        return {
          id: course.id,
          instance_id: null,
          name: course.name || "ללא שם קורס",
          grade_level: "לא צוין",
          max_participants: 0,
          price_per_lesson: 0,
          institution_name: "תבנית קורס",
          instructor_name: "לא הוקצה",
          lesson_count: courseLessons.length,
          start_date: null,
          approx_end_date: null,
          is_assigned: false,
          tasks: allCourseTasks.map((task: any) => ({
            id: task.id,
            title: task.title,
            description: task.description,
            estimated_duration: task.estimated_duration,
            is_mandatory: task.is_mandatory,
            lesson_number: task.lesson_number,
            lesson_title: task.lesson_title,
            order_index: task.order_index,
          })),
        };
      };

      // Format template courses only
      const formattedTemplateCourses = allCoursesData?.map(formatCourseData) || [];
      return formattedTemplateCourses;
    } catch (error) {
      console.error("Error fetching courses:", error);
      throw error;
    }
  };

  return useQuery({
    queryKey: ['courses-data', user?.id],
    queryFn: fetchCourses,
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: true,
  });
};