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
import { CalendarIcon, Plus, Trash2, Edit } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface Institution {
  id: string;
  name: string;
}

interface Instructor {
  id: string;
  full_name: string;
}

interface CurriculumLesson {
  id: string;
  title: string;
  description?: string;
  order_index: number;
  course_id: string;
}

interface CurriculumTask {
  id: string;
  title: string;
  description?: string;
  estimated_duration?: number;
  is_mandatory?: boolean;
  order_index: number;
  curriculum_lesson_id: string;
}

interface Lesson {
  id: string;
  title: string;
  description?: string;
  order_index?: number;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  estimated_duration?: number;
  is_mandatory?: boolean;
  order_index: number;
  lesson_id: string;
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
  const [curriculumLessons, setCurriculumLessons] = useState<CurriculumLesson[]>([]);
  const [lessonSchedules, setLessonSchedules] = useState<LessonSchedule[]>([]);
  const [lessonTasks, setLessonTasks] = useState<{[key: string]: Task[]}>({});
  const [curriculumTasks, setCurriculumTasks] = useState<{[key: string]: CurriculumTask[]}>({});
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [editingLessons, setEditingLessons] = useState(false);
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
        setLessonSchedules([]);
        // Fetch lessons for editing
        if (courseId) {
          fetchCourseLessons();
        }
      }
    }
  }, [open, courseId, mode]);

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
      // Try to fetch curriculum lessons first (new structure)
      let curriculumData: CurriculumLesson[] = [];
      try {
        const { data, error } = await supabase
          .from("curriculum_lessons")
          .select("*")
          .eq("course_id", courseId)
          .order("order_index");

        if (!error && data) {
          curriculumData = data;
          setCurriculumLessons(curriculumData);
          await fetchCurriculumTasks(curriculumData);
        }
      } catch (err) {
        console.warn("Curriculum lessons table not available, using fallback");
      }

      // If no curriculum lessons, use empty array for now
      if (curriculumData.length === 0) {
        setCurriculumLessons([]);
        setCurriculumTasks({});
      }
      
      // For lesson scheduling, also fetch scheduled lessons
      const { data: scheduledData, error: scheduledError } = await supabase
        .from("lessons")
        .select("id, title")
        .eq("course_id", courseId)
        .order("created_at");

      if (scheduledError) {
        console.warn("No scheduled lessons found:", scheduledError);
      }
      
      setLessons(scheduledData || []);
      const courseStartDate = formData.start_date || "";

      const initialSchedules = (scheduledData || []).map((lesson) => ({
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

  const fetchCurriculumTasks = async (curriculumLessons: CurriculumLesson[]) => {
    try {
      const tasks: {[key: string]: CurriculumTask[]} = {};
      
      for (const lesson of curriculumLessons) {
        try {
          const { data, error } = await supabase
            .from("curriculum_tasks")
            .select("*")
            .eq("curriculum_lesson_id", lesson.id)
            .order("order_index");

          if (!error && data) {
            tasks[lesson.id] = data;
          } else {
            tasks[lesson.id] = [];
          }
        } catch (err) {
          console.warn("Curriculum tasks table not available");
          tasks[lesson.id] = [];
        }
      }
      
      setCurriculumTasks(tasks);
    } catch (error) {
      console.error("Error fetching curriculum tasks:", error);
      setCurriculumTasks({});
    }
  };

  // CRUD operations for curriculum lessons
  const createCurriculumLesson = async (lesson: Omit<CurriculumLesson, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from("curriculum_lessons")
        .insert([lesson])
        .select()
        .single();

      if (error) {
        console.error("Error creating curriculum lesson:", error);
        throw new Error("אירעה שגיאה ביצירת השיעור. יתכן שהטבלאות עדיין לא נוצרו במסד הנתונים.");
      }
      return data;
    } catch (error) {
      console.error("Error creating curriculum lesson:", error);
      throw error;
    }
  };

  const updateCurriculumLesson = async (lessonId: string, updates: Partial<CurriculumLesson>) => {
    try {
      const { data, error } = await supabase
        .from("curriculum_lessons")
        .update(updates)
        .eq("id", lessonId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error updating curriculum lesson:", error);
      throw error;
    }
  };

  const deleteCurriculumLesson = async (lessonId: string) => {
    try {
      // First delete all tasks for this lesson
      await supabase
        .from("curriculum_tasks")
        .delete()
        .eq("curriculum_lesson_id", lessonId);

      // Then delete the lesson
      const { error } = await supabase
        .from("curriculum_lessons")
        .delete()
        .eq("id", lessonId);

      if (error) throw error;
    } catch (error) {
      console.error("Error deleting curriculum lesson:", error);
      throw error;
    }
  };

  // CRUD operations for curriculum tasks
  const createCurriculumTask = async (task: Omit<CurriculumTask, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from("curriculum_tasks")
        .insert([task])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error creating curriculum task:", error);
      throw error;
    }
  };

  const updateCurriculumTask = async (taskId: string, updates: Partial<CurriculumTask>) => {
    try {
      const { data, error } = await supabase
        .from("curriculum_tasks")
        .update(updates)
        .eq("id", taskId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error updating curriculum task:", error);
      throw error;
    }
  };

  const deleteCurriculumTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from("curriculum_tasks")
        .delete()
        .eq("id", taskId);

      if (error) throw error;
    } catch (error) {
      console.error("Error deleting curriculum task:", error);
      throw error;
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
      const { error } = await supabase
        .from("lesson_schedules")
        .insert(allInstances);

      if (error) throw error;
    } catch (error) {
      console.error("Error saving lesson schedules:", error);
      throw error;
    }
  };

  const handleFinalSave = async () => {
    setLoading(true);
    try {
      if (mode === 'edit') {
        // For edit mode, just update the course instance
        const result = await handleCourseAssignment();
        if (result) {
          toast({
            title: "הצלחה",
            description: "התוכנית עודכנה בהצלחה!",
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
          // In edit mode, save immediately without going to step 2 unless editing lessons
          if (editingLessons) {
            setStep(3); // Go to lesson editing step
          } else {
            handleFinalSave();
          }
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
        <div className="flex gap-2">
          {mode === 'edit' && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingLessons(true)}
              disabled={loading}
            >
              ערוך שיעורים ומשימות
            </Button>
          )}
          <Button type="submit" disabled={loading}>
            {loading 
              ? (mode === 'edit' ? "מעדכן..." : "משייך...") 
              : (mode === 'edit' ? (editingLessons ? "המשך לעריכת שיעורים" : "עדכן") : "המשך לתזמון שיעורים")
            }
          </Button>
        </div>
      </DialogFooter>
    </form>
  );

  const renderLessonEditingStep = () => {
    const [editingLesson, setEditingLesson] = useState<CurriculumLesson | null>(null);
    const [editingTask, setEditingTask] = useState<CurriculumTask | null>(null);
    const [newLessonData, setNewLessonData] = useState({ title: '', description: '' });
    const [newTaskData, setNewTaskData] = useState({ 
      title: '', 
      description: '', 
      estimated_duration: 30, 
      is_mandatory: false 
    });

    const handleAddLesson = async () => {
      if (!newLessonData.title.trim() || !courseId) return;
      
      try {
        setLoading(true);
        const newLesson = await createCurriculumLesson({
          title: newLessonData.title,
          description: newLessonData.description,
          order_index: curriculumLessons.length,
          course_id: courseId,
        });

        setCurriculumLessons([...curriculumLessons, newLesson]);
        setCurriculumTasks({...curriculumTasks, [newLesson.id]: []});
        setNewLessonData({ title: '', description: '' });
        
        toast({
          title: "הצלחה",
          description: "השיעור נוסף בהצלחה",
        });
      } catch (error) {
        toast({
          title: "שגיאה",
          description: "אירעה שגיאה בהוספת השיעור",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    const handleUpdateLesson = async () => {
      if (!editingLesson || !editingLesson.title.trim()) return;
      
      try {
        setLoading(true);
        const updatedLesson = await updateCurriculumLesson(editingLesson.id, {
          title: editingLesson.title,
          description: editingLesson.description,
        });

        setCurriculumLessons(curriculumLessons.map(l => l.id === editingLesson.id ? updatedLesson : l));
        setEditingLesson(null);
        
        toast({
          title: "הצלחה",
          description: "השיעור עודכן בהצלחה",
        });
      } catch (error) {
        toast({
          title: "שגיאה",
          description: "אירעה שגיאה בעדכון השיעור",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    const handleDeleteLesson = async (lessonId: string) => {
      try {
        setLoading(true);
        await deleteCurriculumLesson(lessonId);
        
        setCurriculumLessons(curriculumLessons.filter(l => l.id !== lessonId));
        const newTasks = { ...curriculumTasks };
        delete newTasks[lessonId];
        setCurriculumTasks(newTasks);
        
        toast({
          title: "הצלחה",
          description: "השיעור נמחק בהצלחה",
        });
      } catch (error) {
        toast({
          title: "שגיאה",
          description: "אירעה שגיאה במחיקת השיעור",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    const handleAddTask = async (lessonId: string) => {
      if (!newTaskData.title.trim()) return;
      
      try {
        setLoading(true);
        const currentTasks = curriculumTasks[lessonId] || [];
        const newTask = await createCurriculumTask({
          title: newTaskData.title,
          description: newTaskData.description,
          estimated_duration: newTaskData.estimated_duration,
          is_mandatory: newTaskData.is_mandatory,
          order_index: currentTasks.length,
          curriculum_lesson_id: lessonId,
        });

        setCurriculumTasks({
          ...curriculumTasks,
          [lessonId]: [...currentTasks, newTask]
        });
        setNewTaskData({ title: '', description: '', estimated_duration: 30, is_mandatory: false });
        
        toast({
          title: "הצלחה",
          description: "המשימה נוספה בהצלחה",
        });
      } catch (error) {
        toast({
          title: "שגיאה",
          description: "אירעה שגיאה בהוספת המשימה",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    const handleUpdateTask = async () => {
      if (!editingTask || !editingTask.title.trim()) return;
      
      try {
        setLoading(true);
        const updatedTask = await updateCurriculumTask(editingTask.id, {
          title: editingTask.title,
          description: editingTask.description,
          estimated_duration: editingTask.estimated_duration,
          is_mandatory: editingTask.is_mandatory,
        });

        const lessonId = editingTask.curriculum_lesson_id;
        const currentTasks = curriculumTasks[lessonId] || [];
        setCurriculumTasks({
          ...curriculumTasks,
          [lessonId]: currentTasks.map(t => t.id === editingTask.id ? updatedTask : t)
        });
        setEditingTask(null);
        
        toast({
          title: "הצלחה",
          description: "המשימה עודכנה בהצלחה",
        });
      } catch (error) {
        toast({
          title: "שגיאה",
          description: "אירעה שגיאה בעדכון המשימה",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    const handleDeleteTask = async (taskId: string, lessonId: string) => {
      try {
        setLoading(true);
        await deleteCurriculumTask(taskId);
        
        const currentTasks = curriculumTasks[lessonId] || [];
        setCurriculumTasks({
          ...curriculumTasks,
          [lessonId]: currentTasks.filter(t => t.id !== taskId)
        });
        
        toast({
          title: "הצלחה",
          description: "המשימה נמחקה בהצלחה",
        });
      } catch (error) {
        toast({
          title: "שגיאה",
          description: "אירעה שגיאה במחיקת המשימה",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="space-y-6">
        <div className="text-sm text-gray-600 mb-4">
          עריכת שיעורים ומשימות עבור התוכנית "{courseName}"
        </div>

        {/* Add new lesson */}
        <Card>
          <CardHeader>
            <CardTitle>הוסף שיעור חדש</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="lesson-title">כותרת השיעור</Label>
              <Input
                id="lesson-title"
                value={newLessonData.title}
                onChange={(e) => setNewLessonData({...newLessonData, title: e.target.value})}
                placeholder="הכנס כותרת השיעור"
              />
            </div>
            <div>
              <Label htmlFor="lesson-description">תיאור השיעור</Label>
              <Textarea
                id="lesson-description"
                value={newLessonData.description}
                onChange={(e) => setNewLessonData({...newLessonData, description: e.target.value})}
                placeholder="הכנס תיאור השיעור"
              />
            </div>
            <Button onClick={handleAddLesson} disabled={loading}>
              <Plus className="w-4 h-4 mr-2" />
              הוסף שיעור
            </Button>
          </CardContent>
        </Card>

        {/* Existing lessons */}
        <div className="space-y-4">
          {curriculumLessons.map((lesson) => (
            <Card key={lesson.id}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">{lesson.title}</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingLesson(lesson)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteLesson(lesson.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {lesson.description && (
                  <p className="text-sm text-gray-600">{lesson.description}</p>
                )}
              </CardHeader>
              <CardContent>
                {/* Tasks for this lesson */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">משימות</h4>
                  </div>
                  
                  {/* Add new task */}
                  <div className="border rounded p-4 bg-gray-50 space-y-3">
                    <h5 className="font-medium text-sm">הוסף משימה חדשה</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor={`task-title-${lesson.id}`}>כותרת המשימה</Label>
                        <Input
                          id={`task-title-${lesson.id}`}
                          value={newTaskData.title}
                          onChange={(e) => setNewTaskData({...newTaskData, title: e.target.value})}
                          placeholder="הכנס כותרת המשימה"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`task-duration-${lesson.id}`}>זמן משוער (דקות)</Label>
                        <Input
                          id={`task-duration-${lesson.id}`}
                          type="number"
                          value={newTaskData.estimated_duration}
                          onChange={(e) => setNewTaskData({...newTaskData, estimated_duration: parseInt(e.target.value) || 30})}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor={`task-description-${lesson.id}`}>תיאור המשימה</Label>
                      <Textarea
                        id={`task-description-${lesson.id}`}
                        value={newTaskData.description}
                        onChange={(e) => setNewTaskData({...newTaskData, description: e.target.value})}
                        placeholder="הכנס תיאור המשימה"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`task-mandatory-${lesson.id}`}
                        checked={newTaskData.is_mandatory}
                        onCheckedChange={(checked) => setNewTaskData({...newTaskData, is_mandatory: checked as boolean})}
                      />
                      <Label htmlFor={`task-mandatory-${lesson.id}`}>משימה חובה</Label>
                    </div>
                    <Button
                      onClick={() => handleAddTask(lesson.id)}
                      disabled={loading}
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      הוסף משימה
                    </Button>
                  </div>

                  {/* Existing tasks */}
                  {(curriculumTasks[lesson.id] || []).map((task) => (
                    <div key={task.id} className="border rounded p-3 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h6 className="font-medium">{task.title}</h6>
                          {task.description && (
                            <p className="text-sm text-gray-600">{task.description}</p>
                          )}
                          <div className="flex gap-4 text-xs text-gray-500 mt-1">
                            <span>{task.estimated_duration} דקות</span>
                            {task.is_mandatory && <Badge variant="secondary">חובה</Badge>}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingTask(task)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteTask(task.id, lesson.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Edit lesson dialog */}
        {editingLesson && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">ערוך שיעור</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-lesson-title">כותרת השיעור</Label>
                  <Input
                    id="edit-lesson-title"
                    value={editingLesson.title}
                    onChange={(e) => setEditingLesson({...editingLesson, title: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-lesson-description">תיאור השיעור</Label>
                  <Textarea
                    id="edit-lesson-description"
                    value={editingLesson.description || ''}
                    onChange={(e) => setEditingLesson({...editingLesson, description: e.target.value})}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditingLesson(null)}>
                    ביטול
                  </Button>
                  <Button onClick={handleUpdateLesson} disabled={loading}>
                    עדכן
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit task dialog */}
        {editingTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">ערוך משימה</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-task-title">כותרת המשימה</Label>
                  <Input
                    id="edit-task-title"
                    value={editingTask.title}
                    onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-task-description">תיאור המשימה</Label>
                  <Textarea
                    id="edit-task-description"
                    value={editingTask.description || ''}
                    onChange={(e) => setEditingTask({...editingTask, description: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-task-duration">זמן משוער (דקות)</Label>
                  <Input
                    id="edit-task-duration"
                    type="number"
                    value={editingTask.estimated_duration || 30}
                    onChange={(e) => setEditingTask({...editingTask, estimated_duration: parseInt(e.target.value) || 30})}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-task-mandatory"
                    checked={editingTask.is_mandatory || false}
                    onCheckedChange={(checked) => setEditingTask({...editingTask, is_mandatory: checked as boolean})}
                  />
                  <Label htmlFor="edit-task-mandatory">משימה חובה</Label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditingTask(null)}>
                    ביטול
                  </Button>
                  <Button onClick={handleUpdateTask} disabled={loading}>
                    עדכן
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setStep(1);
              setEditingLessons(false);
            }}
          >
            חזור
          </Button>
          <Button
            onClick={() => {
              toast({
                title: "הצלחה",
                description: "השיעורים והמשימות נשמרו בהצלחה",
              });
              onAssignmentComplete();
              onOpenChange(false);
            }}
            disabled={loading}
          >
            סיים ושמור
          </Button>
        </DialogFooter>
      </div>
    );
  };

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
              : step === 2 
                ? "תזמון שיעורים"
                : "עריכת שיעורים ומשימות"
            }
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? (mode === 'edit' 
                  ? `עריכת הקצאת התוכנית "${editData?.name || courseName}"` 
                  : `שיוך התוכנית "${courseName}" למדריך, כיתה ומוסד לימודים`
                )
              : step === 2
                ? `תזמון השיעורים עבור התוכנית "${courseName}"`
                : `עריכת השיעורים והמשימות עבור התוכנית "${courseName}"`}
          </DialogDescription>
        </DialogHeader>

        {step === 1
          ? renderCourseAssignmentStep()
          : step === 2
            ? renderLessonSchedulingStep()
            : renderLessonEditingStep()}
      </DialogContent>
    </Dialog>
  );
};

export default CourseAssignDialog;