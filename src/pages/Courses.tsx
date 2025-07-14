
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BookOpen, Users, Calendar, Plus, Edit, Clock, CheckCircle2, Circle, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import CourseCreateDialog from '@/components/CourseCreateDialog';
import CourseAssignDialog from '@/components/CourseAssignDialog';
import MobileNavigation from '@/components/layout/MobileNavigation';

interface Task {
  id: string;
  title: string;
  description: string;
  estimated_duration: number;
  is_mandatory: boolean;
  lesson_number: number;
  lesson_title?: string;
  order_index: number;
}

interface Course {
  id: string;
  name: string;
  grade_level: string;
  max_participants: number;
  price_per_lesson: number;
  institution_name: string;
  instructor_name: string;
  lesson_count: number;
  tasks: Task[];
}

const Courses = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<{ id: string; name: string } | null>(null);
  const [editCourse, setEditCourse] = useState<{
    id: string;
    name: string;
    grade_level: string;
    max_participants: number;
    price_per_lesson: number;
    tasks: any[];
  } | null>(null);

console.log("ROLE  "+user.user_metadata.role);
  const groupTasksByLesson = (tasks: Task[]) => {
  const grouped: Record<number, Task[]> = {};
  for (const task of tasks) {
    if (!grouped[task.lesson_number]) {
      grouped[task.lesson_number] = [];
    }
    grouped[task.lesson_number].push(task);
  }
  return grouped;
};
  const fetchCourses = async () => {
    if (!user) return;

    try {
      const { data: coursesData, error } = await supabase
        .from('courses')
        .select(`
          id,
          name,
          grade_level,
          max_participants,
          price_per_lesson,
          educational_institutions(name),
          instructor_id
        `);

      if (error) throw error;

      // Fetch lessons and tasks for each course
      const courseIds = coursesData?.map(course => course.id).filter(Boolean) || [];
      let lessonsData: any[] = [];
      let tasksData: any[] = [];
      
      if (courseIds.length > 0) {
        // Fetch lessons
        const { data: lessons, error: lessonsError } = await supabase
          .from('lessons')
          .select('*')
          .in('course_id', courseIds)
          .order('created_at');

        if (lessonsError) {
          console.error('Error fetching lessons:', lessonsError);
        } else {
          lessonsData = lessons || [];
        }

  

        // Fetch tasks for all lessons
        const lessonIds = lessonsData.map(lesson => lesson.id).filter(Boolean);
        if (lessonIds.length > 0) {
          const { data: tasks, error: tasksError } = await supabase
            .from('lesson_tasks')
            .select('*')
            .in('lesson_id', lessonIds)
            .order('order_index');

          if (tasksError) {
            console.error('Error fetching tasks:', tasksError);
          } else {
            tasksData = tasks || [];
          }
        }
      }


            const { data: instructorsData, error: instructorsError } = await supabase
        .from('profiles')
       .select('id, full_name')
        .eq('role', 'instructor');

    const formattedCourses = coursesData?.map((course: any) => {
  const courseLessons = lessonsData.filter(lesson => lesson.course_id === course.id);
  const allCourseTasks = courseLessons.flatMap(lesson => {
    const lessonTasks = tasksData.filter(task => task.lesson_id === lesson.id);
    return lessonTasks.map(task => ({
      ...task,
      lesson_title: lesson.title,
      lesson_number: courseLessons.findIndex(l => l.id === lesson.id) + 1
    }));
  });

  // Find instructor name by instructor_id (assumes instructorsData is available)
  const instructor = instructorsData.find(instr => instr.id === course.instructor_id);
  const instructorName = instructor ? instructor.full_name : 'לא צוין';

  return {
    id: course.id,
    name: course.name,
    grade_level: course.grade_level || 'לא צוין',
    max_participants: course.max_participants || 0,
    price_per_lesson: course.price_per_lesson || 0,
    institution_name: course.educational_institutions?.name || 'לא צוין',
    lesson_count: courseLessons.length,
    instructor_name: instructorName,  // <--- added this line
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
}) || [];


      console.log("formattedCourses with lessons and tasks: ", formattedCourses);
      setCourses(formattedCourses);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchCourses();
  }, [user]);

  const handleCourseCreated = () => {
    fetchCourses();
  };

  const handleAssignCourse = (courseId: string, courseName: string) => {
    setSelectedCourse({ id: courseId, name: courseName });
    setShowAssignDialog(true);
  };

  const handleAssignmentComplete = () => {
    fetchCourses();
  };

  const handleEditCourse = (course: Course) => {
    setEditCourse({
      id: course.id,
      name: course.name,
      grade_level: course.grade_level,
      max_participants: course.max_participants,
      price_per_lesson: course.price_per_lesson,
      tasks: course.tasks
    });
    setShowCreateDialog(true);
  };

  const handleDialogClose = (open: boolean) => {
    setShowCreateDialog(open);
    if (!open) {
      setEditCourse(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="md:hidden">
        <MobileNavigation />
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
         {  user.user_metadata.role!="instructor" ?(
          <> 
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ניהול קורסים</h1>
          <p className="text-gray-600 text-lg">ניהול וצפייה בכל הקורסים שאתה מעביר</p>
            </>
            ) : (
            <>
          <h1 className="text-3xl font-bold text-gray-900 mb-2"> הקורסים שלי</h1>
            </>)}
          </div>
        {user.user_metadata.role!="instructor"&&  <Button
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center space-x-2 space-x-reverse bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
          >
            <Plus className="h-4 w-4" />
            <span>תוכנית לימוד חדשה</span>
          </Button>}
        </div>

        {courses.length === 0 ? (
          <Card className="text-center py-16 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent>
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">אין תוכניות לימוד עדיין</h3>
              <p className="text-gray-600 mb-6 text-lg">התחל ליצור את תוכנית הלימוד הראשונה שלך</p>
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                צור תוכנית לימוד חדשה
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {courses.map((course) => (
              <Card key={course.id} className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl mb-2 text-white">{course.name}</CardTitle>
                      <CardDescription className="text-blue-100 text-base">{course.institution_name}</CardDescription>
                    </div>
                {  user.user_metadata.role!="instructor"&&
                  <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-white hover:bg-white/20"
                      onClick={() => handleAssignCourse(course.id, course.name)}
                    >
                      <UserPlus className="h-4 w-4" />
                    </Button>}
                  </div>
                </CardHeader>
                
                <CardContent className="p-6">
                  {/* Course Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="flex items-center justify-evenly">
                      <span className="text-sm text-gray-600 font-medium">שם המדריך :</span>
                      <span className="text-sm font-bold text-green-600">{course.instructor_name}</span>
                    </div>
                    <div className="flex items-center justify-evenly">
                      <span className="text-sm text-gray-600 font-medium">כיתה:</span>
                      <span className="text-sm font-bold text-gray-900">{course.grade_level}</span>
                    </div>
                    <div className="flex items-center justify-evenly">
                      <span className="text-sm text-gray-600 font-medium">משתתפים:</span>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1 text-gray-500" />
                        <span className="text-sm font-bold text-gray-900">{course.max_participants}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-evenly">
                      <span className="text-sm text-gray-600 font-medium">מחיר לשיעור:</span>
                      <span className="text-sm font-bold text-green-600">₪{course.price_per_lesson}</span>
                    </div>
                  </div>

                  {/* Tasks Section */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <CheckCircle2 className="h-5 w-5 mr-2 text-blue-600" />
                      משימות הקורס ({course.tasks.length})
                    </h3>
                    
                  {course.tasks.length > 0 ? (
  <div className="border rounded-lg overflow-hidden">
    <Table>
      <TableHeader>
        <TableRow className="bg-gray-50">
          <TableHead className="text-right font-semibold">שם השיעור</TableHead>
          <TableHead className="text-right font-semibold max-w-xs">תיאור</TableHead>
          <TableHead className="text-right font-semibold">זמן מוערך</TableHead>
          <TableHead className="text-right font-semibold">סוג</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Object.entries(groupTasksByLesson(course.tasks)).map(([lessonNumber, lessonTasks]) => (
          <React.Fragment key={lessonNumber}>
            {/* כותרת שיעור */}
            <TableRow className="bg-blue-100">
              <TableCell colSpan={5} className="font-bold text-right text-blue-900">
                שיעור {lessonNumber} – {lessonTasks[0]?.lesson_title || ''}
              </TableCell>
            </TableRow>

            {/* המשימות של השיעור הזה */}
            {lessonTasks.map((task) => (
              <TableRow key={task.id} className="hover:bg-gray-50">
                <TableCell className="font-medium">
                  <div className="flex items-center">
                   
                      <Circle className="h-4 w-4 text-gray-400 mr-2" />
                   
                    {task.title}
                  </div>
                </TableCell>
                <TableCell className="text-gray-600 max-w-xs truncate">
                  {task.description || 'ללא תיאור'}
                </TableCell>
       
                <TableCell>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-3 w-3 mr-1" />
                    {task.estimated_duration} דק׳
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={task.is_mandatory ? "destructive" : "secondary"}
                    className={task.is_mandatory ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"}
                  >
                    {task.is_mandatory ? 'חובה' : 'רשות'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </React.Fragment>
        ))}
      </TableBody>
    </Table>
  </div>
) : (
  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
    <Circle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
    <p>אין משימות עבור הקורס הזה</p>
    <p className="text-sm">ניתן להוסיף משימות בעת עריכת הקורס</p>
  </div>
)}
      </div>
                  {/* Action Buttons */}
                  <div className="pt-6 space-y-3">
                 {  user.user_metadata.role!="instructor"&& <Button 
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800" 
                      size="sm"
                      onClick={() => handleEditCourse(course)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      לעריכה
                    </Button>}
                    {/* <Button variant="outline" className="w-full border-blue-300 text-blue-700 hover:bg-blue-50" size="sm">
                      <Calendar className="h-4 w-4 mr-2" />
                      מערכת השעות
                    </Button> */}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <CourseCreateDialog
          open={showCreateDialog}
          onOpenChange={handleDialogClose}
          onCourseCreated={handleCourseCreated}
          editCourse={editCourse}
        />

        {selectedCourse && (
          <CourseAssignDialog
            open={showAssignDialog}
            onOpenChange={setShowAssignDialog}
            courseId={selectedCourse.id}
            courseName={selectedCourse.name}
            onAssignmentComplete={handleAssignmentComplete}
          />
        )}
      </main>
    </div>   
  );
};

export default Courses;
