// import React, { useState, useEffect } from "react";
// import { Button } from "@/components/ui/button";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Label } from "@/components/ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Input } from "@/components/ui/input";
// import { Calendar } from "@/components/ui/calendar";
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "@/components/ui/popover";
// import { CalendarIcon, Settings, BookOpen } from "lucide-react";
// import { Checkbox } from "@/components/ui/checkbox";
// import { useToast } from "@/components/ui/use-toast";
// import { supabase } from "@/integrations/supabase/client";
// import type { Json } from "@/integrations/supabase/types";
// import { Badge } from "@/components/ui/badge";
// import CourseLessonsSection, { Lesson } from "./course/CourseLessonsSection";

// interface Institution {
//   id: string;
//   name: string;
// }

// interface Instructor {
//   id: string;
//   full_name: string;
// }

// interface TimeSlot {
//   day: number;
//   start_time: string;
//   end_time: string;
//   [key: string]: Json | undefined;
// }

// interface CourseInstanceSchedule {
//   days_of_week: number[];
//   time_slots: TimeSlot[];
//   total_lessons?: number;
//   lesson_duration_minutes?: number;
// }

// interface EditData {
//   instance_id: string;
//   name: string;
//   grade_level: string;
//   max_participants: number;
//   price_for_customer: number;
//   price_for_instructor: number;
//   institution_name: string;
//   instructor_name: string;
//   start_date: string;
//   approx_end_date: string;
// }

// // Utility function to combine class names
// const cn = (...classes: (string | undefined | null | boolean)[]) => {
//   return classes.filter(Boolean).join(' ');
// };

// // Date formatting function
// const formatDate = (date: Date, formatString: string) => {
//   const day = date.getDate().toString().padStart(2, '0');
//   const month = (date.getMonth() + 1).toString().padStart(2, '0');
//   const year = date.getFullYear();
  
//   if (formatString === "dd/MM/yyyy") {
//     return `${day}/${month}/${year}`;
//   }
//   if (formatString === "dd/MM") {
//     return `${day}/${month}`;
//   }
//   return date.toLocaleDateString();
// };

// interface CourseAssignDialogProps {
//   open: boolean;
//   onOpenChange: (open: boolean) => void;
//   mode?: 'create' | 'edit';
//   courseId?: string;
//   courseName?: string;
//   instanceId?: string;
//   editData?: EditData;
//   onAssignmentComplete: () => void;
// }

// const CourseAssignDialog = ({
//   open,
//   onOpenChange,
//   mode = 'create',
//   courseId,
//   courseName,
//   instanceId,
//   editData,
//   onAssignmentComplete,
// }: CourseAssignDialogProps) => {
//   const { toast } = useToast();
//   const [institutions, setInstitutions] = useState<Institution[]>([]);
//   const [instructors, setInstructors] = useState<Instructor[]>([]);
//   const [lessons, setLessons] = useState<any>([]);
//   const [loading, setLoading] = useState(false);
//   const [step, setStep] = useState(1);
//   const [formData, setFormData] = useState({
//     institution_id: "",
//     instructor_id: "",
//     grade_level: "",
//     price_for_customer: "",
//     price_for_instructor: "",
//     max_participants: "",
//     start_date: "",
//     end_date: "",
//   });

//   // הוספת state עבור הפופאפ החדש של שיעורים ייחודיים
//   const [showCustomLessonsDialog, setShowCustomLessonsDialog] = useState(false);
//   const [templateLessons, setTemplateLessons] = useState<Lesson[]>([]);
//   const [instanceLessons, setInstanceLessons] = useState<Lesson[]>([]);
//   const [hasCustomLessons, setHasCustomLessons] = useState(false);

//   // New schedule state
//   const [courseSchedule, setCourseSchedule] = useState<CourseInstanceSchedule>({
//     days_of_week: [],
//     time_slots: [],
//     total_lessons: 1,
//     lesson_duration_minutes: 60,
//   });

//   const dayNames = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

//   // Helper function to find institution/instructor ID by name
//   const findIdByName = (items: any[], name: string) => {
//     const item = items.find(item => 
//       item.name === name || item.full_name === name
//     );
//     return item?.id || "";
//   };

//   // Reset form when dialog opens
//   // const getInitialState  = () => {
//   //   setFormData({
//   //     institution_id: "",
//   //     instructor_id: "",
//   //     grade_level: "",
//   //     price_for_customer: "",
//   //     price_for_instructor: "",
//   //     max_participants: "",
//   //     start_date: "",
//   //     end_date: "",
//   //   });
//   //   setCourseSchedule({
//   //     days_of_week: [],
//   //     time_slots: [],
//   //     total_lessons: 1,
//   //     lesson_duration_minutes: 60,
//   //   });
//   //   setStep(1);
//   //   // איפוס המצב של השיעורים הייחודיים
//   //   setInstanceLessons([]);
//   //   setHasCustomLessons(false);
//   // };
//   // החלף את הפונקציה הקיימת בזו
// const getInitialState = () => ({
//   formData: {
//     institution_id: "",
//     instructor_id: "",
//     grade_level: "",
//     price_for_customer: "",
//     price_for_instructor: "",
//     max_participants: "",
//     start_date: "",
//     end_date: "",
//   },
//   courseSchedule: {
//     days_of_week: [],
//     time_slots: [],
//     total_lessons: 1,
//     lesson_duration_minutes: 60,
//   },
//   instanceLessons: [],
//   hasCustomLessons: false,
// });

//   // useEffect(() => {
//   //   if (open) {
//   //     fetchInstitutions();
//   //     fetchInstructors();
      
//   //     if (mode === 'create') {
//   //      getInitialState();
//   //       if (courseId) {
//   //         fetchCourseLessons();
//   //         fetchTemplateLessons(); // טעינת שיעורי התבנית
//   //       }
//   //     } else if (mode === 'edit') {
//   //       setStep(1);
//   //       fetchExistingSchedule();
//   //       if (courseId) {
//   //         fetchTemplateLessons();
//   //         loadInstanceLessons(); // טעינת שיעורים ייחודיים קיימים
//   //       }
//   //     }
//   //   }
//   // }, [open, courseId, mode, editData]);

//   // Populate form data when institutions/instructors are loaded and editData is available
  
  
  
  
//   // useEffect(() => {
//   //   if (mode === 'edit' && editData && institutions.length > 0 && instructors.length > 0) {
//   //     const institutionId = findIdByName(institutions, editData.institution_name);
//   //     const instructorId = findIdByName(instructors, editData.instructor_name);
      
//   //     const newFormData = {
//   //       institution_id: institutionId,
//   //       instructor_id: instructorId,
//   //       grade_level: editData.grade_level,
//   //       price_for_customer: editData.price_for_customer.toString(),
//   //       price_for_instructor: editData.price_for_instructor.toString(),
//   //       max_participants: editData.max_participants.toString(),
//   //       start_date: editData.start_date || "",
//   //       end_date: editData.approx_end_date || "",
//   //     };
      
//   //     setFormData(newFormData);
//   //   }
//   // }, [mode, editData, institutions, instructors]);


// // הדבק את שלושתם במקום שני הישנים

// // useEffect 1: איפוס כללי וטעינת נתונים בסיסיים עם פתיחת הדיאלוג
// useEffect(() => {
//   if (open) {
//     // איפוס מלא של כל ה-state למצב ההתחלתי
//     const initialState = getInitialState();
//     setFormData(initialState.formData);
//     setCourseSchedule(initialState.courseSchedule);
//     setInstanceLessons(initialState.instanceLessons);
//     setHasCustomLessons(initialState.hasCustomLessons);
//     setStep(1);

//     // טעינת נתונים שלא תלויים בשום דבר אחר
//     fetchInstitutions();
//     fetchInstructors();

//     // טעינת שיעורי תבנית אם יש courseId
//     if (courseId) {
//       fetchTemplateLessons();
//     }
//   }
// }, [open, courseId]); // התלויות כאן בכוונה מצומצמות

// // useEffect 2: טעינת שיעורי הקורס הכלליים (תלוי ב-templateLessons)
// useEffect(() => {
//   if (open && mode === 'create') {
//      // מעדכנים את מספר השיעורים רק לאחר ששיעורי התבנית נטענו
//      setLessons(templateLessons);
//      setCourseSchedule(prev => ({
//         ...prev,
//         total_lessons: templateLessons.length || 1,
//      }));
//   }
// }, [templateLessons, open, mode]);




// useEffect(() => {
//   console.log("מספר השיעורים הייחודיים התעדכן:", instanceLessons.length);
// }, [instanceLessons]);

// useEffect(() => {
//   if (open && mode === 'edit' && editData && institutions.length > 0 && instructors.length > 0) {
//     const institutionId = findIdByName(institutions, editData.institution_name);
//     const instructorId = findIdByName(instructors, editData.instructor_name);
    
//     setFormData({
//       institution_id: institutionId,
//       instructor_id: instructorId,
//       grade_level: editData.grade_level,
//       price_for_customer: editData.price_for_customer.toString(),
//       price_for_instructor: editData.price_for_instructor.toString(),
//       max_participants: editData.max_participants.toString(),
//       start_date: editData.start_date || "",
//       end_date: editData.approx_end_date || "",
//     });

//     // טעינת הנתונים הספציפיים למצב עריכה
//     fetchExistingSchedule();
//     if (instanceId || editData?.instance_id) {
//        loadInstanceLessons();
//     }
//   }
// }, [open, mode, editData, institutions, instructors]);



// const handleInstanceLessonsChange = (newLessons: Lesson[]) => {
//   // החלק הקריטי: יצירת מערך חדש לגמרי מהשיעורים שהתקבלו
//   // ה- ... הוא מה שמבטיח שזה עותק חדש ולא אותו אחד ישן
//   setInstanceLessons([...newLessons]);
// };
//   // טעינת שיעורי תבנית
//   const fetchTemplateLessons = async () => {
//     if (!courseId) return;

//     try {
//       const { data: lessons, error } = await supabase
//         .from('lessons')
//         .select(`
//           id,
//           title,
//           description,
//           order_index,
//           lesson_tasks (
//             id,
//             title,
//             description,
//             estimated_duration,
//             is_mandatory,
//             order_index
//           )
//         `)
//         .eq('course_id', courseId)
//         .is('course_instance_id', null) // רק שיעורי תבנית
//         .order('order_index');

//       if (error) {
//         console.error('Error loading template lessons:', error);
//         return;
//       }

//       const formattedLessons = lessons?.map(lesson => ({
//         id: lesson.id,
//         title: lesson.title,
//         description: lesson.description || '',
//         order_index: lesson.order_index,
//         tasks: lesson.lesson_tasks?.map(task => ({
//           id: task.id,
//           title: task.title,
//           description: task.description,
//           estimated_duration: task.estimated_duration,
//           is_mandatory: task.is_mandatory,
//           order_index: task.order_index
//         })).sort((a, b) => a.order_index - b.order_index) || []
//       })) || [];

//       setTemplateLessons(formattedLessons);
//     } catch (error) {
//       console.error('Error fetching template lessons:', error);
//     }
//   };

//   // טעינת שיעורים ייחודיים קיימים להקצאה
//   const loadInstanceLessons = async () => {
//     if (!instanceId && !editData?.instance_id) return;

//     const actualInstanceId = instanceId || editData?.instance_id;

//     try {
//       const { data: lessons, error } = await supabase
//         .from('lessons')
//         .select(`
//           id,
//           title,
//           description,
//           order_index,
//           lesson_tasks (
//             id,
//             title,
//             description,
//             estimated_duration,
//             is_mandatory,
//             order_index
//           )
//         `)
//         .eq('course_instance_id', actualInstanceId)
//         .order('order_index');

//       if (error) {
//         console.error('Error loading instance lessons:', error);
//         setHasCustomLessons(false);
//         return;
//       }

//       if (lessons && lessons.length > 0) {
//         const formattedLessons = lessons.map(lesson => ({
//           id: lesson.id,
//           title: lesson.title,
//           description: lesson.description || '',
//           order_index: lesson.order_index,
//           tasks: lesson.lesson_tasks?.map(task => ({
//             id: task.id,
//             title: task.title,
//             description: task.description,
//             estimated_duration: task.estimated_duration,
//             is_mandatory: task.is_mandatory,
//             order_index: task.order_index
//           })).sort((a, b) => a.order_index - b.order_index) || []
//         }));

//         setInstanceLessons(formattedLessons);
//         setHasCustomLessons(true);
//       } else {
//         setInstanceLessons([]);
//         setHasCustomLessons(false);
//       }
//     } catch (error) {
//       console.error('Error loading instance lessons:', error);
//       setHasCustomLessons(false);
//     }
//   };

//   // התחלת יצירה מאפס - ללא העתקה מתבנית
// const startFromScratch = () => {
//   setInstanceLessons([]);
//   setHasCustomLessons(true);
  
//   toast({
//     title: "התחלה חדשה",
//     description: "כעת תוכל ליצור שיעורים ייחודיים מאפס",
//     variant: "default"
//   });
// };
//   // העתקת שיעורי תבנית כנקודת התחלה
//   const copyTemplateLessonsToInstance = () => {
//     if (templateLessons.length === 0) {
//       toast({
//         title: "הודעה",
//         description: "אין שיעורי תבנית להעתקה",
//         variant: "default"
//       });
//       return;
//     }

//     const copiedLessons = templateLessons.map(lesson => ({
//       ...lesson,
//       id: `instance-lesson-${Date.now()}-${Math.random()}`,
//       tasks: lesson.tasks.map(task => ({
//         ...task,
//         id: `instance-task-${Date.now()}-${Math.random()}`
//       }))
//     }));
    
//     setInstanceLessons(copiedLessons);
//     setHasCustomLessons(true);
    
//     toast({
//       title: "הצלחה",
//       description: "שיעורי התבנית הועתקו בהצלחה",
//       variant: "default"
//     });
//   };

//   // איפוס השיעורים הייחודיים
//   const resetInstanceLessons = () => {
//     setInstanceLessons([]);
//     setHasCustomLessons(false);
    
//     toast({
//       title: "אופס",
//       description: "השיעורים הייחודיים נמחקו",
//       variant: "default"
//     });
//   };

//   // שמירת השיעורים הייחודיים בבסיס הנתונים
// // שמירת השיעורים הייחודיים בבסיס הנתונים
// const saveInstanceLessons = async (assignmentInstanceId: string) => {
//   // אם אין שיעורים ייחודיים, אין מה לשמור.
//   if (!hasCustomLessons) {
//      // חשוב: אם המשתמש חוזר להשתמש בתבנית, נמחק את השיעורים הייחודיים הקיימים.
//     const { error: deleteError } = await supabase
//       .from('lessons')
//       .delete()
//       .eq('course_instance_id', assignmentInstanceId);
//       if (deleteError) console.error("Error deleting custom lessons on reset:", deleteError);
//     return;
//   }
  
//   // אם יש שיעורים ייחודיים אבל הרשימה ריקה, נמחק אותם מה-DB.
//   if (hasCustomLessons && instanceLessons.length === 0) {
//       const { error: deleteError } = await supabase
//       .from('lessons')
//       .delete()
//       .eq('course_instance_id', assignmentInstanceId);
//       if (deleteError) console.error("Error deleting all custom lessons:", deleteError);
//     return;
//   }

//   try {
//     // שלב 1: מחיקת שיעורים וקישורים ישנים כדי למנוע כפילויות
//     const { error: deleteError } = await supabase
//       .from('lessons')
//       .delete()
//       .eq('course_instance_id', assignmentInstanceId);

//     if (deleteError) throw deleteError;

//     // שלב 2: שליפת תבנית התזמון העדכנית מה-DB
//     const { data: scheduleData, error: scheduleError } = await supabase
//       .from('course_instance_schedules')
//       .select('*')
//       .eq('course_instance_id', assignmentInstanceId)
//       .single();

//     if (scheduleError || !scheduleData) {
//       throw new Error("Schedule pattern not found for this instance.");
//     }
    
//     // =================================================================
//     //  >>>>> לוגיקת התזמון החדשה <<<<<
//     // =================================================================
//     let lessonDates: { start: string; end: string }[] = [];
//     const timeSlots = (scheduleData.time_slots as any[]) || [];

//     if (timeSlots.length > 0) {
//       // שלב 3: מיון הימים והשעות כדי לקבל סדר כרונולוגי שבועי
//       const sortedSlots = timeSlots.sort((a, b) => {
//         if (a.day !== b.day) return a.day - b.day;
//         return a.start_time.localeCompare(b.start_time);
//       });

//       // שלב 4: יצירת רשימת תאריכים לכל השיעורים
//       for (let i = 0; i < instanceLessons.length; i++) {
//         const slotIndex = i % sortedSlots.length;
//         const weekOffset = Math.floor(i / sortedSlots.length);
//         const currentSlot = sortedSlots[slotIndex];

//         // ודא שיש לנו את כל הנתונים הדרושים
//         if (!currentSlot.first_lesson_date || !currentSlot.start_time || !currentSlot.end_time) {
//           console.warn("Skipping lesson due to incomplete slot data:", currentSlot);
//           continue;
//         }

//         const baseDate = new Date(currentSlot.first_lesson_date);
        
//         // הוסף את מספר השבועות המתאים לתאריך הבסיס
//         const lessonDate = new Date(baseDate.setDate(baseDate.getDate() + weekOffset * 7));
        
//         const scheduledStart = `${lessonDate.toISOString().split('T')[0]}T${currentSlot.start_time}:00`;
//         const scheduledEnd = `${lessonDate.toISOString().split('T')[0]}T${currentSlot.end_time}:00`;

//         lessonDates.push({ start: scheduledStart, end: scheduledEnd });
//       }
//     }
//     // =================================================================
//     //  >>>>> סוף לוגיקת התזמון החדשה <<<<<
//     // =================================================================

//     // שלב 5: הכנסת השיעורים החדשים עם התאריכים המחושבים
//     const lessonsToInsert = instanceLessons.map((lesson, index) => ({
//       course_id: courseId,
//       course_instance_id: assignmentInstanceId,
//       title: lesson.title,
//       description: lesson.description,
//       order_index: index, // ודא סדר נכון
//       // השתמש בתאריכים שחישבנו, עם תאריך ברירת מחדל אם התזמון נכשל
//       scheduled_start: lessonDates[index]?.start || new Date().toISOString(),
//       scheduled_end: lessonDates[index]?.end || new Date().toISOString(),
//       status: 'scheduled'
//     }));
    
//     const { data: savedLessons, error: lessonError } = await supabase
//         .from('lessons')
//         .insert(lessonsToInsert)
//         .select('id, order_index');

//     if (lessonError) throw lessonError;

//     // שלב 6: הכנסת המשימות המשויכות לשיעורים החדשים
//     const tasksToInsert: any[] = [];
//     instanceLessons.forEach((lesson, lessonIndex) => {
//       const savedLesson = savedLessons?.find(sl => sl.order_index === lessonIndex);
//       if (savedLesson && lesson.tasks.length > 0) {
//         lesson.tasks.forEach((task, taskIndex) => {
//             tasksToInsert.push({
//                 lesson_id: savedLesson.id,
//                 title: task.title,
//                 description: task.description,
//                 estimated_duration: task.estimated_duration,
//                 is_mandatory: task.is_mandatory,
//                 order_index: taskIndex // ודא סדר נכון
//             });
//         });
//       }
//     });

//     if (tasksToInsert.length > 0) {
//         const { error: tasksError } = await supabase
//             .from('lesson_tasks')
//             .insert(tasksToInsert);
//         if (tasksError) throw tasksError;
//     }


//     // שלב 7: עדכון מספר השיעורים הכולל בלוח הזמנים
//     const { error: updateScheduleError } = await supabase
//       .from('course_instance_schedules')
//       .update({ total_lessons: instanceLessons.length })
//       .eq('course_instance_id', assignmentInstanceId);

//     if (updateScheduleError) {
//         console.error('Error updating schedule total lessons:', updateScheduleError);
//     }

//   } catch (error) {
//     console.error('Error saving instance lessons:', error);
//     toast({
//         title: "שגיאה קריטית",
//         description: "לא ניתן היה לשמור את השיעורים הייחודיים.",
//         variant: "destructive",
//     });
//     throw error;
//   }
// };

//   const fetchInstitutions = async () => {
//     try {
//       const { data, error } = await supabase
//         .from("educational_institutions")
//         .select("id, name")
//         .order("name");

//       if (error) throw error;
//       setInstitutions(data || []);
//     } catch (error) {
//       console.error("Error fetching institutions:", error);
//       toast({
//         title: "שגיאה",
//         description: "לא ניתן לטעון את רשימת המוסדות",
//         variant: "destructive",
//       });
//     }
//   };

//   const fetchInstructors = async () => {
//     try {
//       const { data, error } = await supabase
//         .from("profiles")
//         .select("id, full_name")
//         .eq("role", "instructor")
//         .order("full_name");

//       if (error) throw error;
//       setInstructors(data || []);
//     } catch (error) {
//       console.error("Error fetching instructors:", error);
//       toast({
//         title: "שגיאה",
//         description: "לא ניתן לטעון את רשימת המדריכים",
//         variant: "destructive",
//       });
//     }
//   };

//   const fetchCourseLessons = async () => {
//     if (!courseId) return;
    
//     try {
//       const { data, error } = await supabase
//         .from("lessons")
//       .select("id, title, order_index, lesson_tasks (id, title, description, estimated_duration, is_mandatory, order_index)")
//           .eq("course_id", courseId)
//         .order("order_index");

//       if (error) throw error;
      
//       const lessonsWithTasks = (data || []).map(lesson => ({
//         ...lesson,
//         tasks: lesson.lesson_tasks || []
//       }));
      
//       setLessons(lessonsWithTasks);
      
//       setCourseSchedule(prev => ({
//         ...prev,
//         total_lessons: lessonsWithTasks.length || 1
//       }));
//     } catch (error) {
//       console.error("Error fetching lessons:", error);
//       toast({
//         title: "שגיאה",
//         description: "לא ניתן לטעון את רשימת השיעורים",
//         variant: "destructive",
//       });
//     }
//   };

//   const fetchExistingSchedule = async () => {
//     if (!editData?.instance_id) return;
    
//     try {
//       const { data: instanceData, error: instanceError } = await supabase
//         .from("course_instances")
//         .select("course_id")
//         .eq("id", editData.instance_id)
//         .single();

//       if (instanceError) throw instanceError;

//       if (instanceData?.course_id) {
//         const { data: lessonsData, error: lessonsError } = await supabase
//           .from("lessons")
//           .select("id, title, order_index, lesson_tasks (id, title, description, estimated_duration, is_mandatory, order_index)")
//           .eq("course_id", instanceData.course_id)
//           .order("order_index");

//         if (!lessonsError && lessonsData) {
//           const lessonsWithTasks = lessonsData.map(lesson => ({
//             ...lesson,
//             tasks: lesson.lesson_tasks || []
//           }));
//           setLessons(lessonsWithTasks);
//         }
//       }

//       const { data: scheduleData, error: scheduleError } = await supabase
//         .from("course_instance_schedules")
//         .select("*")
//         .eq("course_instance_id", editData.instance_id)
//         .single();

//       if (scheduleData && !scheduleError) {
//         setCourseSchedule({
//           days_of_week: scheduleData.days_of_week || [],
//           time_slots: (scheduleData.time_slots as TimeSlot[]) || [],
//           total_lessons: scheduleData.total_lessons || 1,
//           lesson_duration_minutes: scheduleData.lesson_duration_minutes || 60,
//         });
//       } else {
//         const { data: legacySchedules, error: legacyError } = await supabase
//           .from("lesson_schedules")
//           .select("*")
//           .eq("course_instance_id", editData.instance_id);

//         if (legacySchedules && !legacyError && legacySchedules.length > 0) {
//           const daysOfWeek = [...new Set(legacySchedules.map(s => new Date(s.scheduled_start!).getDay()))];
//           const timeSlots: TimeSlot[] = daysOfWeek.map(day => {
//             const scheduleForDay = legacySchedules.find(s => new Date(s.scheduled_start!).getDay() === day);
//             return {
//               day,
//               start_time: scheduleForDay ? new Date(scheduleForDay.scheduled_start!).toTimeString().slice(0, 5) : "",
//               end_time: scheduleForDay ? new Date(scheduleForDay.scheduled_end!).toTimeString().slice(0, 5) : "",
//             };
//           });

//           setCourseSchedule({
//             days_of_week: daysOfWeek,
//             time_slots: timeSlots,
//             total_lessons: legacySchedules.length,
//             lesson_duration_minutes: 60,
//           });
//         }
//       }
//     } catch (error) {
//       console.error("Error fetching existing schedule:", error);
//       toast({
//         title: "שגיאה",
//         description: "לא ניתן לטעון את לוח הזמנים הקיים",
//         variant: "destructive",
//       });
//     }
//   };

//   const handleCourseAssignment = async (): Promise<string | null> => {
//     try {
//       console.log('formDATA', formData);
//       if (mode === 'create') {
//         const { data, error } = await supabase
//           .from("course_instances")
//           .insert([
//             {
//               course_id: courseId,
//               institution_id: formData.institution_id,
//               instructor_id: formData.instructor_id,
//               grade_level: formData.grade_level,
//               max_participants: parseInt(formData.max_participants),
//               price_for_customer: parseFloat(formData.price_for_customer),
//               price_for_instructor: parseFloat(formData.price_for_instructor),
//               start_date: formData.start_date,
//               end_date: formData.end_date && formData.end_date.trim() !== "" 
//                 ? formData.end_date 
//                 : null,
//                 days_of_week: courseSchedule.days_of_week,
//               schedule_pattern: {
//                 time_slots: courseSchedule.time_slots,
//                 total_lessons: courseSchedule.total_lessons,
//                 lesson_duration_minutes: courseSchedule.lesson_duration_minutes,
//               },
//             },
//           ])
//           .select()
//           .single();

//         if (error) throw error;
//         return data.id;
//       } else {
//         const updateData = {
//           institution_id: formData.institution_id,
//           instructor_id: formData.instructor_id,
//           grade_level: formData.grade_level,
//           max_participants: parseInt(formData.max_participants),
//           price_for_customer: parseFloat(formData.price_for_customer),
//           price_for_instructor: parseFloat(formData.price_for_instructor),
//           start_date: formData.start_date,
//           end_date: formData.end_date?.trim() ? formData.end_date : null,
//           days_of_week: courseSchedule.days_of_week,
//           schedule_pattern: {
//             time_slots: courseSchedule.time_slots,
//             total_lessons: courseSchedule.total_lessons,
//             lesson_duration_minutes: courseSchedule.lesson_duration_minutes,
//           },
//         };
        
//         const { data, error } = await supabase
//           .from("course_instances")
//           .update(updateData)
//           .eq("id", editData?.instance_id)
//           .select()
//           .single();

//         if (error) throw error;
//         return editData?.instance_id || null;
//       }
//     } catch (error) {
//       console.error("Error with course assignment:", error);
//       toast({
//         title: "שגיאה",
//         description: mode === 'create' 
//           ? "אירעה שגיאה בשיוך התוכנית" 
//           : "אירעה שגיאה בעדכון התוכנית",
//         variant: "destructive",
//       });
//       return null;
//     }
//   };

// const saveCourseInstanceSchedule = async (instanceId: string) => {
//   try {
//     console.log('=== STARTING SCHEDULE CALCULATION ===');
//     console.log('formData.start_date:', formData.start_date);
//     console.log('courseSchedule.time_slots:', courseSchedule.time_slots);
//     console.log('courseSchedule.days_of_week:', courseSchedule.days_of_week);
    
//     const adjustedTimeSlots = courseSchedule.time_slots.map(timeSlot => {
//       console.log('\n=== Processing timeSlot ===', timeSlot);
      
//       const startDate = new Date(formData.start_date + 'T00:00:00');
//       const now = new Date();
      
//       console.log('Start date:', startDate.toLocaleString());
//       console.log('Current time:', now.toLocaleString());
//       console.log('Target day of week:', timeSlot.day);
//       console.log('Current day of week:', now.getDay());
      
//       let targetDate = new Date(startDate);
//       console.log('Initial target date:', targetDate.toLocaleString());
      
//       while (targetDate.getDay() !== timeSlot.day) {
//         targetDate.setDate(targetDate.getDate() + 1);
//         console.log('Moving to next day:', targetDate.toLocaleString(), 'Day of week:', targetDate.getDay());
//       }
      
//       console.log('Found matching day:', targetDate.toLocaleString());
      
//       const [hours, minutes] = timeSlot.start_time.split(':').map(Number);
//       console.log('Setting time to:', hours, ':', minutes);
//       targetDate.setHours(hours, minutes, 0, 0);
      
//       console.log('Target date with time:', targetDate.toLocaleString());
//       console.log('Target timestamp:', targetDate.getTime());
//       console.log('Current timestamp:', now.getTime());
//       console.log('Difference (minutes):', (targetDate.getTime() - now.getTime()) / (1000 * 60));
      
//       if (targetDate.getTime() <= now.getTime()) {
//         console.log('*** TIME HAS PASSED - SKIPPING TO NEXT WEEK ***');
//         targetDate.setDate(targetDate.getDate() + 7);
//         console.log('New target date:', targetDate.toLocaleString());
//       } else {
//         console.log('*** TIME HAS NOT PASSED - KEEPING CURRENT DATE ***');
//       }
      
//       const result = {
//         ...timeSlot,
//         first_lesson_date: targetDate.toISOString().split('T')[0],
//         actual_start_time: timeSlot.start_time,
//         actual_end_time: timeSlot.end_time
//       };
      
//       console.log('Final result for this slot:', result);
//       return result;
//     });

//     console.log('\n=== FINAL ADJUSTED TIME SLOTS ===');
//     console.log(adjustedTimeSlots);

//     const { data: existingSchedule } = await supabase
//       .from("course_instance_schedules")
//       .select("id")
//       .eq("course_instance_id", instanceId)
//       .single();

//     const scheduleData = {
//       course_instance_id: instanceId,
//       days_of_week: courseSchedule.days_of_week,
//       time_slots: adjustedTimeSlots,
//       total_lessons: courseSchedule.total_lessons,
//       lesson_duration_minutes: courseSchedule.lesson_duration_minutes,
//     };

//     console.log('Saving schedule data:', scheduleData);

//     if (existingSchedule) {
//       const { error } = await supabase
//         .from("course_instance_schedules")
//         .update(scheduleData)
//         .eq("id", existingSchedule.id);

//       if (error) throw error;
//     } else {
//       const { error } = await supabase
//         .from("course_instance_schedules")
//         .insert([scheduleData]);

//       if (error) throw error;
//     }

//     if (mode === 'edit' && (courseSchedule.days_of_week.length > 0 || courseSchedule.time_slots.length > 0)) {
//       const { data: existingCourseSchedule } = await supabase
//         .from("course_instance_schedules")
//         .select("id")
//         .eq("course_instance_id", instanceId)
//         .single();
        
//       if (existingCourseSchedule) {
//         await supabase
//           .from('lesson_schedules')
//           .delete()
//           .eq('course_instance_id', instanceId);
//       }
//     }
//   } catch (error) {
//     console.error("Error saving course instance schedule:", error);
//     throw error;
//   }
// };

//   const handleFinalSave = async () => {
//     setLoading(true);
    
    
//     try {
//       const instanceId = await handleCourseAssignment();
//       if (!instanceId) return;

//       await saveCourseInstanceSchedule(instanceId);
      
//       // שמירת שיעורים ייחודיים אם קיימים
//       // if (hasCustomLessons && instanceLessons.length > 0) {
//         await saveInstanceLessons(instanceId);
//       // }
      
//       toast({
//         title: "הצלחה",
//         description: mode === 'edit' 
//           ? "התוכנית ולוח הזמנים עודכנו בהצלחה!"
//           : "התוכנית נשמרה עם לוח הזמנים החדש!",
//       });
//       onAssignmentComplete();
//       onOpenChange(false);
//     } catch (error) {
//       console.error("Error saving:", error);
//       toast({
//         title: "שגיאה",
//         description: "אירעה שגיאה בשמירה",
//         variant: "destructive",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleInputChange = (field: string, value: string) => {
//     setFormData((prev) => ({
//       ...prev,
//       [field]: value,
//     }));
//   };

//   const toggleDayOfWeek = (dayIndex: number) => {
//     const isSelected = courseSchedule.days_of_week.includes(dayIndex);
    
//     if (isSelected) {
//       setCourseSchedule(prev => ({
//         ...prev,
//         days_of_week: prev.days_of_week.filter(d => d !== dayIndex),
//         time_slots: prev.time_slots.filter(ts => ts.day !== dayIndex),
//       }));
//     } else {
//       setCourseSchedule(prev => ({
//         ...prev,
//         days_of_week: [...prev.days_of_week, dayIndex].sort(),
//         time_slots: [...prev.time_slots, { day: dayIndex, start_time: "", end_time: "" }],
//       }));
//     }
//   };

//   const updateTimeSlot = (dayIndex: number, field: "start_time" | "end_time", value: string) => {
//     setCourseSchedule(prev => ({
//       ...prev,
//       time_slots: prev.time_slots.map(ts => 
//         ts.day === dayIndex ? { ...ts, [field]: value } : ts
//       ),
//     }));
//   };

//   const renderCourseAssignmentStep = () => (
//     <form
//       onSubmit={(e) => {
//         e.preventDefault();
        
//         // Validation
//         const missingFields = [];
//         if (!formData.institution_id) missingFields.push("מוסד");
//         if (!formData.instructor_id) missingFields.push("מדריך");
//         if (!formData.grade_level.trim()) missingFields.push("כיתה");
        
//         if (missingFields.length > 0) {
//           toast({
//             title: "שגיאה בטופס",
//             description: `חסרים שדות חובה: ${missingFields.join(", ")}`,
//             variant: "destructive",
//           });
//           return;
//         }

//         setStep(2); // Go to scheduling step
//       }}
//       className="space-y-4"
//     >
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//         <div className="space-y-2">
//           <Label htmlFor="institution">מוסד חינוכי</Label>
//           <Select
//             value={formData.institution_id}
//             onValueChange={(value) =>
//               handleInputChange("institution_id", value)
//             }
//           >
//             <SelectTrigger>
//               <SelectValue placeholder="בחר מוסד חינוכי" />
//             </SelectTrigger>
//             <SelectContent>
//               {institutions.map((institution) => (
//                 <SelectItem key={institution.id} value={institution.id}>
//                   {institution.name}
//                 </SelectItem>
//               ))}
//             </SelectContent>
//           </Select>
//         </div>

//         <div className="space-y-2">
//           <Label htmlFor="instructor">מדריך</Label>
//           <Select
//             value={formData.instructor_id}
//             onValueChange={(value) => handleInputChange("instructor_id", value)}
//           >
//             <SelectTrigger>
//               <SelectValue placeholder="בחר מדריך" />
//             </SelectTrigger>
//             <SelectContent>
//               {instructors.map((instructor) => (
//                 <SelectItem key={instructor.id} value={instructor.id}>
//                   {instructor.full_name}
//                 </SelectItem>
//               ))}
//             </SelectContent>
//           </Select>
//         </div>

//         <div className="space-y-2">
//           <Label htmlFor="grade_level">כיתה</Label>
//           <Input
//             id="grade_level"
//             value={formData.grade_level}
//             onChange={(e) => handleInputChange("grade_level", e.target.value)}
//             placeholder="למשל: כיתה ז'"
//           />
//         </div>

//         <div className="space-y-2">
//           <Label htmlFor="price_for_customer">מחיר ללקוח</Label>
//           <Input
//             id="price_for_customer"
//             type="number"
//             value={formData.price_for_customer}
//             onChange={(e) =>
//               handleInputChange("price_for_customer", e.target.value)
//             }
//             placeholder="מחיר בשקלים"
//           />
//         </div>

//         <div className="space-y-2">
//           <Label htmlFor="price_for_instructor">מחיר למדריך</Label>
//           <Input
//             id="price_for_instructor"
//             type="number"
//             value={formData.price_for_instructor}
//             onChange={(e) =>
//               handleInputChange("price_for_instructor", e.target.value)
//             }
//             placeholder="מחיר בשקלים"
//           />
//         </div>

//         <div className="space-y-2">
//           <Label htmlFor="start_date">תאריך התחלה</Label>
//           <Input
//             id="start_date"
//             type="date"
//             value={formData.start_date}
//             onChange={(e) => handleInputChange("start_date", e.target.value)}
//           />
//         </div>

//         <div className="space-y-2">
//           <Label htmlFor="end_date">תאריך סיום</Label>
//           <Input
//             id="end_date"
//             type="date"
//             value={formData.end_date}
//             onChange={(e) => handleInputChange("end_date", e.target.value)}
//           />
//         </div>
//       </div>

//       <DialogFooter className="flex justify-between">
//         <Button
//           type="button"
//           variant="outline"
//           onClick={() => onOpenChange(false)}
//         >
//           ביטול
//         </Button>
//         <Button type="submit" disabled={loading}>
//           {loading 
//             ? (mode === 'edit' ? "מעדכן..." : "משייך...") 
//             : "המשך לתזמון"
//           }
//         </Button>
//       </DialogFooter>
//     </form>
//   );

//   // const renderSchedulingStep = () => (

 
//   //   <div className="space-y-4">
//   //     <div className="text-sm text-gray-600 mb-4">
//   //       הגדר את לוח הזמנים הכללי עבור התוכנית "{courseName}"
//   //     </div>

//   //     {/* כפתור שיעורים ייחודיים - ההוספה החדשה! */}
//   //     <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
//   //       <div className="flex items-center justify-between">
//   //         <div>
//   //           <h3 className="font-semibold text-purple-900 mb-2">שיעורים ייחודיים להקצאה</h3>
//   //           <p className="text-sm text-purple-700 mb-3">
//   //             {hasCustomLessons 
//   //               ? `יש ${instanceLessons.length} שיעורים ייחודיים להקצאה זו`
//   //               : "השתמש בשיעורי התבנית או צור שיעורים ייחודיים להקצאה זו"
//   //             }
//   //           </p>
//   //           <div className="flex items-center gap-2">
//   //             {hasCustomLessons ? (
//   //               <Badge className="bg-purple-100 text-purple-800 border-purple-200">
//   //                 <Settings className="h-3 w-3 mr-1" />
//   //                 שיעורים מותאמים
//   //               </Badge>
//   //             ) : (
//   //               <Badge variant="outline" className="bg-gray-100 text-gray-700">
//   //                 <BookOpen className="h-3 w-3 mr-1" />
//   //                 תבנית סטנדרטית
//   //               </Badge>
//   //             )}
//   //           </div>
//   //         </div>
//   //         <Button
//   //           type="button"
//   //           variant="outline"
//   //           onClick={() => setShowCustomLessonsDialog(true)}
//   //           className="border-purple-300 text-purple-700 hover:bg-purple-100"
//   //         >
//   //           <Settings className="h-4 w-4 mr-2" />
//   //           נהל שיעורים
//   //         </Button>
//   //       </div>
//   //     </div>

//   //     {/* Course Lessons Overview with Tasks */}
//   //     {lessons.length > 0 && (
//   //       <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 max-h-96 overflow-y-auto">
//   //         <h3 className="font-semibold text-blue-900 mb-3">
//   //           שיעורים בתוכנית ({hasCustomLessons ? instanceLessons.length : lessons.length})
//   //         </h3>
//   //         <div className="space-y-4">
//   //           {(hasCustomLessons ? instanceLessons : lessons).map((lesson, index) => (
//   //             <div key={lesson.id} className="bg-white rounded-lg p-3 border border-blue-200">
//   //               <div className="flex items-center justify-between mb-2">
//   //                 <div className="text-sm text-blue-800">
//   //                   <span className="font-medium">{index + 1}.</span> {lesson.title}
//   //                 </div>
//   //                 {lesson.tasks && lesson.tasks.length > 0 && (
//   //                   <span className="text-blue-600 text-xs bg-blue-100 px-2 py-1 rounded">
//   //                     {lesson.tasks.length} משימות
//   //                   </span>
//   //                 )}
//   //               </div>
                
//   //               {/* Show tasks for this lesson */}
//   //               {lesson.tasks && lesson.tasks.length > 0 && (
//   //                 <div className="mt-3 space-y-2">
//   //                   {lesson.tasks
//   //                     .sort((a: any, b: any) => a.order_index - b.order_index)
//   //                     .map((task: any) => (
//   //                       <div key={task.id} className="bg-gray-50 p-2 rounded text-xs">
//   //                         <div className="flex items-center justify-between mb-1">
//   //                           <span className="font-medium text-gray-700">{task.title}</span>
//   //                           <div className="flex items-center gap-2">
//   //                             <span className="text-gray-500">{task.estimated_duration} דק'</span>
//   //                             {task.is_mandatory ? (
//   //                               <span className="bg-red-100 text-red-600 px-1 py-0.5 rounded text-xs">חובה</span>
//   //                             ) : (
//   //                               <span className="bg-gray-100 text-gray-600 px-1 py-0.5 rounded text-xs">רשות</span>
//   //                             )}
//   //                           </div>
//   //                         </div>
//   //                         {task.description && (
//   //                           <p className="text-gray-600 text-xs">{task.description}</p>
//   //                         )}
//   //                       </div>
//   //                     ))}
//   //                 </div>
//   //               )}
//   //             </div>
//   //           ))}
//   //         </div>
//   //       </div>
//   //     )}

//   //     <div className="space-y-4">
//   //       {/* Course Date Info */}
//   //       {formData.start_date && formData.end_date && (
//   //         <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
//   //           <div className="text-sm text-gray-600">
//   //             <span className="font-medium">תקופת הקורס:</span> {" "}
//   //             {formData.start_date && formatDate(new Date(formData.start_date), "dd/MM/yyyy")} - {" "}
//   //             {formData.end_date && formatDate(new Date(formData.end_date), "dd/MM/yyyy")}
//   //           </div>
//   //         </div>
//   //       )}

//   //       {/* Days of week selection */}
//   //       <div className="space-y-2">
//   //         <Label>ימים בשבוע</Label>
//   //         <div className="flex flex-wrap gap-2">
//   //           {dayNames.map((day, index) => (
//   //             <div key={index} className="flex items-center space-x-2">
//   //               <Checkbox
//   //                 id={`day-${index}`}
//   //                 checked={courseSchedule.days_of_week.includes(index)}
//   //                 onCheckedChange={() => toggleDayOfWeek(index)}
//   //               />
//   //               <Label htmlFor={`day-${index}`} className="text-sm">
//   //                 {day}
//   //               </Label>
//   //             </div>
//   //           ))}
//   //         </div>
//   //       </div>

//   //       {/* Time slots for selected days */}
//   //       {courseSchedule.days_of_week.length > 0 && (
//   //         <div className="space-y-3">
//   //           <Label className="text-sm font-medium">זמנים לכל יום:</Label>
//   //           {courseSchedule.days_of_week.sort().map((dayIndex) => {
//   //             const timeSlot = courseSchedule.time_slots.find(ts => ts.day === dayIndex);
//   //             return (
//   //               <div key={dayIndex} className="border rounded p-3 bg-gray-50">
//   //                 <div className="flex items-center gap-4">
//   //                   <span className="min-w-[60px] text-sm font-medium">
//   //                     {dayNames[dayIndex]}:
//   //                   </span>
//   //                   <div className="flex gap-2 flex-1">
//   //                     <div className="flex-1">
//   //                       <Label className="text-xs">התחלה</Label>
//   //                       <Input
//   //                         type="time"
//   //                         value={timeSlot?.start_time || ""}
//   //                         onChange={(e) => updateTimeSlot(dayIndex, "start_time", e.target.value)}
//   //                         className="text-sm"
//   //                       />
//   //                     </div>
//   //                     <div className="flex-1">
//   //                       <Label className="text-xs">סיום</Label>
//   //                       <Input
//   //                         type="time"
//   //                         value={timeSlot?.end_time || ""}
//   //                         onChange={(e) => updateTimeSlot(dayIndex, "end_time", e.target.value)}
//   //                         className="text-sm"
//   //                       />
//   //                     </div>
//   //                   </div>
//   //                 </div>
//   //               </div>
//   //             );
//   //           })}
//   //         </div>
//   //       )}

//   //       {/* Additional schedule parameters */}
//   //       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//   //         <div className="space-y-2">
//   //           <Label htmlFor="total_lessons">מספר שיעורים כולל</Label>
//   //           <Input
//   //             id="total_lessons"
//   //             type="number"
//   //             min="1"
//   //             value={courseSchedule.total_lessons || ""}
//   //             onChange={(e) =>
//   //               setCourseSchedule(prev => ({
//   //                 ...prev,
//   //                 total_lessons: parseInt(e.target.value) || 1
//   //               }))
//   //             }
//   //             placeholder="מספר שיעורים"
//   //           />
//   //         </div>

//   //         <div className="space-y-2">
//   //           <Label htmlFor="lesson_duration">משך שיעור (דקות)</Label>
//   //           <Input
//   //             id="lesson_duration"
//   //             type="number"
//   //             min="15"
//   //             step="15"
//   //             value={courseSchedule.lesson_duration_minutes || ""}
//   //             onChange={(e) =>
//   //               setCourseSchedule(prev => ({
//   //                 ...prev,
//   //                 lesson_duration_minutes: parseInt(e.target.value) || 60
//   //               }))
//   //             }
//   //             placeholder="60"
//   //           />
//   //         </div>
//   //       </div>
//   //     </div>

//   //     <DialogFooter className="flex justify-between">
//   //       <Button type="button" variant="outline" onClick={() => setStep(1)}>
//   //         חזור
//   //       </Button>
//   //       <Button onClick={handleFinalSave} disabled={loading}>
//   //         {loading ? "שומר..." : "סיים ושמור"}
//   //       </Button>
//   //     </DialogFooter>
//   //   </div>
//   // );

//   // רנדור הפופאפ החדש לניהול שיעורים ייחודיים
  
// const renderSchedulingStep = () => {
//   // >> התיקון המרכזי: יוצרים משתנה שמחזיק את רשימת השיעורים הסופית <<
//   const lessonsToDisplay = hasCustomLessons ? instanceLessons : lessons;

//   return (
//     <div className="space-y-4">
//       <div className="text-sm text-gray-600 mb-4">
//         הגדר את לוח הזמנים הכללי עבור התוכנית "{courseName}"
//       </div>

//       {/* כפתור שיעורים ייחודיים - ההוספה החדשה! */}
//       <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
//         <div className="flex items-center justify-between">
//           <div>
//             <h3 className="font-semibold text-purple-900 mb-2">שיעורים ייחודיים להקצאה</h3>
//             <p className="text-sm text-purple-700 mb-3">
//               {hasCustomLessons 
//                 ? `יש ${lessonsToDisplay.length} שיעורים ייחודיים להקצאה זו`
//                 : "השתמש בשיעורי התבנית או צור שיעורים ייחודיים להקצאה זו"
//               }
//             </p>
//             <div className="flex items-center gap-2">
//               {hasCustomLessons ? (
//                 <Badge className="bg-purple-100 text-purple-800 border-purple-200">
//                   <Settings className="h-3 w-3 mr-1" />
//                   שיעורים מותאמים
//                 </Badge>
//               ) : (
//                 <Badge variant="outline" className="bg-gray-100 text-gray-700">
//                   <BookOpen className="h-3 w-3 mr-1" />
//                   תבנית סטנדרטית
//                 </Badge>
//               )}
//             </div>
//           </div>
//           <Button
//             type="button"
//             variant="outline"
//             onClick={() => setShowCustomLessonsDialog(true)}
//             className="border-purple-300 text-purple-700 hover:bg-purple-100"
//           >
//             <Settings className="h-4 w-4 mr-2" />
//             נהל שיעורים
//           </Button>
//         </div>
//       </div>

//       {/* >> התיקון כאן: תנאי התצוגה והלולאה משתמשים במשתנה הנכון << */}
//       {lessonsToDisplay.length > 0 && (
//         <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 max-h-96 overflow-y-auto">
//           <h3 className="font-semibold text-blue-900 mb-3">
//             שיעורים בתוכנית ({lessonsToDisplay.length})
//           </h3>
//           <div className="space-y-4">
//             {lessonsToDisplay.map((lesson, index) => (
//               <div key={lesson.id || `lesson-${index}`} className="bg-white rounded-lg p-3 border border-blue-200">
//                 <div className="flex items-center justify-between mb-2">
//                   <div className="text-sm text-blue-800">
//                     <span className="font-medium">{index + 1}.</span> {lesson.title}
//                   </div>
//                   {lesson.tasks && lesson.tasks.length > 0 && (
//                     <span className="text-blue-600 text-xs bg-blue-100 px-2 py-1 rounded">
//                       {lesson.tasks.length} משימות
//                     </span>
//                   )}
//                 </div>
                
//                 {lesson.tasks && lesson.tasks.length > 0 && (
//                   <div className="mt-3 space-y-2">
//                     {lesson.tasks
//                       .sort((a, b) => a.order_index - b.order_index)
//                       .map((task, taskIndex) => (
//                         <div key={task.id || `task-${taskIndex}`} className="bg-gray-50 p-2 rounded text-xs">
//                           <div className="flex items-center justify-between mb-1">
//                             <span className="font-medium text-gray-700">{task.title}</span>
//                             <div className="flex items-center gap-2">
//                               <span className="text-gray-500">{task.estimated_duration} דק'</span>
//                               {task.is_mandatory ? (
//                                 <span className="bg-red-100 text-red-600 px-1 py-0.5 rounded text-xs">חובה</span>
//                               ) : (
//                                 <span className="bg-gray-100 text-gray-600 px-1 py-0.5 rounded text-xs">רשות</span>
//                               )}
//                             </div>
//                           </div>
//                           {task.description && (
//                             <p className="text-gray-600 text-xs">{task.description}</p>
//                           )}
//                         </div>
//                       ))}
//                   </div>
//                 )}
//               </div>
//             ))}
//           </div>
//         </div>
//       )}

//       <div className="space-y-4">
//         {/* Course Date Info */}
//         {formData.start_date && (
//           <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
//             <div className="text-sm text-gray-600">
//               <span className="font-medium">תקופת הקורס:</span>{" "}
//               {formatDate(new Date(formData.start_date), "dd/MM/yyyy")}
//               {formData.end_date && ` - ${formatDate(new Date(formData.end_date), "dd/MM/yyyy")}`}
//             </div>
//           </div>
//         )}

//         {/* Days of week selection */}
//         <div className="space-y-2">
//           <Label>ימים בשבוע</Label>
//           <div className="flex flex-wrap gap-2">
//             {dayNames.map((day, index) => (
//               <div key={index} className="flex items-center space-x-2">
//                 <Checkbox
//                   id={`day-${index}`}
//                   checked={courseSchedule.days_of_week.includes(index)}
//                   onCheckedChange={() => toggleDayOfWeek(index)}
//                 />
//                 <Label htmlFor={`day-${index}`} className="text-sm">
//                   {day}
//                 </Label>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Time slots for selected days */}
//         {courseSchedule.days_of_week.length > 0 && (
//           <div className="space-y-3">
//             <Label className="text-sm font-medium">זמנים לכל יום:</Label>
//             {courseSchedule.days_of_week.sort().map((dayIndex) => {
//               const timeSlot = courseSchedule.time_slots.find(ts => ts.day === dayIndex);
//               return (
//                 <div key={dayIndex} className="border rounded p-3 bg-gray-50">
//                   <div className="flex items-center gap-4">
//                     <span className="min-w-[60px] text-sm font-medium">
//                       {dayNames[dayIndex]}:
//                     </span>
//                     <div className="flex gap-2 flex-1">
//                       <div className="flex-1">
//                         <Label className="text-xs">התחלה</Label>
//                         <Input
//                           type="time"
//                           value={timeSlot?.start_time || ""}
//                           onChange={(e) => updateTimeSlot(dayIndex, "start_time", e.target.value)}
//                           className="text-sm"
//                         />
//                       </div>
//                       <div className="flex-1">
//                         <Label className="text-xs">סיום</Label>
//                         <Input
//                           type="time"
//                           value={timeSlot?.end_time || ""}
//                           onChange={(e) => updateTimeSlot(dayIndex, "end_time", e.target.value)}
//                           className="text-sm"
//                         />
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         )}

//         {/* Additional schedule parameters */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <div className="space-y-2">
//             <Label htmlFor="total_lessons">מספר שיעורים כולל</Label>
//             <Input
//               id="total_lessons"
//               type="number"
//               min="1"
//               value={lessonsToDisplay.length || courseSchedule.total_lessons || ""}
//               onChange={(e) =>
//                 setCourseSchedule(prev => ({
//                   ...prev,
//                   total_lessons: parseInt(e.target.value) || 1
//                 }))
//               }
//               placeholder="מספר שיעורים"
//               readOnly={hasCustomLessons} // אם יש שיעורים ייחודיים, השדה הזה מחושב אוטומטית
//             />
//           </div>
//           <div className="space-y-2">
//             <Label htmlFor="lesson_duration">משך שיעור (דקות)</Label>
//             <Input
//               id="lesson_duration"
//               type="number"
//               min="15"
//               step="15"
//               value={courseSchedule.lesson_duration_minutes || ""}
//               onChange={(e) =>
//                 setCourseSchedule(prev => ({
//                   ...prev,
//                   lesson_duration_minutes: parseInt(e.target.value) || 60
//                 }))
//               }
//               placeholder="60"
//             />
//           </div>
//         </div>
//       </div>

//       <DialogFooter className="flex justify-between">
//         <Button type="button" variant="outline" onClick={() => setStep(1)}>
//           חזור
//         </Button>
//         <Button onClick={handleFinalSave} disabled={loading}>
//           {loading ? "שומר..." : "סיים ושמור"}
//         </Button>
//       </DialogFooter>
//     </div>
//   );
// };

//   const renderCustomLessonsDialog = () => (
//     <Dialog open={showCustomLessonsDialog} onOpenChange={setShowCustomLessonsDialog}>
//       <DialogContent className="max-w-[900px] max-h-[90vh] overflow-y-auto">
//         <DialogHeader>
//           <DialogTitle>ניהול שיעורים ייחודיים להקצאה</DialogTitle>
//           <DialogDescription>
//             צור או ערוך שיעורים ומשימות ייחודיים עבור הקצאה זו. השינויים לא ישפיעו על תבנית הקורס המקורית.
//           </DialogDescription>
//         </DialogHeader>

//         <div className="space-y-4">
//           {/* כפתורי פעולה */}
//           <div className="flex justify-between items-center bg-blue-50 border border-blue-200 rounded-lg p-4">
//             <div>
//               <h3 className="font-semibold text-blue-900 mb-1">
//                 {hasCustomLessons ? "שיעורים ייחודיים פעילים" : "אין שיעורים ייחודיים"}
//               </h3>
//               <p className="text-sm text-blue-700">
//                 {hasCustomLessons 
//                   ? `יש ${instanceLessons.length} שיעורים ייחודיים להקצאה זו`
//                   : "השתמש בכפתור להעתקת שיעורי התבנית כנקודת התחלה"
//                 }
//               </p>
//             </div>
//             <div className="flex gap-2">
//               {!hasCustomLessons && templateLessons.length > 0 && (
//                 <Button
//                   type="button"
//                   onClick={copyTemplateLessonsToInstance}
//                   className="bg-green-600 hover:bg-green-700"
//                 >
//                   העתק מתבנית
//                 </Button>
//               )}
//               {hasCustomLessons && (
//                 <Button
//                   type="button"
//                   variant="destructive"
//                   onClick={resetInstanceLessons}
//                 >
//                   מחק הכל
//                 </Button>
//               )}
//             </div>
//           </div>

//           {/* תוכן הניהול */}
//        {/* תוכן הניהול */}
// {hasCustomLessons || templateLessons.length === 0 ? (
//   <CourseLessonsSection
//     lessons={instanceLessons}
//     onLessonsChange={handleInstanceLessonsChange}
//     courseStartDate={formData.start_date}
//     courseEndDate={formData.end_date}
//   />
// ) : (
//   <div className="space-y-4">
//     {/* כפתור העתק מתבנית */}
//     <div className="text-center py-8 bg-gray-50 rounded-lg">
//       <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
//       <h3 className="text-lg font-semibold text-gray-700 mb-2">
//         התחל ליצור שיעורים ייחודיים
//       </h3>
//       <p className="text-gray-600 mb-4">
//         בחר להעתיק מהתבנית או להתחיל מאפס
//       </p>
//       <div className="flex gap-2 justify-center">
//         <Button
//           type="button"
//           onClick={copyTemplateLessonsToInstance}
//           className="bg-green-600 hover:bg-green-700"
//         >
//           העתק מתבנית ({templateLessons.length} שיעורים)
//         </Button>
//         <Button
//           type="button"
//           variant="outline"
//           onClick={startFromScratch}
//         >
//           התחל מאפס
//         </Button>
//       </div>
//     </div>
//   </div>
// )}
//         </div>

//         <DialogFooter>
//           <Button
//             type="button"
//             variant="outline"
//             onClick={() => setShowCustomLessonsDialog(false)}
//           >
//             סגור
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );

//   return (
//     <>
//       <Dialog open={open} onOpenChange={onOpenChange}>
//         <DialogContent className="max-w-[700px] max-h-[80vh] overflow-y-auto">
//           <DialogHeader>
//             <DialogTitle>
//               {step === 1 
//                 ? (mode === 'edit' ? "עריכת הקצאת תוכנית" : "שיוך תוכנית לימוד") 
//                 : "הגדרת לוח זמנים"
//               }
//             </DialogTitle>
//             <DialogDescription>
//               {step === 1
//                 ? (mode === 'edit' 
//                     ? `עריכת הקצאת התוכנית "${editData?.name || courseName}"` 
//                     : `שיוך התוכנית "${courseName}" למדריך, כיתה ומוסד לימודים`
//                   )
//                 : `הגדרת לוח הזמנים הכללי עבור התוכנית "${courseName}"`}
//             </DialogDescription>
//           </DialogHeader>

//           {step === 1 ? renderCourseAssignmentStep() : renderSchedulingStep()}
//         </DialogContent>
//       </Dialog>

//       {/* הפופאפ החדש לניהול שיעורים ייחודיים */}
//       {renderCustomLessonsDialog()}
//     </>
//   );
// };

// export default CourseAssignDialog;


import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";
import CourseLessonsSection, { Lesson } from "./course/CourseLessonsSection";
import { Settings, BookOpen } from "lucide-react";

import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  getSystemDefaults, 
  getDisabledDatesForCalendar, 
  isDateBlocked,
  clearSystemCache 
} from "@/utils/scheduleUtils"; // עדכן את הנתיב לפי המיקום הנכון

// --- Interfaces ---
interface Institution {
  id: string;
  name: string;
}

interface Instructor {
  id: string;
  full_name: string;
}

interface TimeSlot {
  day: number;
  start_time: string;
  end_time: string;
  [key: string]: Json | undefined;
}

interface CourseInstanceSchedule {
  days_of_week: number[];
  time_slots: TimeSlot[];
  total_lessons?: number;
  lesson_duration_minutes?: number;
}

interface EditData {
  instance_id: string;
  name: string;
  grade_level: string;
  max_participants: number;
  price_for_customer: number;
  price_for_instructor: number;
  institution_name: string;
  instructor_name: string;
  start_date: string;
  approx_end_date: string;
}

interface CourseAssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: 'create' | 'edit';
  courseId?: string;
  courseName?: string;
  instanceId?: string;
  editData?: EditData;
  onAssignmentComplete: () => void;
}

// --- Helper Functions ---
const formatDate = (date: Date, formatString: string) => {
  if (!date) return "";
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  if (formatString === "dd/MM/yyyy") return `${day}/${month}/${year}`;
  if (formatString === "dd/MM") return `${day}/${month}`;
  return d.toLocaleDateString();
};

const getInitialState = () => ({
  formData: {
    institution_id: "",
    instructor_id: "",
    grade_level: "",
    price_for_customer: "",
    price_for_instructor: "",
    max_participants: "",
    start_date: "",
    end_date: "",
  },
  courseSchedule: {
    days_of_week: [],
    time_slots: [],
    total_lessons: 1,
    lesson_duration_minutes: 45,
    task_duration_minutes: 25,
  },
  instanceLessons: [],
  hasCustomLessons: false,
});


// --- Main Component ---
const CourseAssignDialog = ({
  open,
  onOpenChange,
  mode = 'create',
  courseId,
  courseName,
  instanceId,
  editData,
  onAssignmentComplete,
}: CourseAssignDialogProps) => {
  const { toast } = useToast();
  
  // --- States ---
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(getInitialState().formData);
  const [showCustomLessonsDialog, setShowCustomLessonsDialog] = useState(false);
  const [templateLessons, setTemplateLessons] = useState<Lesson[]>([]);
  const [instanceLessons, setInstanceLessons] = useState<Lesson[]>([]);
  const [hasCustomLessons, setHasCustomLessons] = useState(false);
  const [courseSchedule, setCourseSchedule] = useState(getInitialState().courseSchedule);
  const [disabledDates, setDisabledDates] = useState<Date[]>([]);
const [systemDefaults, setSystemDefaults] = useState<any>(null);
const [scheduleWarnings, setScheduleWarnings] = useState<string[]>([]);

console.log(" instance id from dialog assign ",instanceId)
  const isMounted = useRef(false);
  
  const dayNames = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

  // --- useEffects for Data Loading and State Reset ---
  // useEffect(() => {
  //   if (!open) {
  //     isMounted.current = false;
  //     return;
  //   }
  //   if (isMounted.current) {
  //     return;
  //   }

  //   const initialState = getInitialState();
  //   setFormData(initialState.formData);
  //   setCourseSchedule(initialState.courseSchedule);
  //   setInstanceLessons(initialState.instanceLessons);
  //   setHasCustomLessons(initialState.hasCustomLessons);
  //   setStep(1);

  //   fetchInstitutions();
  //   fetchInstructors();

  //   if (mode === 'create' && courseId) {
  //     fetchTemplateLessons().then(templates => {
  //       const lessonList = templates || [];
  //       // אין צורך יותר ב-setLessons, רק מעדכנים את מספר השיעורים
  //       setCourseSchedule(prev => ({ ...prev, total_lessons: lessonList.length || 1 }));
  //     });
  //   } else if (mode === 'edit' && editData) {
  //     fetchExistingSchedule();
  //     loadInstanceLessons();
  //     if(courseId) fetchTemplateLessons();
  //   }

  //   isMounted.current = true;
  // }, [open]);

  useEffect(() => {
  if (!open) {
    isMounted.current = false;
    return;
  }
  if (isMounted.current) {
    return;
  }

  const initialState = getInitialState();
  setFormData(initialState.formData);
  setCourseSchedule(initialState.courseSchedule);
  setInstanceLessons(initialState.instanceLessons);
  setHasCustomLessons(initialState.hasCustomLessons);
  setStep(1);
  setScheduleWarnings([]); // הוסף את זה

  // טעינת הגדרות מערכת וקבצים חסומים
  loadSystemConfiguration();

  fetchInstitutions();
  fetchInstructors();

  if (mode === 'create' && courseId) {
    fetchTemplateLessons().then(templates => {
      const lessonList = templates || [];
      setCourseSchedule(prev => ({ ...prev, total_lessons: lessonList.length || 1 }));
    });
  } else if (mode === 'edit' && editData) {
    fetchExistingSchedule();
    loadInstanceLessons();
    if(courseId) fetchTemplateLessons();
  }

  isMounted.current = true;
}, [open]);


useEffect(() => {
  if (templateLessons.length > 0 || instanceLessons.length > 0) {
    const totalLessons = templateLessons.length + instanceLessons.length;
    setCourseSchedule(prev => ({
      ...prev,
      total_lessons: totalLessons || prev.total_lessons || 1
    }));
  }
}, [templateLessons, instanceLessons]); // רק כשהרשימות משתנות, לא כשהערך משתנה

useEffect(() => {
  const debounceTimer = setTimeout(() => {
    validateScheduleDates();
  }, 500);
  
  return () => clearTimeout(debounceTimer);
}, [formData.start_date, formData.end_date, courseSchedule.days_of_week, courseSchedule.total_lessons, templateLessons, instanceLessons]);
  // Load system configuration on dialog open
const loadSystemConfiguration = async () => {
  try {
    // Load system defaults
    const defaults = await getSystemDefaults();
    setSystemDefaults(defaults);
    
    // Update course schedule with system defaults
    setCourseSchedule(prev => ({
      ...prev,
      lesson_duration_minutes: defaults.default_lesson_duration,
      task_duration_minutes: defaults.default_task_duration,
    }));
    
    // Load disabled dates for calendar
    const disabled = await getDisabledDatesForCalendar();
    setDisabledDates(disabled);
    
  } catch (error) {
    console.error('Error loading system configuration:', error);
    toast({
      title: "שגיאה",
      description: "לא ניתן לטעון הגדרות מערכת",
      variant: "destructive",
    });
  }
};

const validateScheduleDates = async () => {
  if (!formData.start_date || !formData.end_date || courseSchedule.days_of_week.length === 0) {
    setScheduleWarnings([]);
    return;
  }
  
  const warnings: string[] = [];
  
  // Generate potential lesson dates
  const potentialDates: Date[] = [];
  const startDate = new Date(formData.start_date);
  const endDate = new Date(formData.end_date);
  
  let currentDate = new Date(startDate);
  let lessonCount = 0;
  const maxLessons = templateLessons.length + instanceLessons.length || 10;
  
  while (currentDate <= endDate && lessonCount < maxLessons) {
    const dayOfWeek = currentDate.getDay();
    if (courseSchedule.days_of_week.includes(dayOfWeek)) {
      const isBlocked = await isDateBlocked(currentDate);
      if (isBlocked) {
        warnings.push(`התאריך ${formatDate(currentDate, "dd/MM/yyyy")} חסום במערכת`);
      }
      potentialDates.push(new Date(currentDate));
      lessonCount++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Check if lesson duration is appropriate
  if (courseSchedule.lesson_duration_minutes && systemDefaults) {
    if (courseSchedule.lesson_duration_minutes < 15) {
      warnings.push('משך השיעור קצר מהמומלץ (15 דקות)');
    }
    if (courseSchedule.lesson_duration_minutes > systemDefaults.default_lesson_duration * 2) {
      warnings.push(`משך השיעור ארוך משמעותית מברירת המחדל (${systemDefaults.default_lesson_duration} דקות)`);
    }
  }
  
  setScheduleWarnings(warnings);
};

  useEffect(() => {
    if (mode === 'edit' && editData && institutions.length > 0 && instructors.length > 0) {
      const institutionId = findIdByName(institutions, editData.institution_name);
      const instructorId = findIdByName(instructors, editData.instructor_name);
      setFormData({
        institution_id: institutionId,
        instructor_id: instructorId,
        grade_level: editData.grade_level,
        price_for_customer: editData.price_for_customer.toString(),
        price_for_instructor: editData.price_for_instructor.toString(),
        max_participants: editData.max_participants.toString(),
        start_date: editData.start_date || "",
        end_date: editData.approx_end_date || "",
      });
    }
  }, [editData, institutions, instructors, mode, open]);

  // --- Data Fetching Functions ---
  const findIdByName = (items: any[], name: string) => items.find(item => item.name === name || item.full_name === name)?.id || "";

  const fetchInstitutions = async () => {
    try {
      const { data, error } = await supabase.from("educational_institutions").select("id, name").order("name");
      if (error) throw error;
      setInstitutions(data || []);
    } catch (error) {
      console.error("Error fetching institutions:", error);
      toast({ title: "שגיאה", description: "לא ניתן לטעון את רשימת המוסדות", variant: "destructive" });
    }
  };
  
  const fetchInstructors = async () => {
    try {
      const { data, error } = await supabase.from("profiles").select("id, full_name").eq("role", "instructor").order("full_name");
      if (error) throw error;
      setInstructors(data || []);
    } catch (error) {
      console.error("Error fetching instructors:", error);
      toast({ title: "שגיאה", description: "לא ניתן לטעון את רשימת המדריכים", variant: "destructive" });
    }
  };

const fetchTemplateLessons = async () => {
    if (!courseId) return;

    try {
      const { data: lessons, error } = await supabase
        .from('lessons')
        .select(`
          id,
          title,
          order_index,
          lesson_tasks (
            id,
            title,
            description,
            estimated_duration,
            is_mandatory,
            order_index
          )
        `)
        .eq('course_id', courseId)
        .is('course_instance_id', null) // רק שיעורי תבנית
        .order('order_index');

      if (error) {
        console.error('Error loading template lessons:', error);
        return;
      }

      const formattedLessons = lessons?.map(lesson => ({
        id: lesson.id,
        title: lesson.title,
        order_index: lesson.order_index,
        tasks: lesson.lesson_tasks?.map(task => ({
          id: task.id,
          title: task.title,
          description: task.description,
          estimated_duration: task.estimated_duration,
          is_mandatory: task.is_mandatory,
          order_index: task.order_index
        })).sort((a, b) => a.order_index - b.order_index) || []
      })) || [];

      setTemplateLessons(formattedLessons);
    } catch (error) {
      console.error('Error fetching template lessons:', error);
    }
  };
  const loadInstanceLessons = async () => {
    const actualInstanceId = instanceId || editData?.instance_id;
    if (!actualInstanceId) return;
    try {
      const { data, error } = await supabase.from('lessons').select('id, title, description, order_index, lesson_tasks(*)').eq('course_instance_id', actualInstanceId).order('order_index');
      if (error) throw error;
      if (data && data.length > 0) {
        const formattedLessons = data.map(l => ({...l, description: l.description || '', tasks: (l.lesson_tasks as any[]) || []}));
        setInstanceLessons(formattedLessons);
        setHasCustomLessons(true);
      } else {
        setInstanceLessons([]);
        setHasCustomLessons(false);
      }
    } catch (error) {
      console.error('Error loading instance lessons:', error);
    }
  };
  
  // Make sure to load system defaults *before* fetching the existing schedule.
// Your main useEffect already does this, which is great.

const fetchExistingSchedule = async () => {
  if (!editData?.instance_id) return;
  try {
    const { data, error } = await supabase
      .from("course_instance_schedules")
      .select("*")
      .eq("course_instance_id", editData.instance_id)
      .single();

    if (data && !error) {
      // The fix is here:
      setCourseSchedule({
        days_of_week: data.days_of_week || [],
        time_slots: (data.time_slots as TimeSlot[]) || [],
        total_lessons: data.total_lessons || 1,
        // Prioritize DB value, then system default, then a final fallback.
        lesson_duration_minutes:
          data.lesson_duration_minutes ||
          systemDefaults?.default_lesson_duration || // <-- Use the loaded default
          45, // <-- Final fallback
        task_duration_minutes:
          data.task_duration_minutes ||
          systemDefaults?.default_task_duration || // <-- Use the loaded default
          25, // <-- Final fallback
      });
    }
  } catch (error) {
    console.error("Error fetching existing schedule:", error);
  }
};

  // --- Logic and Handlers ---
  const handleInstanceLessonsChange = (newLessons: Lesson[]) => {
    setInstanceLessons([...newLessons]);
  };
  
  const copyTemplateLessonsToInstance = () => {
    if (templateLessons.length === 0) {
      toast({ title: "הודעה", description: "אין שיעורי תבנית להעתקה", variant: "default" });
      return;
    }
    const copiedLessons = templateLessons.map(lesson => ({
      ...lesson,
      id: `instance-lesson-${Date.now()}-${Math.random()}`,
      tasks: lesson.tasks.map(task => ({ ...task, id: `instance-task-${Date.now()}-${Math.random()}` }))
    }));
    setInstanceLessons(copiedLessons);
    setHasCustomLessons(true);
    toast({ title: "הצלחה", description: "שיעורי התבנית הועתקו בהצלחה", variant: "default" });
  };
  
  const startFromScratch = () => {
    setInstanceLessons([]);
    setHasCustomLessons(true);
    toast({ title: "התחלה חדשה", description: "כעת תוכל ליצור שיעורים ייחודיים מאפס", variant: "default" });
  };
  
  const resetInstanceLessons = () => {
    setInstanceLessons([]);
    setHasCustomLessons(false);
    toast({ title: "איפוס", description: "השימוש חזר לשיעורי התבנית המקוריים", variant: "default" });
  };

  const handleInputChange = (field: string, value: string) => setFormData(prev => ({...prev, [field]: value}));
  
  const toggleDayOfWeek = (dayIndex: number) => {
    setCourseSchedule(prev => {
      const isSelected = prev.days_of_week.includes(dayIndex);
      if (isSelected) {
        return {
          ...prev,
          days_of_week: prev.days_of_week.filter(d => d !== dayIndex),
          time_slots: prev.time_slots.filter(ts => ts.day !== dayIndex),
        };
      } else {
        return {
          ...prev,
          days_of_week: [...prev.days_of_week, dayIndex].sort(),
          time_slots: [...prev.time_slots, { day: dayIndex, start_time: "08:00", end_time: "08:45" }],
        };
      }
    });
  };

  const updateTimeSlot = (dayIndex: number, field: "start_time" | "end_time", value: string) => {
    setCourseSchedule(prev => ({
      ...prev,
      time_slots: prev.time_slots.map(ts => ts.day === dayIndex ? { ...ts, [field]: value } : ts),
    }));
  };

  // --- Saving Logic ---
  // const handleCourseAssignment = async (): Promise<string | null> => {
  //   const lessonsToUse = hasCustomLessons ? instanceLessons : templateLessons;
  //   const finalSchedule = {
  //     ...courseSchedule,
  //     total_lessons: lessonsToUse.length,
  //   };

  //   try {
  //     if (mode === 'create') {
  //       const { data, error } = await supabase
  //         .from("course_instances")
  //         .insert([{
  //             course_id: courseId,
  //             institution_id: formData.institution_id,
  //             instructor_id: formData.instructor_id,
  //             grade_level: formData.grade_level,
  //             max_participants: parseInt(formData.max_participants) || null,
  //             price_for_customer: parseFloat(formData.price_for_customer) || null,
  //             price_for_instructor: parseFloat(formData.price_for_instructor) || null,
  //             start_date: formData.start_date,
  //             end_date: formData.end_date || null,
  //             days_of_week: finalSchedule.days_of_week,
  //             schedule_pattern: {
  //               time_slots: finalSchedule.time_slots,
  //               total_lessons: finalSchedule.total_lessons,
  //               lesson_duration_minutes: finalSchedule.lesson_duration_minutes,
  //             },
  //         }])
  //         .select()
  //         .single();
  //       if (error) throw error;
  //       return data.id;
  //     } else {
  //       const { data, error } = await supabase
  //         .from("course_instances")
  //         .update({
  //           institution_id: formData.institution_id,
  //           instructor_id: formData.instructor_id,
  //           grade_level: formData.grade_level,
  //           max_participants: parseInt(formData.max_participants) || null,
  //           price_for_customer: parseFloat(formData.price_for_customer) || null,
  //           price_for_instructor: parseFloat(formData.price_for_instructor) || null,
  //           start_date: formData.start_date,
  //           end_date: formData.end_date || null,
  //           days_of_week: finalSchedule.days_of_week,
  //           schedule_pattern: {
  //             time_slots: finalSchedule.time_slots,
  //             total_lessons: finalSchedule.total_lessons,
  //             lesson_duration_minutes: finalSchedule.lesson_duration_minutes,
  //           },
  //         })
  //         .eq("id", editData?.instance_id)
  //         .select()
  //         .single();
  //       if (error) throw error;
  //       return editData?.instance_id || null;
  //     }
  //   } catch (error) {
  //     console.error("Error with course assignment:", error);
  //     toast({ title: "שגיאה", description: mode === 'create' ? "שגיאה בשיוך התוכנית" : "שגיאה בעדכון התוכנית", variant: "destructive"});
  //     return null;
  //   }
  // };
  
  const handleCourseAssignment = async (): Promise<string | null> => {
    // התיקון כאן: מחשבים את סך השיעורים כסכום של שתי הרשימות
    const finalSchedule = {
      ...courseSchedule,
      total_lessons: templateLessons.length + instanceLessons.length,
    };

    try {
      if (mode === 'create') {
        const { data, error } = await supabase
          .from("course_instances")
          .insert([{
              course_id: courseId,
              institution_id: formData.institution_id,
              instructor_id: formData.instructor_id,
              grade_level: formData.grade_level,
              max_participants: parseInt(formData.max_participants) || null,
              price_for_customer: parseFloat(formData.price_for_customer) || null,
              price_for_instructor: parseFloat(formData.price_for_instructor) || null,
              start_date: formData.start_date,
              end_date: formData.end_date || null,
              days_of_week: finalSchedule.days_of_week,
              schedule_pattern: {
                time_slots: finalSchedule.time_slots,
                total_lessons: finalSchedule.total_lessons, // כאן נכנס הערך המתוקן
                lesson_duration_minutes: finalSchedule.lesson_duration_minutes,
                    
              },
          }])
          .select()
          .single();
        if (error) throw error;
        return data.id;
      } else {
        const { data, error } = await supabase
          .from("course_instances")
          .update({
            institution_id: formData.institution_id,
            instructor_id: formData.instructor_id,
            grade_level: formData.grade_level,
            max_participants: parseInt(formData.max_participants) || null,
            price_for_customer: parseFloat(formData.price_for_customer) || null,
            price_for_instructor: parseFloat(formData.price_for_instructor) || null,
            start_date: formData.start_date,
            end_date: formData.end_date || null,
            days_of_week: finalSchedule.days_of_week,
            schedule_pattern: {
              time_slots: finalSchedule.time_slots,
              total_lessons: finalSchedule.total_lessons, // וכאן
              lesson_duration_minutes: finalSchedule.lesson_duration_minutes,
            },
          })
          .eq("id", editData?.instance_id)
          .select()
          .single();
        if (error) throw error;
        return editData?.instance_id || null;
      }
    } catch (error) {
      console.error("Error with course assignment:", error);
      toast({ title: "שגיאה", description: mode === 'create' ? "שגיאה בשיוך התוכנית" : "שגיאה בעדכון התוכנית", variant: "destructive"});
      return null;
    }
  };
  // const saveCourseInstanceSchedule = async (instanceId: string) => {
  //   try {
  //     const adjustedTimeSlots = courseSchedule.time_slots.map(timeSlot => {
  //       const startDate = new Date(formData.start_date + 'T00:00:00');
  //       let targetDate = new Date(startDate);
  //       while (targetDate.getDay() !== timeSlot.day) {
  //         targetDate.setDate(targetDate.getDate() + 1);
  //       }
  //       const [hours, minutes] = timeSlot.start_time.split(':').map(Number);
  //       targetDate.setHours(hours, minutes, 0, 0);
  //       if (targetDate.getTime() <= new Date().getTime()) {
  //         targetDate.setDate(targetDate.getDate() + 7);
  //       }
  //       return {
  //         ...timeSlot,
  //         first_lesson_date: targetDate.toISOString().split('T')[0],
  //       };
  //     });

  //     const lessonsToUse = hasCustomLessons ? instanceLessons : templateLessons;
  //     const scheduleData = {
  //       course_instance_id: instanceId,
  //       days_of_week: courseSchedule.days_of_week,
  //       time_slots: adjustedTimeSlots,
  //       total_lessons: lessonsToUse.length,
  //       lesson_duration_minutes: courseSchedule.lesson_duration_minutes,
  //     };

  //     const { error } = await supabase.from("course_instance_schedules").upsert(scheduleData, { onConflict: 'course_instance_id' });
  //     if (error) throw error;
  //   } catch (error) {
  //     console.error("Error saving course instance schedule:", error);
  //     throw error;
  //   }
  // };
  
  // const saveInstanceLessons = async (assignmentInstanceId: string) => {
  //   try {
  //     await supabase.from('lessons').delete().eq('course_instance_id', assignmentInstanceId);

  //     if (!hasCustomLessons || instanceLessons.length === 0) {
  //       return;
  //     }

  //     const { data: scheduleData } = await supabase.from('course_instance_schedules').select('*').eq('course_instance_id', assignmentInstanceId).single();
  //     if (!scheduleData) throw new Error("Schedule not found to create lessons.");

  //     let lessonDates: { start: string; end: string }[] = [];
  //     const timeSlots = (scheduleData.time_slots as any[]) || [];
  //     if (timeSlots.length > 0) {
  //       const sortedSlots = [...timeSlots].sort((a, b) => a.day - b.day || a.start_time.localeCompare(b.start_time));
  //       for (let i = 0; i < instanceLessons.length; i++) {
  //         const slot = sortedSlots[i % sortedSlots.length];
  //         const weekOffset = Math.floor(i / sortedSlots.length);
  //         const baseDate = new Date(slot.first_lesson_date);
  //         baseDate.setDate(baseDate.getDate() + weekOffset * 7);
  //         const scheduledStart = `${baseDate.toISOString().split('T')[0]}T${slot.start_time}:00`;
  //         const scheduledEnd = `${baseDate.toISOString().split('T')[0]}T${slot.end_time}:00`;
  //         lessonDates.push({ start: scheduledStart, end: scheduledEnd });
  //       }
  //     }

  //     const lessonsToInsert = instanceLessons.map((lesson, index) => ({
  //       course_id: courseId,
  //       course_instance_id: assignmentInstanceId,
  //       title: lesson.title,
  //       order_index: index,
  //       scheduled_start: lessonDates[index]?.start || new Date().toISOString(),
  //       scheduled_end: lessonDates[index]?.end || new Date().toISOString(),
  //       status: 'scheduled'
  //     }));

  //     const { data: savedLessons, error: lessonError } = await supabase.from('lessons').insert(lessonsToInsert).select('id, order_index');
  //     if (lessonError) throw lessonError;

  //     const tasksToInsert = instanceLessons.flatMap((lesson, lessonIndex) => {
  //       const savedLesson = savedLessons?.find(sl => sl.order_index === lessonIndex);
  //       return savedLesson ? lesson.tasks.map((task, taskIndex) => ({
  //           lesson_id: savedLesson.id,
  //           title: task.title,
  //           description: task.description,
  //           estimated_duration: task.estimated_duration,
  //           is_mandatory: task.is_mandatory,
  //           order_index: taskIndex
  //       })) : [];
  //     });

  //     if (tasksToInsert.length > 0) {
  //       const { error: tasksError } = await supabase.from('lesson_tasks').insert(tasksToInsert);
  //       if (tasksError) throw tasksError;
  //     }
  //   } catch (error) {
  //     console.error('Error saving instance lessons:', error);
  //     throw error;
  //   }
  // };

const saveCourseInstanceSchedule = async (instanceId: string) => {
  try {
    // בדיקה אם כבר קיים לוח זמנים
    const { data: existingSchedule } = await supabase
      .from("course_instance_schedules")
      .select("*")
      .eq("course_instance_id", instanceId)
      .single();

    const adjustedTimeSlots = courseSchedule.time_slots.map(timeSlot => {
      const startDate = new Date(formData.start_date + 'T00:00:00');
      let targetDate = new Date(startDate);
      
      // מציאת היום הראשון המתאים
      while (targetDate.getDay() !== timeSlot.day) {
        targetDate.setDate(targetDate.getDate() + 1);
      }
      
      const [hours, minutes] = timeSlot.start_time.split(':').map(Number);
      targetDate.setHours(hours, minutes, 0, 0);
      
      // אם כבר עבר התאריך הזה והיא עריכה, השתמש בתאריך הקיים
      if (existingSchedule && timeSlot.first_lesson_date) {
        return timeSlot; // שמור על התאריך הקיים
      }
      
      // בדיקה שהתאריך לא בעבר
      if (targetDate.getTime() <= new Date().getTime()) {
        targetDate.setDate(targetDate.getDate() + 7);
      }
      
      return {
        ...timeSlot,
        first_lesson_date: targetDate.toISOString().split('T')[0],
      };
    });

    // חישוב מספר השיעורים הכולל
    const totalLessonsCount = templateLessons.length + instanceLessons.length;

    const scheduleData = {
      course_instance_id: instanceId,
      days_of_week: courseSchedule.days_of_week,
      time_slots: adjustedTimeSlots,
      total_lessons: totalLessonsCount, // שימוש במספר המתוקן
      lesson_duration_minutes: courseSchedule.lesson_duration_minutes,
    };

    const { error } = await supabase
      .from("course_instance_schedules")
      .upsert(scheduleData, { onConflict: 'course_instance_id' });
    
    if (error) throw error;
    
    console.log(`Schedule saved with ${totalLessonsCount} total lessons`);
  } catch (error) {
    console.error("Error saving course instance schedule:", error);
    throw error;
  }
};
  


// const saveInstanceLessons = async (assignmentInstanceId: string) => {
//   try {
//     // במקום למחוק את כל השיעורים, נבדוק מה כבר קיים
//     const { data: existingLessons } = await supabase
//       .from('lessons')
//       .select('id, title, order_index, scheduled_start, scheduled_end')
//       .eq('course_instance_id', assignmentInstanceId)
//       .order('order_index');

//     if (!hasCustomLessons || instanceLessons.length === 0) {
//       return;
//     }

//     // מציאת השיעורים החדשים שצריך להוסיף
//     const existingTitles = new Set(existingLessons?.map(l => l.title) || []);
//     const newLessons = instanceLessons.filter(lesson => 
//       !existingTitles.has(lesson.title)
//     );

//     if (newLessons.length === 0) {
//       console.log('No new lessons to add');
//       return;
//     }

//     // קבלת נתוני התזמון
//     const { data: scheduleData } = await supabase
//       .from('course_instance_schedules')
//       .select('*')
//       .eq('course_instance_id', assignmentInstanceId)
//       .single();
    
//     if (!scheduleData) throw new Error("Schedule not found to create lessons.");

//     // חישוב תאריכים לשיעורים החדשים בלבד
//     let lessonDates: { start: string; end: string }[] = [];
//     const timeSlots = (scheduleData.time_slots as any[]) || [];
    
//     if (timeSlots.length > 0) {
//       // מציאת התאריך האחרון של שיעור קיים
//       let startFromDate: Date;
//       let startingLessonIndex = existingLessons?.length || 0;
      
//       if (existingLessons && existingLessons.length > 0) {
//         // התחל מהשבוע הבא אחרי השיעור האחרון
//         const lastLesson = existingLessons[existingLessons.length - 1];
//         startFromDate = new Date(lastLesson.scheduled_end);
//         startFromDate.setDate(startFromDate.getDate() + 1);
//       } else {
//         // אם אין שיעורים קיימים, התחל מתאריך ההתחלה
//         const { data: instanceData } = await supabase
//           .from('course_instances')
//           .select('start_date')
//           .eq('id', assignmentInstanceId)
//           .single();
        
//         startFromDate = new Date(instanceData?.start_date || new Date());
//       }

//       const sortedSlots = [...timeSlots].sort((a, b) => 
//         a.day - b.day || a.start_time.localeCompare(b.start_time)
//       );

//       // חישוב תאריכים רק לשיעורים החדשים
//       for (let i = 0; i < newLessons.length; i++) {
//         let foundValidDate = false;
//         let currentDate = new Date(startFromDate);
//         let attempts = 0;
        
//         while (!foundValidDate && attempts < 365) {
//           const dayOfWeek = currentDate.getDay();
//           const slot = sortedSlots.find(s => s.day === dayOfWeek);
          
//           if (slot) {
//             const dateStr = currentDate.toISOString().split('T')[0];
//             const scheduledStart = `${dateStr}T${slot.start_time}:00`;
//             const scheduledEnd = `${dateStr}T${slot.end_time}:00`;
            
//             // בדיקה שאין התנגשות עם שיעור קיים
//             const hasConflict = existingLessons?.some(existing => {
//               const existingStart = new Date(existing.scheduled_start);
//               const existingEnd = new Date(existing.scheduled_end);
//               const newStart = new Date(scheduledStart);
//               const newEnd = new Date(scheduledEnd);
              
//               return (newStart >= existingStart && newStart < existingEnd) ||
//                      (newEnd > existingStart && newEnd <= existingEnd) ||
//                      (newStart <= existingStart && newEnd >= existingEnd);
//             });
            
//             if (!hasConflict) {
//               lessonDates.push({ start: scheduledStart, end: scheduledEnd });
//               foundValidDate = true;
//               // עדכון התאריך להמשך
//               startFromDate = new Date(scheduledEnd);
//               startFromDate.setDate(startFromDate.getDate() + 1);
//             }
//           }
          
//           currentDate.setDate(currentDate.getDate() + 1);
//           attempts++;
//         }
        
//         if (!foundValidDate) {
//           console.warn(`Could not find valid date for lesson ${i}`);
//           // fallback - use a default date
//           const now = new Date();
//           lessonDates.push({ 
//             start: now.toISOString(), 
//             end: new Date(now.getTime() + 60 * 60 * 1000).toISOString() 
//           });
//         }
//       }
//     }

//     // הכנת השיעורים החדשים להוספה
//     const startingIndex = existingLessons?.length || 0;
//     const lessonsToInsert = newLessons.map((lesson, index) => ({
//       course_id: courseId,
//       course_instance_id: assignmentInstanceId,
//       title: lesson.title,
//       order_index: startingIndex + index, // המשך מהאינדקס האחרון
//       scheduled_start: lessonDates[index]?.start || new Date().toISOString(),
//       scheduled_end: lessonDates[index]?.end || new Date().toISOString(),
//       status: 'scheduled'
//     }));

//     // הוספת השיעורים החדשים בלבד
//     const { data: savedLessons, error: lessonError } = await supabase
//       .from('lessons')
//       .insert(lessonsToInsert)
//       .select('id, title, order_index');
    
//     if (lessonError) throw lessonError;

//     // הוספת המשימות לשיעורים החדשים
//     const tasksToInsert = newLessons.flatMap((lesson, lessonIndex) => {
//       const savedLesson = savedLessons?.find(sl => sl.title === lesson.title);
//       return savedLesson ? lesson.tasks.map((task, taskIndex) => ({
//         lesson_id: savedLesson.id,
//         title: task.title,
//         description: task.description,
//         estimated_duration: task.estimated_duration,
//         is_mandatory: task.is_mandatory,
//         order_index: taskIndex
//       })) : [];
//     });

//     if (tasksToInsert.length > 0) {
//       const { error: tasksError } = await supabase
//         .from('lesson_tasks')
//         .insert(tasksToInsert);
//       if (tasksError) throw tasksError;
//     }

//     console.log(`Added ${newLessons.length} new lessons successfully`);
//   } catch (error) {
//     console.error('Error saving instance lessons:', error);
//     throw error;
//   }
// };

  
  // const handleFinalSave = async () => {
  //   setLoading(true);
  //   try {
  //     const newInstanceId = await handleCourseAssignment();
  //     if (!newInstanceId) throw new Error("Failed to create or update course instance.");
      
  //     await saveCourseInstanceSchedule(newInstanceId);
  //     await saveInstanceLessons(newInstanceId);
      
  //     toast({ title: "הצלחה", description: mode === 'edit' ? "התוכנית עודכנה בהצלחה!" : "התוכנית נוצרה ושוייכה בהצלחה!" });
  //     onAssignmentComplete();
  //     onOpenChange(false);
  //   } catch (error) {
  //     console.error("Error saving:", error);
  //     toast({ title: "שגיאה", description: "אירעה שגיאה בשמירה", variant: "destructive" });
  //   } finally {
  //     setLoading(false);
  //   }
  // };


const saveInstanceLessons = async (assignmentInstanceId: string) => {
  try {
    // בדיקה מה כבר קיים
    const { data: existingLessons } = await supabase
      .from('lessons')
      .select('id, title, order_index, scheduled_start, scheduled_end')
      .eq('course_instance_id', assignmentInstanceId)
      .order('order_index');

    // בדיקת שיעורי תבנית
    const { data: templateLessons } = await supabase
      .from('lessons')
      .select('id, order_index')
      .eq('course_id', courseId)
      .is('course_instance_id', null)
      .order('order_index');

    if (!hasCustomLessons || instanceLessons.length === 0) {
      return;
    }

    // מציאת השיעורים החדשים שצריך להוסיף
    const existingTitles = new Set(existingLessons?.map(l => l.title) || []);
    const newLessons = instanceLessons.filter(lesson => 
      !existingTitles.has(lesson.title)
    );

    if (newLessons.length === 0) {
      console.log('No new lessons to add');
      return;
    }

    // חישוב ה-order_index הנכון - התחל אחרי כל השיעורים הקיימים
    const maxTemplateIndex = templateLessons?.reduce((max, lesson) => 
      Math.max(max, lesson.order_index || 0), -1) ?? -1;
    
    const maxExistingIndex = existingLessons?.reduce((max, lesson) => 
      Math.max(max, lesson.order_index || 0), maxTemplateIndex) ?? maxTemplateIndex;

    const startingIndex = maxExistingIndex + 1;

    // קבלת נתוני התזמון
    const { data: scheduleData } = await supabase
      .from('course_instance_schedules')
      .select('*')
      .eq('course_instance_id', assignmentInstanceId)
      .single();
    
    if (!scheduleData) throw new Error("Schedule not found to create lessons.");

    // חישוב תאריכים לשיעורים החדשים
    let lessonDates: { start: string; end: string }[] = [];
    const timeSlots = (scheduleData.time_slots as any[]) || [];
    
    if (timeSlots.length > 0) {
      // מציאת התאריך להתחלה
      let startFromDate: Date;
      
      if (existingLessons && existingLessons.length > 0) {
        const lastLesson = existingLessons[existingLessons.length - 1];
        startFromDate = new Date(lastLesson.scheduled_end);
        startFromDate.setDate(startFromDate.getDate() + 1);
      } else {
        const { data: instanceData } = await supabase
          .from('course_instances')
          .select('start_date')
          .eq('id', assignmentInstanceId)
          .single();
        
        startFromDate = new Date(instanceData?.start_date || new Date());
      }

      const sortedSlots = [...timeSlots].sort((a, b) => 
        a.day - b.day || a.start_time.localeCompare(b.start_time)
      );

      // יצירת תאריכים לשיעורים החדשים
      for (let i = 0; i < newLessons.length; i++) {
        let foundValidDate = false;
        let currentDate = new Date(startFromDate);
        let attempts = 0;
        
        while (!foundValidDate && attempts < 365) {
          const dayOfWeek = currentDate.getDay();
          const slot = sortedSlots.find(s => s.day === dayOfWeek);
          
          if (slot) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const scheduledStart = `${dateStr}T${slot.start_time}:00`;
            const scheduledEnd = `${dateStr}T${slot.end_time}:00`;
            
            // בדיקת התנגשות
            const hasConflict = existingLessons?.some(existing => {
              const existingStart = new Date(existing.scheduled_start);
              const existingEnd = new Date(existing.scheduled_end);
              const newStart = new Date(scheduledStart);
              const newEnd = new Date(scheduledEnd);
              
              return (newStart >= existingStart && newStart < existingEnd) ||
                     (newEnd > existingStart && newEnd <= existingEnd) ||
                     (newStart <= existingStart && newEnd >= existingEnd);
            });
            
            if (!hasConflict) {
              lessonDates.push({ start: scheduledStart, end: scheduledEnd });
              foundValidDate = true;
              startFromDate = new Date(scheduledEnd);
              startFromDate.setDate(startFromDate.getDate() + 1);
            }
          }
          
          currentDate.setDate(currentDate.getDate() + 1);
          attempts++;
        }
        
        if (!foundValidDate) {
          console.warn(`Could not find valid date for lesson ${i}`);
          const now = new Date();
          lessonDates.push({ 
            start: now.toISOString(), 
            end: new Date(now.getTime() + 60 * 60 * 1000).toISOString() 
          });
        }
      }
    }

    // הכנת השיעורים החדשים להוספה עם order_index נכון
    const lessonsToInsert = newLessons.map((lesson, index) => ({
      course_id: courseId,
      course_instance_id: assignmentInstanceId,
      title: lesson.title,
      order_index: startingIndex + index, // order_index שלא יתנגש
      scheduled_start: lessonDates[index]?.start || new Date().toISOString(),
      scheduled_end: lessonDates[index]?.end || new Date().toISOString(),
      status: 'scheduled'
    }));

    console.log('Inserting new lessons with order_index starting from:', startingIndex);

    // הוספת השיעורים החדשים
    const { data: savedLessons, error: lessonError } = await supabase
      .from('lessons')
      .insert(lessonsToInsert)
      .select('id, title, order_index');
    
    if (lessonError) throw lessonError;

    // הוספת המשימות לשיעורים החדשים
    const tasksToInsert = newLessons.flatMap((lesson, lessonIndex) => {
      const savedLesson = savedLessons?.find(sl => sl.title === lesson.title);
      return savedLesson ? lesson.tasks.map((task, taskIndex) => ({
        lesson_id: savedLesson.id,
        title: task.title,
        description: task.description,
        estimated_duration: task.estimated_duration,
        is_mandatory: task.is_mandatory,
        order_index: taskIndex
      })) : [];
    });

    if (tasksToInsert.length > 0) {
      const { error: tasksError } = await supabase
        .from('lesson_tasks')
        .insert(tasksToInsert);
      if (tasksError) throw tasksError;
    }

    console.log(`Added ${newLessons.length} new lessons successfully`);
  } catch (error) {
    console.error('Error saving instance lessons:', error);
    throw error;
  }
};
  const handleFinalSave = async () => {
  setLoading(true);
  try {
    const newInstanceId = await handleCourseAssignment();
    if (!newInstanceId) throw new Error("Failed to create or update course instance.");
    
    // עדכון: קודם שמור את לוח הזמנים
    await saveCourseInstanceSchedule(newInstanceId);
    
    // אז שמור את השיעורים (אם יש)
    if (hasCustomLessons && instanceLessons.length > 0) {
      await saveInstanceLessons(newInstanceId);
    }
    
    toast({ title: "הצלחה", description: mode === 'edit' ? "התוכנית עודכנה בהצלחה!" : "התוכנית נוצרה ושוייכה בהצלחה!" });
    onAssignmentComplete();
    onOpenChange(false);
  } catch (error) {
    console.error("Error saving:", error);
    toast({ title: "שגיאה", description: "אירעה שגיאה בשמירה", variant: "destructive" });
  } finally {
    setLoading(false);
  }
};
  // --- JSX Renderers ---
  const renderCourseAssignmentStep = () => (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const missingFields = [];
        if (!formData.institution_id) missingFields.push("מוסד");
        if (!formData.instructor_id) missingFields.push("מדריך");
        if (!formData.grade_level.trim()) missingFields.push("כיתה");
        if (missingFields.length > 0) {
          toast({ title: "שגיאה בטופס", description: `חסרים שדות חובה: ${missingFields.join(", ")}`, variant: "destructive" });
          return;
        }
        setStep(2);
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="institution">מוסד חינוכי</Label>
          <Select value={formData.institution_id} onValueChange={(value) => handleInputChange("institution_id", value)}>
            <SelectTrigger><SelectValue placeholder="בחר מוסד חינוכי" /></SelectTrigger>
            <SelectContent>
              {institutions.map((institution) => (<SelectItem key={institution.id} value={institution.id}>{institution.name}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="instructor">מדריך</Label>
          <Select value={formData.instructor_id} onValueChange={(value) => handleInputChange("instructor_id", value)}>
            <SelectTrigger><SelectValue placeholder="בחר מדריך" /></SelectTrigger>
            <SelectContent>
              {instructors.map((instructor) => (<SelectItem key={instructor.id} value={instructor.id}>{instructor.full_name}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="grade_level">כיתה</Label>
          <Input id="grade_level" value={formData.grade_level} onChange={(e) => handleInputChange("grade_level", e.target.value)} placeholder="למשל: כיתה ז'"/>
        </div>

        <div className="space-y-2">
          <Label htmlFor="price_for_customer">מחיר ללקוח</Label>
          <Input id="price_for_customer" type="number" value={formData.price_for_customer} onChange={(e) => handleInputChange("price_for_customer", e.target.value)} placeholder="מחיר בשקלים"/>
        </div>

        <div className="space-y-2">
          <Label htmlFor="price_for_instructor">מחיר למדריך</Label>
          <Input id="price_for_instructor" type="number" value={formData.price_for_instructor} onChange={(e) => handleInputChange("price_for_instructor", e.target.value)} placeholder="מחיר בשקלים"/>
        </div>
        


        {/* <div className="space-y-2">
          <Label htmlFor="start_date">תאריך התחלה</Label>
          <Input id="start_date" type="date" value={formData.start_date} onChange={(e) => handleInputChange("start_date", e.target.value)} />
        </div> */}
{/* 
        <div className="space-y-2">
          <Label htmlFor="end_date">תאריך סיום</Label>
          <Input id="end_date" type="date" value={formData.end_date} onChange={(e) => handleInputChange("end_date", e.target.value)} />
        </div>
      </div> */}
     <div className="space-y-2">
  <Label htmlFor="start_date">תאריך התחלה</Label>
  <Popover>
    <PopoverTrigger asChild>
      <Button
        variant="outline"
        className="w-full justify-start text-right font-normal"
      >
        <CalendarIcon className="ml-2 h-4 w-4" />
        {formData.start_date ? (
          formatDate(new Date(formData.start_date), "dd/MM/yyyy")
        ) : (
          <span>בחר תאריך התחלה</span>
        )}
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-auto p-0" align="start">
      <Calendar
        mode="single"
        selected={formData.start_date ? new Date(formData.start_date) : undefined}
        onSelect={(date) => {
          if (date) {
            handleInputChange("start_date", date.toISOString().split('T')[0]);
          }
        }}
        disabled={(date) => {
  const formatDate = (d: Date) => {
    return d.getFullYear() + "-" +
      String(d.getMonth() + 1).padStart(2, "0") + "-" +
      String(d.getDate()).padStart(2, "0");
  };

  const dateStr = formatDate(date);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return  disabledDates.some(disabledDate =>
    formatDate(disabledDate) === dateStr
  );
}}
        initialFocus
      />
    </PopoverContent>
  </Popover>
</div>
      <div className="space-y-2">
  <Label htmlFor="end_date">תאריך סיום</Label>
  <Popover>
    <PopoverTrigger asChild>
      <Button
        variant="outline"
        className="w-full justify-start text-right font-normal"
      >
        <CalendarIcon className="ml-2 h-4 w-4" />
        {formData.end_date ? (
          formatDate(new Date(formData.end_date), "dd/MM/yyyy")
        ) : (
          <span>בחר תאריך סיום</span>
        )}
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-auto p-0" align="start">
      <Calendar
        mode="single"
        selected={formData.end_date ? new Date(formData.end_date) : undefined}
        onSelect={(date) => {
          if (date) {
            handleInputChange("end_date", date.toISOString().split('T')[0]);
          }
        }}
        disabled={(date) => {
          const dateStr = date.toISOString().split('T')[0];
          const startDate = formData.start_date ? new Date(formData.start_date) : new Date();
          
          return  disabledDates.some(disabledDate => 
            disabledDate.toISOString().split('T')[0] === dateStr
          );
        }}
        initialFocus
      />
    </PopoverContent>
  </Popover>
</div>
</div>
      <DialogFooter className="flex justify-between">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>ביטול</Button>
        <Button type="submit" disabled={loading}>{loading ? (mode === 'edit' ? "מעדכן..." : "משייך...") : "המשך לתזמון"}</Button>
      </DialogFooter>
    </form>
  );

  const renderSchedulingStep = () => {
const lessonsToDisplay = [...templateLessons, ...instanceLessons];
    return (
      <div className="space-y-4">
        <div className="text-sm text-gray-600 mb-4">
          הגדר את לוח הזמנים הכללי עבור התוכנית "{courseName}"
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-purple-900 mb-2">שיעורים ייחודיים להקצאה</h3>
              <p className="text-sm text-purple-700 mb-3">
                {hasCustomLessons 
                  ? `יש ${instanceLessons.length} שיעורים ייחודיים להקצאה זו`
                  : "השתמש בשיעורי התבנית או צור שיעורים ייחודיים להקצאה זו"
                }
              </p>
              <div className="flex items-center gap-2">
                {hasCustomLessons ? (
                  <Badge className="bg-purple-100 text-purple-800 border-purple-200"><Settings className="h-3 w-3 mr-1" />שיעורים מותאמים</Badge>
                ) : (
                  <Badge variant="outline" className="bg-gray-100 text-gray-700"><BookOpen className="h-3 w-3 mr-1" />תבנית סטנדרטית</Badge>
                )}
              </div>
            </div>
            <Button type="button" variant="outline" onClick={() => setShowCustomLessonsDialog(true)} className="border-purple-300 text-purple-700 hover:bg-purple-100">
              <Settings className="h-4 w-4 mr-2" />
              נהל שיעורים
            </Button>
          </div>
        </div>

        {lessonsToDisplay.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 max-h-96 overflow-y-auto">
            <h3 className="font-semibold text-blue-900 mb-3">
              שיעורים בתוכנית ({lessonsToDisplay.length})
            </h3>
            <div className="space-y-4">
              {lessonsToDisplay.map((lesson, index) => (
                <div key={lesson.id || `lesson-${index}`} className="bg-white rounded-lg p-3 border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-blue-800">
                      <span className="font-medium">{index + 1}.</span> {lesson.title}
                    </div>
                    {lesson.tasks && lesson.tasks.length > 0 && (
                      <span className="text-blue-600 text-xs bg-blue-100 px-2 py-1 rounded">{lesson.tasks.length} משימות</span>
                    )}
                  </div>
                  {lesson.tasks && lesson.tasks.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {lesson.tasks.sort((a, b) => a.order_index - b.order_index).map((task, taskIndex) => (
                        <div key={task.id || `task-${taskIndex}`} className="bg-gray-50 p-2 rounded text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-gray-700">{task.title}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">{task.estimated_duration} דק'</span>
                              {task.is_mandatory ? (<span className="bg-red-100 text-red-600 px-1 py-0.5 rounded text-xs">חובה</span>) : (<span className="bg-gray-100 text-gray-600 px-1 py-0.5 rounded text-xs">רשות</span>)}
                            </div>
                          </div>
                          {task.description && (<p className="text-gray-600 text-xs">{task.description}</p>)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          {formData.start_date && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium">תקופת הקורס:</span>{" "}
                {formatDate(new Date(formData.start_date), "dd/MM/yyyy")}
                {formData.end_date && ` - ${formatDate(new Date(formData.end_date), "dd/MM/yyyy")}`}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>ימים בשבוע</Label>
            <div className="flex flex-wrap gap-2">
              {dayNames.map((day, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox id={`day-${index}`} checked={courseSchedule.days_of_week.includes(index)} onCheckedChange={() => toggleDayOfWeek(index)} />
                  <Label htmlFor={`day-${index}`} className="text-sm">{day}</Label>
                </div>
              ))}
            </div>
          </div>

          {courseSchedule.days_of_week.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">זמנים לכל יום:</Label>
              {courseSchedule.days_of_week.sort().map((dayIndex) => {
                const timeSlot = courseSchedule.time_slots.find(ts => ts.day === dayIndex);
                return (
                  <div key={dayIndex} className="border rounded p-3 bg-gray-50">
                    <div className="flex items-center gap-4">
                      <span className="min-w-[60px] text-sm font-medium">{dayNames[dayIndex]}:</span>
                      <div className="flex gap-2 flex-1">
                        <div className="flex-1">
                          <Label className="text-xs">התחלה</Label>
                          <Input type="time" value={timeSlot?.start_time || ""} onChange={(e) => updateTimeSlot(dayIndex, "start_time", e.target.value)} className="text-sm"/>
                        </div>
                        <div className="flex-1">
                          <Label className="text-xs">סיום</Label>
                          <Input type="time" value={timeSlot?.end_time || ""} onChange={(e) => updateTimeSlot(dayIndex, "end_time", e.target.value)} className="text-sm"/>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="total_lessons">מספר מפגשים כולל</Label>
<Input 
  id="total_lessons" 
  type="number" 
  min="1"
  value={courseSchedule.total_lessons || 1}
  onChange={(e) => setCourseSchedule(prev => ({
    ...prev, 
    total_lessons: parseInt(e.target.value) || 1 
  }))} 
  placeholder="מספר שיעורים"
/>       
</div>
            <div className="space-y-2">
              <Label htmlFor="lesson_duration">משך שיעור (דקות)</Label>
              <Input id="lesson_duration" type="number" min="15" step="15" value={courseSchedule.lesson_duration_minutes || ""} onChange={(e) => setCourseSchedule(prev => ({...prev, lesson_duration_minutes: parseInt(e.target.value) }))} placeholder="45"/>
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => setStep(1)}>חזור</Button>
          <Button onClick={handleFinalSave} disabled={loading}>{loading ? "שומר..." : "סיים ושמור"}</Button>
        </DialogFooter>
      </div>
    );
  };

  const renderCustomLessonsDialog = () => (
    <Dialog open={showCustomLessonsDialog} onOpenChange={setShowCustomLessonsDialog}>
      <DialogContent className="max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>ניהול שיעורים ייחודיים להקצאה</DialogTitle>
          <DialogDescription>צור או ערוך שיעורים ומשימות ייחודיים עבור הקצאה זו. השינויים לא ישפיעו על תבנית הקורס המקורית.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">{hasCustomLessons ? "שיעורים ייחודיים פעילים" : "אין שיעורים ייחודיים"}</h3>
              <p className="text-sm text-blue-700">{hasCustomLessons ? `יש ${instanceLessons.length} שיעורים ייחודיים להקצאה זו` : "השתמש בכפתור להעתקת שיעורי התבנית כנקודת התחלה"}</p>
            </div>
            <div className="flex gap-2">
              {!hasCustomLessons && templateLessons.length > 0 && (
                <Button type="button" onClick={copyTemplateLessonsToInstance} className="bg-green-600 hover:bg-green-700">העתק מתבנית</Button>
              )}
              {hasCustomLessons && (
                <Button type="button" variant="destructive" onClick={resetInstanceLessons}>חזור לתבנית</Button>
              )}
            </div>
          </div>
          {hasCustomLessons || templateLessons.length === 0 ? (
            <CourseLessonsSection  instanceId={instanceId} lessons={instanceLessons} onLessonsChange={handleInstanceLessonsChange} courseStartDate={formData.start_date} courseEndDate={formData.end_date} />
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">התחל ליצור שיעורים ייחודיים</h3>
              <p className="text-gray-600 mb-4">בחר להעתיק מהתבנית או להתחיל מאפס</p>
              <div className="flex gap-2 justify-center">
                <Button type="button" onClick={copyTemplateLessonsToInstance} className="bg-green-600 hover:bg-green-700">העתק מתבנית ({templateLessons.length} שיעורים)</Button>
                <Button type="button" variant="outline" onClick={startFromScratch}>התחל מאפס</Button>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setShowCustomLessonsDialog(false)}>סגור</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <>
      {scheduleWarnings.length > 0 && (
  <Alert variant="destructive" className="mb-4">
    <AlertCircle className="h-4 w-4" />
    <AlertDescription>
      <div className="space-y-1">
        <p className="font-medium">בעיות בלוח הזמנים:</p>
        {scheduleWarnings.map((warning, index) => (
          <p key={index} className="text-sm">• {warning}</p>
        ))}
      </div>
    </AlertDescription>
  </Alert>
)}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {step === 1 ? (mode === 'edit' ? "עריכת הקצאת תוכנית" : "שיוך תוכנית לימוד") : "הגדרת לוח זמנים"}
            </DialogTitle>
            <DialogDescription>
              {step === 1 ? (mode === 'edit' ? `עריכת הקצאת התוכנית "${editData?.name || courseName}"` : `שיוך התוכנית "${courseName}" למדריך, כיתה ומוסד לימודים`) : `הגדרת לוח הזמנים הכללי עבור התוכנית "${courseName}"`}
            </DialogDescription>
          </DialogHeader>
          {step === 1 ? renderCourseAssignmentStep() : renderSchedulingStep()}
        </DialogContent>
      </Dialog>
      {renderCustomLessonsDialog()}
    </>
  );
};

export default CourseAssignDialog;