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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  Users,
  Calendar,
  Plus,
  Edit,
  Clock,
  CheckCircle2,
  Circle,
  UserPlus,
  Filter,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getSchoolTypeDisplayName } from "@/utils/schoolTypeUtils";
import CourseCreateDialog from "@/components/CourseCreateDialog";
import CourseAssignDialog from "@/components/CourseAssignDialog";
import MobileNavigation from "@/components/layout/MobileNavigation";
// Step 1: Add new imports
import { Trash2 } from "lucide-react";
import DeleteCourseDialog from "@/components/DeleteCourseDialog"; // Import the new dialog
import { Pagination } from "@/components/ui/Pagination"; // Pagination component

interface Task {
  id: string;
  title: string;
  description: string;
  estimated_duration: number;
  is_mandatory: boolean;
  lesson_number: number;
  lesson_title?: string;
  order_index: number;
  // Add schedule information
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
  school_type?: string;
  presentation_link?: string;
  program_link?: string;
}

const Courses = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<{
    id: string;
    instanceId: string;
    name: string;
  } | null>(null);
  const [editCourse, setEditCourse] = useState<any | null>(null);
  const [schoolTypeFilter, setSchoolTypeFilter] = useState<string>("");
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  console.log("ROLE  " + user.user_metadata.role);
  // Step 2: Add new state for the delete dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<any | null>(null);
  const [assignmentDetails, setAssignmentDetails] = useState<any[]>([]);

  // PAGINATION STATE - רק state חדש, לא שינוי בלוגיקה!
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20; // 20 courses per page

  const userRole = user?.user_metadata?.role;
  const hasAdminAccess = ["admin", "pedagogical_manager"].includes(userRole);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth <= 768);

    checkIsMobile(); // בדיקה ראשונית
    window.addEventListener("resize", checkIsMobile);

    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  const toggleCardExpansion = (cardId: string) => {
    setExpandedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };
  const groupTasksByLesson = (tasks: Task[]) => {
    const grouped: Record<number, Task[]> = {};

    // קיבוץ המשימות לפי מספר שיעור
    for (const task of tasks) {
      if (!grouped[task.lesson_number]) {
        grouped[task.lesson_number] = [];
      }
      grouped[task.lesson_number].push(task);
    }

    // מיון המשימות בתוך כל שיעור לפי order_index
    for (const lessonNumber in grouped) {
      grouped[lessonNumber].sort((a, b) => a.order_index - b.order_index);
    }

    return grouped;
  };

  // Step 3: Add functions to handle deletion
  const handleDeleteClick = async (course: any) => {
    setCourseToDelete(course);
    setLoading(true);

    try {
      // Check for course assignments by querying course_instances
      const { data, error } = await supabase
        .from("course_instances")
        .select(
          `
          id,
          educational_institutions (name),
          profiles (full_name)
        `
        )
        .eq("course_id", course.id);

      if (error) {
        console.error("Error checking for course assignments:", error);
        // You can add a toast notification here for the user
        return;
      }

      setAssignmentDetails(data || []);
      setShowDeleteDialog(true);
    } catch (error) {
      console.error("An unexpected error occurred:", error);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!courseToDelete || assignmentDetails.length > 0) return;

    setLoading(true);
    // Use the RPC function to safely delete the course and its dependencies
    const { error } = await supabase.rpc("delete_course_template", {
      p_course_id: courseToDelete.id,
    });

    if (error) {
      console.error("Error deleting course:", error);
      // You can add an error toast here for the user
    } else {
      // Deletion was successful
      console.log("Course deleted successfully");
      setShowDeleteDialog(false);
      setCourseToDelete(null);
      await fetchCourses(); // Refresh the list of courses
      // You can add a success toast here
    }
    setLoading(false);
  };

  const fetchCourses = async () => {
    if (!user) return;

    try {
      // Only fetch template courses for the courses page
      // Course instances are now handled in the CourseAssignments page

      // Fetch courses with pagination
      const start = currentPage * pageSize;
      const end = start + pageSize - 1;

      const { data: allCoursesData, error: coursesError, count } = await supabase
        .from("courses")
        .select(`
          id,
          name,
          school_type,
          presentation_link,
          program_link,
          created_at
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(start, end);

      // Store total count for pagination
      setTotalCount(count || 0);

      if (coursesError) throw coursesError;

      // Fetch lessons and tasks for template courses
      const allCourseIds = allCoursesData?.map((course) => course.id) || [];
      let lessonsData: any[] = [];
      let tasksData: any[] = [];

      if (allCourseIds.length > 0) {
        // Fetch lessons

        const { data: lessons, error: lessonsError } = await supabase.rpc(
          "get_lessons_by_courses",
          { course_ids: allCourseIds }
        );
        if (lessonsError) {
          console.error("Error fetching lessons:", lessonsError);
        } else {
          lessonsData = (lessons || []).filter(
            (lesson) => lesson.course_instance_id === null
          );
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
      }

      // Fetch instructors data
      const { data: instructorsData, error: instructorsError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("role", "instructor");

      if (instructorsError) {
        console.error("Error fetching instructors:", instructorsError);
      }

      // Helper function to format template course data
      // בתוך פונקציית formatCourseData, החלף את החלק הזה:

      const formatCourseData = (course: any) => {
        // שלב 1: סינון ומיון השיעורים לפי order_index
        const courseLessons = lessonsData
          .filter((lesson) => lesson.course_id === course.id)
          .sort((a, b) => {
            // מיון לפי order_index, ואם הם שווים אז לפי id
            if (a.order_index !== b.order_index) {
              return a.order_index - b.order_index;
            }
            return a.id.localeCompare(b.id);
          });

        console.log(
          `Lessons for course ${course.name}:`,
          courseLessons.map((l) => ({
            title: l.title,
            order_index: l.order_index,
            id: l.id,
          }))
        );

        // שלב 2: יצירת מפה של lesson_id למספר השיעור הנכון
        const lessonNumberMap = new Map();
        courseLessons.forEach((lesson, index) => {
          lessonNumberMap.set(lesson.id, index + 1);
        });

        // שלב 3: בניית רשימת המשימות עם המספור הנכון
        const allCourseTasks = [];

        courseLessons.forEach((lesson) => {
          const lessonNumber = lessonNumberMap.get(lesson.id);
          const lessonTasks = tasksData
            .filter((task) => task.lesson_id === lesson.id)
            .sort((a, b) => a.order_index - b.order_index) // מיון משימות לפי order_index
            .map((task) => ({
              ...task,
              lesson_title: lesson.title,
              lesson_number: lessonNumber,
            }));

          allCourseTasks.push(...lessonTasks);
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
          school_type: course.school_type,
          presentation_link: course.presentation_link,
          program_link: course.program_link,
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
      const formattedTemplateCourses =
        allCoursesData?.map(formatCourseData) || [];

      console.log("Template courses: ", formattedTemplateCourses);
      setCourses(formattedTemplateCourses);
      setFilteredCourses(formattedTemplateCourses);
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [user, currentPage]); // Added currentPage dependency

  // Filter courses based on school type
  useEffect(() => {
    if (!schoolTypeFilter || schoolTypeFilter === "all") {
      setFilteredCourses(courses);
    } else {
      const filtered = courses.filter(
        (course) => course.school_type === schoolTypeFilter
      );
      setFilteredCourses(filtered);
    }
  }, [courses, schoolTypeFilter]);

  const handleCourseCreated = () => {
    fetchCourses();
  };

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
    setShowAssignDialog(true);
  };

  const handleAssignmentComplete = () => {
    fetchCourses();
  };

  const handleEditCourse = (course: Course) => {
    setEditCourse({
      id: course.id,
      instance_id: course.instance_id,
      name: course.name,
      grade_level: course.grade_level,
      max_participants: course.max_participants,
      price_per_lesson: course.price_per_lesson,
      tasks: course.tasks,
      start_date: course?.start_date,
      approx_end_date: course?.approx_end_date,
      school_type: course.school_type,
      presentation_link: course.presentation_link,
      program_link: course.program_link,
    });
    setShowCreateDialog(true);
  };

  const handleDialogClose = (open: boolean) => {
    setShowCreateDialog(open);
    if (!open) {
      setEditCourse(null);
    }
  };

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    const day = date.getDate();
    const month = date.getMonth() + 1; // months are zero-based
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  console.log("courses", courses);
  const isInstructor = user.user_metadata.role === "instructor";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 md:mb-0 mb-12">
      <div className="md:hidden">
        <MobileNavigation />
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            {user.user_metadata.role !== "instructor" ? (
              <>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  ניהול קורסים
                </h1>
                <p className="text-gray-600 text-lg">
                  ניהול וצפייה בכל הקורסים שאתה מעביר
                </p>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {" "}
                  הקורסים שלי
                </h1>
              </>
            )}
          </div>
          {!isInstructor && (
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="flex items-center space-x-2 space-x-reverse bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
            >
              <Plus className="h-4 w-4" />
              <span>תוכנית לימוד חדשה</span>
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="mb-6">
          <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <span className="font-medium text-gray-700">סינון:</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">סוג בית ספר:</span>
                  <Select
                    value={schoolTypeFilter}
                    onValueChange={setSchoolTypeFilter}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="כל סוגי בתי הספר" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">כל סוגי בתי הספר</SelectItem>
                      <SelectItem value="elementary">יסודי</SelectItem>
                      <SelectItem value="middle">חטיבה</SelectItem>
                      <SelectItem value="high">תיכון</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {schoolTypeFilter && schoolTypeFilter !== "all" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSchoolTypeFilter("all")}
                    className="text-gray-600"
                  >
                    נקה סינון
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {filteredCourses.length === 0 ? (
          <Card className="text-center py-16 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent>
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {schoolTypeFilter && schoolTypeFilter !== "all"
                  ? "לא נמצאו תוכניות לימוד מהסוג הנבחר"
                  : "אין תוכניות לימוד עדיין"}
              </h3>
              <p className="text-gray-600 mb-6 text-lg">
                {schoolTypeFilter && schoolTypeFilter !== "all"
                  ? "נסה לשנות את הסינון או לצור תוכנית לימוד חדשה"
                  : "התחל ליצור את תוכנית הלימוד הראשונה שלך"}
              </p>
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
          <>
            <div className="space-y-8">
              {filteredCourses.map((course) => (
                <Card
                  key={course.instance_id || course.id}
                    className={`shadow-xl border-0 backdrop-blur-sm ${
                      course.is_assigned
                        ? "bg-white/80"
                        : "bg-yellow-50/80 border-2 border-yellow-200"
                    }`}
                  >
                    <CardHeader
                      className={`text-white rounded-t-lg ${
                        course.is_assigned
                          ? "bg-gradient-to-r from-blue-600 to-blue-700"
                          : "bg-gradient-to-r from-amber-500 to-orange-600"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          {/* <div>
                        {" "}
                        {formatDate(course.approx_end_date)} -{" "}
                        {formatDate(course.start_date)}
                      </div> */}
                       {isMobile && (
                          <div className="flex justify-end absolute top-2 left-2 gap-2">
                            {hasAdminAccess && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-white hover:bg-white/20"
                                  onClick={() =>
                                    handleAssignCourse(
                                      course.id,
                                      course.instance_id || "",
                                      course.name
                                    )
                                  }
                                >
                                  <UserPlus className="h-4 w-4" />
                                  {!isMobile && (
                                    <span className="mr-1">הקצה</span>
                                  )}{" "}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-white hover:bg-white/20"
                                  onClick={() => handleDeleteClick(course)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  {!isMobile && (
                                    <span className="mr-1">מחק</span>
                                  )}{" "}
                                </Button>
                              </>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-white hover:bg-white/20"
                              onClick={() =>
                                toggleCardExpansion(
                                  course.instance_id || course.id
                                )
                              }
                              title={
                                expandedCards.has(
                                  course.instance_id || course.id
                                )
                                  ? "הסתר פרטים"
                                  : "הצג פרטים"
                              }
                            >
                              {expandedCards.has(
                                course.instance_id || course.id
                              ) ? (
                                <ChevronUp className="h-5 w-5" />
                              ) : (
                                <ChevronDown className="h-5 w-5" />
                              )}
                            </Button>
                          </div>
                        )}
                          <div className= {isMobile?"flex items-center gap-2 mb-2 mt-4":"flex items-center gap-2 mb-2" }>
                            <CardTitle className="text-2xl text-white">
                              {course.name}
                            </CardTitle>
                          </div>
                          {!course.is_assigned && (
                            <Badge className="bg-white/20 text-white border-white/30">
                              ממתין להקצאה
                            </Badge>
                          )}

                          <div>
                            {course.presentation_link ? (
                              <a
                                href={course.presentation_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`underline text-sm ${
                                  course.is_assigned
                                    ? "text-blue-100"
                                    : "text-amber-100"
                                }`}
                              >
                                <b> צפה במצגת הקורס</b>
                              </a>
                            ) : (
                              <span className="text-black font-bold">
                                לא קיימת מצגת המשוייכת לקורס זה{" "}
                              </span>
                            )}
                          </div>
                          <div className="mt-1">
                            {course.program_link ? (
                              <a
                                href={course.program_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`underline text-sm ${
                                  course.is_assigned
                                    ? "text-blue-100"
                                    : "text-amber-100"
                                }`}
                              >
                                <b> צפה בתכנית הפדגוגית</b>
                              </a>
                            ) : (
                              <span className="text-black font-bold">
                                לא קיימת תכנית פדגוגית לקורס זה{" "}
                              </span>
                            )}
                          </div>

                          {/* <CardDescription
                        className={`text-base ${
                          course.is_assigned
                            ? "text-blue-100"
                            : "text-amber-100"
                        }`}
                      >
                        {course.is_assigned
                          ? course.institution_name
                          : "ממתין להקצאה "}
                      </CardDescription> */}
                        </div>

                        {/* <div className="flex gap-2">
                        {user.user_metadata.role !== "instructor" && (<>
                         <Button
                           variant="ghost"
                           size="sm"
                           className="text-white hover:bg-white/20"
                           onClick={() =>
                             handleAssignCourse(
                               course.id,
                               course.instance_id || "",
                               course.name
                             )
                           }
                         >
                           <UserPlus className="h-4 w-4" />
                           <span className="mr-1">הקצה</span>
                         </Button>
                         </>)}
                          <Button
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-white/20"
                        onClick={() => toggleCardExpansion(course.instance_id || course.id)}
                        title={expandedCards.has(course.instance_id || course.id) ? "הסתר פרטים" : "הצג פרטים"}
                      >
                        {expandedCards.has(course.instance_id || course.id) ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </Button>
                      </div>
                     */}
                        {!isMobile && (
                          <div className="flex gap-2">
                            {hasAdminAccess && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-white hover:bg-white/20"
                                  onClick={() =>
                                    handleAssignCourse(
                                      course.id,
                                      course.instance_id || "",
                                      course.name
                                    )
                                  }
                                >
                                  <UserPlus className="h-4 w-4" />
                                  {!isMobile && (
                                    <span className="mr-1">הקצה</span>
                                  )}{" "}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-white hover:bg-white/20"
                                  onClick={() => handleDeleteClick(course)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  {!isMobile && (
                                    <span className="mr-1">מחק</span>
                                  )}{" "}
                                </Button>
                              </>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-white hover:bg-white/20"
                              onClick={() =>
                                toggleCardExpansion(
                                  course.instance_id || course.id
                                )
                              }
                              title={
                                expandedCards.has(
                                  course.instance_id || course.id
                                )
                                  ? "הסתר פרטים"
                                  : "הצג פרטים"
                              }
                            >
                              {expandedCards.has(
                                course.instance_id || course.id
                              ) ? (
                                <ChevronUp className="h-5 w-5" />
                              ) : (
                                <ChevronDown className="h-5 w-5" />
                              )}
                            </Button>
                          </div>
                        )}

                       
                      </div>
                      
                    </CardHeader>

                    {expandedCards.has(course.instance_id || course.id) && (
                      <CardContent className="p-6">
                        {/* Assignment Status Alert */}
                        {/* {!course.is_assigned && (
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                            <div className="flex items-center">
                              <div className="h-2 w-2 bg-amber-400 rounded-full mr-2"></div>
                              <span className="text-amber-800 font-medium">
                                קורס זה עדיין לא הוקצה למוסד ומדריך
                              </span>
                            </div>
                          </div>
                        )} */}

                        {/* Course Details */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                          <div className="flex items-center justify-evenly">
                            <span className="text-sm text-gray-600 font-medium">
                              סוג בית ספר:
                            </span>
                            <span className="text-sm font-bold text-blue-600">
                              {getSchoolTypeDisplayName(course.school_type)}
                            </span>
                          </div>
                          {/* <div className="flex items-center justify-evenly">
                      <span className="text-sm text-gray-600 font-medium">
                        שם המדריך:
                      </span>
                      <span
                        className={`text-sm font-bold ${
                          course.is_assigned
                            ? "text-green-600"
                            : "text-gray-400"
                        }`}
                      >
                        {course.is_assigned
                          ? course.instructor_name
                          : "לא צוין"}
                      </span>
                    </div> */}
                          {/* <div className="flex items-center justify-evenly">
                      <span className="text-sm text-gray-600 font-medium">
                        כיתה:
                      </span>
                      <span
                        className={`text-sm font-bold ${
                          course.is_assigned ? "text-gray-900" : "text-gray-400"
                        }`}
                      >
                        {course.is_assigned ? course.grade_level : "לא צוין"}
                      </span>
                    </div>
                    <div className="flex items-center justify-evenly">
                      <span className="text-sm text-gray-600 font-medium">
                        משתתפים:
                      </span>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1 text-gray-500" />
                        <span className="text-sm font-bold text-gray-900">
                          {course.max_participants}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-evenly">
                      <span className="text-sm text-gray-600 font-medium">
                        מחיר לשיעור:
                      </span>
                      <span className="text-sm font-bold text-green-600">
                        ₪{course.price_per_lesson}
                      </span>
                    </div> */}
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
                                    <TableHead className="text-right font-semibold">
                                      שם השיעור
                                    </TableHead>
                                    <TableHead className="text-right font-semibold max-w-xs">
                                      תיאור
                                    </TableHead>
                                    <TableHead className="text-right font-semibold">
                                      זמן מוערך
                                    </TableHead>
                                    <TableHead className="text-right font-semibold">
                                      סוג
                                    </TableHead>
                                    {course.is_assigned && (
                                      <TableHead className="text-right font-semibold">
                                        מועד שיעור
                                      </TableHead>
                                    )}
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {Object.entries(
                                    groupTasksByLesson(course.tasks)
                                  )
                                    .sort(([a], [b]) => Number(a) - Number(b)) // מיון לפי מספר השיעור
                                    .map(([lessonNumber, lessonTasks]) => (
                                      <React.Fragment key={lessonNumber}>
                                        {/* כותרת שיעור */}
                                        <TableRow className="bg-blue-100">
                                          <TableCell
                                            colSpan={course.is_assigned ? 6 : 5}
                                            className="font-bold text-right text-blue-900"
                                          >
                                            <div className="flex items-center justify-between">
                                              <span>
                                                שיעור {lessonNumber} –{" "}
                                                {lessonTasks[0]?.lesson_title ||
                                                  ""}
                                              </span>
                                              {course.is_assigned &&
                                                lessonTasks[0]
                                                  ?.scheduled_start && (
                                                  <div className="flex items-center text-sm text-blue-700 px-7">
                                                    {`${
                                                      formatDateTime(
                                                        lessonTasks[0]
                                                          .scheduled_end
                                                      ).split(" ")[1]
                                                    }
                                            - ${
                                              formatDateTime(
                                                lessonTasks[0].scheduled_start
                                              ).split(" ")[1]
                                            }`}
                                                    {" | "}

                                                    {
                                                      formatDateTime(
                                                        lessonTasks[0]
                                                          .scheduled_start
                                                      ).split(" ")[0]
                                                    }
                                                    <Calendar className="h-4 w-4 mr-1" />
                                                  </div>
                                                )}
                                            </div>
                                          </TableCell>
                                        </TableRow>

                                        {/* המשימות של השיעור הזה */}
                                        {lessonTasks.map((task) => (
                                          <TableRow
                                            key={task.id}
                                            className="hover:bg-gray-50"
                                          >
                                            <TableCell className="font-medium">
                                              <div className="flex items-center">
                                                <Circle className="h-4 w-4 text-gray-400 mr-2" />
                                                {task.title}
                                              </div>
                                            </TableCell>
                                            <TableCell className="text-gray-600 max-w-xs truncate">
                                              {task.description || "ללא תיאור"}
                                            </TableCell>
                                            <TableCell>
                                              <div className="flex items-center text-sm text-gray-600">
                                                <Clock className="h-3 w-3 mr-1" />
                                                {task.estimated_duration} דק׳
                                              </div>
                                            </TableCell>
                                            <TableCell>
                                              <Badge
                                                variant={
                                                  task.is_mandatory
                                                    ? "destructive"
                                                    : "secondary"
                                                }
                                                className={
                                                  task.is_mandatory
                                                    ? "bg-red-100 text-red-800"
                                                    : "bg-gray-100 text-gray-800"
                                                }
                                              >
                                                {task.is_mandatory
                                                  ? "חובה"
                                                  : "רשות"}
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
                              <p className="text-sm">
                                ניתן להוסיף משימות בעת עריכת הקורס
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-6 space-y-3">
                          {user.user_metadata.role !== "instructor" && (
                            <Button
                              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                              size="sm"
                              onClick={() => handleEditCourse(course)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              לעריכה
                            </Button>
                          )}
                          {!course.is_assigned &&
                            user.user_metadata.role !== "instructor" && (
                              <Button
                                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                                size="sm"
                                onClick={() =>
                                  handleAssignCourse(
                                    course.id,
                                    course.instance_id,
                                    course.name
                                  )
                                }
                              >
                                <UserPlus className="h-4 w-4 mr-2" />
                                הקצה קורס למוסד
                              </Button>
                            )}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                )
              )}
            </div>

            {/* PAGINATION UI - רק UI חדש, לא שינוי בלוגיקה! */}
            {!loading && totalCount > 0 && (
              <div className="mt-6">
                <Pagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(totalCount / pageSize)}
                  totalItems={totalCount}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  isLoading={loading}
                />
              </div>
            )}
          </>
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
            instanceId={selectedCourse.instanceId}
            courseId={selectedCourse.id}
            courseName={selectedCourse.name}
            onAssignmentComplete={handleAssignmentComplete}
          />
        )}
        {courseToDelete && (
          <DeleteCourseDialog
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
            courseName={courseToDelete.name}
            assignments={assignmentDetails}
            onConfirmDelete={confirmDelete}
          />
        )}
      </main>
    </div>
  );
};

export default Courses;
