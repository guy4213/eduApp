import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  Calendar,
  Edit,
  Clock,
  CheckCircle2,
  Circle,
  UserPlus,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import CourseAssignDialog from "@/components/CourseAssignDialog";
import MobileNavigation from "@/components/layout/MobileNavigation";

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

interface CourseAssignment {
  id: string;
  instance_id: string;
  name: string;
  grade_level: string;
  max_participants: number;
  price_for_instructor: number;
  price_for_customer: number;
  institution_name: string;
  instructor_name: string;
  lesson_count: number;
  tasks: Task[];
  start_date: string;
  approx_end_date: string;
}

const CourseAssignments = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<CourseAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedCourse, setSelectedCourse] = useState<{
    id: string;
    instanceId: string;
    name: string;
  } | null>(null);
  const [editData, setEditData] = useState<CourseAssignment | null>(null);

  // Check user role and permissions
  const userRole = user?.user_metadata?.role;
  const hasAdminAccess = ['admin', 'pedagogical_manager'].includes(userRole);
  const isInstructor = userRole === 'instructor';

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

  const fetchAssignments = async () => {
    if (!user) return;

    try {
      let query = supabase.from("course_instances").select(`
        id,
        grade_level,
        max_participants,
        price_for_customer,
        price_for_instructor,
        start_date,
        end_date,
        created_at,
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
      `);

      // If user is instructor, filter by their assignments only
      if (isInstructor && user?.id) {
        query = query.eq('instructor_id', user.id);
      }

      const { data: coursesData, error: instancesError } = await query;

      if (instancesError) throw instancesError;

      // Fetch lessons and tasks for assigned courses
      const courseIds = coursesData?.map((instance: any) => instance.course?.id).filter(Boolean) || [];
      let lessonsData: any[] = [];
      let tasksData: any[] = [];
      let schedulesData: any[] = [];

      if (courseIds.length > 0) {
        // Fetch lessons
        const { data: lessons, error: lessonsError } = await supabase
          .from("lessons")
          .select("*")
          .in("course_id", courseIds)
          .order("created_at");

        if (lessonsError) {
          console.error("Error fetching lessons:", lessonsError);
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
          } else {
            tasksData = tasks || [];
          }
        }

        // Fetch lesson schedules for assigned courses
        const courseInstanceIds = coursesData?.map((instance) => instance.id) || [];
        if (courseInstanceIds.length > 0) {
          const { data: schedules, error: schedulesError } = await supabase
            .from("lesson_schedules")
            .select("*")
            .in("course_instance_id", courseInstanceIds);

          if (schedulesError) {
            console.error("Error fetching lesson schedules:", schedulesError);
          } else {
            schedulesData = schedules || [];
          }
        }
      }

      // Format assigned courses data
      const formatAssignmentData = (instanceData: any) => {
        const course = instanceData.course;
        const courseLessons = lessonsData.filter(
          (lesson) => lesson.course_id === course.id
        );
        
        const allCourseTasks = courseLessons.flatMap((lesson) => {
          const lessonTasks = tasksData.filter(
            (task) => task.lesson_id === lesson.id
          );

          const lessonSchedule = schedulesData.find(
            (schedule) =>
              schedule.lesson_id === lesson.id &&
              schedule.course_instance_id === instanceData.id
          );

          return lessonTasks.map((task) => ({
            ...task,
            lesson_title: lesson.title,
            lesson_number: courseLessons.findIndex((l) => l.id === lesson.id) + 1,
            scheduled_start: lessonSchedule?.scheduled_start || null,
            scheduled_end: lessonSchedule?.scheduled_end || null,
          }));
        });

        return {
          id: course.id,
          instance_id: instanceData.id,
          name: course.name || "ללא שם קורס",
          grade_level: instanceData.grade_level || "לא צוין",
          max_participants: instanceData.max_participants || 0,
          price_for_customer: instanceData.price_for_customer || 0,
          price_for_instructor: instanceData.price_for_instructor || 0,
          institution_name: instanceData.institution?.name || "לא צוין",
          instructor_name: instanceData.instructor?.full_name || "לא צוין",
          lesson_count: courseLessons.length,
          start_date: instanceData.start_date || null,
          approx_end_date: instanceData.end_date || null,
          tasks: allCourseTasks.map((task: any) => ({
            id: task.id,
            title: task.title,
            description: task.description,
            estimated_duration: task.estimated_duration,
            is_mandatory: task.is_mandatory,
            lesson_number: task.lesson_number,
            lesson_title: task.lesson_title,
            order_index: task.order_index,
            scheduled_start: task.scheduled_start,
            scheduled_end: task.scheduled_end,
          })),
        };
      };

      const formattedAssignments = coursesData?.map(formatAssignmentData) || [];
      setAssignments(formattedAssignments);
    } catch (error) {
      console.error("Error fetching assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [user]);

  // Handle creating new assignment
  const handleAssignCourse = (
    courseId: string,
    instanceId: string,
    courseName: string
  ) => {
    setSelectedCourse({
      id: courseId,
      instanceId: instanceId,
      name: courseName,
    });
    setDialogMode('create');
    setEditData(null);
    setShowDialog(true);
  };

  // Handle editing existing assignment
  const handleEditAssignment = (assignment: CourseAssignment) => {
    setEditData(assignment);
    setDialogMode('edit');
    setSelectedCourse(null);
    console.log("Editing assignment:", assignment);
    setShowDialog(true);
  };

  const handleAssignmentComplete = () => {
    fetchAssignments();
    setSelectedCourse(null);
    setEditData(null);
  };

  const formatDate = (isoDate: string) => {
    if (!isoDate) return "לא צוין";
    const date = new Date(isoDate);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const formatDateTime = (isoDateTime: string) => {
    if (!isoDateTime) return null;
    const date = new Date(isoDateTime);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${day}.${month}.${year} ${hours}:${minutes}`;
  };

  // Redirect if user doesn't have permission to view page
  if (!hasAdminAccess && !isInstructor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
        <Card className="text-center py-16 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent>
            <Users className="h-16 w-16 text-red-400 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              אין הרשאה לצפייה בדף זה
            </h3>
            <p className="text-gray-600 mb-6 text-lg">
              רק מנהלים, מנהלים פדגוגיים ומדריכים יכולים לצפות בהקצאות קורסים
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isInstructor ? "הקורסים שלי" : "הקצאות קורסים"}
            </h1>
            <p className="text-gray-600 text-lg">
              {isInstructor 
                ? "צפייה בקורסים שהוקצו לך" 
                : "ניהול וצפייה בכל הקורסים שהוקצו למדריכים"
              }
            </p>
          </div>
        </div>

        {assignments.length === 0 ? (
          <Card className="text-center py-16 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent>
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {isInstructor ? "אין קורסים מוקצים" : "אין הקצאות קורסים עדיין"}
              </h3>
              <p className="text-gray-600 mb-6 text-lg">
                {isInstructor 
                  ? "לא נמצאו קורסים שהוקצו לך"
                  : "לא נמצאו קורסים שהוקצו למדריכים"
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {assignments.map((assignment) => (
              <Card
                key={assignment.instance_id}
                className="shadow-xl border-0 backdrop-blur-sm bg-white/80"
              >
                <CardHeader className="text-white rounded-t-lg bg-gradient-to-r from-blue-600 to-blue-700">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-blue-100 mb-1">
                        {formatDate(assignment.start_date)} - {formatDate(assignment.approx_end_date)}
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-2xl text-white">
                          {assignment.name}
                        </CardTitle>
                        <Badge className="bg-green-500/20 text-green-100 border-green-300/30">
                          מוקצה
                        </Badge>
                      </div>
                      <CardDescription className="text-blue-100 text-base">
                        {assignment.institution_name} • מדריך: {assignment.instructor_name}
                      </CardDescription>
                    </div>
                    {/* Only show action buttons for admin/pedagogical_manager */}
                    {hasAdminAccess && (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-white hover:bg-white/20"
                          onClick={() => handleEditAssignment(assignment)}
                          title="עריכת הקצאה"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-white hover:bg-white/20"
                          onClick={() =>
                            handleAssignCourse(
                              assignment.id,
                              assignment.instance_id,
                              assignment.name
                            )
                          }
                          title="הקצאה חדשה"
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  {/* Course Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center text-blue-600 mb-2">
                        <Users className="h-5 w-5 ml-2" />
                        <span className="font-medium">כיתה</span>
                      </div>
                      <span className="text-lg font-bold text-gray-900">
                        {assignment.grade_level}
                      </span>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center text-green-600 mb-2">
                        <Users className="h-5 w-5 ml-2" />
                        <span className="font-medium">מקסימום תלמידים</span>
                      </div>
                      <span className="text-lg font-bold text-gray-900">
                        {assignment.max_participants}
                      </span>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="flex items-center text-purple-600 mb-2">
                        <Calendar className="h-5 w-5 ml-2" />
                        <span className="font-medium">מספר שיעורים</span>
                      </div>
                      <span className="text-lg font-bold text-gray-900">
                        {assignment.lesson_count}
                      </span>
                    </div>

                    <div className="bg-orange-50 p-4 rounded-lg">
                      <div className="flex items-center text-orange-600 mb-2">
                        <span className="font-medium">מחיר ללקוח</span>
                      </div>
                      <span className="text-lg font-bold text-gray-900">
                        ₪{assignment.price_for_customer}
                      </span>
                    </div>
                  </div>

                  {/* Tasks Section */}
                  {assignment.tasks.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <CheckCircle2 className="h-5 w-5 ml-2 text-green-600" />
                        משימות הקורס
                      </h3>

                      <div className="space-y-6">
                        {Object.entries(groupTasksByLesson(assignment.tasks)).map(([lessonNumber, tasks]) => (
                          <div key={lessonNumber} className="bg-gray-50 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                              <Calendar className="h-4 w-4 ml-2" />
                              שיעור {lessonNumber}: {tasks[0]?.lesson_title || "ללא כותרת"}
                            </h4>

                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="text-right">משימה</TableHead>
                                  <TableHead className="text-right">זמן משוער</TableHead>
                                  <TableHead className="text-right">סטטוס</TableHead>
                                  <TableHead className="text-right">זמן מתוכנן</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {tasks
                                  .sort((a, b) => a.order_index - b.order_index)
                                  .map((task) => (
                                    <TableRow key={task.id}>
                                      <TableCell>
                                        <div>
                                          <span className="font-medium">{task.title}</span>
                                          {task.description && (
                                            <p className="text-sm text-gray-600 mt-1">
                                              {task.description}
                                            </p>
                                          )}
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex items-center text-gray-600">
                                          <Clock className="h-4 w-4 ml-1" />
                                          <span>{task.estimated_duration} דקות</span>
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex items-center">
                                          {task.is_mandatory ? (
                                            <CheckCircle2 className="h-4 w-4 text-red-500 ml-2" />
                                          ) : (
                                            <Circle className="h-4 w-4 text-gray-400 ml-2" />
                                          )}
                                          <span className={task.is_mandatory ? "text-red-600 font-medium" : "text-gray-600"}>
                                            {task.is_mandatory ? "חובה" : "רשות"}
                                          </span>
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        {task.scheduled_start && task.scheduled_end ? (
                                          <div className="text-sm">
                                            <div>{formatDateTime(task.scheduled_start)}</div>
                                            <div className="text-gray-500">עד {formatDateTime(task.scheduled_end)}</div>
                                          </div>
                                        ) : (
                                          <span className="text-gray-400">לא מתוכנן</span>
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                              </TableBody>
                            </Table>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Course Assignment Dialog - Works for both create and edit modes */}
        {hasAdminAccess && (
          <CourseAssignDialog
            open={showDialog}
            onOpenChange={setShowDialog}
            mode={dialogMode}
            courseId={selectedCourse?.id}
            courseName={selectedCourse?.name}
            instanceId={selectedCourse?.instanceId}
            editData={editData ? {
              instance_id: editData.instance_id,
              name: editData.name,
              grade_level: editData.grade_level,
              max_participants: editData.max_participants,
              price_for_customer: editData.price_for_customer,
              price_for_instructor: editData.price_for_instructor,
              institution_name: editData.institution_name,
              instructor_name: editData.instructor_name,
              start_date: editData.start_date,
              approx_end_date: editData.approx_end_date,
            } : undefined}
            onAssignmentComplete={handleAssignmentComplete}
          />
        )}
      </main>
    </div>
  );
};

export default CourseAssignments;