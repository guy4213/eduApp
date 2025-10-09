import React, { useEffect, useRef, useState } from "react";
import {
  Camera,
  FileText,
  CheckCircle,
  X,
  Eye,
  Calendar,
  User,
  Users,
  CalendarDays,
  Filter,
  Plus,
  UserCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import MobileNavigation from "@/components/layout/MobileNavigation";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import FeedbackDialog from "@/components/FeedbackDialog";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { rescheduleSpecificLesson } from "@/services/lessonReschedulingService";

const LessonReport = () => {
  const fileInputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [lessonTitle, setLessonTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [feedback, setFeedback] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Student attendance state
  const [students, setStudents] = useState([]);
  const [newStudentName, setNewStudentName] = useState("");
  const [attendanceList, setAttendanceList] = useState([]);
  const [courseInstanceId, setCourseInstanceId] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());

  const { id } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const scheduleId = queryParams.get("scheduleId");
  const courseInstanceIdFromUrl = queryParams.get("courseInstanceId");
  const selectedDate = location.state?.selectedDate ? new Date(location.state.selectedDate) : null;

  const [lesson, setLesson] = useState(null);
  const [lessonTasks, setLessonTasks] = useState([]);
  const [checkedTasks, setCheckedTasks] = useState([]);
  const [allReports, setAllReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isLessonOk, setIsLessonOk] = useState(false);
  const [isCompleted, setIsCompleted] = useState(true); // האם השיעור התקיים
  const [cancellationReason, setCancellationReason] = useState(""); // סיבת הביטול
  const [maxPar, setMaxPar] = useState(null);
  const { user } = useAuth();
  const [selectedReport, setSelectedReport] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const isInstructor = user?.user_metadata.role === "instructor";
  const isAdmin = user?.user_metadata.role === "admin";

  // Date filtering state (admin only)
  const [selectedMonth, setSelectedMonth] = useState<string>("");
const [selectedInstructor, setSelectedInstructor] = useState<string>("");
const [selectedCourse, setSelectedCourse] = useState<string>("");
const [selectedStatus, setSelectedStatus] = useState<string>("");
const [selectedInstitution, setSelectedInstitution] = useState<string>("");

const [instructors, setInstructors] = useState([]);
const [courses, setCourses] = useState([]);
const [institutions, setInstitutions] = useState<{id: string, name: string}[]>([]);

  const [dateFrom, setDateFrom] = useState(undefined);
  const [dateTo, setDateTo] = useState(undefined);
  const [filteredReports, setFilteredReports] = useState([]);
  const [lessonNumber, setLessonNumber] = useState<any>();
  const navigate = useNavigate();
  
  async function getMaxParticipantsByScheduleId(scheduleId) {
    console.log("Getting max participants for schedule ID:", scheduleId);

    // First, try to get from the new course_instance_schedules table
    let { data, error } = await supabase
      .from("course_instance_schedules")
      .select(
        `course_instances (
                max_participants,
                id
            )`
      )
      .eq("id", scheduleId)
      .single();

    // If not found in new table, try the legacy lesson_schedules table
    if (error || !data) {
      console.log(
        "Not found in course_instance_schedules, trying lesson_schedules..."
      );
      const legacyResult = await supabase
        .from("lesson_schedules")
        .select(
          `course_instances (
                    max_participants,
                    id
                )`
        )
        .eq("id", scheduleId)
        .single();

      if (legacyResult.error) {
        console.error(
          "Error fetching max participants from both tables:",
          legacyResult.error
        );
        throw new Error(
          `לא ניתן למצוא את לוח הזמנים עם מזהה ${scheduleId}. ייתכן שהלוח זמנים נמחק או שאינו קיים.`
        );
      }

      data = legacyResult.data;
    }

    if (!data || !data.course_instances) {
      throw new Error(`לא נמצאו נתוני קורס עבור לוח הזמנים ${scheduleId}`);
    }

    console.log("Found course instance data:", data);
    return {
      maxParticipants: data.course_instances?.max_participants ?? null,
      courseInstanceId: data.course_instances?.id ?? null,
    };
  }

  // Fetch existing students for the course instance
  async function fetchStudentsByCourseInstance(courseInstanceId) {
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .eq("course_instance_id", courseInstanceId)
      .order("full_name");

    if (error) {
      console.error("Error fetching students:", error);
      return [];
    }

    return data || [];
  }

  useEffect(() => {
    async function fetchMaxParticipants() {
      try {
        // If courseInstanceId is provided directly from URL, use it
        if (courseInstanceIdFromUrl) {
          console.log(
            "Using courseInstanceId from URL:",
            courseInstanceIdFromUrl
          );
          setCourseInstanceId(courseInstanceIdFromUrl);

          // Fetch max participants for this course instance
          const { data, error } = await supabase
            .from("course_instances")
            .select("max_participants")
            .eq("id", courseInstanceIdFromUrl)
            .single();

          if (error) {
            console.error("Error fetching max participants:", error);
            throw new Error("שגיאה בטעינת נתוני הקורס");
          }

          setMaxPar(data?.max_participants ?? null);
          return;
        }

        // Fallback to old scheduleId logic for backward compatibility
        if (!scheduleId) {
          console.error("No scheduleId or courseInstanceId provided");
          toast({
            title: "שגיאה",
            description: "לא נמצא מזהה לוח זמנים. אנא חזור לדף הקודם ונסה שוב.",
            variant: "destructive",
          });
          return;
        }

        const result = await getMaxParticipantsByScheduleId(scheduleId);
        setMaxPar(result.maxParticipants);
        setCourseInstanceId(result.courseInstanceId);
      } catch (err) {
        console.error("Error fetching max participants:", err);
        toast({
          title: "שגיאה",
          description: err.message || "שגיאה בטעינת נתוני הקורס",
          variant: "destructive",
        });
      }
    }

    if (courseInstanceIdFromUrl || scheduleId) {
      fetchMaxParticipants();
    }
  }, [courseInstanceIdFromUrl, scheduleId, toast]);

  // Fetch students when course instance ID is available
  useEffect(() => {
    async function loadStudents() {
      if (!courseInstanceId) return;

      try {
        console.log("Loading students for course instance:", courseInstanceId);
        const existingStudents = await fetchStudentsByCourseInstance(
          courseInstanceId
        );
        console.log("Existing students loaded:", existingStudents);
        setStudents(existingStudents);

        // Initialize attendance list with existing students
        const initialAttendanceList = existingStudents.map((student) => ({
          id: student.id,
          name: student.full_name,
          isPresent: false,
          isNew: false,
        }));
        console.log("Initial attendance list:", initialAttendanceList);
        setAttendanceList(initialAttendanceList);
      } catch (err) {
        console.error("Error loading students:", err);
      }
    }

    loadStudents();
  }, [courseInstanceId]);

  // Add new student to attendance list (UI only)
  const handleAddStudent = () => {
    if (!newStudentName.trim()) {
      toast({
        title: "שגיאה",
        description: "נדרש להזין שם תלמיד",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicate names
    const trimmedName = newStudentName.trim();
    const isDuplicate = attendanceList.some(
      (student) => student.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (isDuplicate) {
      toast({
        title: "שגיאה",
        description: "תלמיד עם שם זה כבר קיים ברשימה",
        variant: "destructive",
      });
      return;
    }

    const newStudent = {
      id: `temp_${Date.now()}`,
      name: trimmedName,
      isPresent: false,
      isNew: true,
    };

    console.log("Adding new student:", newStudent);
    setAttendanceList((prev) => {
      const updated = [...prev, newStudent];
      console.log("Updated attendance list:", updated);
      return updated;
    });
    setNewStudentName("");

    // Show success message
    toast({
      title: "הצלחה",
      description:
        "תלמיד נוסף לרשימה. הוא יישמר במסד הנתונים בעת שליחת הדיווח.",
      variant: "default",
    });
  };

  // Toggle student presence
  const handleTogglePresence = (studentId) => {
    setAttendanceList((prev) =>
      prev.map((student) =>
        student.id === studentId
          ? { ...student, isPresent: !student.isPresent }
          : student
      )
    );
  };

  // Remove student from attendance list (UI only)
  const handleRemoveStudent = (studentId) => {
    setAttendanceList((prev) =>
      prev.filter((student) => student.id !== studentId)
    );
  };

  // Save new students to database and get their IDs
  async function saveNewStudents() {
    const newStudents = attendanceList.filter((student) => student.isNew);
    console.log("New students to save:", newStudents);

    if (!courseInstanceId) {
      throw new Error(
        "Course instance ID is not available. Please wait for the page to finish loading and try again."
      );
    }

    const studentsToInsert = newStudents.map((student) => ({
      course_instance_id: courseInstanceId,
      full_name: student.name,
    }));

    console.log("Students to insert:", studentsToInsert);
    console.log("Course instance ID:", courseInstanceId);

    if (studentsToInsert.length > 0) {
      const { data, error } = await supabase
        .from("students")
        .insert(studentsToInsert)
        .select();

      console.log("Database response:", { data, error });

      if (error) {
        console.error("Error saving students:", error);
        throw new Error(`שגיאה בשמירת תלמידים חדשים: ${error.message}`);
      }

      // Update attendance list with real IDs
      const updatedAttendanceList = attendanceList.map((student) => {
        if (student.isNew) {
          const savedStudent = data.find((s) => s.full_name === student.name);
          if (savedStudent) {
            return { ...student, id: savedStudent.id, isNew: false };
          }
        }
        return student;
      });

      console.log("Updated attendance list:", updatedAttendanceList);
      setAttendanceList(updatedAttendanceList);
      return updatedAttendanceList;
    }

    return attendanceList;
  }

  // שמירת נוכחות בטבלת lesson_attendance
  async function saveStudentAttendance(lessonReportId, attendanceList) {
    const attendanceRecords = attendanceList
      .filter((student) => !student.isNew) // רק סטודנטים קיימים (עם ID אמיתי)
      .map((student) => ({
        lesson_report_id: lessonReportId,
        student_id: student.id,
        attended: student.isPresent,
      }));

    if (attendanceRecords.length > 0) {
      const { error } = await supabase
        .from("lesson_attendance")
        .insert(attendanceRecords);

      if (error) {
        throw new Error(`שגיאה בשמירת נוכחות: ${error.message}`);
      }
    }
  }

  // Toggle row expansion for attendance details
  const toggleRowExpansion = (reportId) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(reportId)) {
        newSet.delete(reportId);
      } else {
        newSet.add(reportId);
      }
      return newSet;
    });
  };

  useEffect(() => {
   
    if (isInstructor && !id) return;

    if (isInstructor) {
      // Fetch lesson data for instructors
      const fetchLessonData = async () => {
        const [lessonRes, tasksRes] = await Promise.all([
          supabase.from("lessons").select("*").eq("id", id).single(),
          supabase.from("lesson_tasks").select("*").eq("lesson_id", id),
        ]);

        if (lessonRes.error) {
          console.error("Lesson fetch error:", lessonRes.error);
        } else {
          setLesson(lessonRes.data);
        }

        if (tasksRes.error) {
          console.error("Tasks fetch error:", tasksRes.error);
        } else {
          setLessonTasks(tasksRes.data || []);
        }
      };

      fetchLessonData();
    } else {
      // Fetch all reports for admins/managers with enhanced data
      const fetchAllReports = async () => {
        setLoading(true);
        const { data, error } = await supabase
  .from("lesson_reports")
  .select(`
    *,
    reported_lesson_instances(lesson_number),
    instructor:instructor_id (
      id,
      full_name
    ),
    profiles (
      full_name
    ),
    lesson_attendance (
      student_id,
      attended,
      students (
        id,
        full_name
      )
    ),
    lessons:lesson_id (
      id,
      course_id,
      lesson_tasks (
        id,
        title,
        description,
        is_mandatory
      ),
      courses:course_id (
        name
      )
    ),
    course_instances:course_instance_id (
      id,
      educational_institutions:institution_id (
        id,
        name
      )
    )
  `)
  .order("created_at", { ascending: false });

        if (error) {
          console.error("Reports fetch error:", error);
          toast({
            title: "שגיאה",
            description: "שגיאה בטעינת הדיווחים",
            variant: "destructive",
          });
        } else {
          // Process reports to include attendance data from lesson_attendance table
          const processedReports = await Promise.all(
            data.map(async (report) => {
              // Get course instance data from either lesson_schedule_id or course_instance_id
              let courseInstanceData = null;

              if (report.course_instance_id) {
                // New architecture: direct course instance reference
                const { data: courseInstance } = await supabase
                  .from("course_instances")
                  .select(
                    `id,
                                    students (
                                        id,
                                        full_name
                                    )`
                  )
                  .eq("id", report.course_instance_id)
                  .single();

                courseInstanceData = { course_instances: courseInstance };
              } else if (report.lesson_schedule_id) {
                // Legacy architecture: get from lesson_schedule_id
                // Try to get from new course_instance_schedules first
                let { data: scheduleData } = await supabase
                  .from("course_instance_schedules")
                  .select(
                    `course_instances (
                                    id,
                                    students (
                                        id,
                                        full_name
                                    )
                                )`
                  )
                  .eq("id", report.lesson_schedule_id)
                  .single();

                // If not found, try legacy lesson_schedules
                if (!scheduleData) {
                  const { data: legacyData } = await supabase
                    .from("lesson_schedules")
                    .select(
                      `course_instances (
                                        id,
                                        students (
                                            id,
                                            full_name
                                        )
                                    )`
                    )
                    .eq("id", report.lesson_schedule_id)
                    .single();
                  scheduleData = legacyData;
                }

                courseInstanceData = scheduleData;
              }

              const allStudents =
                courseInstanceData?.course_instances?.students || [];
              const attendanceRecords = report.lesson_attendance || [];

              // יצירת נתוני נוכחות מהטבלה החדשה
              const attendanceData = allStudents.map((student) => {
                const attendanceRecord = attendanceRecords.find(
                  (record) => record.student_id === student.id
                );
                return {
                  id: student.id,
                  name: student.full_name,
                  attended: attendanceRecord
                    ? attendanceRecord.attended
                    : false,
                };
              });

              return {
                ...report,
                totalStudents: allStudents.length,
                attendanceData: attendanceData,
                // חישוב מספר הנוכחים מתוך טבלת הנוכחות
                participants_count: attendanceRecords.filter((r) => r.attended)
                  .length,
              };
            })
          );

          setAllReports(processedReports || []);
          setFilteredReports(processedReports || []);
        }
        setLoading(false);
      };

      fetchAllReports();
    }
  }, [id, isInstructor, toast]);

  // Date filtering effect (admin only)
  useEffect(() => {
    if (!isAdmin || !allReports.length) return;

    let filtered = [...allReports];

    if (dateFrom) {
      filtered = filtered.filter(
        (report) => new Date(report.created_at) >= dateFrom
      );
    }

    if (dateTo) {
      const endOfDay = new Date(dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      filtered = filtered.filter(
        (report) => new Date(report.created_at) <= endOfDay
      );
    }

    setFilteredReports(filtered);
  }, [dateFrom, dateTo, allReports, isAdmin]);

  const clearDateFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const handleToggleTask = (taskId) => {
    setCheckedTasks((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleFileSelect = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer.files);
    setFiles((prev) => [...prev, ...droppedFiles]);
  };

  const handleClick = () => fileInputRef.current?.click();

  const handleRemoveFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (file, lessonReportId) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()}-${Date.now()}.${fileExt}`;
    const filePath = `lesson-reports/${lessonReportId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("lesson-files")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { error: dbError } = await supabase.from("lesson_files").insert({
      lesson_report_id: lessonReportId,
      file_name: file.name,
      file_path: filePath,
      file_size: file.size,
      file_type: file.type,
      is_for_marketing: marketingConsent,
    });

    if (dbError) throw dbError;

    return true;
  };

  //     // Count present students
  //     const presentStudents = attendanceList.filter(student => student.isPresent).length;
  //     const participantsCount = presentStudents;

  //     if (participantsCount > maxPar || participantsCount === 0) {
  //         toast({
  //             title: 'שגיאה',
  //             description: `נדרש לבחור לפחות תלמיד אחד ועד ${maxPar} משתתפים`,
  //             variant: 'destructive',
  //         });
  //         return;
  //     }

  //     if (!lessonTitle.trim()) {
  //         toast({
  //             title: 'שגיאה',
  //             description: 'נדרש להזין כותרת שיעור',
  //             variant: 'destructive',
  //         });
  //         return;
  //     }

  //     if (!isLessonOk && !feedback.trim()) {
  //         toast({
  //             title: 'שגיאה',
  //             description: 'בבקשה הזן משוב במידה והשיעור לא התנהל כשורה',
  //             variant: 'destructive',
  //         });
  //         return;
  //     }

  //     setIsSubmitting(true);

  //     try {
  //         const { data: { user }, error: userError } = await supabase.auth.getUser();
  //         if (userError || !user) throw new Error('משתמש לא מחובר');

  //         console.log('Starting form submission...');
  //         console.log('Current attendance list:', attendanceList);

  //         // שמירת סטודנטים חדשים קודם
  //         let updatedAttendanceList;
  //         try {
  //             updatedAttendanceList = await saveNewStudents();
  //             console.log('Students saved successfully:', updatedAttendanceList);
  //         } catch (studentError) {
  //             console.error('Failed to save students:', studentError);
  //             toast({
  //                 title: 'שגיאה',
  //                 description: studentError.message || 'שגיאה בשמירת תלמידים חדשים',
  //                 variant: 'destructive',
  //             });
  //             return;
  //         }

  //         // Handle lesson_schedule_id and course_instance_id for new architecture
  //         let lessonScheduleId = scheduleId;
  //         let courseInstanceIdForReport = null;

  //         // If we're using the new architecture (courseInstanceIdFromUrl), use course_instance_id field
  //         if (courseInstanceIdFromUrl && !scheduleId) {
  //             console.log('Using new architecture with course_instance_id:', courseInstanceIdFromUrl);
  //             courseInstanceIdForReport = courseInstanceIdFromUrl;
  //             lessonScheduleId = null; // Don't use lesson_schedule_id for new architecture
  //         } else if (scheduleId) {
  //             console.log('Using legacy architecture with lesson_schedule_id:', scheduleId);
  //             lessonScheduleId = scheduleId;
  //         } else {
  //             throw new Error('לא ניתן ליצור דיווח ללא מזהה לוח זמנים תקין');
  //         }

  //         // יצירת דיווח השיעור (ללא attended_student_ids)
  //         const reportDataToInsert = {
  //             lesson_title: lessonTitle,
  //             participants_count: participantsCount,
  //             notes,
  //             feedback,
  //             marketing_consent: marketingConsent,
  //             instructor_id: user.id,
  //             is_lesson_ok: isLessonOk,
  //             completed_task_ids: checkedTasks,
  //             lesson_id: id,
  //             // הסרנו את attended_student_ids מכאן
  //         };

  //         // Add the appropriate schedule reference based on architecture
  //         if (courseInstanceIdForReport) {
  //             reportDataToInsert.course_instance_id = courseInstanceIdForReport;
  //         } else if (lessonScheduleId) {
  //             reportDataToInsert.lesson_schedule_id = lessonScheduleId;
  //         }

  //         const { data: reportData, error: reportError } = await supabase
  //             .from('lesson_reports')
  //             .insert(reportDataToInsert)
  //             .select()
  //             .single();

  //         if (reportError) throw reportError;

  //         console.log('Lesson report created:', reportData);

  //         // Create a record in reported_lesson_instances to track this specific lesson instance
  //         const reportedInstanceData:any = {
  //             lesson_report_id: reportData.id,
  //             lesson_id: id,
  //             scheduled_date: new Date().toISOString().split('T')[0], // Today's date as default
  //         };

  //         // Add the appropriate schedule reference
  //         if (courseInstanceIdForReport) {
  //             reportedInstanceData.course_instance_id = courseInstanceIdForReport;

  //             // Get the lesson's order_index from the database
  //             try {
  //                 const { data: lessonData, error: lessonError } = await supabase
  //                     .from('lessons')
  //                     .select('order_index')
  //                     .eq('id', id)
  //                     .single();

  //                 if (lessonError) {
  //                     console.error('Error fetching lesson order_index:', lessonError);
  //                     reportedInstanceData.lesson_number = 1; // Fallback
  //                 } else {
  //                     reportedInstanceData.lesson_number = lessonData.order_index+1;
  //                     console.log('Using lesson order_index:', lessonData.order_index+1);
  //                 }
  //             } catch (error) {
  //                 console.error('Error getting lesson order_index:', error);
  //                 reportedInstanceData.lesson_number = 1; // Fallback
  //             }
  //         } else if (lessonScheduleId) {
  //             reportedInstanceData.lesson_schedule_id = lessonScheduleId;
  //         }

  //         const { error: trackingError } = await supabase
  //             .from('reported_lesson_instances')
  //             .insert(reportedInstanceData);

  //         if (trackingError) {
  //             console.error('Error creating reported lesson instance record:', trackingError);
  //             // Don't throw error here as the main report was created successfully
  //         } else {
  //             console.log('Reported lesson instance record created');
  //         }

  //         // שמירת נתוני נוכחות בטבלה נפרדת
  //         try {
  //             await saveStudentAttendance(reportData.id, updatedAttendanceList);
  //             console.log('Attendance saved successfully');
  //         } catch (attendanceError) {
  //             console.error('Failed to save attendance:', attendanceError);
  //             toast({
  //                 title: 'אזהרה',
  //                 description: 'הדיווח נשמר אך הייתה שגיאה בשמירת הנוכחות',
  //                 variant: 'destructive',
  //             });
  //         }

  //         if (files.length > 0) {
  //             const uploadResults = await Promise.all(
  //                 files.map((file) => uploadFile(file, reportData.id))
  //             );
  //             const failed = uploadResults.filter((r) => !r).length;
  //             if (failed > 0) {
  //                 toast({
  //                     title: 'אזהרה',
  //                     description: `${failed} קבצים לא הועלו בהצלחה`,
  //                     variant: 'destructive',
  //                 });
  //             }
  //         }

  //         toast({ title: 'הצלחה!', description: 'דיווח השיעור נשמר בהצלחה' });

  //         // Reset form
  //         setLessonTitle('');
  //         setNotes('');
  //         setFeedback('');
  //         setFiles([]);
  //         setCheckedTasks([]);
  //         setMarketingConsent(false);
  //         // Reset attendance but keep existing students
  //         setAttendanceList(prev => prev.map(student => ({ ...student, isPresent: false, isNew: false })));
  //         if (fileInputRef.current) fileInputRef.current.value = '';

  //     } catch (err) {
  //         toast({
  //             title: 'שגיאה',
  //             description: err.message || 'אירעה שגיאה בשמירת הדיווח',
  //             variant: 'destructive',
  //         });
  //     } finally {
  //         setIsSubmitting(false);
  //     }
  // };
  
//   const handleSubmit = async () => {

//     const { error } = await supabase.rpc('report_work_hour');

//   if (error) {
//     console.error('Error reporting work hour:', error);
//     // Show an error toast
//   } else {
//     console.log('Successfully reported 1 work hour!');
//     // Show a success toast
//   }

//     // Count present students
//     const presentStudents = attendanceList.filter(
//       (student) => student.isPresent
//     ).length;
//     const participantsCount = presentStudents;
//     const totalStudents = attendanceList.length;

//     // If lesson didn't take place, allow submission without participants
//     if (isCompleted && participantsCount === 0) {
//       toast({
//         title: "שגיאה",
//         description: `נדרש לבחור לפחות תלמיד אחד ועד ${maxPar} משתתפים`,
//         variant: "destructive",
//       });
//       return;
//     }

//     if (!lessonTitle.trim()) {
//       toast({
//         title: "שגיאה",
//         description: "נדרש להזין כותרת שיעור",
//         variant: "destructive",
//       });
//       return;
//     }

//     // בדיקת משוב רק אם השיעור התקיים ולא התנהל כשורה
//     if (isCompleted && !isLessonOk && !feedback.trim()) {
//       toast({
//         title: "שגיאה",
//         description: "בבקשה הזן משוב במידה והשיעור לא התנהל כשורה",
//         variant: "destructive",
//       });
//       return;
//     }

//     setIsSubmitting(true);

//     try {
//       const {
//         data: { user },
//         error: userError,
//       } = await supabase.auth.getUser();
//       if (userError || !user) throw new Error("משתמש לא מחובר");

//       console.log("Starting form submission...");
//       console.log("Current attendance list:", attendanceList);

//       // שמירת סטודנטים חדשים קודם
//       let updatedAttendanceList;
//       try {
//         updatedAttendanceList = await saveNewStudents();
//         console.log("Students saved successfully:", updatedAttendanceList);
//       } catch (studentError) {
//         console.error("Failed to save students:", studentError);
//         toast({
//           title: "שגיאה",
//           description: studentError.message || "שגיאה בשמירת תלמידים חדשים",
//           variant: "destructive",
//         });
//         setIsSubmitting(false); // Stop submission on critical error
//         return;
//       }

//       // Handle lesson_schedule_id and course_instance_id for new architecture
//       let lessonScheduleId = scheduleId;
//       let courseInstanceIdForReport = null;

//       if (courseInstanceIdFromUrl && !scheduleId) {
//         console.log(
//           "Using new architecture with course_instance_id:",
//           courseInstanceIdFromUrl
//         );
//         courseInstanceIdForReport = courseInstanceIdFromUrl;
//         lessonScheduleId = null;
//       } else if (scheduleId) {
//         console.log(
//           "Using legacy architecture with lesson_schedule_id:",
//           scheduleId
//         );
//         lessonScheduleId = scheduleId;
//       } else {
//         throw new Error("לא ניתן ליצור דיווח ללא מזהה לוח זמנים תקין");
//       }

//       // יצירת דיווח השיעור
//       const reportDataToInsert = {
//         lesson_title: lessonTitle,
//         participants_count: participantsCount,
//         notes,
//         feedback,
//         marketing_consent: marketingConsent,
//         instructor_id: user.id,
//         is_lesson_ok: isCompleted ? isLessonOk : null, // רק אם השיעור התקיים
//         is_completed: isCompleted,
//         completed_task_ids: checkedTasks,
//         lesson_id: id,
//       };

//       if (courseInstanceIdForReport) {
//         reportDataToInsert.course_instance_id = courseInstanceIdForReport;
//       } else if (lessonScheduleId) {
//         reportDataToInsert.lesson_schedule_id = lessonScheduleId;
//       }

//       const { data: reportData, error: reportError } = await supabase
//         .from("lesson_reports")
//         .insert(reportDataToInsert)
//         .select()
//         .single();

//       if (reportError) throw reportError;

//       console.log("Lesson report created:", reportData);

//       // Create a record in reported_lesson_instances
//       const reportedInstanceData = {
//         lesson_report_id: reportData.id,
//         lesson_id: id,
//         scheduled_date: new Date().toISOString().split("T")[0],
//         lesson_number: 1, // Default value
//       };

//       if (courseInstanceIdForReport) {
//         reportedInstanceData.course_instance_id = courseInstanceIdForReport;
//         const { data: lessonData, error: lessonError } = await supabase
//           .from("lessons")
//           .select("order_index")
//           .eq("id", id)
//           .single();
//         if (lessonError) {
//           console.error("Error fetching lesson order_index:", lessonError);
//         } else {
//           reportedInstanceData.lesson_number = lessonData.order_index + 1;
         
//         }
//       } else if (lessonScheduleId) {
//         reportedInstanceData.lesson_schedule_id = lessonScheduleId;
//       }

//       const { error: trackingError } = await supabase
//         .from("reported_lesson_instances")
//         .insert(reportedInstanceData);

//       if (trackingError) {
//         console.error(
//           "Error creating reported lesson instance record:",
//           trackingError
//         );
//       } else {
//         console.log("Reported lesson instance record created");
//       }

//       // שמירת נתוני נוכחות
//       try {
//         await saveStudentAttendance(reportData.id, updatedAttendanceList);
//         console.log("Attendance saved successfully");
//       } catch (attendanceError) {
//         console.error("Failed to save attendance:", attendanceError);
//         toast({
//           title: "אזהרה",
//           description: "הדיווח נשמר אך הייתה שגיאה בשמירת הנוכחות",
//           variant: "destructive",
//         });
//       }

//       // --- START: EMAIL NOTIFICATIONS ---

//       // Calculate attendance percentage
//       const attendancePercentage =
//         totalStudents > 0 ? (participantsCount / totalStudents) * 100 : 0;

//       // Check for low attendance (below 70%)
//       // Update this part in your handleSubmit function in LessonReport.tsx

//       // Check for low attendance (below 70%)
//       if (isCompleted && totalStudents > 0 && attendancePercentage < 70) {
//         console.log(
//           "Low attendance detected, invoking Edge Function to notify admins..."
//         );

//         // Get course name and grade level from existing data
//         let courseName = "לא ידוע";
//         let gradeLevel = "לא ידוע";

//         if (lesson?.course_id) {
//           const { data: courseData } = await supabase
//             .from("courses")
//             .select("name")
//             .eq("id", lesson.course_id)
//             .single();
//           if (courseData) courseName = courseData.name;
//         }

//         // Get grade level from course instance
//         if (courseInstanceId) {
//           const { data: instanceData } = await supabase
//             .from("course_instances")
//             .select("grade_level")
//             .eq("id", courseInstanceId)
//             .single();
//           if (instanceData) gradeLevel = instanceData.grade_level;
//         }

//         // Prepare the payload with all the data we have
//         const lowAttendancePayload = {
//           lessonReportId: reportData.id,
//           attendanceCount: participantsCount,
//           totalStudents: totalStudents,
//           attendancePercentage: attendancePercentage,
//           teacherName: user?.user_metadata?.full_name || "מדריך לא ידוע",
//           courseName: courseName,
//           gradeLevel: gradeLevel,
//           lessonTitle: lessonTitle,
//           lessonDate: new Date().toLocaleDateString("he-IL"),
//         };

//         // Invoke the low attendance notification function
//         const { error: lowAttendanceFunctionError } =
//           await supabase.functions.invoke("notify-admins-low-attendance", {
//             body: lowAttendancePayload,
//           });

//         if (lowAttendanceFunctionError) {
//           console.error(
//             "Error invoking low attendance notification function:",
//             lowAttendanceFunctionError
//           );
//           toast({
//             title: "אזהרה",
//             description: "הדיווח נשמר, אך שליחת התראת נוכחות נמוכה נכשלה.",
//             variant: "destructive",
//           });
//         } else {
//           console.log(
//             "Low attendance notification function invoked successfully."
//           );
//         }
//       }

//       // If the lesson was not OK and it actually took place, call feedback notification function
//       if (isCompleted && !isLessonOk && feedback.trim()) {
//         console.log(
//           "Lesson not OK, invoking Edge Function to notify admins..."
//         );

//         // Get course name (if not already fetched above)
//         let courseName = "לא ידוע";
//         if (lesson?.course_id) {
//           const { data: courseData } = await supabase
//             .from("courses")
//             .select("name")
//             .eq("id", lesson.course_id)
//             .single();
//           if (courseData) courseName = courseData.name;
//         }

//         // Prepare the payload for feedback notification
//         const feedbackPayload = {
//           courseName: courseName,
//           lessonTitle: lessonTitle,
//           lessonNumber: reportedInstanceData.lesson_number,
//           participantsCount: participantsCount,
//           notes: notes,
//           feedback: feedback,
//           marketingConsent: marketingConsent,
//           instructorName: user?.user_metadata?.full_name || "מדריך לא ידוע",
//         };

//         // Invoke the feedback notification function
//         const { error: feedbackFunctionError } =
//           await supabase.functions.invoke("notify-admins-on-feedback", {
//             body: feedbackPayload,
//           });

//         if (feedbackFunctionError) {
//           console.error(
//             "Error invoking notify-admins function:",
//             feedbackFunctionError
//           );
//           toast({
//             title: "אזהרה",
//             description: "הדיווח נשמר, אך שליחת ההתראה למנהל נכשלה.",
//             variant: "destructive",
//           });
//         } else {
//           console.log("Admin notification function invoked successfully.");
//         }
//       }

//       // --- END: EMAIL NOTIFICATIONS ---

//       if (files.length > 0) {
//         const uploadResults = await Promise.all(
//           files.map((file) => uploadFile(file, reportData.id))
//         );
//         const failed = uploadResults.filter((r) => !r).length;
//         if (failed > 0) {
//           toast({
//             title: "אזהרה",
//             description: `${failed} קבצים לא הועלו בהצלחה`,
//             variant: "destructive",
//           });
//         }
//       }

//       toast({ title: "הצלחה!", description: "דיווח השיעור נשמר בהצלחה" });

//       // Trigger dashboard refresh
//       localStorage.setItem("lessonReportUpdated", Date.now().toString());
//       window.dispatchEvent(new Event("lessonReportUpdated"));

//       // Reset form
//       setLessonTitle("");
//       setNotes("");
//       setFeedback("");
//       setFiles([]);
//       setCheckedTasks([]);
//       setMarketingConsent(false);
//       setIsCompleted(true);
//       setIsLessonOk(false);
//       setAttendanceList((prev) =>
//         prev.map((student) => ({ ...student, isPresent: false, isNew: false }))
//       );
//       if (fileInputRef.current) fileInputRef.current.value = "";
//       navigate('/calendar', { 
//   state: { selectedDate: location.state?.selectedDate || new Date().toISOString() }
// });
//     } catch (err) {
//       toast({
//         title: "שגיאה",
//         description: err.message || "אירעה שגיאה בשמירת הדיווח",
//         variant: "destructive",
//       });
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

const handleSubmit = async () => {
  // Count present students
  const presentStudents = attendanceList.filter(
    (student) => student.isPresent
  ).length;
  const participantsCount = presentStudents;
  const totalStudents = attendanceList.length;

  // If lesson didn't take place, allow submission without participants
  if (isCompleted && participantsCount === 0) {
    toast({
      title: "שגיאה",
      description: `נדרש לבחור לפחות תלמיד אחד ועד ${maxPar} משתתפים`,
      variant: "destructive",
    });
    return;
  }

  if (!lessonTitle.trim()) {
    toast({
      title: "שגיאה",
      description: "נדרש להזין כותרת שיעור",
      variant: "destructive",
    });
    return;
  }

  // Check if all tasks were completed - if not, notes are required
  if (isCompleted && checkedTasks.length < lessonTasks.length && !notes.trim()) {
    toast({
      title: "שגיאה",
      description: "נדרש להזין הערות כאשר לא כל המשימות בוצעו",
      variant: "destructive",
    });
    return;
  }

  // בדיקת סיבת ביטול אם השיעור לא התקיים
  if (!isCompleted && !cancellationReason.trim()) {
    toast({
      title: "שגיאה",
      description: "נא להזין סיבה לביטול השיעור",
      variant: "destructive",
    });
    return;
  }

  // בדיקת משוב רק אם השיעור התקיים ולא התנהל כשורה
  if (isCompleted && !isLessonOk && !feedback.trim()) {
    toast({
      title: "שגיאה",
      description: "בבקשה הזן משוב במידה והשיעור לא התנהל כשורה",
      variant: "destructive",
    });
    return;
  }

  setIsSubmitting(true);

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("משתמש לא מחובר");

    console.log("Starting form submission...");
    console.log("Current attendance list:", attendanceList);

    // שמירת סטודנטים חדשים קודם
    let updatedAttendanceList;
    try {
      updatedAttendanceList = await saveNewStudents();
      console.log("Students saved successfully:", updatedAttendanceList);
    } catch (studentError) {
      console.error("Failed to save students:", studentError);
      toast({
        title: "שגיאה",
        description: studentError.message || "שגיאה בשמירת תלמידים חדשים",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    // Handle lesson_schedule_id and course_instance_id for new architecture
    let lessonScheduleId = scheduleId;
    let courseInstanceIdForReport = null;

    if (courseInstanceIdFromUrl && !scheduleId) {
      console.log(
        "Using new architecture with course_instance_id:",
        courseInstanceIdFromUrl
      );
      courseInstanceIdForReport = courseInstanceIdFromUrl;
      lessonScheduleId = null;
    } else if (scheduleId) {
      console.log(
        "Using legacy architecture with lesson_schedule_id:",
        scheduleId
      );
      lessonScheduleId = scheduleId;
    } else {
      throw new Error("לא ניתן ליצור דיווח ללא מזהה לוח זמנים תקין");
    }

    // יצירת דיווח השיעור
    const reportDataToInsert = {
      lesson_title: lessonTitle,
      participants_count: participantsCount,
      notes,
      feedback,
      marketing_consent: marketingConsent,
      instructor_id: user.id,
      is_lesson_ok: isCompleted ? isLessonOk : null,
      is_completed: isCompleted,
      is_cancelled: !isCompleted,
      cancellation_reason: !isCompleted ? cancellationReason.trim() : null,
      completed_task_ids: checkedTasks,
      lesson_id: id,
    };

    if (courseInstanceIdForReport) {
      reportDataToInsert.course_instance_id = courseInstanceIdForReport;
    } else if (lessonScheduleId) {
      reportDataToInsert.lesson_schedule_id = lessonScheduleId;
    }

    const { data: reportData, error: reportError } = await supabase
      .from("lesson_reports")
      .insert(reportDataToInsert)
      .select()
      .single();

    if (reportError) throw reportError;

    console.log("Lesson report created:", reportData);

    // If lesson is cancelled, reschedule it to the next available date
    if (!isCompleted && courseInstanceIdForReport) {
      try {
        const originalDate = selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        
        const rescheduleResult = await rescheduleSpecificLesson(
          courseInstanceIdForReport,
          id,
          originalDate,
          cancellationReason.trim()
        );

        if (rescheduleResult.success) {
          console.log('Lesson rescheduled successfully:', rescheduleResult);
          toast({
            title: "השיעור תוזמן מחדש",
            description: rescheduleResult.message,
          });
        } else {
          console.error('Error rescheduling lesson:', rescheduleResult.error);
          toast({
            title: "שגיאה בתזמון מחדש",
            description: rescheduleResult.message,
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error in rescheduling process:', error);
        toast({
          title: "שגיאה בתזמון מחדש",
          description: "אירעה שגיאה בתזמון מחדש של השיעור",
          variant: "destructive",
        });
      }
    }

    // Create a record in reported_lesson_instances
    const reportedInstanceData = {
      lesson_report_id: reportData.id,
      lesson_id: id,
      scheduled_date: new Date().toISOString().split("T")[0],
      lesson_number: 1,
    };

    if (courseInstanceIdForReport) {
      reportedInstanceData.course_instance_id = courseInstanceIdForReport;
      const { data: lessonData, error: lessonError } = await supabase
        .from("lessons")
        .select("order_index")
        .eq("id", id)
        .single();
      if (lessonError) {
        console.error("Error fetching lesson order_index:", lessonError);
      } else {
        reportedInstanceData.lesson_number = lessonData.order_index + 1;
      }
    } else if (lessonScheduleId) {
      reportedInstanceData.lesson_schedule_id = lessonScheduleId;
    }

    const { error: trackingError } = await supabase
      .from("reported_lesson_instances")
      .insert(reportedInstanceData);

    if (trackingError) {
      console.error(
        "Error creating reported lesson instance record:",
        trackingError
      );
    } else {
      console.log("Reported lesson instance record created");
    }

    // שמירת נתוני נוכחות
    try {
      await saveStudentAttendance(reportData.id, updatedAttendanceList);
      console.log("Attendance saved successfully");
    } catch (attendanceError) {
      console.error("Failed to save attendance:", attendanceError);
      toast({
        title: "אזהרה",
        description: "הדיווח נשמר אך הייתה שגיאה בשמירת הנוכחות",
        variant: "destructive",
      });
    }

    // --- START: EMAIL NOTIFICATIONS ---

    // Calculate attendance percentage
    const attendancePercentage =
      totalStudents > 0 ? (participantsCount / totalStudents) * 100 : 0;

    // Check for low attendance (below 70%)
    if (isCompleted && totalStudents > 0 && attendancePercentage < 70) {
      console.log(
        "Low attendance detected, invoking Edge Function to notify admins..."
      );

      let courseName = "לא ידוע";
      let gradeLevel = "לא ידוע";

      if (lesson?.course_id) {
        const { data: courseData } = await supabase
          .from("courses")
          .select("name")
          .eq("id", lesson.course_id)
          .single();
        if (courseData) courseName = courseData.name;
      }

      if (courseInstanceId) {
        const { data: instanceData } = await supabase
          .from("course_instances")
          .select("grade_level")
          .eq("id", courseInstanceId)
          .single();
        if (instanceData) gradeLevel = instanceData.grade_level;
      }

      const lowAttendancePayload = {
        lessonReportId: reportData.id,
        attendanceCount: participantsCount,
        totalStudents: totalStudents,
        attendancePercentage: attendancePercentage,
        teacherName: user?.user_metadata?.full_name || "מדריך לא ידוע",
        courseName: courseName,
        gradeLevel: gradeLevel,
        lessonTitle: lessonTitle,
        lessonDate: new Date().toLocaleDateString("he-IL"),
      };

      const { error: lowAttendanceFunctionError } =
        await supabase.functions.invoke("notify-admins-low-attendance", {
          body: lowAttendancePayload,
        });

      if (lowAttendanceFunctionError) {
        console.error(
          "Error invoking low attendance notification function:",
          lowAttendanceFunctionError
        );
        toast({
          title: "אזהרה",
          description: "הדיווח נשמר, אך שליחת התראת נוכחות נמוכה נכשלה.",
          variant: "destructive",
        });
      } else {
        console.log(
          "Low attendance notification function invoked successfully."
        );
      }
    }

    // If the lesson was not OK and it actually took place, call feedback notification function
    if (isCompleted && !isLessonOk && feedback.trim()) {
      console.log(
        "Lesson not OK, invoking Edge Function to notify admins..."
      );

      let courseName = "לא ידוע";
      if (lesson?.course_id) {
        const { data: courseData } = await supabase
          .from("courses")
          .select("name")
          .eq("id", lesson.course_id)
          .single();
        if (courseData) courseName = courseData.name;
      }

      const feedbackPayload = {
        courseName: courseName,
        lessonTitle: lessonTitle,
        lessonNumber: reportedInstanceData.lesson_number,
        participantsCount: participantsCount,
        notes: notes,
        feedback: feedback,
        marketingConsent: marketingConsent,
        instructorName: user?.user_metadata?.full_name || "מדריך לא ידוע",
      };

      const { error: feedbackFunctionError } =
        await supabase.functions.invoke("notify-admins-on-feedback", {
          body: feedbackPayload,
        });

      if (feedbackFunctionError) {
        console.error(
          "Error invoking notify-admins function:",
          feedbackFunctionError
        );
        toast({
          title: "אזהרה",
          description: "הדיווח נשמר, אך שליחת ההתראה למנהל נכשלה.",
          variant: "destructive",
        });
      } else {
        console.log("Admin notification function invoked successfully.");
      }
    }

if (isCompleted && checkedTasks.length < lessonTasks.length) {
  console.log(
    "Incomplete tasks detected, invoking Edge Function to notify admins..."
  );

  // Get the incomplete tasks details
  const incompleteTasks = lessonTasks.filter(
    (task) => !checkedTasks.includes(task.id)
  );

  let courseName = "לא ידוע";
  let gradeLevel = "לא ידוע";

  if (lesson?.course_id) {
    const { data: courseData } = await supabase
      .from("courses")
      .select("name")
      .eq("id", lesson.course_id)
      .single();
    if (courseData) courseName = courseData.name;
  }

  if (courseInstanceId) {
    const { data: instanceData } = await supabase
      .from("course_instances")
      .select("grade_level")
      .eq("id", courseInstanceId)
      .single();
    if (instanceData) gradeLevel = instanceData.grade_level;
  }

  const incompleteTasksPayload = {
    lessonReportId: reportData.id,
    courseName: courseName,
    gradeLevel: gradeLevel,
    lessonTitle: lessonTitle,
    lessonNumber: reportedInstanceData.lesson_number,
    teacherName: user?.user_metadata?.full_name || "מדריך לא ידוע",
    lessonDate: new Date().toLocaleDateString("he-IL"),
    completedTasksCount: checkedTasks.length,
    totalTasksCount: lessonTasks.length,
    incompleteTasks: incompleteTasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      is_mandatory: task.is_mandatory,
    })),
    notes: notes,
  };

  const { error: incompleteTasksFunctionError } =
    await supabase.functions.invoke("notify-admins-incomplete-tasks", {
      body: incompleteTasksPayload,
    });

  if (incompleteTasksFunctionError) {
    console.error(
      "Error invoking incomplete tasks notification function:",
      incompleteTasksFunctionError
    );
    toast({
      title: "אזהרה",
      description: "הדיווח נשמר, אך שליחת התראת משימות לא בוצעה נכשלה.",
      variant: "destructive",
    });
  } else {
    console.log(
      "Incomplete tasks notification function invoked successfully."
    );
  }
}
    
    // --- END: EMAIL NOTIFICATIONS ---

    if (files.length > 0) {
      const uploadResults = await Promise.all(
        files.map((file) => uploadFile(file, reportData.id))
      );
      const failed = uploadResults.filter((r) => !r).length;
      if (failed > 0) {
        toast({
          title: "אזהרה",
          description: `${failed} קבצים לא הועלו בהצלחה`,
          variant: "destructive",
        });
      }
    }

    toast({ 
      title: "הצלחה!", 
      description: !isCompleted ? "ביטול השיעור נשמר בהצלחה - השיעורים הבאים יתוזמנו מחדש אוטומטית" : "דיווח השיעור נשמר בהצלחה" 
    });

    // Report work hour only after successful submission
    const { error: workHourError } = await supabase.rpc('report_work_hour');
    
    if (workHourError) {
      console.error('Error reporting work hour:', workHourError);
      toast({
        title: "אזהרה",
        description: "הדיווח נשמר אך הייתה שגיאה בדיווח שעת עבודה",
        variant: "destructive",
      });
    } else {
      console.log('Successfully reported 1 work hour!');
    }

    // Trigger dashboard refresh
    localStorage.setItem("lessonReportUpdated", Date.now().toString());
    window.dispatchEvent(new Event("lessonReportUpdated"));
    
    // Trigger cancellation event if lesson was cancelled
    if (!isCompleted) {
      window.dispatchEvent(new Event('lessonCancelled'));
    }

    // Reset form
    setLessonTitle("");
    setNotes("");
    setFeedback("");
    setFiles([]);
    setCheckedTasks([]);
    setMarketingConsent(false);
    setIsCompleted(true);
    setIsLessonOk(false);
    setCancellationReason("");
    setAttendanceList((prev) =>
      prev.map((student) => ({ ...student, isPresent: false, isNew: false }))
    );
    if (fileInputRef.current) fileInputRef.current.value = "";
    navigate('/calendar', { 
      state: { selectedDate: location.state?.selectedDate || new Date().toISOString() }
    });
  } catch (err) {
    toast({
      title: "שגיאה",
      description: err.message || "אירעה שגיאה בשמירת הדיווח",
      variant: "destructive",
    });
  } finally {
    setIsSubmitting(false);
  }
};

// טען את הנתונים למסננים
useEffect(() => {
  if (!isAdmin) return;

  const fetchFilterData = async () => {
    // טען מדריכים
    const { data: instructorsData } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "instructor")
      .order("full_name");
    
    setInstructors(instructorsData || []);

    // טען קורסים
    const { data: coursesData } = await supabase
      .from("courses")
      .select("id, name")
      .order("name");
    
    setCourses(coursesData || []);

    // טען מוסדות (מתוך course_instances)
    const { data: institutionsData } = await supabase
      .from("educational_institutions")
  .select("id, name")
      .order("name");
    
    // הסר כפילויות
    setInstitutions(institutionsData || []);
  };

  fetchFilterData();
}, [isAdmin]);

// עדכן את פונקציית הסינון
useEffect(() => {
  if (!isAdmin || !allReports.length) return;

  let filtered = [...allReports];

  // סינון לפי תאריכים (קיים)
  if (dateFrom) {
    filtered = filtered.filter(
      (report) => new Date(report.created_at) >= dateFrom
    );
  }

  if (dateTo) {
    const endOfDay = new Date(dateTo);
    endOfDay.setHours(23, 59, 59, 999);
    filtered = filtered.filter(
      (report) => new Date(report.created_at) <= endOfDay
    );
  }

  // סינון לפי חודש
  if (selectedMonth) {
    filtered = filtered.filter((report) => {
      const reportDate = new Date(report.created_at);
      const reportMonth = `${reportDate.getFullYear()}-${String(reportDate.getMonth() + 1).padStart(2, '0')}`;
      return reportMonth === selectedMonth;
    });
  }

  // סינון לפי מדריך
  if (selectedInstructor) {
    filtered = filtered.filter(
      (report) => report.instructor_id === selectedInstructor
    );
  }

  // סינון לפי קורס
  if (selectedCourse) {
    filtered = filtered.filter(
      (report) => report.lessons?.course_id === selectedCourse
    );
  }

  // סינון לפי סטטוס
  if (selectedStatus) {
    filtered = filtered.filter((report) => {
      if (selectedStatus === "completed") return report.is_completed !== false && report.is_lesson_ok;
      if (selectedStatus === "not-ok") return report.is_completed && !report.is_lesson_ok;
      if (selectedStatus === "cancelled") return report.is_completed === false;
      return true;
    });
  }

  // סינון לפי מוסד (צריך לקשר דרך course_instance)
  if (selectedInstitution) {
    filtered = filtered.filter((report) => {
      // נצטרך להוסיף את id ל-query המקורי
      return report.course_instances?.educational_institutions?.id === selectedInstitution;
    });
  }

  setFilteredReports(filtered);
}, [dateFrom, dateTo, selectedMonth, selectedInstructor, selectedCourse, selectedStatus, selectedInstitution, allReports, isAdmin]);

// פונקציה לניקוי כל המסננים
const clearAllFilters = () => {
  setDateFrom(undefined);
  setDateTo(undefined);
  setSelectedMonth("");
  setSelectedInstructor("");
  setSelectedCourse("");
  setSelectedStatus("");
  setSelectedInstitution("");
};



console.log('reports',filteredReports)
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="md:hidden">
        <MobileNavigation />
      </div>
<div className="w-full px-4 my-8  xl:max-w-[98rem] md:max-w-[125rem] xl:mx-auto">  
        {isInstructor ? (
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            דיווח שיעור  {lesson?.order_index+1} - {lesson?.title}
            {!scheduleId && !courseInstanceIdFromUrl && (
              <Badge variant="destructive" className="mr-2 text-xs">
                שגיאה: לא נמצא לוח זמנים
              </Badge>
            )}
          </h1>
        ) : (
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            כלל השיעורים שדווחו{" "}
          </h1>
        )}

        {isInstructor ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Report Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 ml-2" />
                  טופס דיווח
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="lesson-title">נושא השיעור *</Label>
                  <Input
                    id="lesson-title"
                    value={lessonTitle}
                    onChange={(e) => setLessonTitle(e.target.value)}
                    required
                  />
                </div>

                {/* Student Attendance List */}
                <div>
                  <Label className="flex items-center">
                    <UserCheck className="h-4 w-4 ml-2" />
                    רשימת נוכחות תלמידים
                    {!courseInstanceId && (
                      <Badge
                        variant="outline"
                        className="mr-2 text-xs bg-yellow-50 text-yellow-700 border-yellow-200"
                      >
                        טוען...
                      </Badge>
                    )}
                  </Label>

                  {!isCompleted && (
                    <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        ⚠️ השיעור לא התקיים - שדה הנוכחות לא רלוונטי
                      </p>
                    </div>
                  )}

                  {/* Add new student */}
                  <div className="flex gap-2 mb-4">
                    <Input
                      placeholder="הזן שם תלמיד חדש"
                      value={newStudentName}
                      onChange={(e) => setNewStudentName(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleAddStudent()
                      }
                      className="flex-1"
                      disabled={!isCompleted}
                    />
                    <Button
                      type="button"
                      onClick={handleAddStudent}
                      variant="outline"
                      disabled={!isCompleted}
                    >
                      <Plus className="h-4 w-4" />
                      הוסף
                    </Button>
                  </div>
                  {!courseInstanceId && (
                    <div className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded mb-2">
                      ⚠️ אזהרה: נתוני קורס עדיין נטענים. תלמידים חדשים יישמרו
                      ברגע שהנתונים יטענו.
                    </div>
                  )}

                  {/* Attendance list */}
                  <div className="max-h-64 overflow-y-auto border rounded-lg bg-white">
                    {attendanceList.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        {!courseInstanceId
                          ? "טוען נתוני קורס..."
                          : "אין תלמידים ברשימה. הוסף תלמידים חדשים למעלה."}
                      </div>
                    ) : (
                      <div className="divide-y">
                        {attendanceList.map((student) => (
                          <div
                            key={student.id}
                            className="flex items-center justify-between p-3 hover:bg-gray-50"
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={student.isPresent}
                                onChange={() =>
                                  handleTogglePresence(student.id)
                                }
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                disabled={!isCompleted}
                              />
                              <span
                                className={`font-medium ${
                                  student.isPresent
                                    ? "text-green-700"
                                    : "text-gray-700"
                                } ${!isCompleted ? "text-gray-400" : ""}`}
                              >
                                {student.name}
                              </span>
                              {student.isNew && (
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                                >
                                  חדש
                                </Badge>
                              )}
                            </div>
                        
                     {lesson?.order_index+1 ==1 &&  <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveStudent(student.id)}
                              className="text-red-500 hover:text-red-700"
                              disabled={!isCompleted}
                            >
                              <X className="h-4 w-4" />
                            </Button>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Present students counter */}
                  <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded mt-2">
                    נוכחים:{" "}
                    <span className="font-bold text-green-600">
                      {attendanceList.filter((s) => s.isPresent).length}
                    </span>{" "}
                    מתוך {attendanceList.length} תלמידים
                    {maxPar && (
                      <span className="mr-2">(מקסימום: {maxPar})</span>
                    )}
                  </div>
                </div>
                <div>
                  <Label>משימות</Label>
                  {!isCompleted && (
                    <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        ⚠️ השיעור לא התקיים - שדה המשימות לא רלוונטי
                      </p>
                    </div>
                  )}
                  {lessonTasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        checked={checkedTasks.includes(task.id)}
                        onChange={() => handleToggleTask(task.id)}
                        className="w-4 h-4"
                        disabled={!isCompleted}
                      />
                      <label
                        className={`text-sm ${
                          !isCompleted ? "text-gray-400" : ""
                        }`}
                      >
                        {task.title}
                      </label>
                    </div>
                  ))}
                </div>

                <div className="flex items-center ">
                  <input
                    type="checkbox"
                    checked={isCompleted}
                    onChange={() => setIsCompleted(!isCompleted)}
                    className="w-4 h-4"
                  />
                  <label className="text-sm pr-1">האם השיעור התקיים? </label>
                </div>

                {isCompleted && (
                  <div className="flex items-center ">
                    <input
                      type="checkbox"
                      checked={isLessonOk}
                      onChange={() => setIsLessonOk(!isLessonOk)}
                      className="w-4 h-4"
                    />
                    <label className="text-sm pr-1">
                      האם השיעור התנהל כשורה?{" "}
                    </label>
                  </div>
                )}

                {!isCompleted && (
                  <div>
                    <Label htmlFor="cancellation-reason">סיבת הביטול *</Label>
                    <Textarea
                      id="cancellation-reason"
                      value={cancellationReason}
                      onChange={(e) => setCancellationReason(e.target.value)}
                      placeholder="נא לציין את הסיבה לביטול השיעור (טיול, טקס, מחלה וכו')"
                      rows={2}
                      required={!isCompleted}
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="notes">הערות נוספות</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="feedback">משוב כללי</Label>
                  <Textarea
                    id="feedback"
                    value={feedback}
                    required={isCompleted && !isLessonOk}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  <CheckCircle className="h-4 w-4 ml-2" />
                  {isSubmitting ? "שומר..." : "שמור דיווח"}
                </Button>
                {!scheduleId &&
                  !courseInstanceIdFromUrl &&
                  !courseInstanceId && (
                    <p className="text-sm text-yellow-600 text-center mt-2">
                      ⚠️ אזהרה: נתוני קורס עדיין נטענים. הדיווח יישמר ברגע
                      שהנתונים יטענו.
                    </p>
                  )}
              </CardContent>
            </Card>

            {/* File Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Camera className="h-5 w-5 ml-2" />
                  העלאת קבצים
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400"
                  onClick={handleClick}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                >
                  <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">
                    גרור קבצים לכאן או לחץ להעלאה
                  </p>
                  <Button variant="outline" type="button">
                    בחר קבצים
                  </Button>
                  <input
                    type="file"
                    multiple
                    hidden
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*,video/*,.pdf,.doc,.docx"
                  />
                </div>

                {files.length > 0 && (
                  <div className="bg-gray-100 p-3 rounded-lg space-y-2">
                    <h4 className="text-sm font-semibold text-right">
                      קבצים שנבחרו:
                    </h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {files.map((file, index) => (
                        <li
                          key={index}
                          className="flex justify-between items-center"
                        >
                          <span className="truncate">{file.name}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveFile(index)}
                            type="button"
                          >
                            <X className="w-4 h-4 text-red-500" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <Label className="flex items-center justify-end">
                  <input
                    type="checkbox"
                    className="ml-2"
                    checked={marketingConsent}
                    onChange={(e) => setMarketingConsent(e.target.checked)}
                  />
                  אישור להשתמש בתמונות לצרכי שיווק
                </Label>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6 w-full ">
            {/* Date Filter for Admins */}
          {isAdmin && (
  <Card className="border-primary/20 shadow-md">
    <CardHeader className="pb-4">
      <CardTitle className="flex items-center justify-between text-primary">
        <div className="flex items-center">
          <Filter className="h-5 w-5 ml-2" />
          סינונים מתקדמים
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAllFilters}
          className="text-sm"
        >
          נקה הכל
        </Button>
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      {/* שורה ראשונה: תאריכים */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>מתאריך</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-right font-normal"
              >
                <CalendarDays className="ml-2 h-4 w-4" />
                {dateFrom
                  ? format(dateFrom, "dd/MM/yyyy", { locale: he })
                  : "בחר תאריך"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={dateFrom}
                onSelect={setDateFrom}
                locale={he}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <Label>עד תאריך</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-right font-normal"
              >
                <CalendarDays className="ml-2 h-4 w-4" />
                {dateTo
                  ? format(dateTo, "dd/MM/yyyy", { locale: he })
                  : "בחר תאריך"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={dateTo}
                onSelect={setDateTo}
                locale={he}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <Label>חודש</Label>
          <select
            className="w-full h-10 px-3 rounded-md border border-input bg-background"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            <option value="">כל החודשים</option>
            {Array.from({ length: 12 }, (_, i) => {
              const date = new Date();
              date.setMonth(i);
              const monthValue = `${date.getFullYear()}-${String(i + 1).padStart(2, '0')}`;
              return (
                <option key={monthValue} value={monthValue}>
                  {date.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* שורה שנייה: מדריכים וקורסים */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>מדריך</Label>
          <select
            className="w-full h-10 px-3 rounded-md border border-input bg-background"
            value={selectedInstructor}
            onChange={(e) => setSelectedInstructor(e.target.value)}
          >
            <option value="">כל המדריכים</option>
            {instructors.map((instructor) => (
              <option key={instructor.id} value={instructor.id}>
                {instructor.full_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label>קורס</Label>
          <select
            className="w-full h-10 px-3 rounded-md border border-input bg-background"
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
          >
            <option value="">כל הקורסים</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* שורה שלישית: סטטוס ומוסד */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>סטטוס שיעור</Label>
          <select
            className="w-full h-10 px-3 rounded-md border border-input bg-background"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="">כל הסטטוסים</option>
            <option value="completed">דווח (התנהל כשורה)</option>
            <option value="not-ok">לא התנהל כשורה</option>
            <option value="cancelled">לא התקיים</option>
          </select>
        </div>

        <div>
          <Label>מוסד חינוך</Label>
          <select
            className="w-full h-10 px-3 rounded-md border border-input bg-background"
            value={selectedInstitution}
            onChange={(e) => setSelectedInstitution(e.target.value)}
          >
            <option value="">כל המוסדות</option>
            {institutions.map((institution) => (
              <option key={institution.id} value={institution.id}>
                {institution.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* סיכום סינון */}
      {(dateFrom || dateTo || selectedMonth || selectedInstructor || selectedCourse || selectedStatus || selectedInstitution) && (
        <div className="mt-4 p-3 bg-primary/5 rounded-lg">
          <p className="text-sm text-primary font-medium">
            מציג {filteredReports.length} דיווחים מתוך {allReports.length}
          </p>
        </div>
      )}
    </CardContent>
  </Card>
)}

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">טוען דיווחים...</p>
              </div>
            ) : allReports.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground  mb-4" />
                  <p className="text-muted-foreground">אין דיווחים זמינים</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border/50 shadow-lg">
      <CardHeader className="border-b border-border/50 bg-muted/10">
        <CardTitle className="flex items-center text-primary">
          <FileText className="h-5 w-5 ml-2" />
          כל הדיווחים ({isAdmin ? filteredReports.length : allReports.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Desktop: No scroll, full width */}
        <div className="md:block w-full">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary/5 border-b-2 border-primary/20 hover:bg-primary/10">
                <TableHead className="font-bold text-primary py-3 px-4 text-right text-sm">שיעור מס'</TableHead>
                <TableHead className="font-bold text-primary py-3 px-4 text-right text-sm">כותרת השיעור</TableHead>
                <TableHead className="font-bold text-primary py-3 px-4 text-right text-sm">קורס</TableHead>
                <TableHead className="font-bold text-primary py-3 px-4 text-right text-sm">מדריך</TableHead>
                <TableHead className="font-bold text-primary py-3 px-4 text-right text-sm">נוכחות</TableHead>
                <TableHead className="font-bold text-primary py-3 px-4 text-right text-sm">רשימת תלמידים</TableHead>
                <TableHead className="font-bold text-primary py-3 px-4 text-right text-sm">משימות שבוצעו</TableHead>
                <TableHead className="font-bold text-primary py-3 px-4 text-right text-sm">תאריך</TableHead>
                <TableHead className="font-bold text-primary py-3 px-4 text-right text-sm">מוסד</TableHead>
                <TableHead className="font-bold text-primary py-3 px-4 text-right text-sm">התנהל כשורה</TableHead>
                <TableHead className="font-bold text-primary py-3 px-4 text-right text-sm">סטטוס שיעור</TableHead>
                <TableHead className="font-bold text-primary py-3 px-4 text-right text-sm">משוב</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                        {(isAdmin ? filteredReports : allReports).map(
                          (report, index) => (
                           
                            <React.Fragment key={report.id}>
                              <TableRow
                                className={`hover:bg-primary/5 transition-all duration-200 border-b border-border/30
                                                            ${
                                                              index % 2 === 0
                                                                ? "bg-background"
                                                                : "bg-muted/20"
                                                            }
                                                            `}
                              >
                                <TableCell className="font-medium py-4 px-6">
                                  <div className="font-bold text-foreground text-base">
                                    {report.reported_lesson_instances?.[0]
                                      ?.lesson_number || "N/A"}
                                  </div>
                                </TableCell>
                                <TableCell className="font-medium py-4 px-6">
                                  <div className="font-bold text-foreground text-base">
                                    {report.lesson_title}
                                  </div>
                                </TableCell>
                                <TableCell className="py-4 ml-4">
                                  <Badge
                                    variant="outline"
                                    className="font-medium border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 p-4"
                                  >
                                    {report.lessons?.courses?.name || "לא זמין"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="py-4">
                                  <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-primary/10 rounded-full">
                                      <User className="h-4 w-4 text-primary" />
                                    </div>
                                    <span className="font-medium text-foreground">
                                      {report.instructor?.full_name ||
                                        "לא זמין"}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="py-4 px-6">
                                  <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-accent/20 rounded-full">
                                      <Users className="h-4 w-4 text-accent-foreground" />
                                    </div>
                                    <span className="font-bold text-lg">
                                      {report.participants_count || 0}
                                      <span className="text-sm font-normal text-muted-foreground">
                                        {" "}
                                        מתוך {report.totalStudents || 0}
                                      </span>
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="py-4 px-6">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      toggleRowExpansion(report.id)
                                    }
                                    className="flex items-center gap-1 hover:bg-primary/10"
                                  >
                                    <Users className="h-4 w-4" />
                                    <span>הצג רשימה</span>
                                    {expandedRows.has(report.id) ? (
                                      <ChevronUp className="h-3 w-3" />
                                    ) : (
                                      <ChevronDown className="h-3 w-3" />
                                    )}
                                  </Button>
                                </TableCell>
                                <TableCell className="py-4 px-6">
                                  <div className="space-y-1">
                                    {report.lessons?.lesson_tasks &&
                                    report.lessons.lesson_tasks.length > 0 ? (
                                      <div className="flex items-center gap-3">
                                        <Badge
                                          variant="secondary"
                                          className="text-sm font-medium bg-secondary/80 text-secondary-foreground px-3 py-1"
                                        >
                                          {report.completed_task_ids?.length ||
                                            0}{" "}
                                          מתוך{" "}
                                          {report.lessons.lesson_tasks.length}
                                        </Badge>
                                        <div className="p-1 bg-emerald-100 rounded-full">
                                          <CheckCircle className="h-4 w-4 text-emerald-600" />
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex items-center text-muted-foreground">
                                        <span className="text-sm font-medium">
                                          אין משימות
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="py-4 px-6">
                                  <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-muted rounded-full">
                                      <Calendar className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <span className="text-sm font-medium text-foreground">
                                      {new Date(
                                        report.created_at
                                      ).toLocaleDateString("he-IL")}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="py-4 px-6">
                                  {report?.course_instances?.educational_institutions?.name ? (
                                    <Badge
                                      variant="default"
                                      className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 font-medium p-4"
                                    >
          {report.course_instances.educational_institutions.name}     
                               </Badge>
                                  ) : (
                                    <Badge
                                      variant="outline"
                                      className="text-muted-foreground"
                                    >
                                        לא זמין
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell className="px-12">
                                  {report.is_lesson_ok ? (
                                    <Badge
                                      variant="default"
                                      className="bg-green-100 text-green-800 hover:bg-green-200"
                                    >
                                      כן
                                    </Badge>
                                  ) : (
                                    <Badge
                                      variant="outline"
                                      className="text-muted-foreground bg-red-100 hover:bg-red-200"
                                    >
                                      לא
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell className="px-6">
                                  {report.is_completed === false ? (
                                    <Badge
                                      variant="outline"
                                      className="bg-orange-100 text-white border-orange-200 hover:bg-orange-200"
                                      style={{
                                        backgroundColor: "#FFA500",
                                        color: "white",
                                      }}
                                    >
                                      לא התקיים
                                    </Badge>
                                  ) : !report.is_lesson_ok ? (
                                    <Badge
                                      variant="outline"
                                      className="bg-red-100 text-white border-red-200 hover:bg-red-200"
                                      style={{
                                        backgroundColor: "#FF0000",
                                        color: "white",
                                      }}
                                    >
                                      לא התנהל כשורה
                                    </Badge>
                                  ) : (
                                    <Badge
                                      variant="default"
                                      className="bg-green-100 text-green-800 hover:bg-green-200"
                                    >
                                      דווח
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="hover:bg-primary hover:text-primary-foreground transition-colors"
                                    onClick={() => {
                                      setSelectedReport(report);
                                      setDialogOpen(true);
                                    }}
                                  >
                                    <Eye className="h-3 w-3 " />
                                    צפה במשוב
                                  </Button>
                                </TableCell>
                              </TableRow>
                              {/* Expandable row for attendance details */}
                              {expandedRows.has(report.id) && (
                                <TableRow>
                                  <TableCell
                                    colSpan={11}
                                    className="bg-gray-50 p-4"
                                  >
                                    <div className="grid grid-cols-2 gap-6">
                                      <div>
                                        <h4 className="font-semibold text-green-700 mb-2 flex items-center">
                                          <CheckCircle className="h-4 w-4 ml-1" />
                                          נוכחים (
                                          {report.attendanceData?.filter(
                                            (s) => s.attended
                                          ).length || 0}
                                          )
                                        </h4>
                                        <div className="space-y-1">
                                          {report.attendanceData
                                            ?.filter((s) => s.attended)
                                            .map((student) => (
                                              <div
                                                key={student.id}
                                                className="text-sm text-gray-700 flex items-center"
                                              >
                                                <span className="w-2 h-2 bg-green-500 rounded-full ml-2"></span>
                                                {student.name}
                                              </div>
                                            )) || (
                                            <span className="text-gray-500">
                                              אין נתונים
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <div>
                                        <h4 className="font-semibold text-red-700 mb-2 flex items-center">
                                          <X className="h-4 w-4 ml-1" />
                                          נעדרים (
                                          {report.attendanceData?.filter(
                                            (s) => !s.attended
                                          ).length || 0}
                                          )
                                        </h4>
                                        <div className="space-y-1">
                                          {report.attendanceData
                                            ?.filter((s) => !s.attended)
                                            .map((student) => (
                                              <div
                                                key={student.id}
                                                className="text-sm text-gray-700 flex items-center"
                                              >
                                                <span className="w-2 h-2 bg-red-500 rounded-full ml-2"></span>
                                                {student.name}
                                              </div>
                                            )) || (
                                            <span className="text-gray-500">
                                              אין נתונים
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </React.Fragment>
                          )
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
      <FeedbackDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        report={selectedReport}
      />
    </div>
  );
};

export default LessonReport;
