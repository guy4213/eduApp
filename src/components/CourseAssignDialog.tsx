import React, { useState, useEffect } from "react";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Institution {
  id: string;
  name: string;
}

interface Instructor {
  id: string;
  full_name: string;
}

interface Lesson {
  id: string;
  title: string;

}

interface DaySchedule {
  day: number;
  start_time: string;
  end_time: string;
}

interface LessonSchedule {
  lesson_id: string;
  lesson_title: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  // New fields for instances
  create_instances: boolean;
  days_of_week: number[]; // [0,3] for Sun,Wed
  day_schedules: DaySchedule[]; // Per-day timing
  total_instances: number;
  instance_start_date: string;
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

// Utility function to combine class names
const cn = (...classes: (string | undefined | null | boolean)[]) => {
  return classes.filter(Boolean).join(' ');
};

// Date formatting function
const formatDate = (date: Date, formatString: string) => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  if (formatString === "dd/MM/yyyy") {
    return `${day}/${month}/${year}`;
  }
  if (formatString === "dd/MM") {
    return `${day}/${month}`;
  }
  return date.toLocaleDateString();
};

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
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [lessonSchedules, setLessonSchedules] = useState<LessonSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    institution_id: "",
    instructor_id: "",
    grade_level: "",
    price_for_customer: "",
    price_for_instructor: "",
    max_participants: "",
    start_date: "",
    end_date: "",
  });

  const dayNames = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

  // Helper function to find institution/instructor ID by name
  const findIdByName = (items: any[], name: string) => {
    const item = items.find(item => 
      item.name === name || item.full_name === name
    );
    return item?.id || "";
  };

  // Reset form when dialog opens
  const resetForm = () => {
    setFormData({
      institution_id: "",
      instructor_id: "",
      grade_level: "",
      price_for_customer: "",
      price_for_instructor: "",
      max_participants: "",
      start_date: "",
      end_date: "",
    });
    setStep(1);
    setLessonSchedules([]);
  };

  useEffect(() => {
    if (open) {
      fetchInstitutions();
      fetchInstructors();
      
      if (mode === 'create') {
        resetForm();
        if (courseId) {
          fetchCourseLessons();
        }
      } else if (mode === 'edit') {
        // Reset to step 1 for editing
        setStep(1);
        // Load existing lesson schedules instead of clearing them
        fetchExistingLessonSchedules();
      }
    }
  }, [open, courseId, mode, editData]);

  // Debug function to check if we can access the record
  const debugCourseInstance = async () => {
    if (mode === 'edit' && editData?.instance_id) {
      try {
        const { data, error } = await supabase
          .from("course_instances")
          .select("*")
          .eq("id", editData.instance_id)
          .single();

        console.log('DEBUG - Can read record:', data);
        console.log('DEBUG - Read error:', error);
        
        if (error) {
          toast({
            title: "שגיאה",
            description: `לא ניתן לגשת לרשומה: ${error.message}`,
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('DEBUG - Exception reading record:', error);
      }
    }
  };

  useEffect(() => {
    if (open && mode === 'edit') {
      debugCourseInstance();
    }
  }, [open, mode, editData]);

  // Populate form data when institutions/instructors are loaded and editData is available
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
  }, [mode, editData, institutions, instructors]);

  const fetchInstitutions = async () => {
    try {
      const { data, error } = await supabase
        .from("educational_institutions")
        .select("id, name")
        .order("name");

      if (error) throw error;
      setInstitutions(data || []);
    } catch (error) {
      console.error("Error fetching institutions:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לטעון את רשימת המוסדות",
        variant: "destructive",
      });
    }
  };

  const fetchInstructors = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("role", "instructor")
        .order("full_name");

      if (error) throw error;
      setInstructors(data || []);
    } catch (error) {
      console.error("Error fetching instructors:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לטעון את רשימת המדריכים",
        variant: "destructive",
      });
    }
  };

  const fetchCourseLessons = async () => {
    if (!courseId) return;
    
    try {
      const { data, error } = await supabase
        .from("lessons")
        .select("id, title")
        .eq("course_id", courseId)
    

      if (error) throw error;
      
      setLessons(data || []);
      const courseStartDate = formData.start_date || "";

      const initialSchedules = (data || []).map((lesson) => ({
        lesson_id: lesson.id,
        lesson_title: lesson.title,
        scheduled_date: courseStartDate,
        start_time: "",
        end_time: "",
        create_instances: false,
        days_of_week: [],
        day_schedules: [],
        total_instances: 1,
        instance_start_date: courseStartDate,
      }));
      setLessonSchedules(initialSchedules);
    } catch (error) {
      console.error("Error fetching lessons:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לטעון את רשימת השיעורים",
        variant: "destructive",
      });
    }
  };

  const fetchExistingLessonSchedules = async () => {
    if (!editData?.instance_id) return;
    
    try {
      // First, get the course_id from the instance
      const { data: instanceData, error: instanceError } = await supabase
        .from("course_instances")
        .select("course_id")
        .eq("id", editData.instance_id)
        .single();

      if (instanceError) throw instanceError;

      // Fetch lessons for this course
      const { data: lessonsData, error: lessonsError } = await supabase
        .from("lessons")
        .select("id, title")
        .eq("course_id", instanceData.course_id);

      if (lessonsError) throw lessonsError;

      setLessons(lessonsData || []);

      // Fetch existing lesson schedules for this instance
      const { data: schedulesData, error: schedulesError } = await supabase
        .from("lesson_schedules")
        .select("*")
        .eq("course_instance_id", editData.instance_id);

      if (schedulesError) throw schedulesError;

      // Group schedules by lesson_id to handle multiple instances
      const schedulesByLesson = new Map();
      
      schedulesData?.forEach((schedule) => {
        const lessonId = schedule.lesson_id;
        if (!schedulesByLesson.has(lessonId)) {
          schedulesByLesson.set(lessonId, []);
        }
        schedulesByLesson.get(lessonId).push(schedule);
      });

      // Create lesson schedules with existing data
      const formattedSchedules = (lessonsData || []).map((lesson) => {
        const existingSchedules = schedulesByLesson.get(lesson.id) || [];
        
        if (existingSchedules.length > 0) {
          // If multiple schedules exist, it means this lesson has instances
          if (existingSchedules.length > 1) {
            // Extract days of week and timing from existing schedules
            const daysOfWeek = [...new Set(existingSchedules.map(s => new Date(s.scheduled_start).getDay()))];
            const daySchedules = daysOfWeek.map(day => {
              const scheduleForDay = existingSchedules.find(s => new Date(s.scheduled_start).getDay() === day);
              return {
                day,
                start_time: scheduleForDay ? new Date(scheduleForDay.scheduled_start).toTimeString().slice(0, 5) : "",
                end_time: scheduleForDay ? new Date(scheduleForDay.scheduled_end).toTimeString().slice(0, 5) : "",
              };
            });

            return {
              lesson_id: lesson.id,
              lesson_title: lesson.title,
              scheduled_date: new Date(existingSchedules[0].scheduled_start).toISOString().split('T')[0],
              start_time: "",
              end_time: "",
              create_instances: true,
              days_of_week: daysOfWeek,
              day_schedules: daySchedules,
              total_instances: existingSchedules.length,
              instance_start_date: new Date(existingSchedules[0].scheduled_start).toISOString().split('T')[0],
            };
          } else {
            // Single lesson schedule
            const schedule = existingSchedules[0];
            const scheduledDate = new Date(schedule.scheduled_start);
            
            return {
              lesson_id: lesson.id,
              lesson_title: lesson.title,
              scheduled_date: scheduledDate.toISOString().split('T')[0],
              start_time: scheduledDate.toTimeString().slice(0, 5),
              end_time: new Date(schedule.scheduled_end).toTimeString().slice(0, 5),
              create_instances: false,
              days_of_week: [],
              day_schedules: [],
              total_instances: 1,
              instance_start_date: scheduledDate.toISOString().split('T')[0],
            };
          }
        } else {
          // No existing schedule for this lesson
          return {
            lesson_id: lesson.id,
            lesson_title: lesson.title,
            scheduled_date: editData.start_date || "",
            start_time: "",
            end_time: "",
            create_instances: false,
            days_of_week: [],
            day_schedules: [],
            total_instances: 1,
            instance_start_date: editData.start_date || "",
          };
        }
      });

      setLessonSchedules(formattedSchedules);
    } catch (error) {
      console.error("Error fetching existing lesson schedules:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לטעון את לוח הזמנים הקיים",
        variant: "destructive",
      });
    }
  };

  const handleCourseAssignment = async (): Promise<string | null> => {
    try {
      if (mode === 'create') {
        // Create new course instance
        const { data, error } = await supabase
          .from("course_instances")
          .insert([
            {
              course_id: courseId,
              institution_id: formData.institution_id,
              instructor_id: formData.instructor_id,
              grade_level: formData.grade_level,
              max_participants: parseInt(formData.max_participants),
              price_for_customer: parseFloat(formData.price_for_customer),
              price_for_instructor: parseFloat(formData.price_for_instructor),
              start_date: formData.start_date,
              end_date: formData.end_date,
            },
          ])
          .select()
          .single();

        if (error) throw error;
        return data.id;
      } else {
        // Edit mode - update existing instance
        const { error } = await supabase
          .from("course_instances")
          .update({
            institution_id: formData.institution_id,
            instructor_id: formData.instructor_id,
            grade_level: formData.grade_level,
            max_participants: parseInt(formData.max_participants),
            price_for_customer: parseFloat(formData.price_for_customer),
            price_for_instructor: parseFloat(formData.price_for_instructor),
            start_date: formData.start_date,
            end_date: formData.end_date,
          })
          .eq("id", editData?.instance_id);

        if (error) throw error;
        return editData?.instance_id || null;
      }
    } catch (error) {
      console.error("Error with course assignment:", error);
      toast({
        title: "שגיאה",
        description: mode === 'create' 
          ? "אירעה שגיאה בשיוך התוכנית" 
          : "אירעה שגיאה בעדכון התוכנית",
        variant: "destructive",
      });
      return null;
    }
  };

  // Function to generate multiple instances with per-day timing
  const generateLessonInstances = (schedule: LessonSchedule) => {
    const courseStart = new Date(formData.start_date);
    const courseEnd = new Date(formData.end_date);

    const instances = [];
    const currentDate = new Date(schedule.instance_start_date);
    let createdCount = 0;

    let lastInstanceDate: Date | null = null;

    while (createdCount < schedule.total_instances) {
      const dayOfWeek = currentDate.getDay();

      if (schedule.days_of_week.includes(dayOfWeek)) {
        const dateStr = currentDate.toISOString().split("T")[0];

        const daySchedule = schedule.day_schedules.find(
          (ds) => ds.day === dayOfWeek
        );

        if (daySchedule?.start_time && daySchedule?.end_time) {
          // Check range
          if (currentDate < courseStart || currentDate > courseEnd) {
            const attempted = currentDate.toISOString().split("T")[0];
            const allowedEnd = courseEnd.toISOString().split("T")[0];

            return {
              success: false,
              error: `תאריך המפגש האחרון שנוצר (${attempted}) חורג מתאריך סיום הקורס (${allowedEnd}). נסה לשנות את תאריך ההתחלה או להקטין את מספר המפגשים.`,
              lastInstanceDate: attempted,
            };
          }

          instances.push({
            course_instance_id: "",
            lesson_id: schedule.lesson_id,
            scheduled_start: `${dateStr}T${daySchedule.start_time}:00`,
            scheduled_end: `${dateStr}T${daySchedule.end_time}:00`,
            instance_number: createdCount + 1,
          });

          lastInstanceDate = new Date(currentDate);
          createdCount++;
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    const lastDateStr = lastInstanceDate
      ? lastInstanceDate.toISOString().split("T")[0]
      : null;

    return {
      success: true,
      instances,
      finalDateMessage: `המפגש האחרון יתקיים בתאריך ${lastDateStr}`,
    };
  };

  const validateLessonDates = () => {
    if (!formData.start_date || !formData.end_date) {
      return {
        valid: false,
        message: "נא להגדיר תאריכי התחלה וסיום לתוכנית לפני תזמון שיעורים.",
      };
    }
    const courseStart = new Date(formData.start_date);
    const courseEnd = new Date(formData.end_date);

    for (const schedule of lessonSchedules) {
      if (schedule.create_instances) {
        const instanceStart = new Date(schedule.instance_start_date);
        if (instanceStart < courseStart || instanceStart > courseEnd) {
          return {
            valid: false,
            message: `תאריך התחלה של שיעור "${schedule.lesson_title}" מחוץ לתחום התוכנית.`,
          };
        }
      } else {
        if (!schedule.scheduled_date) continue;
        const lessonDate = new Date(schedule.scheduled_date);
        if (lessonDate < courseStart || lessonDate > courseEnd) {
          return {
            valid: false,
            message: `תאריך השיעור "${schedule.lesson_title}" מחוץ לתחום התוכנית.`,
          };
        }
      }
    }

    return { valid: true };
  };

  const saveLessonSchedules = async (instanceId: string, allInstances: any[]) => {
    try {
      if (mode === 'edit') {
        // For edit mode, delete existing schedules and insert new ones
        const { error: deleteError } = await supabase
          .from("lesson_schedules")
          .delete()
          .eq("course_instance_id", instanceId);

        if (deleteError) throw deleteError;
      }

      // Insert new/updated schedules
      if (allInstances.length > 0) {
        const { error } = await supabase
          .from("lesson_schedules")
          .insert(allInstances);

        if (error) throw error;
      }
    } catch (error) {
      console.error("Error saving lesson schedules:", error);
      throw error;
    }
  };

  const handleFinalSave = async () => {
    setLoading(true);
    try {
      if (mode === 'edit') {
        // For edit mode, update the course instance and lesson schedules
        const result = await handleCourseAssignment();
        if (result) {
          // Process lesson schedules for edit mode
          const allInstances = [];
          
          for (const schedule of lessonSchedules) {
            if (schedule.create_instances) {
              const instanceResult = generateLessonInstances(schedule);

              if (!instanceResult.success) {
                toast({
                  title: "שגיאה",
                  variant: "destructive",
                  description: instanceResult.error,
                });
                setLoading(false);
                return;
              }

              instanceResult.instances.forEach((instance) => {
                instance.course_instance_id = result;
              });

              allInstances.push(...instanceResult.instances);
            } else {
              // Single lesson schedule
              if (schedule.scheduled_date && schedule.start_time && schedule.end_time) {
                allInstances.push({
                  course_instance_id: result,
                  lesson_id: schedule.lesson_id,
                  scheduled_start: `${schedule.scheduled_date}T${schedule.start_time}:00`,
                  scheduled_end: `${schedule.scheduled_date}T${schedule.end_time}:00`,
                });
              }
            }
          }

          // Save updated lesson schedules
          await saveLessonSchedules(result, allInstances);
          
          toast({
            title: "הצלחה",
            description: "התוכנית ולוח הזמנים עודכנו בהצלחה!",
          });
          onAssignmentComplete();
          onOpenChange(false);
        }
        return;
      }

      // Create mode - proceed with full flow including lesson scheduling
      const validation = validateLessonDates();
      if (!validation.valid) {
        toast({
          title: "שגיאה בתאריכים",
          description: validation.message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const instanceId = await handleCourseAssignment();
      if (!instanceId) return;

      const allInstances = [];
      let totalCount = 0;

      for (const schedule of lessonSchedules) {
        if (schedule.create_instances) {
          const result = generateLessonInstances(schedule);

          if (!result.success) {
            toast({
              title: "שגיאה",
              variant: "destructive",
              description: result.error,
            });
            return;
          }

          result.instances.forEach((instance) => {
            instance.course_instance_id = instanceId;
          });

          allInstances.push(...result.instances);
          totalCount += result.instances.length;

          console.log(result.finalDateMessage);
        } else {
          // Single lesson schedule
          if (schedule.scheduled_date && schedule.start_time && schedule.end_time) {
            allInstances.push({
              course_instance_id: instanceId,
              lesson_id: schedule.lesson_id,
              scheduled_start: `${schedule.scheduled_date}T${schedule.start_time}:00`,
              scheduled_end: `${schedule.scheduled_date}T${schedule.end_time}:00`,
            });
            totalCount++;
          }
        }
      }

      if (allInstances.length > 0) {
        await saveLessonSchedules(instanceId, allInstances);
      }

      toast({
        title: "הצלחה",
        description: `התוכנית נשמרה עם ${totalCount} מופעי שיעורים!${
          allInstances.length > 0
            ? "\nהמפגש האחרון בתוכנית יתקיים בתאריך " +
              allInstances[allInstances.length - 1].scheduled_start.split(
                "T"
              )[0]
            : ""
        }`,
      });
      onAssignmentComplete();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving:", error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בשמירה",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateLessonSchedule = (
    lessonId: string,
    field: string,
    value: any
  ) => {
    setLessonSchedules((prev) =>
      prev.map((schedule) =>
        schedule.lesson_id === lessonId
          ? { ...schedule, [field]: value }
          : schedule
      )
    );
  };

  const toggleDayOfWeek = (lessonId: string, dayIndex: number) => {
    setLessonSchedules((prev) =>
      prev.map((schedule) => {
        if (schedule.lesson_id === lessonId) {
          const isRemoving = schedule.days_of_week.includes(dayIndex);
          const newDays = isRemoving
            ? schedule.days_of_week.filter((d) => d !== dayIndex)
            : [...schedule.days_of_week, dayIndex];

          let newDaySchedules = [...schedule.day_schedules];

          if (isRemoving) {
            newDaySchedules = newDaySchedules.filter(
              (ds) => ds.day !== dayIndex
            );
          } else {
            newDaySchedules.push({
              day: dayIndex,
              start_time: "",
              end_time: "",
            });
          }

          return {
            ...schedule,
            days_of_week: newDays,
            day_schedules: newDaySchedules,
          };
        }
        return schedule;
      })
    );
  };

  const updateDaySchedule = (
    lessonId: string,
    dayIndex: number,
    field: "start_time" | "end_time",
    value: string
  ) => {
    setLessonSchedules((prev) =>
      prev.map((schedule) => {
        if (schedule.lesson_id === lessonId) {
          const newDaySchedules = schedule.day_schedules.map((ds) =>
            ds.day === dayIndex ? { ...ds, [field]: value } : ds
          );
          return { ...schedule, day_schedules: newDaySchedules };
        }
        return schedule;
      })
    );
  };

  const renderCourseAssignmentStep = () => (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        
        // Validation
        if (
          !formData.institution_id ||
          !formData.instructor_id ||
          !formData.grade_level.trim()
        ) {
          toast({
            title: "שגיאה בטופס",
            description: "אנא בחר מוסד, מדריך והזן כיתה לפני המשך.",
            variant: "destructive",
          });
          return;
        }

        // Additional validation for edit mode
        if (mode === 'edit' && !editData?.instance_id) {
          toast({
            title: "שגיאה בטופס",
            description: "חסר מזהה ההקצאה לעדכון.",
            variant: "destructive",
          });
          return;
        }

        console.log('Form submission - Mode:', mode);
        console.log('Form submission - Form Data:', formData);
        console.log('Form submission - Edit Data:', editData);
        
        if (mode === 'edit') {
          // In edit mode, save immediately without going to step 2
          handleFinalSave();
        } else {
          // In create mode, proceed to lesson scheduling
          setStep(2);
        }
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="institution">מוסד חינוכי</Label>
          <Select
            value={formData.institution_id}
            onValueChange={(value) =>
              handleInputChange("institution_id", value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="בחר מוסד חינוכי" />
            </SelectTrigger>
            <SelectContent>
              {institutions.map((institution) => (
                <SelectItem key={institution.id} value={institution.id}>
                  {institution.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="instructor">מדריך</Label>
          <Select
            value={formData.instructor_id}
            onValueChange={(value) => handleInputChange("instructor_id", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="בחר מדריך" />
            </SelectTrigger>
            <SelectContent>
              {instructors.map((instructor) => (
                <SelectItem key={instructor.id} value={instructor.id}>
                  {instructor.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="grade_level">כיתה</Label>
          <Input
            id="grade_level"
            value={formData.grade_level}
            onChange={(e) => handleInputChange("grade_level", e.target.value)}
            placeholder="למשל: כיתה ז'"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="price_for_customer">מחיר ללקוח</Label>
          <Input
            id="price_for_customer"
            type="number"
            value={formData.price_for_customer}
            onChange={(e) =>
              handleInputChange("price_for_customer", e.target.value)
            }
            placeholder="מחיר בשקלים"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="price_for_instructor">מחיר למדריך</Label>
          <Input
            id="price_for_instructor"
            type="number"
            value={formData.price_for_instructor}
            onChange={(e) =>
              handleInputChange("price_for_instructor", e.target.value)
            }
            placeholder="מחיר בשקלים"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="max_participants">מספר משתתפים מקסימלי</Label>
          <Input
            id="max_participants"
            type="number"
            value={formData.max_participants}
            onChange={(e) =>
              handleInputChange("max_participants", e.target.value)
            }
            placeholder="מספר משתתפים"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="start_date">תאריך התחלה</Label>
          <Input
            id="start_date"
            type="date"
            value={formData.start_date}
            onChange={(e) => handleInputChange("start_date", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="end_date">תאריך סיום</Label>
          <Input
            id="end_date"
            type="date"
            value={formData.end_date}
            onChange={(e) => handleInputChange("end_date", e.target.value)}
          />
        </div>
      </div>

      <DialogFooter className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
        >
          ביטול
        </Button>
        <Button type="submit" disabled={loading}>
          {loading 
            ? (mode === 'edit' ? "מעדכן..." : "משייך...") 
            : (mode === 'edit' ? "עדכן" : "המשך לתזמון שיעורים")
          }
        </Button>
      </DialogFooter>
    </form>
  );

  const renderLessonSchedulingStep = () => (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-4">
        כעת ניתן לתזמן את השיעורים עבור התוכנית "{courseName}"
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {lessonSchedules.map((schedule) => (
          <div
            key={schedule.lesson_id}
            className="border rounded-lg p-4 space-y-3"
          >
            <h4 className="font-medium text-right">{schedule.lesson_title}</h4>

            <div className="flex items-center space-x-2">
              <Checkbox
                id={`instances-${schedule.lesson_id}`}
                checked={schedule.create_instances}
                onCheckedChange={(checked) =>
                  updateLessonSchedule(
                    schedule.lesson_id,
                    "create_instances",
                    checked
                  )
                }
              />
              <Label htmlFor={`instances-${schedule.lesson_id}`}>
                צור מופעים מרובים (חזרות קבועות)
              </Label>
            </div>

            {!schedule.create_instances ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>תאריך</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !schedule.scheduled_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {schedule.scheduled_date
                          ? formatDate(
                              new Date(schedule.scheduled_date),
                              "dd/MM/yyyy"
                            )
                          : "בחר תאריך"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={
                          schedule.scheduled_date
                            ? new Date(schedule.scheduled_date)
                            : undefined
                        }
                        onSelect={(date) =>
                          updateLessonSchedule(
                            schedule.lesson_id,
                            "scheduled_date",
                            date ? date.toISOString().split("T")[0] : ""
                          )
                        }
                        disabled={(date) => {
                          const courseStart = new Date(formData.start_date);
                          courseStart.setDate(courseStart.getDate() - 1);
                          const courseEnd = new Date(formData.end_date);
                          return date < courseStart || date > courseEnd;
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>שעת התחלה</Label>
                  <Input
                    type="time"
                    value={schedule.start_time}
                    onChange={(e) =>
                      updateLessonSchedule(
                        schedule.lesson_id,
                        "start_time",
                        e.target.value
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>שעת סיום</Label>
                  <Input
                    type="time"
                    value={schedule.end_time}
                    onChange={(e) =>
                      updateLessonSchedule(
                        schedule.lesson_id,
                        "end_time",
                        e.target.value
                      )
                    }
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>ימים בשבוע</Label>
                  <div className="flex flex-wrap gap-2">
                    {dayNames.map((day, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Checkbox
                          id={`day-${schedule.lesson_id}-${index}`}
                          checked={schedule.days_of_week.includes(index)}
                          onCheckedChange={() =>
                            toggleDayOfWeek(schedule.lesson_id, index)
                          }
                        />
                        <Label
                          htmlFor={`day-${schedule.lesson_id}-${index}`}
                          className="text-sm"
                        >
                          {day}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {schedule.days_of_week.length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">
                      זמנים לכל יום:
                    </Label>
                    {schedule.days_of_week.sort().map((dayIndex) => {
                      const daySchedule = schedule.day_schedules.find(
                        (ds) => ds.day === dayIndex
                      );
                      return (
                        <div
                          key={dayIndex}
                          className="border rounded p-3 bg-gray-50"
                        >
                          <div className="flex items-center gap-4">
                            <span className="min-w-[60px] text-sm font-medium">
                              {dayNames[dayIndex]}:
                            </span>
                            <div className="flex gap-2 flex-1">
                              <div className="flex-1">
                                <Label className="text-xs">התחלה</Label>
                                <Input
                                  type="time"
                                  value={daySchedule?.start_time || ""}
                                  onChange={(e) =>
                                    updateDaySchedule(
                                      schedule.lesson_id,
                                      dayIndex,
                                      "start_time",
                                      e.target.value
                                    )
                                  }
                                  className="text-sm"
                                />
                              </div>
                              <div className="flex-1">
                                <Label className="text-xs">סיום</Label>
                                <Input
                                  type="time"
                                  value={daySchedule?.end_time || ""}
                                  onChange={(e) =>
                                    updateDaySchedule(
                                      schedule.lesson_id,
                                      dayIndex,
                                      "end_time",
                                      e.target.value
                                    )
                                  }
                                  className="text-sm"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Start date for instances */}
                  <div className="space-y-2">
                    <Label>תאריך התחלה</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !schedule.instance_start_date &&
                              "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {schedule.instance_start_date
                            ? formatDate(
                                new Date(schedule.instance_start_date),
                                "dd/MM"
                              )
                            : "תאריך"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={
                            schedule.instance_start_date
                              ? new Date(schedule.instance_start_date)
                              : undefined
                          }
                          onSelect={(date) =>
                            updateLessonSchedule(
                              schedule.lesson_id,
                              "instance_start_date",
                              date ? date.toISOString().split("T")[0] : ""
                            )
                          }
                          disabled={(date) => {
                            const courseStart = new Date(formData.start_date);
                            courseStart.setDate(courseStart.getDate() - 1);
                            const courseEnd = new Date(formData.end_date);
                            return date < courseStart || date > courseEnd;
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>מספר מופעים</Label>
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={schedule.total_instances}
                      onChange={(e) =>
                        updateLessonSchedule(
                          schedule.lesson_id,
                          "total_instances",
                          parseInt(e.target.value)
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <DialogFooter className="flex justify-between">
        <Button type="button" variant="outline" onClick={() => setStep(1)}>
          חזור
        </Button>
        <Button onClick={handleFinalSave} disabled={loading}>
          {loading ? "שומר..." : "סיים ושמור"}
        </Button>
      </DialogFooter>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 1 
              ? (mode === 'edit' ? "עריכת הקצאת תוכנית" : "שיוך תוכנית לימוד") 
              : "תזמון שיעורים"
            }
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? (mode === 'edit' 
                  ? `עריכת הקצאת התוכנית "${editData?.name || courseName}"` 
                  : `שיוך התוכנית "${courseName}" למדריך, כיתה ומוסד לימודים`
                )
              : `תזמון השיעורים עבור התוכנית "${courseName}"`}
          </DialogDescription>
        </DialogHeader>

        {step === 1
          ? renderCourseAssignmentStep()
          : renderLessonSchedulingStep()}
      </DialogContent>
    </Dialog>
  );
};

export default CourseAssignDialog;