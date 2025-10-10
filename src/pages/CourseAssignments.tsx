// import React, { useEffect, useState } from "react";
// import { useAuth } from "@/components/auth/AuthProvider";
// import { Button } from "@/components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import {
//   Users,
//   Calendar,
//   Edit,
//   Clock,
//   CheckCircle2,
//   Circle,
//   UserPlus,
//   Filter,
// } from "lucide-react";
// import { supabase } from "@/integrations/supabase/client";
// import { getSchoolTypeDisplayName, getSchoolTypeColors } from "@/utils/schoolTypeUtils";
// import CourseAssignDialog from "@/components/CourseAssignDialog";
// import MobileNavigation from "@/components/layout/MobileNavigation";
// import { fetchCombinedSchedules } from "@/utils/scheduleUtils";

// interface Task {
//   id: string;
//   title: string;
//   description: string;
//   estimated_duration: number;
//   is_mandatory: boolean;
//   lesson_number: number;
//   lesson_title?: string;
//   order_index: number;
//   scheduled_start?: string;
//   scheduled_end?: string;
// }

// interface CourseAssignment {
//   id: string;
//   instance_id: string;
//   name: string;
//   grade_level: string;
//   max_participants: number;
//   price_for_instructor: number;
//   price_for_customer: number;
//   institution_name: string;
//   instructor_name: string;
//   lesson_count: number;
//   tasks: Task[];
//   start_date: string;
//   approx_end_date: string;
//   school_type?: string;
//   presentation_link?: string;
// }

// const CourseAssignments = () => {
//   const { user } = useAuth();
//   const [assignments, setAssignments] = useState<CourseAssignment[]>([]);
//   const [filteredAssignments, setFilteredAssignments] = useState<CourseAssignment[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [showDialog, setShowDialog] = useState(false);
//   const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
//   const [selectedCourse, setSelectedCourse] = useState<{
//     id: string;
//     instanceId: string;
//     name: string;
//   } | null>(null);
//   const [editData, setEditData] = useState<CourseAssignment | null>(null);

//   // Filter states
//   const [instructorFilter, setInstructorFilter] = useState<string>('');
//   const [institutionFilter, setInstitutionFilter] = useState<string>('');
//   const [courseFilter, setCourseFilter] = useState<string>('');
//   const [schoolTypeFilter, setSchoolTypeFilter] = useState<string>('');

//   // Filter options
//   const [instructors, setInstructors] = useState<any[]>([]);
//   const [institutions, setInstitutions] = useState<any[]>([]);
//   const [courseTemplates, setCourseTemplates] = useState<any[]>([]);

//   // Check user role and permissions
//   const userRole = user?.user_metadata?.role;
//   const hasAdminAccess = ['admin', 'pedagogical_manager'].includes(userRole);
//   const isInstructor = userRole === 'instructor';

//   const groupTasksByLesson = (tasks: Task[]) => {
//     const grouped: Record<number, Task[]> = {};
//     for (const task of tasks) {
//       if (!grouped[task.lesson_number]) {
//         grouped[task.lesson_number] = [];
//       }
//       grouped[task.lesson_number].push(task);
//     }
//     return grouped;
//   };

//   const fetchFilterOptions = async () => {
//     try {
//       // Fetch instructors
//       const { data: instructorsData, error: instructorsError } = await supabase
//         .from('profiles')
//         .select('id, full_name')
//         .eq('role', 'instructor')
//         .order('full_name');

//       if (instructorsError) throw instructorsError;

//       // Fetch institutions
//       const { data: institutionsData, error: institutionsError } = await supabase
//         .from('educational_institutions')
//         .select('id, name')
//         .order('name');

//       if (institutionsError) throw institutionsError;

//       // Fetch course templates
//       const { data: coursesData, error: coursesError } = await supabase
//         .from('courses')
//         .select('id, name, school_type')
//         .order('name');

//       if (coursesError) throw coursesError;

//       setInstructors(instructorsData || []);
//       setInstitutions(institutionsData || []);
//       setCourseTemplates(coursesData || []);
//     } catch (error) {
//       console.error('Error fetching filter options:', error);
//     }
//   };

//   const fetchAssignments = async () => {
//     if (!user) return;

//     try {
//       let query = supabase.from("course_instances").select(`
//         id,
//         grade_level,
//         max_participants,
//         price_for_customer,
//         price_for_instructor,
//         start_date,
//         end_date,
//         created_at,
//         course:course_id (
//           id,
//           name,
//           school_type,
//           presentation_link
//         ),
//         instructor:instructor_id (
//           id,
//           full_name
//         ),
//         institution:institution_id (
//           id,
//           name
//         )
//       `);

//       // If user is instructor, filter by their assignments only
//       if (isInstructor && user?.id) {
//         query = query.eq('instructor_id', user.id);
//       }

//       const { data: coursesData, error: instancesError } = await query;

//       if (instancesError) throw instancesError;

//       console.log(`[DEBUG] Found ${coursesData?.length || 0} course instances for ${isInstructor ? 'instructor' : 'admin'}:`, coursesData);

//       // Fetch lessons and tasks for assigned courses
//       const courseIds = coursesData?.map((instance: any) => instance.course?.id).filter(Boolean) || [];
//       console.log(`[DEBUG] Course instances details:`, coursesData?.map(instance => ({
//         instanceId: instance.id,
//         courseId: instance.course?.id,
//         courseName: instance.course?.name,
//         instructorId: instance.instructor?.id
//       })));
//       let lessonsData: any[] = [];
//       let tasksData: any[] = [];
//       let schedulesData: any[] = [];

//       if (courseIds.length > 0) {
//         // Fetch lessons
//         console.log(`[DEBUG] About to fetch lessons for course IDs:`, courseIds);

//         // First, let's check if any lessons exist at all for these courses
//         const { data: allLessonsForCourse, error: allLessonsError } = await supabase
//           .from("lessons")
//           .select("id, title, course_id, instructor_id")
//           .in("course_id", courseIds);

//         console.log(`[DEBUG] All lessons found for courses (before any filtering):`, allLessonsForCourse);
//         console.log(`[DEBUG] Current user role:`, userRole, `Current user ID:`, user?.id);

//         const { data: lessons, error: lessonsError } = await supabase
//           .from("lessons")
//           .select("*")
//           .in("course_id", courseIds)
//           .order("order_index");

//         if (lessonsError) {
//           console.error("Error fetching lessons:", lessonsError);
//         } else {
//           lessonsData = lessons || [];
//           console.log(`[DEBUG] Found ${lessonsData.length} lessons for course IDs:`, courseIds, lessonsData);
//         }

//         // Fetch tasks for all lessons
//         const lessonIds = lessonsData
//           .map((lesson) => lesson.id)
//           .filter(Boolean);
//         if (lessonIds.length > 0) {
//           const { data: tasks, error: tasksError } = await supabase
//             .from("lesson_tasks")
//             .select("*")
//             .in("lesson_id", lessonIds)
//             .order("order_index");

//           if (tasksError) {
//             console.error("Error fetching tasks:", tasksError);
//           } else {
//             tasksData = tasks || [];
//             console.log(`[DEBUG] Found ${tasksData.length} tasks for ${lessonIds.length} lessons:`, tasksData);
//           }
//         }

//         // Fetch combined lesson schedules (legacy + new architecture)
//         const courseInstanceIds = coursesData?.map((instance) => instance.id) || [];
//         if (courseInstanceIds.length > 0) {
//           try {
//             const allSchedules = await fetchCombinedSchedules();
//             // Filter schedules for the relevant course instances
//             schedulesData = allSchedules.filter(schedule =>
//               courseInstanceIds.includes(schedule.course_instance_id)
//             );

//           } catch (error) {
//             console.error("Error fetching combined schedules:", error);
//             schedulesData = [];
//           }
//         }
//       }

//       // Format assigned courses data
//       const formatAssignmentData = (instanceData: any) => {
//         const course = instanceData.course;
//         const courseLessons = lessonsData.filter(
//           (lesson) => lesson.course_id === course.id
//         );

//         const allCourseTasks = courseLessons.flatMap((lesson) => {
//           const lessonTasks = tasksData.filter(
//             (task) => task.lesson_id === lesson.id
//           );

//           const lessonSchedule = schedulesData.find(
//             (schedule) =>
//               schedule.lesson_id === lesson.id &&
//               schedule.course_instance_id === instanceData.id
//           );

//           return lessonTasks.map((task) => ({
//             ...task,
//             lesson_title: lesson.title,
//             lesson_number: courseLessons.findIndex((l) => l.id === lesson.id) + 1,
//             scheduled_start: lessonSchedule?.scheduled_start || null,
//             scheduled_end: lessonSchedule?.scheduled_end || null,
//           }));
//         });

//         return {
//           id: course.id,
//           instance_id: instanceData.id,
//           name: course.name || "ללא שם קורס",
//           grade_level: instanceData.grade_level || "לא צוין",
//           max_participants: instanceData.max_participants || 0,
//           price_for_customer: instanceData.price_for_customer || 0,
//           price_for_instructor: instanceData.price_for_instructor || 0,
//           institution_name: instanceData.institution?.name || "לא צוין",
//           instructor_name: instanceData.instructor?.full_name || "לא צוין",
//           lesson_count: courseLessons.length,
//           start_date: instanceData.start_date || null,
//           approx_end_date: instanceData.end_date || null,
//           school_type: course.school_type,
//           presentation_link: course.presentation_link,
//           tasks: allCourseTasks.map((task: any) => ({
//             id: task.id,
//             title: task.title,
//             description: task.description,
//             estimated_duration: task.estimated_duration,
//             is_mandatory: task.is_mandatory,
//             lesson_number: task.lesson_number,
//             lesson_title: task.lesson_title,
//             order_index: task.order_index,
//             scheduled_start: task.scheduled_start,
//             scheduled_end: task.scheduled_end,
//           })),
//         };
//       };

//       const formattedAssignments = coursesData?.map(formatAssignmentData) || [];
//       console.log(`[DEBUG] Final formatted assignments:`, formattedAssignments.map(a => ({
//         name: a.name,
//         tasks_count: a.tasks.length,
//         lesson_count: a.lesson_count
//       })));
//       setAssignments(formattedAssignments);
//       setFilteredAssignments(formattedAssignments);
//     } catch (error) {
//       console.error("Error fetching assignments:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchAssignments();
//     fetchFilterOptions();
//   }, [user]);

//   // Apply filters
//   useEffect(() => {
//     let filtered = assignments;

//     if (instructorFilter && instructorFilter !== 'all') {
//       filtered = filtered.filter(assignment =>
//         assignment.instructor_name.includes(instructorFilter) ||
//         instructors.find(instructor => instructor.id === instructorFilter)?.full_name === assignment.instructor_name
//       );
//     }

//     if (institutionFilter && institutionFilter !== 'all') {
//       filtered = filtered.filter(assignment =>
//         assignment.institution_name.includes(institutionFilter) ||
//         institutions.find(institution => institution.id === institutionFilter)?.name === assignment.institution_name
//       );
//     }

//     if (courseFilter && courseFilter !== 'all') {
//       filtered = filtered.filter(assignment =>
//         assignment.name.includes(courseFilter) ||
//         courseTemplates.find(course => course.id === courseFilter)?.name === assignment.name
//       );
//     }

//     if (schoolTypeFilter && schoolTypeFilter !== 'all') {
//       filtered = filtered.filter(assignment => assignment.school_type === schoolTypeFilter);
//     }

//     setFilteredAssignments(filtered);
//   }, [assignments, instructorFilter, institutionFilter, courseFilter, schoolTypeFilter, instructors, institutions, courseTemplates]);

//   // Handle creating new assignment
//   const handleAssignCourse = (
//     courseId: string,
//     instanceId: string,
//     courseName: string
//   ) => {
//     setSelectedCourse({
//       id: courseId,
//       instanceId: instanceId,
//       name: courseName,
//     });
//     setDialogMode('create');
//     setEditData(null);
//     setShowDialog(true);
//   };

//   // Handle editing existing assignment
//   const handleEditAssignment = (assignment: CourseAssignment) => {
//     setEditData(assignment);
//     setDialogMode('edit');
//     // Set selectedCourse with the course ID for edit mode
//     setSelectedCourse({
//       id: assignment.id,
//       instanceId: assignment.instance_id,
//       name: assignment.name,
//     });
//     console.log("Editing assignment:", assignment);
//     setShowDialog(true);
//   };

//   const handleAssignmentComplete = () => {
//     fetchAssignments();
//     setSelectedCourse(null);
//     setEditData(null);
//   };

//   const formatDate = (isoDate: string) => {
//     if (!isoDate) return "לא צוין";
//     const date = new Date(isoDate);
//     const day = date.getDate();
//     const month = date.getMonth() + 1;
//     const year = date.getFullYear();
//     return `${day}.${month}.${year}`;
//   };

//   const formatDateTime = (isoDateTime: string) => {
//     if (!isoDateTime) return null;
//     const date = new Date(isoDateTime);
//     const day = date.getDate();
//     const month = date.getMonth() + 1;
//     const year = date.getFullYear();
//     const hours = date.getHours().toString().padStart(2, "0");
//     const minutes = date.getMinutes().toString().padStart(2, "0");
//     return `${day}.${month}.${year} ${hours}:${minutes}`;
//   };

//   // Redirect if user doesn't have permission to view page
//   if (!hasAdminAccess && !isInstructor) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
//         <Card className="text-center py-16 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
//           <CardContent>
//             <Users className="h-16 w-16 text-red-400 mx-auto mb-6" />
//             <h3 className="text-xl font-semibold text-gray-900 mb-3">
//               אין הרשאה לצפייה בדף זה
//             </h3>
//             <p className="text-gray-600 mb-6 text-lg">
//               רק מנהלים, מנהלים פדגוגיים ומדריכים יכולים לצפות בהקצאות קורסים
//             </p>
//           </CardContent>
//         </Card>
//       </div>
//     );
//   }

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
//         <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
//       <div className="md:hidden">
//         <MobileNavigation />
//       </div>

//       <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         {/* Header */}
//         <div className="flex justify-between items-center mb-8">
//           <div>
//             <h1 className="text-3xl font-bold text-gray-900 mb-2">
//               {isInstructor ? "הקורסים שלי" : "הקצאות קורסים"}
//             </h1>
//             <p className="text-gray-600 text-lg">
//               {isInstructor
//                 ? "צפייה בקורסים שהוקצו לך"
//                 : "ניהול וצפייה בכל הקורסים שהוקצו למדריכים"
//               }
//             </p>
//           </div>
//         </div>

//         {/* Filters - Only show for admins */}
//         {hasAdminAccess && (
//           <div className="mb-6">
//             <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
//               <CardContent className="p-4">
//                 <div className="space-y-4">
//                   <div className="flex items-center gap-2">
//                     <Filter className="h-4 w-4 text-gray-500" />
//                     <span className="font-medium text-gray-700">סינון:</span>
//                   </div>

//                   <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//                     <div className="flex flex-col gap-2">
//                       <span className="text-sm text-gray-600">מדריך:</span>
//                       <Select value={instructorFilter} onValueChange={setInstructorFilter}>
//                         <SelectTrigger>
//                           <SelectValue placeholder="כל המדריכים" />
//                         </SelectTrigger>
//                         <SelectContent>
//                           <SelectItem value="all">כל המדריכים</SelectItem>
//                           {instructors.map((instructor) => (
//                             <SelectItem key={instructor.id} value={instructor.full_name}>
//                               {instructor.full_name}
//                             </SelectItem>
//                           ))}
//                         </SelectContent>
//                       </Select>
//                     </div>

//                     <div className="flex flex-col gap-2">
//                       <span className="text-sm text-gray-600">מוסד חינוכי:</span>
//                       <Select value={institutionFilter} onValueChange={setInstitutionFilter}>
//                         <SelectTrigger>
//                           <SelectValue placeholder="כל המוסדות" />
//                         </SelectTrigger>
//                         <SelectContent>
//                           <SelectItem value="all">כל המוסדות</SelectItem>
//                           {institutions.map((institution) => (
//                             <SelectItem key={institution.id} value={institution.name}>
//                               {institution.name}
//                             </SelectItem>
//                           ))}
//                         </SelectContent>
//                       </Select>
//                     </div>

//                     <div className="flex flex-col gap-2">
//                       <span className="text-sm text-gray-600">קורס:</span>
//                       <Select value={courseFilter} onValueChange={setCourseFilter}>
//                         <SelectTrigger>
//                           <SelectValue placeholder="כל הקורסים" />
//                         </SelectTrigger>
//                         <SelectContent>
//                           <SelectItem value="all">כל הקורסים</SelectItem>
//                           {courseTemplates.map((course) => (
//                             <SelectItem key={course.id} value={course.name}>
//                               {course.name}
//                             </SelectItem>
//                           ))}
//                         </SelectContent>
//                       </Select>
//                     </div>

//                     <div className="flex flex-col gap-2">
//                       <span className="text-sm text-gray-600">סוג בית ספר:</span>
//                       <Select value={schoolTypeFilter} onValueChange={setSchoolTypeFilter}>
//                         <SelectTrigger>
//                           <SelectValue placeholder="כל סוגי בתי הספר" />
//                         </SelectTrigger>
//                         <SelectContent>
//                           <SelectItem value="all">כל סוגי בתי הספר</SelectItem>
//                           <SelectItem value="elementary">יסודי</SelectItem>
//                           <SelectItem value="middle">חטיבה</SelectItem>
//                           <SelectItem value="high">תיכון</SelectItem>
//                         </SelectContent>
//                       </Select>
//                     </div>
//                   </div>

//                   {(instructorFilter || institutionFilter || courseFilter || schoolTypeFilter) && (
//                     <div className="flex gap-2 flex-wrap">
//                       <Button
//                         variant="outline"
//                         size="sm"
//                         onClick={() => {
//                           setInstructorFilter('');
//                           setInstitutionFilter('');
//                           setCourseFilter('');
//                           setSchoolTypeFilter('');
//                         }}
//                         className="text-gray-600"
//                       >
//                         נקה את כל הסינונים
//                       </Button>
//                     </div>
//                   )}
//                 </div>
//               </CardContent>
//             </Card>
//           </div>
//         )}

//         {filteredAssignments.length === 0 ? (
//           <Card className="text-center py-16 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
//             <CardContent>
//               <Users className="h-16 w-16 text-gray-400 mx-auto mb-6" />
//               <h3 className="text-xl font-semibold text-gray-900 mb-3">
//                 {(instructorFilter && instructorFilter !== 'all' || institutionFilter && institutionFilter !== 'all' || courseFilter && courseFilter !== 'all' || schoolTypeFilter && schoolTypeFilter !== 'all')
//                   ? "לא נמצאו הקצאות התואמות לסינון"
//                   : (isInstructor ? "אין קורסים מוקצים" : "אין הקצאות קורסים עדיין")
//                 }
//               </h3>
//               <p className="text-gray-600 mb-6 text-lg">
//                 {(instructorFilter && instructorFilter !== 'all' || institutionFilter && institutionFilter !== 'all' || courseFilter && courseFilter !== 'all' || schoolTypeFilter && schoolTypeFilter !== 'all')
//                   ? "נסה לשנות את הסינון או לנקות את הסינונים"
//                   : (isInstructor
//                     ? "לא נמצאו קורסים שהוקצו לך"
//                     : "לא נמצאו קורסים שהוקצו למדריכים"
//                   )
//                 }
//               </p>
//             </CardContent>
//           </Card>
//         ) : (
//           <div className="space-y-8">
//             {filteredAssignments.map((assignment) => (
//               <Card
//                 key={assignment.instance_id}
//                 className="shadow-xl border-0 backdrop-blur-sm bg-white/80"
//               >
//                 <CardHeader className="text-white rounded-t-lg bg-gradient-to-r from-blue-600 to-blue-700">
//                   <div className="flex justify-between items-start">
//                     <div>
//                       <div className="text-blue-100 mb-1">
//                         {formatDate(assignment.start_date)} - {formatDate(assignment.approx_end_date)}
//                       </div>
//                       <div className="flex items-center gap-2 mb-2">
//                         <CardTitle className="text-2xl text-white">
//                           {assignment.name}
//                         </CardTitle>
//                         <Badge className="bg-green-500/20 text-green-100 border-green-300/30">
//                           מוקצה
//                         </Badge>
//                       </div>
//                       {assignment.presentation_link ? (
//                         <a
//                           href={assignment.presentation_link}
//                           target="_blank"
//                           rel="noopener noreferrer"
//                           className="underline text-sm text-blue-100"
//                         >
//                        <b>   צפה במצגת הקורס</b>
//                         </a>
//                       )
//                    :(
//                      <span className="text-black">לא קיימת מצגת המשוייכת להקצאה זו  </span>
//                     )}
//                       <CardDescription className="text-blue-100 text-base">
//                         {assignment.institution_name} • מדריך: {assignment.instructor_name}
//                       </CardDescription>
//                     </div>
//                     {/* Only show action buttons for admin/pedagogical_manager */}
//                     {hasAdminAccess && (
//                       <div className="flex gap-2">
//                         <Button
//                           variant="ghost"
//                           size="sm"
//                           className="text-white hover:bg-white/20"
//                           onClick={() => handleEditAssignment(assignment)}
//                           title="עריכת הקצאה"
//                         >
//                           <Edit className="h-4 w-4" />
//                         </Button>
//                         <Button
//                           variant="ghost"
//                           size="sm"
//                           className="text-white hover:bg-white/20"
//                           onClick={() =>
//                             handleAssignCourse(
//                               assignment.id,
//                               assignment.instance_id,
//                               assignment.name
//                             )
//                           }
//                           title="הקצאה חדשה"
//                         >
//                           <UserPlus className="h-4 w-4" />
//                         </Button>
//                       </div>
//                     )}
//                   </div>
//                 </CardHeader>

//                 <CardContent className="p-6">
//                   {/* Course Info Grid */}
//                   <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
//                     <div className={`${getSchoolTypeColors(assignment.school_type).bg} p-4 rounded-lg border ${getSchoolTypeColors(assignment.school_type).border}`}>
//                       <div className={`flex items-center ${getSchoolTypeColors(assignment.school_type).text} mb-2`}>
//                         <span className="font-medium">סוג בית ספר</span>
//                       </div>
//                       <span className="text-lg font-bold text-gray-900">
//                         {getSchoolTypeDisplayName(assignment.school_type)}
//                       </span>
//                     </div>

//                     <div className="bg-blue-50 p-4 rounded-lg">
//                       <div className="flex items-center text-blue-600 mb-2">
//                         <Users className="h-5 w-5 ml-2" />
//                         <span className="font-medium">כיתה</span>
//                       </div>
//                       <span className="text-lg font-bold text-gray-900">
//                         {assignment.grade_level}
//                       </span>
//                     </div>

//                     <div className="bg-green-50 p-4 rounded-lg">
//                       <div className="flex items-center text-green-600 mb-2">
//                         <Users className="h-5 w-5 ml-2" />
//                         <span className="font-medium">מקסימום תלמידים</span>
//                       </div>
//                       <span className="text-lg font-bold text-gray-900">
//                         {assignment.max_participants}
//                       </span>
//                     </div>

//                     <div className="bg-purple-50 p-4 rounded-lg">
//                       <div className="flex items-center text-purple-600 mb-2">
//                         <Calendar className="h-5 w-5 ml-2" />
//                         <span className="font-medium">מספר שיעורים</span>
//                       </div>
//                       <span className="text-lg font-bold text-gray-900">
//                         {assignment.lesson_count}
//                       </span>
//                     </div>

//                     <div className="bg-orange-50 p-4 rounded-lg">
//                       <div className="flex items-center text-orange-600 mb-2">
//                         <span className="font-medium">מחיר ללקוח</span>
//                       </div>
//                       <span className="text-lg font-bold text-gray-900">
//                         ₪{assignment.price_for_customer}
//                       </span>
//                     </div>
//                   </div>

//                   {/* Tasks Section */}
//                   {assignment.tasks.length > 0 && (
//                     <div>
//                       <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
//                         <CheckCircle2 className="h-5 w-5 ml-2 text-green-600" />
//                         משימות הקורס
//                       </h3>

//                       <div className="space-y-6">
//                         {Object.entries(groupTasksByLesson(assignment.tasks)).map(([lessonNumber, tasks]) => (
//                           <div key={lessonNumber} className="bg-gray-50 rounded-lg p-4">
//                             <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
//                               <Calendar className="h-4 w-4 ml-2" />
//                               שיעור {lessonNumber}: {tasks[0]?.lesson_title || "ללא כותרת"}
//                             </h4>

//                             <Table>
//                               <TableHeader>
//                                 <TableRow>
//                                   <TableHead className="text-right">משימה</TableHead>
//                                   <TableHead className="text-right">זמן משוער</TableHead>
//                                   <TableHead className="text-right">סטטוס</TableHead>
//                                   <TableHead className="text-right">זמן מתוכנן</TableHead>
//                                 </TableRow>
//                               </TableHeader>
//                               <TableBody>
//                                 {tasks
//                                   .sort((a, b) => a.order_index - b.order_index)
//                                   .map((task) => (
//                                     <TableRow key={task.id}>
//                                       <TableCell>
//                                         <div>
//                                           <span className="font-medium">{task.title}</span>
//                                           {task.description && (
//                                             <p className="text-sm text-gray-600 mt-1">
//                                               {task.description}
//                                             </p>
//                                           )}
//                                         </div>
//                                       </TableCell>
//                                       <TableCell>
//                                         <div className="flex items-center text-gray-600">
//                                           <Clock className="h-4 w-4 ml-1" />
//                                           <span>{task.estimated_duration} דקות</span>
//                                         </div>
//                                       </TableCell>
//                                       <TableCell>
//                                         <div className="flex items-center">
//                                           {task.is_mandatory ? (
//                                             <CheckCircle2 className="h-4 w-4 text-red-500 ml-2" />
//                                           ) : (
//                                             <Circle className="h-4 w-4 text-gray-400 ml-2" />
//                                           )}
//                                           <span className={task.is_mandatory ? "text-red-600 font-medium" : "text-gray-600"}>
//                                             {task.is_mandatory ? "חובה" : "רשות"}
//                                           </span>
//                                         </div>
//                                       </TableCell>
//                                       <TableCell>
//                                         {task.scheduled_start && task.scheduled_end ? (
//                                           <div className="text-sm">
//                                             <div>{formatDateTime(task.scheduled_start)}</div>
//                                             <div className="text-gray-500">עד {formatDateTime(task.scheduled_end)}</div>
//                                           </div>
//                                         ) : (
//                                           <span className="text-gray-400">לא מתוכנן</span>
//                                         )}
//                                       </TableCell>
//                                     </TableRow>
//                                   ))}
//                               </TableBody>
//                             </Table>
//                           </div>
//                         ))}
//                       </div>
//                     </div>
//                   )}
//                 </CardContent>
//               </Card>
//             ))}
//           </div>
//         )}

//         {/* Course Assignment Dialog - Works for both create and edit modes */}
//         {hasAdminAccess && (
//           <CourseAssignDialog
//             open={showDialog}
//             onOpenChange={setShowDialog}
//             mode={dialogMode}
//             courseId={selectedCourse?.id}
//             courseName={selectedCourse?.name}
//             instanceId={selectedCourse?.instanceId}
//             editData={editData ? {
//               instance_id: editData.instance_id,
//               name: editData.name,
//               grade_level: editData.grade_level,
//               max_participants: editData.max_participants,
//               price_for_customer: editData.price_for_customer,
//               price_for_instructor: editData.price_for_instructor,
//               institution_name: editData.institution_name,
//               instructor_name: editData.instructor_name,
//               start_date: editData.start_date,
//               approx_end_date: editData.approx_end_date,
//             } : undefined}
//             onAssignmentComplete={handleAssignmentComplete}
//           />
//         )}
//       </main>
//     </div>
//   );
// };

// export default CourseAssignments;

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
  Users,
  Calendar,
  Edit,
  Clock,
  CheckCircle2,
  Circle,
  UserPlus,
  Filter,
  Trash,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  getSchoolTypeDisplayName,
  getSchoolTypeColors,
} from "@/utils/schoolTypeUtils";
import CourseAssignDialog from "@/components/CourseAssignDialog";
import MobileNavigation from "@/components/layout/MobileNavigation";
import { fetchCombinedSchedules } from "@/utils/scheduleUtils";
import { DeleteConfirmationPopup } from "@/components/ui/DeleteConfirmationPopup ";

interface Task {
  id: string;
  title: string;
  description: string;
  estimated_duration: number;
  is_mandatory: boolean;
  lesson_number: number;
  lesson_title?: string;
  lesson_id?: string;
  order_index: number;
  scheduled_start?: string;
  scheduled_end?: string;
  report_status?: {
    isReported: boolean;
    isCompleted?: boolean;
    isLessonOk?: boolean;
    reportId?: string;
  };
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
  school_type?: string;
  presentation_link?: string;
  program_link?: string;
  lesson_mode?: 'template' | 'custom_only' | 'combined'; // *** הוסף את זה ***

}

// מטמון זמני לשיפור ביצועים
const statusCache = new Map<
  string,
  { data: Map<string, any>; timestamp: number }
>();
const CACHE_TTL = 30 * 1000; // 30 שניות

const CourseAssignments = () => {
  const { user } = useAuth();

  const [assignments, setAssignments] = useState<CourseAssignment[]>([]);
  const [deleteTargetAssignment, setDeleteTargetAssignment] =
    useState<CourseAssignment | null>(null);
  const [filteredAssignments, setFilteredAssignments] = useState<
    CourseAssignment[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [selectedCourse, setSelectedCourse] = useState<{
    id: string;
    instanceId: string;
    name: string;
  } | null>(null);
  const [editData, setEditData] = useState<CourseAssignment | null>(null);

  // Filter states
  const [instructorFilter, setInstructorFilter] = useState<string>("");
  const [institutionFilter, setInstitutionFilter] = useState<string>("");
  const [courseFilter, setCourseFilter] = useState<string>("");
  const [schoolTypeFilter, setSchoolTypeFilter] = useState<string>("");

  // Filter options
  const [instructors, setInstructors] = useState<any[]>([]);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [courseTemplates, setCourseTemplates] = useState<any[]>([]);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  // Report status state
  const [reportStatusMap, setReportStatusMap] = useState<
    Map<
      string,
      { isCompleted: boolean; isLessonOk: boolean; reportId?: string }
    >
  >(new Map());

  // Check user role and permissions
  const userRole = user?.user_metadata?.role;
  const hasAdminAccess = ["admin", "pedagogical_manager"].includes(userRole);
  const isInstructor = userRole === "instructor";

  // Function to toggle card expansion
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
  // שיפור פונקציית fetchReportStatuses
  const fetchReportStatuses = async (
    courseInstanceIds: string[]
  ): Promise<
    Map<
      string,
      { isCompleted: boolean; isLessonOk: boolean; reportId?: string }
    >
  > => {
    if (!courseInstanceIds || courseInstanceIds.length === 0) {
      return new Map();
    }

    try {
      console.log(
        "[DEBUG] Fetching report statuses for course instances:",
        courseInstanceIds
      );

      // Fetch lesson reports with their associated reported_lesson_instances
      const { data: lessonReports, error } = await supabase
        .from("lesson_reports")
        .select(
          `
          id,
          is_completed,
          is_lesson_ok,
          created_at,
          reported_lesson_instances!inner (
            lesson_schedule_id,
            course_instance_id,
            lesson_id,
            scheduled_date
          )
        `
        )
        .in("reported_lesson_instances.course_instance_id", courseInstanceIds);

      if (error) {
        console.error("Error fetching lesson reports:", error);
        return new Map();
      }

      console.log("[DEBUG] Found lesson reports:", lessonReports?.length || 0);

      // Create a map for report statuses with improved key generation
      const statusMap = new Map<
        string,
        { isCompleted: boolean; isLessonOk: boolean; reportId: string }
      >();

      lessonReports?.forEach((report: any) => {
        if (!report.reported_lesson_instances) return;

        // Handle both single instance and array of instances
        const instances = Array.isArray(report.reported_lesson_instances)
          ? report.reported_lesson_instances
          : [report.reported_lesson_instances];

        instances.forEach((instance: any) => {
          if (!instance) return;

          const keys: string[] = [];

          // Legacy architecture: use lesson_schedule_id
          if (instance.lesson_schedule_id) {
            keys.push(instance.lesson_schedule_id);
          }

          // New architecture: create composite key
          if (instance.course_instance_id && instance.lesson_id) {
            keys.push(`${instance.course_instance_id}_${instance.lesson_id}`);
          }

          // Store status for all relevant keys
          keys.forEach((key) => {
            if (key) {
              // If key already exists, keep the most recent report
              const existing = statusMap.get(key);
              if (
                !existing ||
                new Date(report.created_at) > new Date(existing.reportId)
              ) {
                statusMap.set(key, {
                  isCompleted: report.is_completed !== false,
                  isLessonOk: report.is_lesson_ok || false,
                  reportId: report.id,
                });
              }
            }
          });
        });
      });

      console.log("[DEBUG] Created status map with", statusMap.size, "entries");
      return statusMap;
    } catch (error) {
      console.error("Error in fetchReportStatuses:", error);
      return new Map();
    }
  };

  // מטמון עם TTL
  const getCachedReportStatuses = async (courseInstanceIds: string[]) => {
    const cacheKey = courseInstanceIds.sort().join(",");
    const cached = statusCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log("[DEBUG] Using cached report statuses");
      return cached.data;
    }

    const fresh = await fetchReportStatuses(courseInstanceIds);
    statusCache.set(cacheKey, { data: fresh, timestamp: Date.now() });

    // ניקוי cache ישנים
    for (const [key, value] of statusCache.entries()) {
      if (Date.now() - value.timestamp > CACHE_TTL) {
        statusCache.delete(key);
      }
    }

    return fresh;
  };

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

  const fetchFilterOptions = async () => {
    try {
      // Fetch instructors
      const { data: instructorsData, error: instructorsError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("role", "instructor")
        .order("full_name");

      if (instructorsError) throw instructorsError;

      // Fetch institutions
      const { data: institutionsData, error: institutionsError } =
        await supabase
          .from("educational_institutions")
          .select("id, name")
          .order("name");

      if (institutionsError) throw institutionsError;

      // Fetch course templates
      const { data: coursesData, error: coursesError } = await supabase
        .from("courses")
        .select("id, name, school_type")
        .order("name");

      if (coursesError) throw coursesError;

      setInstructors(instructorsData || []);
      setInstitutions(institutionsData || []);
      setCourseTemplates(coursesData || []);
    } catch (error) {
      console.error("Error fetching filter options:", error);
    }
  };

  // שיפור fetchAssignments עם טעינה מקבילה
  // const fetchAssignments = async () => {
  //   if (!user) return;

  //   try {
  //     setLoading(true);

  //     let query = supabase.from("course_instances").select(`
  //       id,
  //       grade_level,
  //       max_participants,
  //       price_for_customer,
  //       price_for_instructor,
  //       start_date,
  //       end_date,
  //       created_at,
  //       course:course_id (
  //         id,
  //         name,
  //         school_type,
  //         presentation_link,
  //         program_link
  //       ),
  //       instructor:instructor_id (
  //         id,
  //         full_name
  //       ),
  //       institution:institution_id (
  //         id,
  //         name
  //       )
  //     `)
  //     .eq ('id', false);

  //     // If user is instructor, filter by their assignments only
  //     if (isInstructor && user?.id) {
  //       query = query.eq('instructor_id', user.id);
  //     }

  //     const { data: coursesData, error: instancesError } = await query;

  //     if (instancesError) throw instancesError;

  //     console.log(`[DEBUG] Found ${coursesData?.length || 0} course instances for ${isInstructor ? 'instructor' : 'admin'}:`, coursesData);

  //     if (!coursesData || coursesData.length === 0) {
  //       setAssignments([]);
  //       setFilteredAssignments([]);
  //       return;
  //     }

  //     const courseIds = coursesData?.map((instance: any) => instance.course?.id).filter(Boolean) || [];
  //     const courseInstanceIds = coursesData.map((instance) => instance.id);

  //     console.log(`[DEBUG] Course instances details:`, coursesData?.map(instance => ({
  //       instanceId: instance.id,
  //       courseId: instance.course?.id,
  //       courseName: instance.course?.name,
  //       instructorId: instance.instructor?.id
  //     })));

  //     // טעינה מקבילה של כל הנתונים הנדרשים
  //     const [lessonsData, schedulesData, statusMap] = await Promise.all([
  //       // Fetch lessons
  //       courseIds.length > 0 ? supabase
  //         .from("lessons")
  //         .select("*")
  //         .in("course_id", courseIds)
  //         .order("order_index")
  //         .then(({ data, error }) => {
  //           if (error) {
  //             console.error("Error fetching lessons:", error);
  //             return [];
  //           }
  //           console.log(`[DEBUG] Found ${data?.length || 0} lessons`);
  //           return data || [];
  //         }) : Promise.resolve([]),

  //       // Fetch schedules
  //       courseInstanceIds.length > 0 ? fetchCombinedSchedules()
  //         .then(allSchedules => {
  //           const filtered = allSchedules.filter(schedule =>
  //             courseInstanceIds.includes(schedule.course_instance_id)
  //           );
  //           console.log(`[DEBUG] Found ${filtered.length} relevant schedules`);
  //           return filtered;
  //         })
  //         .catch(error => {
  //           console.error("Error fetching combined schedules:", error);
  //           return [];
  //         }) : Promise.resolve([]),

  //       // Fetch report statuses
  //       getCachedReportStatuses(courseInstanceIds)
  //     ]);

  //     // Fetch tasks for lessons
  //     let tasksData: any[] = [];
  //     if (lessonsData.length > 0) {
  //       const lessonIds = lessonsData.map(lesson => lesson.id).filter(Boolean);
  //       if (lessonIds.length > 0) {
  //         const { data: tasks, error: tasksError } = await supabase
  //           .from("lesson_tasks")
  //           .select("*")
  //           .in("lesson_id", lessonIds)
  //           .order("order_index");

  //         if (tasksError) {
  //           console.error("Error fetching tasks:", tasksError);
  //         } else {
  //           tasksData = tasks || [];
  //           console.log(`[DEBUG] Found ${tasksData.length} tasks for ${lessonIds.length} lessons:`, tasksData);
  //         }
  //       }
  //     }

  //     // Update the report status map state
  //     setReportStatusMap(statusMap);

  //     // Format assigned courses data עם שיפור מיפוי הסטטוס
  //     const formatAssignmentData = (instanceData: any) => {
  //       const course = instanceData.course;
  //       const courseLessons = lessonsData.filter(
  //         (lesson) => lesson.course_id === course.id
  //       );

  //       const allCourseTasks = courseLessons.flatMap((lesson, lessonIndex) => {
  //         const lessonTasks = tasksData.filter(
  //           (task) => task.lesson_id === lesson.id
  //         );

  //         const lessonSchedule = schedulesData.find(
  //           (schedule) =>
  //             schedule.lesson_id === lesson.id &&
  //             schedule.course_instance_id === instanceData.id
  //         );

  //         // Improved report status checking with multiple key attempts
  //         let reportStatus = {
  //           isReported: false,
  //           isCompleted: undefined as boolean | undefined,
  //           isLessonOk: undefined as boolean | undefined,
  //           reportId: undefined as string | undefined
  //         };

  //         // Try multiple keys to find report status
  //         const possibleKeys = [
  //           lessonSchedule?.id, // Legacy schedule ID
  //           `${instanceData.id}_${lesson.id}`, // New composite key
  //         ].filter(Boolean);

  //         for (const key of possibleKeys) {
  //           const status = statusMap.get(key);
  //           if (status) {
  //             reportStatus = {
  //               isReported: true,
  //               isCompleted: status.isCompleted,
  //               isLessonOk: status.isLessonOk,
  //               reportId: status.reportId
  //             };
  //             break; // Use first found status
  //           }
  //         }

  //         return lessonTasks.map((task) => ({
  //           ...task,
  //           lesson_title: lesson.title,
  //           lesson_id: lesson.id,
  //           lesson_number: lessonIndex + 1,
  //           scheduled_start: lessonSchedule?.scheduled_start || null,
  //           scheduled_end: lessonSchedule?.scheduled_end || null,
  //           report_status: reportStatus
  //         }));
  //       });

  //       return {
  //         id: course.id,
  //         instance_id: instanceData.id,
  //         name: course.name || "ללא שם קורס",
  //         grade_level: instanceData.grade_level || "לא צוין",
  //         max_participants: instanceData.max_participants || 0,
  //         price_for_customer: instanceData.price_for_customer || 0,
  //         price_for_instructor: instanceData.price_for_instructor || 0,
  //         institution_name: instanceData.institution?.name || "לא צוין",
  //         instructor_name: instanceData.instructor?.full_name || "לא צוין",
  //         lesson_count: courseLessons.length,
  //         start_date: instanceData.start_date || null,
  //         approx_end_date: instanceData.end_date || null,
  //         school_type: course.school_type,
  //         presentation_link: course.presentation_link,
  //         program_link: course.program_link,
  //         tasks: allCourseTasks.map((task: any) => ({
  //           id: task.id,
  //           title: task.title,
  //           description: task.description,
  //           estimated_duration: task.estimated_duration,
  //           is_mandatory: task.is_mandatory,
  //           lesson_number: task.lesson_number,
  //           lesson_title: task.lesson_title,
  //           lesson_id: task.lesson_id,
  //           order_index: task.order_index,
  //           scheduled_start: task.scheduled_start,
  //           scheduled_end: task.scheduled_end,
  //           report_status: task.report_status
  //         })),
  //       };
  //     };

  //     const formattedAssignments = coursesData?.map(formatAssignmentData) || [];
  //     console.log(`[DEBUG] Final formatted assignments:`, formattedAssignments.map(a => ({
  //       name: a.name,
  //       tasks_count: a.tasks.length,
  //       lesson_count: a.lesson_count
  //     })));
  //     setAssignments(formattedAssignments);
  //     setFilteredAssignments(formattedAssignments);
  //   } catch (error) {
  //     console.error("Error fetching assignments:", error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };
//   const fetchAssignments = async () => {
//     if (!user) return;

//     try {
//       setLoading(true);
//       let query = supabase.from("course_instances").select(`
//         id,
//         grade_level,
//         max_participants,
//         price_for_customer,
//         price_for_instructor,
//         start_date,
//         end_date,
//         created_at,
//         course:course_id (
//           id,
//           name,
//           school_type,
//           presentation_link,
//           program_link
//         ),
//         instructor:instructor_id (
//           id,
//           full_name
//         ),
//         institution:institution_id (
//           id,
//           name
//         )
//       `); // If user is instructor, filter by their assignments only

//       if (isInstructor && user?.id) {
//         query = query.eq("instructor_id", user.id);
//       }

//       const { data: coursesData, error: instancesError } = await query;

//       if (instancesError) throw instancesError;

//       console.log(
//         `[DEBUG] Found ${coursesData?.length || 0} course instances for ${
//           isInstructor ? "instructor" : "admin"
//         }:`,
//         coursesData
//       );

//       if (!coursesData || coursesData.length === 0) {
//         setAssignments([]);
//         setFilteredAssignments([]);
//         return;
//       }

//       const courseIds =
//         coursesData
//           ?.map((instance: any) => instance.course?.id)
//           .filter(Boolean) || [];
//       const courseInstanceIds = coursesData.map((instance) => instance.id);
//       console.log(
//         `[DEBUG] Course instances details:`,
//         coursesData?.map((instance) => ({
//           instanceId: instance.id,
//           courseId: instance.course?.id,
//           courseName: instance.course?.name,
//           instructorId: instance.instructor?.id,
//         }))
//       ); // Parallel fetching of all required data

//       const [lessonsData, schedulesData, statusMap] = await Promise.all([
//         // Fetch lessons
//         courseIds.length > 0
//           ? supabase
//               .from("lessons")
//               .select("*")
//               .in("course_id", courseIds)
//               // --- CHANGE 1: ADDED .or() FILTER ---
//               // This fetches lessons that are either generic (no instance ID) OR specific to the retrieved course instances.
//               .or(
//                 `course_instance_id.is.null,course_instance_id.in.(${courseInstanceIds.join(
//                   ","
//                 )})`
//               )
//               .order("order_index")
//               .then(({ data, error }) => {
//                 if (error) {
//                   console.error("Error fetching lessons:", error);
//                   return [];
//                 }
//                 console.log(
//                   `[DEBUG] Found ${
//                     data?.length || 0
//                   } potentially relevant lessons`
//                 );
//                 return data || [];
//               })
//           : Promise.resolve([]), // Fetch schedules
//         courseInstanceIds.length > 0
//           ? fetchCombinedSchedules()
//               .then((allSchedules) => {
//                 const filtered = allSchedules.filter((schedule) =>
//                   courseInstanceIds.includes(schedule.course_instance_id)
//                 );
//                 console.log(
//                   `[DEBUG] Found ${filtered.length} relevant schedules`
//                 );
//                 return filtered;
//               })
//               .catch((error) => {
//                 console.error("Error fetching combined schedules:", error);
//                 return [];
//               })
//           : Promise.resolve([]), // Fetch report statuses
//         getCachedReportStatuses(courseInstanceIds),
//       ]); // Fetch tasks for lessons

//       let tasksData: any[] = [];
//       if (lessonsData.length > 0) {
//         const lessonIds = lessonsData
//           .map((lesson) => lesson.id)
//           .filter(Boolean);
//         if (lessonIds.length > 0) {
//           const { data: tasks, error: tasksError } = await supabase
//             .from("lesson_tasks")
//             .select("*")
//             .in("lesson_id", lessonIds)
//             .order("order_index");

//           if (tasksError) {
//             console.error("Error fetching tasks:", tasksError);
//           } else {
//             tasksData = tasks || [];
//             console.log(
//               `[DEBUG] Found ${tasksData.length} tasks for ${lessonIds.length} lessons:`,
//               tasksData
//             );
//           }
//         }
//       } // Update the report status map state

//       setReportStatusMap(statusMap); // Format assigned courses data

//       // const formatAssignmentData = (instanceData: any) => {
//       //   const course = instanceData.course;

//       //   // --- CHANGE 2: UPDATED LESSON FILTERING LOGIC ---
//       //   // This logic correctly selects lessons for the specific instance,
//       //   // prioritizing instance-specific lessons over generic ones.

//       //   // 1. Get all lessons related to this course template.
//       //   const allCourseTemplateLessons = lessonsData.filter(
//       //     (lesson) => lesson.course_id === course.id
//       //   );

//       //   // 2. Create a map to hold the final lessons, using order_index to handle overrides.
//       //   const finalLessonsMap = new Map();

//       //   // 3. Add generic lessons first (where course_instance_id is null).
//       //   allCourseTemplateLessons
//       //     .filter((lesson) => lesson.course_instance_id === null)
//       //     .forEach((lesson) => finalLessonsMap.set(lesson.order_index, lesson));

//       //   // 4. Override with instance-specific lessons.
//       //   allCourseTemplateLessons
//       //     .filter((lesson) => lesson.course_instance_id === instanceData.id)
//       //     .forEach((lesson) => finalLessonsMap.set(lesson.order_index, lesson));

//       //   // 5. Convert map back to a sorted array.
//       //   const courseLessons = Array.from(finalLessonsMap.values()).sort(
//       //     (a, b) => a.order_index - b.order_index
//       //   );
//       //   const allCourseTasks = courseLessons.flatMap((lesson, lessonIndex) => {
//       //     const lessonTasks = tasksData.filter(
//       //       (task) => task.lesson_id === lesson.id
//       //     );

//       //     const lessonSchedule = schedulesData.find(
//       //       (schedule) =>
//       //         schedule.lesson_id === lesson.id &&
//       //         schedule.course_instance_id === instanceData.id
//       //     ); // Improved report status checking

//       //     let reportStatus = {
//       //       isReported: false,
//       //       isCompleted: undefined as boolean | undefined,
//       //       isLessonOk: undefined as boolean | undefined,
//       //       reportId: undefined as string | undefined,
//       //     };

//       //     const possibleKeys = [
//       //       lessonSchedule?.id, // Legacy key
//       //       `${instanceData.id}_${lesson.id}`, // New composite key
//       //     ].filter(Boolean);

//       //     for (const key of possibleKeys) {
//       //       const status = statusMap.get(key);
//       //       if (status) {
//       //         reportStatus = {
//       //           isReported: true,
//       //           isCompleted: status.isCompleted,
//       //           isLessonOk: status.isLessonOk,
//       //           reportId: status.reportId,
//       //         };
//       //         break;
//       //       }
//       //     }

//       //     return lessonTasks.map((task) => ({
//       //       ...task,
//       //       lesson_title: lesson.title,
//       //       lesson_id: lesson.id,
//       //       lesson_number: lessonIndex + 1,
//       //       scheduled_start: lessonSchedule?.scheduled_start || null,
//       //       scheduled_end: lessonSchedule?.scheduled_end || null,
//       //       report_status: reportStatus,
//       //     }));
//       //   });

//       //   return {
//       //     id: course.id,
//       //     instance_id: instanceData.id,
//       //     name: course.name || "ללא שם קורס",
//       //     grade_level: instanceData.grade_level || "לא צוין",
//       //     max_participants: instanceData.max_participants || 0,
//       //     price_for_customer: instanceData.price_for_customer || 0,
//       //     price_for_instructor: instanceData.price_for_instructor || 0,
//       //     institution_name: instanceData.institution?.name || "לא צוין",
//       //     instructor_name: instanceData.instructor?.full_name || "לא צוין",
//       //     lesson_count: courseLessons.length,
//       //     start_date: instanceData.start_date || null,
//       //     approx_end_date: instanceData.end_date || null,
//       //     school_type: course.school_type,
//       //     presentation_link: course.presentation_link,
//       //     program_link: course.program_link,
//       //     tasks: allCourseTasks.map((task: any) => ({
//       //       id: task.id,
//       //       title: task.title,
//       //       description: task.description,
//       //       estimated_duration: task.estimated_duration,
//       //       is_mandatory: task.is_mandatory,
//       //       lesson_number: task.lesson_number,
//       //       lesson_title: task.lesson_title,
//       //       lesson_id: task.lesson_id,
//       //       order_index: task.order_index,
//       //       scheduled_start: task.scheduled_start,
//       //       scheduled_end: task.scheduled_end,
//       //       report_status: task.report_status,
//       //     })),
//       //   };
//       // };

//       const formatAssignmentData = (instanceData: any) => {
//   const course = instanceData.course;

//   // *** השתמש באותה לוגיקה כמו fetchAndGenerateSchedules ***
  
//   // 1. קבל את כל השיעורים של הקורס
//   const allCourseTemplateLessons = lessonsData.filter(
//     (lesson) => lesson.course_id === course.id
//   );

//   // 2. בדוק אם יש lesson_mode
//   const lessonMode = instanceData.lesson_mode || 'template';
  
//   let courseLessons: any[] = [];

//   // 3. בחר שיעורים לפי lesson_mode
//   switch (lessonMode) {
//     case 'custom_only':
//       // רק שיעורים ייחודיים
//       courseLessons = allCourseTemplateLessons
//         .filter((lesson) => lesson.course_instance_id === instanceData.id)
//         .sort((a, b) => a.order_index - b.order_index);
//       console.log(`Instance ${instanceData.id}: Using ${courseLessons.length} custom-only lessons`);
//       break;
      
//     case 'combined':
//       // תבנית + ייחודיים
//       const templateLessons = allCourseTemplateLessons
//         .filter((lesson) => lesson.course_instance_id === null);
//       const instanceLessons = allCourseTemplateLessons
//         .filter((lesson) => lesson.course_instance_id === instanceData.id);
      
//       courseLessons = [...templateLessons, ...instanceLessons]
//         .sort((a, b) => a.order_index - b.order_index);
//       console.log(`Instance ${instanceData.id}: Using ${templateLessons.length} template + ${instanceLessons.length} custom lessons`);
//       break;
      
//     case 'template':
//     default:
//       // רק תבנית (ברירת מחדל)
//       courseLessons = allCourseTemplateLessons
//         .filter((lesson) => lesson.course_instance_id === null)
//         .sort((a, b) => a.order_index - b.order_index);
//       console.log(`Instance ${instanceData.id}: Using ${courseLessons.length} template lessons`);
//       break;
//   }

//   // 4. בניית allCourseTasks
//   const allCourseTasks = courseLessons.flatMap((lesson, lessonIndex) => {
//     const lessonTasks = tasksData.filter(
//       (task) => task.lesson_id === lesson.id
//     );

//     const lessonSchedule = schedulesData.find(
//       (schedule) =>
//         schedule.lesson_id === lesson.id &&
//         schedule.course_instance_id === instanceData.id
//     );

//     // Improved report status checking
//     let reportStatus = {
//       isReported: false,
//       isCompleted: undefined as boolean | undefined,
//       isLessonOk: undefined as boolean | undefined,
//       reportId: undefined as string | undefined,
//     };

//     const possibleKeys = [
//       lessonSchedule?.id, // Legacy key
//       `${instanceData.id}_${lesson.id}`, // New composite key
//     ].filter(Boolean);

//     for (const key of possibleKeys) {
//       const status = statusMap.get(key);
//       if (status) {
//         reportStatus = {
//           isReported: true,
//           isCompleted: status.isCompleted,
//           isLessonOk: status.isLessonOk,
//           reportId: status.reportId,
//         };
//         break;
//       }
//     }

//     return lessonTasks.map((task) => ({
//       ...task,
//       lesson_title: lesson.title,
//       lesson_id: lesson.id,
//       lesson_number: lessonIndex + 1,
//       scheduled_start: lessonSchedule?.scheduled_start || null,
//       scheduled_end: lessonSchedule?.scheduled_end || null,
//       report_status: reportStatus,
//     }));
//   });

//   // 5. החזרת האובייקט המלא
//   return {
//     id: course.id,
//     instance_id: instanceData.id,
//     name: course.name || "ללא שם קורס",
//     grade_level: instanceData.grade_level || "לא צוין",
//     max_participants: instanceData.max_participants || 0,
//     price_for_customer: instanceData.price_for_customer || 0,
//     price_for_instructor: instanceData.price_for_instructor || 0,
//     institution_name: instanceData.institution?.name || "לא צוין",
//     instructor_name: instanceData.instructor?.full_name || "לא צוין",
//     lesson_count: courseLessons.length,
//     start_date: instanceData.start_date || null,
//     approx_end_date: instanceData.end_date || null,
//     school_type: course.school_type,
//     presentation_link: course.presentation_link,
//     program_link: course.program_link,
//     tasks: allCourseTasks.map((task: any) => ({
//       id: task.id,
//       title: task.title,
//       description: task.description,
//       estimated_duration: task.estimated_duration,
//       is_mandatory: task.is_mandatory,
//       lesson_number: task.lesson_number,
//       lesson_title: task.lesson_title,
//       lesson_id: task.lesson_id,
//       order_index: task.order_index,
//       scheduled_start: task.scheduled_start,
//       scheduled_end: task.scheduled_end,
//       report_status: task.report_status,
//     })),
//   };
// };
//       const formattedAssignments = coursesData?.map(formatAssignmentData) || [];
//       console.log(
//         `[DEBUG] Final formatted assignments:`,
//         formattedAssignments.map((a) => ({
//           name: a.name,
//           tasks_count: a.tasks.length,
//           lesson_count: a.lesson_count,
//         }))
//       );
//       setAssignments(formattedAssignments);
//       setFilteredAssignments(formattedAssignments);
//     } catch (error) {
//       console.error("Error fetching assignments:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

const fetchAssignments = async () => {
  if (!user) return;

  try {
    setLoading(true);
    
    // *** שליפת ההקצאות כולל lesson_mode ***
    let query = supabase.from("course_instances").select(`
      id,
      grade_level,
      max_participants,
      price_for_customer,
      price_for_instructor,
      start_date,
      end_date,
      created_at,
      lesson_mode,
      course:course_id (
        id,
        name,
        school_type,
        presentation_link,
        program_link
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

    if (isInstructor && user?.id) {
      query = query.eq("instructor_id", user.id);
    }

    const { data: coursesData, error: instancesError } = await query;

    if (instancesError) throw instancesError;

    console.log(
      `[DEBUG] Found ${coursesData?.length || 0} course instances:`,
      coursesData
    );

    if (!coursesData || coursesData.length === 0) {
      setAssignments([]);
      setFilteredAssignments([]);
      return;
    }

    const courseIds = coursesData
      ?.map((instance: any) => instance.course?.id)
      .filter(Boolean) || [];
    const courseInstanceIds = coursesData.map((instance) => instance.id);

    // *** טעינה מקבילה של כל הנתונים ***
    const [lessonsData, schedulesData, statusMap] = await Promise.all([
      // *** שליפת שיעורים - כולל ייחודיים ***
      courseIds.length > 0
        ? supabase
            .from("lessons")
            .select("*")
            .in("course_id", courseIds)
            .or(
              `course_instance_id.is.null,course_instance_id.in.(${courseInstanceIds.join(
                ","
              )})`
            )
            .order("order_index")
            .then(({ data, error }) => {
              if (error) {
                console.error("Error fetching lessons:", error);
                return [];
              }
              console.log(`[DEBUG] Found ${data?.length || 0} total lessons (template + custom)`);
              return data || [];
            })
        : Promise.resolve([]),

      // שליפת תזמונים
      courseInstanceIds.length > 0
        ? fetchCombinedSchedules()
            .then((allSchedules) => {
              const filtered = allSchedules.filter((schedule) =>
                courseInstanceIds.includes(schedule.course_instance_id)
              );
              console.log(`[DEBUG] Found ${filtered.length} schedules`);
              return filtered;
            })
            .catch((error) => {
              console.error("Error fetching combined schedules:", error);
              return [];
            })
        : Promise.resolve([]),

      // שליפת סטטוסים
      getCachedReportStatuses(courseInstanceIds),
    ]);

    // *** שליפת משימות ***
    let tasksData: any[] = [];
    if (lessonsData.length > 0) {
      const lessonIds = lessonsData.map((lesson) => lesson.id).filter(Boolean);
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
          console.log(`[DEBUG] Found ${tasksData.length} tasks`);
        }
      }
    }

    setReportStatusMap(statusMap);

    // *** פורמט הנתונים - עם תמיכה ב-lesson_mode ***
    const formatAssignmentData = (instanceData: any) => {
      const course = instanceData.course;
      const lessonMode = instanceData.lesson_mode || 'template';

      console.log(`[DEBUG] Processing instance ${instanceData.id} with lesson_mode: ${lessonMode}`);

      // *** קבל את כל השיעורים הרלוונטיים לקורס הזה ***
      const allCourseTemplateLessons = lessonsData.filter(
        (lesson) => lesson.course_id === course.id
      );

      let courseLessons: any[] = [];

      // *** בחר שיעורים לפי lesson_mode ***
      switch (lessonMode) {
        case 'custom_only':
          // רק שיעורים ייחודיים
          courseLessons = allCourseTemplateLessons
            .filter((lesson) => lesson.course_instance_id === instanceData.id)
            .sort((a, b) => a.order_index - b.order_index);
          console.log(`  → Using ${courseLessons.length} custom-only lessons`);
          break;

        case 'combined':
          // תבנית + ייחודיים
          const templateLessons = allCourseTemplateLessons
            .filter((lesson) => lesson.course_instance_id === null);
          const instanceLessons = allCourseTemplateLessons
            .filter((lesson) => lesson.course_instance_id === instanceData.id);

          courseLessons = [...templateLessons, ...instanceLessons].sort(
            (a, b) => a.order_index - b.order_index
          );
          console.log(
            `  → Using ${templateLessons.length} template + ${instanceLessons.length} custom lessons (${courseLessons.length} total)`
          );
          break;

        case 'template':
        default:
          // רק תבנית (ברירת מחדל)
          courseLessons = allCourseTemplateLessons
            .filter((lesson) => lesson.course_instance_id === null)
            .sort((a, b) => a.order_index - b.order_index);
          console.log(`  → Using ${courseLessons.length} template lessons`);
          break;
      }

      // *** בניית המשימות ***
      const allCourseTasks = courseLessons.flatMap((lesson, lessonIndex) => {
        const lessonTasks = tasksData.filter(
          (task) => task.lesson_id === lesson.id
        );

        // מצא את כל התזמונים הרלוונטיים לשיעור זה
        const lessonSchedules = schedulesData.filter(
          (schedule) =>
            schedule.lesson_id === lesson.id &&
            schedule.course_instance_id === instanceData.id
        );
        
        // מיון לפי תאריך - התאריך הקדום ביותר ראשון
        lessonSchedules.sort((a, b) => 
          new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime()
        );
        
        // השתמש בתזמון הראשון (הקדום ביותר) כבסיס
        const lessonSchedule = lessonSchedules[0];

        // סטטוס דיווח
        let reportStatus = {
          isReported: false,
          isCompleted: undefined as boolean | undefined,
          isLessonOk: undefined as boolean | undefined,
          reportId: undefined as string | undefined,
        };

        const possibleKeys = [
          lessonSchedule?.id,
          `${instanceData.id}_${lesson.id}`,
        ].filter(Boolean);

        for (const key of possibleKeys) {
          const status = statusMap.get(key);
          if (status) {
            reportStatus = {
              isReported: true,
              isCompleted: status.isCompleted,
              isLessonOk: status.isLessonOk,
              reportId: status.reportId,
            };
            break;
          }
        }

        // צור משימה עבור כל תזמון (בוטל ונדחה)
        return lessonSchedules.map((schedule, scheduleIndex) => {
          // סטטוס דיווח עבור התזמון הספציפי
          let scheduleReportStatus = { ...reportStatus };
          
          // בדוק אם יש דיווח עבור התזמון הזה
          const possibleKeys = [
            schedule.id,
            `${instanceData.id}_${lesson.id}`,
          ];
          
          for (const key of possibleKeys) {
            if (statusMap.has(key)) {
              scheduleReportStatus = statusMap.get(key);
              break;
            }
          }
          
          return lessonTasks.map((task) => ({
            ...task,
            lesson_title: lesson.title,
            lesson_id: lesson.id,
            lesson_number: lessonIndex + 1,
            scheduled_start: schedule.scheduled_start,
            scheduled_end: schedule.scheduled_end,
            report_status: scheduleReportStatus,
            is_cancelled: schedule.is_cancelled || false,
            is_postponed: schedule.is_postponed || false,
            original_scheduled_date: schedule.original_scheduled_date,
            new_scheduled_date: schedule.new_scheduled_date,
            // הוסף מזהה ייחודי לכל תזמון
            schedule_id: schedule.id,
            schedule_index: scheduleIndex,
          }));
        }).flat();
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
        school_type: course.school_type,
        presentation_link: course.presentation_link,
        program_link: course.program_link,
        lesson_mode: lessonMode, // *** שמור גם את ה-mode ***
        tasks: allCourseTasks.map((task: any) => ({
          id: task.id,
          title: task.title,
          description: task.description,
          estimated_duration: task.estimated_duration,
          is_mandatory: task.is_mandatory,
          lesson_number: task.lesson_number,
          lesson_title: task.lesson_title,
          lesson_id: task.lesson_id,
          order_index: task.order_index,
          scheduled_start: task.scheduled_start,
          scheduled_end: task.scheduled_end,
          report_status: task.report_status,
        })),
      };
    };

    const formattedAssignments = coursesData?.map(formatAssignmentData) || [];
    
    console.log(
      `[DEBUG] Final assignments:`,
      formattedAssignments.map((a) => ({
        name: a.name,
        lesson_mode: a.lesson_mode,
        lesson_count: a.lesson_count,
        tasks_count: a.tasks.length,
      }))
    );
    
    setAssignments(formattedAssignments);
    setFilteredAssignments(formattedAssignments);
  } catch (error) {
    console.error("Error fetching assignments:", error);
  } finally {
    setLoading(false);
  }
};
  useEffect(() => {
    fetchAssignments();
    fetchFilterOptions();
  }, [user]);

  const handleDeleteConfirm = () => {
    // רענון הרשימה אחרי מחיקה מוצלחת
    fetchAssignments();
    alert("ההקצאה נמחקה בהצלחה!");
  };
  // שיפור ה-real-time updates עם debouncing
  useEffect(() => {
    if (!user) return;

    let refreshTimeout: NodeJS.Timeout;

    const debouncedRefresh = () => {
      clearTimeout(refreshTimeout);
      refreshTimeout = setTimeout(() => {
        console.log("CourseAssignments: Debounced refresh triggered");
        // ניקוי מטמון בעת רענון
        statusCache.clear();
        fetchAssignments();
      }, 1000); // מניעת רענון מרובה
    };

    // Set up real-time subscription to listen for changes in lesson reports
    const channel = supabase
      .channel("lesson_reports_changes_assignments")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "lesson_reports",
        },
        (payload) => {
          console.log("CourseAssignments: Lesson report changed:", payload);
          debouncedRefresh();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reported_lesson_instances",
        },
        (payload) => {
          console.log(
            "CourseAssignments: Reported lesson instance changed:",
            payload
          );
          debouncedRefresh();
        }
      )
      .subscribe();

    return () => {
      clearTimeout(refreshTimeout);
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Listen for lesson report updates from localStorage/custom events
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "lessonReportUpdated") {
        console.log(
          "CourseAssignments: Lesson report updated via storage, refreshing..."
        );
        statusCache.clear();
        fetchAssignments();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Also listen for custom events
    const handleCustomEvent = () => {
      console.log(
        "CourseAssignments: Custom lesson report event, refreshing..."
      );
      statusCache.clear();
      fetchAssignments();
    };

    window.addEventListener("lessonReportUpdated", handleCustomEvent);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("lessonReportUpdated", handleCustomEvent);
    };
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = assignments;

    if (instructorFilter && instructorFilter !== "all") {
      filtered = filtered.filter(
        (assignment) =>
          assignment.instructor_name.includes(instructorFilter) ||
          instructors.find((instructor) => instructor.id === instructorFilter)
            ?.full_name === assignment.instructor_name
      );
    }

    if (institutionFilter && institutionFilter !== "all") {
      filtered = filtered.filter(
        (assignment) =>
          assignment.institution_name.includes(institutionFilter) ||
          institutions.find(
            (institution) => institution.id === institutionFilter
          )?.name === assignment.institution_name
      );
    }

    if (courseFilter && courseFilter !== "all") {
      filtered = filtered.filter(
        (assignment) =>
          assignment.name.includes(courseFilter) ||
          courseTemplates.find((course) => course.id === courseFilter)?.name ===
            assignment.name
      );
    }

    if (schoolTypeFilter && schoolTypeFilter !== "all") {
      filtered = filtered.filter(
        (assignment) => assignment.school_type === schoolTypeFilter
      );
    }

    setFilteredAssignments(filtered);
  }, [
    assignments,
    instructorFilter,
    institutionFilter,
    courseFilter,
    schoolTypeFilter,
    instructors,
    institutions,
    courseTemplates,
  ]);

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
    setDialogMode("create");
    setEditData(null);
    setShowDialog(true);
  };

  // Handle editing existing assignment
  const handleEditAssignment = (assignment: CourseAssignment) => {
    setEditData(assignment);
    setDialogMode("edit");
    // Set selectedCourse with the course ID for edit mode
    setSelectedCourse({
      id: assignment.id,
      instanceId: assignment.instance_id,
      name: assignment.name,
    });
    console.log("Editing assignment:", assignment);
    setShowDialog(true);
  };

  const handleAssignmentComplete = () => {
    statusCache.clear(); // ניקוי מטמון לאחר שינויים
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
  // if (!hasAdminAccess && !isInstructor) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
  //       <Card className="text-center py-16 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
  //         <CardContent>
  //           <Users className="h-16 w-16 text-red-400 mx-auto mb-6" />
  //           <h3 className="text-xl font-semibold text-gray-900 mb-3">
  //             אין הרשאה לצפייה בדף זה
  //           </h3>
  //           <p className="text-gray-600 mb-6 text-lg">
  //             רק מנהלים, מנהלים פדגוגיים ומדריכים יכולים לצפות בהקצאות קורסים
  //           </p>
  //         </CardContent>
  //       </Card>
  //     </div>
  //   );
  // }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  //   return (
  //     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
  //       <div className="md:hidden">
  //         <MobileNavigation />
  //       </div>

  //       <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  //         {/* Header */}
  //         <div className="flex justify-between items-center mb-8">
  //           <div>
  //             <h1 className="text-3xl font-bold text-gray-900 mb-2">
  //               {isInstructor ? "הקורסים שלי" : "הקצאות קורסים"}
  //             </h1>
  //             <p className="text-gray-600 text-lg">
  //               {isInstructor
  //                 ? "צפייה בקורסים שהוקצו לך"
  //                 : "ניהול וצפייה בכל הקורסים שהוקצו למדריכים"
  //               }
  //             </p>
  //           </div>
  //         </div>

  //         {/* Filters - Only show for admins */}
  //         {hasAdminAccess && (
  //           <div className="mb-6">
  //             <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
  //               <CardContent className="p-4">
  //                 <div className="space-y-4">
  //                   <div className="flex items-center gap-2">
  //                     <Filter className="h-4 w-4 text-gray-500" />
  //                     <span className="font-medium text-gray-700">סינון:</span>
  //                   </div>

  //                   <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
  //                     <div className="flex flex-col gap-2">
  //                       <span className="text-sm text-gray-600">מדריך:</span>
  //                       <Select value={instructorFilter} onValueChange={setInstructorFilter}>
  //                         <SelectTrigger>
  //                           <SelectValue placeholder="כל המדריכים" />
  //                         </SelectTrigger>
  //                         <SelectContent>
  //                           <SelectItem value="all">כל המדריכים</SelectItem>
  //                           {instructors.map((instructor) => (
  //                             <SelectItem key={instructor.id} value={instructor.full_name}>
  //                               {instructor.full_name}
  //                             </SelectItem>
  //                           ))}
  //                         </SelectContent>
  //                       </Select>
  //                     </div>

  //                     <div className="flex flex-col gap-2">
  //                       <span className="text-sm text-gray-600">מוסד חינוכי:</span>
  //                       <Select value={institutionFilter} onValueChange={setInstitutionFilter}>
  //                         <SelectTrigger>
  //                           <SelectValue placeholder="כל המוסדות" />
  //                         </SelectTrigger>
  //                         <SelectContent>
  //                           <SelectItem value="all">כל המוסדות</SelectItem>
  //                           {institutions.map((institution) => (
  //                             <SelectItem key={institution.id} value={institution.name}>
  //                               {institution.name}
  //                             </SelectItem>
  //                           ))}
  //                         </SelectContent>
  //                       </Select>
  //                     </div>

  //                     <div className="flex flex-col gap-2">
  //                       <span className="text-sm text-gray-600">קורס:</span>
  //                       <Select value={courseFilter} onValueChange={setCourseFilter}>
  //                         <SelectTrigger>
  //                           <SelectValue placeholder="כל הקורסים" />
  //                         </SelectTrigger>
  //                         <SelectContent>
  //                           <SelectItem value="all">כל הקורסים</SelectItem>
  //                           {courseTemplates.map((course) => (
  //                             <SelectItem key={course.id} value={course.name}>
  //                               {course.name}
  //                             </SelectItem>
  //                           ))}
  //                         </SelectContent>
  //                       </Select>
  //                     </div>

  //                     <div className="flex flex-col gap-2">
  //                       <span className="text-sm text-gray-600">סוג בית ספר:</span>
  //                       <Select value={schoolTypeFilter} onValueChange={setSchoolTypeFilter}>
  //                         <SelectTrigger>
  //                           <SelectValue placeholder="כל סוגי בתי הספר" />
  //                         </SelectTrigger>
  //                         <SelectContent>
  //                           <SelectItem value="all">כל סוגי בתי הספר</SelectItem>
  //                           <SelectItem value="elementary">יסודי</SelectItem>
  //                           <SelectItem value="middle">חטיבה</SelectItem>
  //                           <SelectItem value="high">תיכון</SelectItem>
  //                         </SelectContent>
  //                       </Select>
  //                     </div>
  //                   </div>

  //                   {(instructorFilter || institutionFilter || courseFilter || schoolTypeFilter) && (
  //                     <div className="flex gap-2 flex-wrap">
  //                       <Button
  //                         variant="outline"
  //                         size="sm"
  //                         onClick={() => {
  //                           setInstructorFilter('');
  //                           setInstitutionFilter('');
  //                           setCourseFilter('');
  //                           setSchoolTypeFilter('');
  //                         }}
  //                         className="text-gray-600"
  //                       >
  //                         נקה את כל הסינונים
  //                       </Button>
  //                     </div>
  //                   )}
  //                 </div>
  //               </CardContent>
  //             </Card>
  //           </div>
  //         )}

  //         {filteredAssignments.length === 0 ? (
  //           <Card className="text-center py-16 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
  //             <CardContent>
  //               <Users className="h-16 w-16 text-gray-400 mx-auto mb-6" />
  //               <h3 className="text-xl font-semibold text-gray-900 mb-3">
  //                 {(instructorFilter && instructorFilter !== 'all' || institutionFilter && institutionFilter !== 'all' || courseFilter && courseFilter !== 'all' || schoolTypeFilter && schoolTypeFilter !== 'all')
  //                   ? "לא נמצאו הקצאות התואמות לסינון"
  //                   : (isInstructor ? "אין קורסים מוקצים" : "אין הקצאות קורסים עדיין")
  //                 }
  //               </h3>
  //               <p className="text-gray-600 mb-6 text-lg">
  //                 {(instructorFilter && instructorFilter !== 'all' || institutionFilter && institutionFilter !== 'all' || courseFilter && courseFilter !== 'all' || schoolTypeFilter && schoolTypeFilter !== 'all')
  //                   ? "נסה לשנות את הסינון או לנקות את הסינונים"
  //                   : (isInstructor
  //                     ? "לא נמצאו קורסים שהוקצו לך"
  //                     : "לא נמצאו קורסים שהוקצו למדריכים"
  //                   )
  //                 }
  //               </p>
  //             </CardContent>
  //           </Card>
  //         ) : (
  //           <div className="space-y-8">
  //             {filteredAssignments.map((assignment) => (
  //               <Card
  //                 key={assignment.instance_id}
  //                 className="shadow-xl border-0 backdrop-blur-sm bg-white/80"
  //               >
  //                 <CardHeader className="text-white rounded-t-lg bg-gradient-to-r from-blue-600 to-blue-700">
  //                   <div className="flex justify-between items-start">
  //                     <div>
  //                       <div className="text-blue-100 mb-1">
  //                         {formatDate(assignment.start_date)} - {formatDate(assignment.approx_end_date)}
  //                       </div>
  //                       <div className="flex items-center gap-2 mb-2">
  //                         <CardTitle className="text-2xl text-white">
  //                           {assignment.name}
  //                         </CardTitle>
  //                         <Badge className="bg-green-500/20 text-green-100 border-green-300/30">
  //                           מוקצה
  //                         </Badge>
  //                       </div>
  //                       {assignment.presentation_link ? (
  //                         <a
  //                           href={assignment.presentation_link}
  //                           target="_blank"
  //                           rel="noopener noreferrer"
  //                           className="underline text-sm text-blue-100"
  //                         >
  //                        <b>   צפה במצגת הקורס</b>
  //                         </a>
  //                       )
  //                    :(
  //                      <span className="text-black">לא קיימת מצגת המשוייכת להקצאה זו  </span>
  //                     )}
  //                       <CardDescription className="text-blue-100 text-base">
  //                         {assignment.institution_name} • מדריך: {assignment.instructor_name}
  //                       </CardDescription>
  //                     </div>
  //                     {/* Only show action buttons for admin/pedagogical_manager */}
  //                     {hasAdminAccess && (
  //                       <div className="flex gap-2">
  //                         <Button
  //                           variant="ghost"
  //                           size="sm"
  //                           className="text-white hover:bg-white/20"
  //                           onClick={() => handleEditAssignment(assignment)}
  //                           title="עריכת הקצאה"
  //                         >
  //                           <Edit className="h-4 w-4" />
  //                         </Button>
  //                         <Button
  //                           variant="ghost"
  //                           size="sm"
  //                           className="text-white hover:bg-white/20"
  //                           onClick={() =>
  //                             handleAssignCourse(
  //                               assignment.id,
  //                               assignment.instance_id,
  //                               assignment.name
  //                             )
  //                           }
  //                           title="הקצאה חדשה"
  //                         >
  //                           <UserPlus className="h-4 w-4" />
  //                         </Button>
  //                       </div>
  //                     )}
  //                   </div>
  //                 </CardHeader>

  //                 <CardContent className="p-6">
  //                   {/* Course Info Grid */}
  //                   <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
  //                     <div className={`${getSchoolTypeColors(assignment.school_type).bg} p-4 rounded-lg border ${getSchoolTypeColors(assignment.school_type).border}`}>
  //                       <div className={`flex items-center ${getSchoolTypeColors(assignment.school_type).text} mb-2`}>
  //                         <span className="font-medium">סוג בית ספר</span>
  //                       </div>
  //                       <span className="text-lg font-bold text-gray-900">
  //                         {getSchoolTypeDisplayName(assignment.school_type)}
  //                       </span>
  //                     </div>

  //                     <div className="bg-blue-50 p-4 rounded-lg">
  //                       <div className="flex items-center text-blue-600 mb-2">
  //                         <Users className="h-5 w-5 ml-2" />
  //                         <span className="font-medium">כיתה</span>
  //                       </div>
  //                       <span className="text-lg font-bold text-gray-900">
  //                         {assignment.grade_level}
  //                       </span>
  //                     </div>

  //                     <div className="bg-green-50 p-4 rounded-lg">
  //                       <div className="flex items-center text-green-600 mb-2">
  //                         <Users className="h-5 w-5 ml-2" />
  //                         <span className="font-medium">מקסימום תלמידים</span>
  //                       </div>
  //                       <span className="text-lg font-bold text-gray-900">
  //                         {assignment.max_participants}
  //                       </span>
  //                     </div>

  //                     <div className="bg-purple-50 p-4 rounded-lg">
  //                       <div className="flex items-center text-purple-600 mb-2">
  //                         <Calendar className="h-5 w-5 ml-2" />
  //                         <span className="font-medium">מספר שיעורים</span>
  //                       </div>
  //                       <span className="text-lg font-bold text-gray-900">
  //                         {assignment.lesson_count}
  //                       </span>
  //                     </div>

  //                     <div className="bg-orange-50 p-4 rounded-lg">
  //                       <div className="flex items-center text-orange-600 mb-2">
  //                         <span className="font-medium">מחיר ללקוח</span>
  //                       </div>
  //                       <span className="text-lg font-bold text-gray-900">
  //                         ₪{assignment.price_for_customer}
  //                       </span>
  //                     </div>
  //                   </div>

  //                   {/* Tasks Section */}
  //                   {assignment.tasks.length > 0 && (
  //                     <div>
  //                       <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
  //                         <CheckCircle2 className="h-5 w-5 ml-2 text-green-600" />
  //                         שיעורי הקורס
  //                       </h3>

  //                       <div className="space-y-6">
  //                         {Object.entries(groupTasksByLesson(assignment.tasks)).map(([lessonNumber, tasks]) => (
  //                           <div key={lessonNumber} className="bg-gray-50 rounded-lg p-4">
  //                             <div className="flex justify-between items-center mb-4">
  //                             <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
  //                               <Calendar className="h-4 w-4 ml-2" />
  //                               שיעור {lessonNumber}: {tasks[0]?.lesson_title || "ללא כותרת"}
  //                             </h4>
  //                             <h4></h4>
  //                           </div>
  //                             <Table>
  //                               <TableHeader>
  //                                 <TableRow>
  //                                   <TableHead className="text-right">משימה</TableHead>
  //                                   <TableHead className="text-right">זמן משוער</TableHead>
  //                                   <TableHead className="text-right">סטטוס</TableHead>
  //                                   <TableHead className="text-right">זמן מתוכנן</TableHead>
  //                                   <TableHead className="text-right">סטטוס דיווח</TableHead>
  //                                 </TableRow>
  //                               </TableHeader>
  //                               <TableBody>
  //                                 {tasks
  //                                   .sort((a, b) => a.order_index - b.order_index)
  //                                   .map((task) => {
  //                                     // Get report status for this lesson (all tasks in a lesson share the same report status)
  //                                     const reportStatus = task.report_status;

  //                                     // Function to render report status badge
  //                                     const renderReportStatus = () => {
  //                                       if (!reportStatus?.isReported) {
  //                                         return (
  //                                           <Badge variant="outline" className="bg-gray-100">
  //                                             📋 טרם דווח
  //                                           </Badge>
  //                                         );
  //                                       }

  //                                       if (reportStatus.isCompleted === false) {
  //                                         return (
  //                                           <Badge className="bg-orange-500 text-white">
  //                                             ❌ לא התקיים
  //                                           </Badge>
  //                                         );
  //                                       }

  //                                       if (reportStatus.isCompleted && reportStatus.isLessonOk === false) {
  //                                         return (
  //                                           <Badge className="bg-red-500 text-white">
  //                                             ⚠️ לא התנהל כשורה
  //                                           </Badge>
  //                                         );
  //                                       }

  //                                       return (
  //                                         <Badge className="bg-green-500 text-white">
  //                                           ✅ דווח והתקיים
  //                                         </Badge>
  //                                       );
  //                                     };

  //                                     return (
  //                                       <TableRow key={task.id}>
  //                                         <TableCell>
  //                                           <div>
  //                                             <span className="font-medium">{task.title}</span>
  //                                             {task.description && (
  //                                               <p className="text-sm text-gray-600 mt-1">
  //                                                 {task.description}
  //                                               </p>
  //                                             )}
  //                                           </div>
  //                                         </TableCell>
  //                                         <TableCell>
  //                                           <div className="flex items-center text-gray-600">
  //                                             <Clock className="h-4 w-4 ml-1" />
  //                                             <span>{task.estimated_duration} דקות</span>
  //                                           </div>
  //                                         </TableCell>
  //                                         <TableCell>
  //                                           <div className="flex items-center">
  //                                             {task.is_mandatory ? (
  //                                               <CheckCircle2 className="h-4 w-4 text-red-500 ml-2" />
  //                                             ) : (
  //                                               <Circle className="h-4 w-4 text-gray-400 ml-2" />
  //                                             )}
  //                                             <span className={task.is_mandatory ? "text-red-600 font-medium" : "text-gray-600"}>
  //                                               {task.is_mandatory ? "חובה" : "רשות"}
  //                                             </span>
  //                                           </div>
  //                                         </TableCell>
  //                                         <TableCell>
  //                                           {task.scheduled_start && task.scheduled_end ? (
  //                                             <div className="text-sm">
  //                                               <div>{formatDateTime(task.scheduled_start)}</div>
  //                                               <div className="text-gray-500">עד {formatDateTime(task.scheduled_end)}</div>
  //                                             </div>
  //                                           ) : (
  //                                             <span className="text-gray-400">לא מתוכנן</span>
  //                                           )}
  //                                         </TableCell>
  //                                         <TableCell>
  //                                           {renderReportStatus()}
  //                                         </TableCell>
  //                                       </TableRow>
  //                                     );
  //                                   })}
  //                               </TableBody>
  //                             </Table>
  //                           </div>
  //                         ))}
  //                       </div>
  //                     </div>
  //                   )}
  //                 </CardContent>
  //               </Card>
  //             ))}
  //           </div>
  //         )}

  //         {/* Course Assignment Dialog - Works for both create and edit modes */}
  //         {hasAdminAccess && (
  //           <CourseAssignDialog
  //             open={showDialog}
  //             onOpenChange={setShowDialog}
  //             mode={dialogMode}
  //             courseId={selectedCourse?.id}
  //             courseName={selectedCourse?.name}
  //             instanceId={selectedCourse?.instanceId}
  //             editData={editData ? {
  //               instance_id: editData.instance_id,
  //               name: editData.name,
  //               grade_level: editData.grade_level,
  //               max_participants: editData.max_participants,
  //               price_for_customer: editData.price_for_customer,
  //               price_for_instructor: editData.price_for_instructor,
  //               institution_name: editData.institution_name,
  //               instructor_name: editData.instructor_name,
  //               start_date: editData.start_date,
  //               approx_end_date: editData.approx_end_date,
  //             } : undefined}
  //             onAssignmentComplete={handleAssignmentComplete}
  //           />
  //         )}
  //       </main>
  //     </div>
  //   );
  // };
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Mobile Navigation */}
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
                : "ניהול וצפייה בכל הקורסים שהוקצו למדריכים"}
            </p>
          </div>
        </div>

        {/* Filters - only for admin */}

        <div className="mb-6">
          <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="font-medium text-gray-700">סינון:</span>
              </div>
              <div
                className={
                  hasAdminAccess
                    ? "grid grid-cols-1 md:grid-cols-4 gap-4"
                    : "grid grid-cols-1 md:grid-cols-3 gap-4"
                }
              >
                {/* Instructor Filter */}
                {hasAdminAccess && (
                  <div className="flex flex-col gap-2">
                    <span className="text-sm text-gray-600">מדריך:</span>
                    <Select
                      value={instructorFilter}
                      onValueChange={setInstructorFilter}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="כל המדריכים" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">כל המדריכים</SelectItem>
                        {instructors.map((inst) => (
                          <SelectItem key={inst.id} value={inst.full_name}>
                            {inst.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {/* Institution Filter */}
                <div className="flex flex-col gap-2">
                  <span className="text-sm text-gray-600">מוסד חינוכי:</span>
                  <Select
                    value={institutionFilter}
                    onValueChange={setInstitutionFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="כל המוסדות" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">כל המוסדות</SelectItem>
                      {institutions.map((inst) => (
                        <SelectItem key={inst.id} value={inst.name}>
                          {inst.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Course Filter */}
                <div className="flex flex-col gap-2">
                  <span className="text-sm text-gray-600">קורס:</span>
                  <Select value={courseFilter} onValueChange={setCourseFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="כל הקורסים" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">כל הקורסים</SelectItem>
                      {courseTemplates.map((course) => (
                        <SelectItem key={course.id} value={course.name}>
                          {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* School Type Filter */}
                <div className="flex flex-col gap-2">
                  <span className="text-sm text-gray-600">סוג בית ספר:</span>
                  <Select
                    value={schoolTypeFilter}
                    onValueChange={setSchoolTypeFilter}
                  >
                    <SelectTrigger>
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
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assignments List */}
        <div className="space-y-8">
          {filteredAssignments.map((assignment) => (
            <Card
              key={assignment.instance_id}
              className="shadow-xl border-0 backdrop-blur-sm bg-white/80"
            >
              <CardHeader className="text-white rounded-t-lg bg-gradient-to-r from-blue-600 to-blue-700">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-blue-100 mb-1">
                      {formatDate(assignment.start_date)} -{" "}
                      {formatDate(assignment.approx_end_date)}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-2xl text-white">
                        {assignment.name}
                      </CardTitle>
                      <Badge className="bg-green-500/20 text-green-100 border-green-300/30">
                        מוקצה
                      </Badge>
                    </div>
                    {assignment.presentation_link ? (
                      <a
                        href={assignment.presentation_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-sm text-blue-100"
                      >
                        <b>צפה במצגת הקורס</b>
                      </a>
                    ) : (
                      <span className="text-black font-bold">
                        לא קיימת מצגת המשוייכת להקצאה זו
                      </span>
                    )}
                    <div className="mt-2">
                      {assignment.program_link ? (
                        <a
                          href={assignment.program_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline text-sm text-blue-100"
                        >
                          <b> צפה בתכנית הפדגוגית</b>
                        </a>
                      ) : (
                        <span className="text-black font-bold">
                          לא קיימת תכנית פדגוגית להקצאה זו{" "}
                        </span>
                      )}
                    </div>
                    <CardDescription className="text-blue-100 text-base">
                      {assignment.institution_name} • מדריך:{" "}
                      {assignment.instructor_name} • כיתה:{" "}
                      {assignment.grade_level}
                    </CardDescription>
                    
                  </div>

                  <div className="flex gap-2">
                    {hasAdminAccess && (
                      <>
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
                          onClick={() => setDeleteTargetAssignment(assignment)}
                          title=" מחיקת הקצאה  "
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20"
                      onClick={() =>
                        toggleCardExpansion(assignment.instance_id)
                      } // <-- שמור את ההקצאה הספציפית
                      title={
                        expandedCards.has(assignment.instance_id)
                          ? "הסתר פרטים"
                          : "הצג פרטים"
                      }
                    >
                      {expandedCards.has(assignment.instance_id) ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {expandedCards.has(assignment.instance_id) && (
                <CardContent className="p-6">
                  {/* Course Info Grid */}
                  <div className={user?.user_metadata.role==="admin"?"grid grid-cols-1 md:grid-cols-4 gap-4 mb-6":"grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"}>
                    {/* דוגמא לסוג בית ספר */}
                    <div
                      className={`${
                        getSchoolTypeColors(assignment.school_type).bg
                      } p-4 rounded-lg border ${
                        getSchoolTypeColors(assignment.school_type).border
                      }`}
                    >
                      <div
                        className={`flex items-center ${
                          getSchoolTypeColors(assignment.school_type).text
                        } mb-2`}
                      >
                        <span className="font-medium">סוג בית ספר</span>
                      </div>
                      <span className="text-lg font-bold text-gray-900">
                        {getSchoolTypeDisplayName(assignment.school_type)}
                      </span>
                    </div>

                    {/* כיתה */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center text-blue-600 mb-2">
                        <Users className="h-5 w-5 ml-2" />
                        <span className="font-medium">כיתה</span>
                      </div>
                      <span className="text-lg font-bold text-gray-900">
                        {assignment.grade_level}
                      </span>
                    </div>

                    {/* מקסימום תלמידים */}
                    {/* <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center text-green-600 mb-2">
                        <Users className="h-5 w-5 ml-2" />
                        <span className="font-medium">מקסימום תלמידים</span>
                      </div>
                      <span className="text-lg font-bold text-gray-900">
                        {assignment.max_participants}
                      </span>
                    </div> */}

                    {/* מספר שיעורים */}
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="flex items-center text-purple-600 mb-2">
                        <Calendar className="h-5 w-5 ml-2" />
                        <span className="font-medium">מספר שיעורים</span>
                      </div>
                      <span className="text-lg font-bold text-gray-900">
                        {assignment.lesson_count}
                      </span>
                    </div>

                    {/* מחיר */}
                    { user?.user_metadata.role==="admin" && <div className="bg-orange-50 p-4 rounded-lg">
                      <div className="flex items-center text-orange-600 mb-2">
                        <span className="font-medium">מחיר ללקוח</span>
                      </div>
                      <span className="text-lg font-bold text-gray-900">
                        ₪{assignment.price_for_customer}
                      </span>
                    </div>}
                  </div>

                  {/* Tasks Section */}
                  {assignment.tasks.length > 0 && (
                    <div className="space-y-6">
                      {Object.entries(groupTasksByLesson(assignment.tasks)).map(
                        ([lessonNumber, tasks]) => {
                          // סינון משימות - הצג רק משימות רלוונטיות
                          const relevantTasks = tasks.filter(task => {
                            // אם יש שיעור בוטל, הצג רק את המשימות שלו
                            if (task.is_cancelled) {
                              return true;
                            }
                            // אם יש שיעור נדחה, הצג רק את המשימות שלו
                            if (task.is_postponed) {
                              return true;
                            }
                            // אחרת, הצג רק משימות שלא בוטלו ולא נדחו
                            return !task.is_cancelled && !task.is_postponed;
                          });

                          // חישוב סטטוס ברמת השיעור
                          const lessonStatus = (() => {
                            const report = tasks[0]?.report_status;
                            if (!report?.isReported)
                              return {
                                text: "📋 טרם דווח",
                                color: "bg-gray-500",
                              };
                            // בדיקה אם זה שיעור בוטל
                            if (tasks[0]?.is_cancelled) {
                              return {
                                text: "❌ בוטל",
                                color: "bg-red-500 text-white",
                              };
                            }
                            
                            // בדיקה אם זה שיעור נדחה
                            if (tasks[0]?.is_postponed) {
                              return {
                                text: "📅 נדחה - טרם דווח",
                                color: "bg-cyan-500 text-white",
                              };
                            }
                            
                            // בדיקה אם השיעור לא התקיים
                            if (report.isCompleted === false) {
                              return {
                                text: "❌ לא התקיים",
                                color: "bg-orange-500 text-white",
                              };
                            }
                            if (
                              report.isCompleted &&
                              report.isLessonOk === false
                            )
                              return {
                                text: "⚠️ לא התנהל כשורה",
                                color: "bg-red-500 text-white",
                              };
                            return {
                              text: "✅ דווח והתקיים",
                              color: "bg-green-500 text-white",
                            };
                          })();

                          return (
                            <div
                              key={lessonNumber}
                              className="bg-gray-50 rounded-lg p-4"
                            >
                              <div className="flex justify-between items-center mb-4">
                                <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                                  <Calendar className="h-4 w-4 ml-2" />
                                  שיעור {lessonNumber}:{" "}
                                  {tasks[0]?.lesson_title || "ללא כותרת"}
                                </h4>
                                <Badge className={`${lessonStatus.color}`}>
                                  {lessonStatus.text}
                                </Badge>
                              </div>

                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="text-right">
                                      משימה
                                    </TableHead>
                                    <TableHead className="text-right">
                                      זמן משוער
                                    </TableHead>
                                    <TableHead className="text-right">
                                      סטטוס
                                    </TableHead>
                                    <TableHead className="text-right">
                                      זמן מתוכנן
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {relevantTasks
                                    .sort(
                                      (a, b) => a.order_index - b.order_index
                                    )
                                    .map((task) => (
                                      <TableRow key={task.id}>
                                        <TableCell>
                                          <div>
                                            <span className="font-medium">
                                              {task.title}
                                            </span>
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
                                            <span>
                                              {task.estimated_duration} דקות
                                            </span>
                                          </div>
                                        </TableCell>
                                        <TableCell>
                                          <div className="flex items-center">
                                            {task.is_mandatory ? (
                                              <CheckCircle2 className="h-4 w-4 text-red-500 ml-2" />
                                            ) : (
                                              <Circle className="h-4 w-4 text-gray-400 ml-2" />
                                            )}
                                            <span
                                              className={
                                                task.is_mandatory
                                                  ? "text-red-600 font-medium"
                                                  : "text-gray-600"
                                              }
                                            >
                                              {task.is_mandatory
                                                ? "חובה"
                                                : "רשות"}
                                            </span>
                                          </div>
                                        </TableCell>
                                        <TableCell>
                                          {task.scheduled_start &&
                                          task.scheduled_end ? (
                                            <div className="text-sm">
                                              <div>
                                                {formatDateTime(
                                                  task.scheduled_start
                                                )}
                                              </div>
                                              <div className="text-gray-500">
                                                עד{" "}
                                                {formatDateTime(
                                                  task.scheduled_end
                                                )}
                                              </div>
                                            </div>
                                          ) : (
                                            <span className="text-gray-400">
                                              לא מתוכנן
                                            </span>
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                </TableBody>
                              </Table>
                            </div>
                          );
                        }
                      )}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
        {deleteTargetAssignment && (
          <DeleteConfirmationPopup
            assignment={deleteTargetAssignment}
            isOpen={!!deleteTargetAssignment}
            onClose={() => setDeleteTargetAssignment(null)}
            onConfirm={() => {
              handleDeleteConfirm();
              setDeleteTargetAssignment(null);
            }}
          />
        )}

        {hasAdminAccess && (
          <CourseAssignDialog
            open={showDialog}
            onOpenChange={setShowDialog}
            mode={dialogMode}
            courseId={selectedCourse?.id}
            courseName={selectedCourse?.name}
            instanceId={selectedCourse?.instanceId}
            editData={
              editData
                ? {
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
                  }
                : undefined
            }
            onAssignmentComplete={handleAssignmentComplete}
          />
        )}
      </main>
    </div>
  );
};
export default CourseAssignments;
