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
import { CalendarIcon } from "lucide-react";
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

interface TimeSlot {
  day: number;
  start_time: string;
  end_time: string;
}

interface CourseInstanceSchedule {
  days_of_week: number[];
  time_slots: TimeSlot[];
  total_lessons?: number;
  lesson_duration_minutes?: number;
}

interface Lesson {
  id: string;
  title: string;
  order_index?: number;
  tasks?: any[];
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

  // New schedule state
  const [courseSchedule, setCourseSchedule] = useState<CourseInstanceSchedule>({
    days_of_week: [],
    time_slots: [],
    total_lessons: 1,
    lesson_duration_minutes: 60,
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
    setCourseSchedule({
      days_of_week: [],
      time_slots: [],
      total_lessons: 1,
      lesson_duration_minutes: 60,
    });
    setStep(1);
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
        setStep(1);
        fetchExistingSchedule();
      }
    }
  }, [open, courseId, mode, editData]);

  // Populate form data when institutions/instructors are loaded and editData is available
  useEffect(() => {
    if (mode === 'edit' && editData && institutions.length > 0 && instructors.length > 0) {
      const institutionId = findIdByName(institutions, editData.institution_name);
      const instructorId = findIdByName(instructors, editData.instructor_name);
      
      const newFormData = {
        institution_id: institutionId,
        instructor_id: instructorId,
        grade_level: editData.grade_level,
        price_for_customer: editData.price_for_customer.toString(),
        price_for_instructor: editData.price_for_instructor.toString(),
        max_participants: editData.max_participants.toString(),
        start_date: editData.start_date || "",
        end_date: editData.approx_end_date || "",
      };
      
      setFormData(newFormData);
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
        .select("id, title, order_index, lesson_tasks (id, title, description, estimated_duration, is_mandatory, order_index)")
        .eq("course_id", courseId)
        .order("order_index");

      if (error) throw error;
      
      // Ensure lessons have tasks property properly set
      const lessonsWithTasks = (data || []).map(lesson => ({
        ...lesson,
        tasks: lesson.lesson_tasks || []
      }));
      
      setLessons(lessonsWithTasks);
      
      // Set default total_lessons to the number of lessons in the course
      setCourseSchedule(prev => ({
        ...prev,
        total_lessons: lessonsWithTasks.length || 1
      }));
    } catch (error) {
      console.error("Error fetching lessons:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לטעון את רשימת השיעורים",
        variant: "destructive",
      });
    }
  };

  const fetchExistingSchedule = async () => {
    if (!editData?.instance_id) return;
    
    try {
      // First, get the course_id from the instance to fetch lessons
      const { data: instanceData, error: instanceError } = await supabase
        .from("course_instances")
        .select("course_id")
        .eq("id", editData.instance_id)
        .single();

      if (instanceError) throw instanceError;

      // Fetch lessons for this course
      if (instanceData?.course_id) {
        const { data: lessonsData, error: lessonsError } = await supabase
          .from("lessons")
          .select("id, title, order_index, lesson_tasks (id, title, description, estimated_duration, is_mandatory, order_index)")
          .eq("course_id", instanceData.course_id)
          .order("order_index");

        if (!lessonsError && lessonsData) {
          const lessonsWithTasks = lessonsData.map(lesson => ({
            ...lesson,
            tasks: lesson.lesson_tasks || []
          }));
          setLessons(lessonsWithTasks);
        }
      }

      // Check if there's a course_instance_schedules entry
      const { data: scheduleData, error: scheduleError } = await supabase
        .from("course_instance_schedules")
        .select("*")
        .eq("course_instance_id", editData.instance_id)
        .single();

      if (scheduleData && !scheduleError) {
        // Use new schedule format
        setCourseSchedule({
          days_of_week: scheduleData.days_of_week || [],
          time_slots: (scheduleData.time_slots as TimeSlot[]) || [],
          total_lessons: scheduleData.total_lessons || 1,
          lesson_duration_minutes: scheduleData.lesson_duration_minutes || 60,
        });
      } else {
        // Fallback: Try to extract from existing lesson_schedules (legacy)
        const { data: legacySchedules, error: legacyError } = await supabase
          .from("lesson_schedules")
          .select("*")
          .eq("course_instance_id", editData.instance_id);

        if (legacySchedules && !legacyError && legacySchedules.length > 0) {
          // Convert legacy schedules to new format
          const daysOfWeek = [...new Set(legacySchedules.map(s => new Date(s.scheduled_start!).getDay()))];
          const timeSlots: TimeSlot[] = daysOfWeek.map(day => {
            const scheduleForDay = legacySchedules.find(s => new Date(s.scheduled_start!).getDay() === day);
            return {
              day,
              start_time: scheduleForDay ? new Date(scheduleForDay.scheduled_start!).toTimeString().slice(0, 5) : "",
              end_time: scheduleForDay ? new Date(scheduleForDay.scheduled_end!).toTimeString().slice(0, 5) : "",
            };
          });

          setCourseSchedule({
            days_of_week: daysOfWeek,
            time_slots: timeSlots,
            total_lessons: legacySchedules.length,
            lesson_duration_minutes: 60,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching existing schedule:", error);
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
              days_of_week: courseSchedule.days_of_week,
              schedule_pattern: {
                time_slots: courseSchedule.time_slots,
                total_lessons: courseSchedule.total_lessons,
                lesson_duration_minutes: courseSchedule.lesson_duration_minutes,
              },
            },
          ])
          .select()
          .single();

        if (error) throw error;
        return data.id;
      } else {
        // Edit mode - update existing instance
        const updateData = {
          institution_id: formData.institution_id,
          instructor_id: formData.instructor_id,
          grade_level: formData.grade_level,
          max_participants: parseInt(formData.max_participants),
          price_for_customer: parseFloat(formData.price_for_customer),
          price_for_instructor: parseFloat(formData.price_for_instructor),
          start_date: formData.start_date,
          end_date: formData.end_date,
          days_of_week: courseSchedule.days_of_week,
          schedule_pattern: {
            time_slots: courseSchedule.time_slots,
            total_lessons: courseSchedule.total_lessons,
            lesson_duration_minutes: courseSchedule.lesson_duration_minutes,
          },
        };
        
        const { data, error } = await supabase
          .from("course_instances")
          .update(updateData)
          .eq("id", editData?.instance_id)
          .select()
          .single();

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

  const saveCourseInstanceSchedule = async (instanceId: string) => {
    try {
      // Check if schedule already exists
      const { data: existingSchedule } = await supabase
        .from("course_instance_schedules")
        .select("id")
        .eq("course_instance_id", instanceId)
        .single();

      const scheduleData = {
        course_instance_id: instanceId,
        days_of_week: courseSchedule.days_of_week,
        time_slots: courseSchedule.time_slots,
        total_lessons: courseSchedule.total_lessons,
        lesson_duration_minutes: courseSchedule.lesson_duration_minutes,
      };

      if (existingSchedule) {
        // Update existing schedule
        const { error } = await supabase
          .from("course_instance_schedules")
          .update(scheduleData)
          .eq("id", existingSchedule.id);

        if (error) throw error;
      } else {
        // Create new schedule
        const { error } = await supabase
          .from("course_instance_schedules")
          .insert([scheduleData]);

        if (error) throw error;
      }

      // Only clean up old lesson_schedules if we're updating schedule pattern in edit mode
      if (mode === 'edit' && (courseSchedule.days_of_week.length > 0 || courseSchedule.time_slots.length > 0)) {
        // Check if there are any existing course_instance_schedules
        const { data: existingCourseSchedule } = await supabase
          .from("course_instance_schedules")
          .select("id")
          .eq("course_instance_id", instanceId)
          .single();
          
        // Only delete legacy schedules if we're migrating to new schedule format
        if (existingCourseSchedule) {
          await supabase
            .from('lesson_schedules')
            .delete()
            .eq('course_instance_id', instanceId);
        }
      }
    } catch (error) {
      console.error("Error saving course instance schedule:", error);
      throw error;
    }
  };

  const handleFinalSave = async () => {
    setLoading(true);
    try {
      const instanceId = await handleCourseAssignment();
      if (!instanceId) return;

      // Save the course instance schedule
      await saveCourseInstanceSchedule(instanceId);
      
      toast({
        title: "הצלחה",
        description: mode === 'edit' 
          ? "התוכנית ולוח הזמנים עודכנו בהצלחה!"
          : "התוכנית נשמרה עם לוח הזמנים החדש!",
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

  const toggleDayOfWeek = (dayIndex: number) => {
    const isSelected = courseSchedule.days_of_week.includes(dayIndex);
    
    if (isSelected) {
      // Remove day
      setCourseSchedule(prev => ({
        ...prev,
        days_of_week: prev.days_of_week.filter(d => d !== dayIndex),
        time_slots: prev.time_slots.filter(ts => ts.day !== dayIndex),
      }));
    } else {
      // Add day
      setCourseSchedule(prev => ({
        ...prev,
        days_of_week: [...prev.days_of_week, dayIndex].sort(),
        time_slots: [...prev.time_slots, { day: dayIndex, start_time: "", end_time: "" }],
      }));
    }
  };

  const updateTimeSlot = (dayIndex: number, field: "start_time" | "end_time", value: string) => {
    setCourseSchedule(prev => ({
      ...prev,
      time_slots: prev.time_slots.map(ts => 
        ts.day === dayIndex ? { ...ts, [field]: value } : ts
      ),
    }));
  };

  const renderCourseAssignmentStep = () => (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        
        // Validation
        const missingFields = [];
        if (!formData.institution_id) missingFields.push("מוסד");
        if (!formData.instructor_id) missingFields.push("מדריך");
        if (!formData.grade_level.trim()) missingFields.push("כיתה");
        
        if (missingFields.length > 0) {
          toast({
            title: "שגיאה בטופס",
            description: `חסרים שדות חובה: ${missingFields.join(", ")}`,
            variant: "destructive",
          });
          return;
        }

        setStep(2); // Go to scheduling step
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
            : "המשך לתזמון"
          }
        </Button>
      </DialogFooter>
    </form>
  );

  const renderSchedulingStep = () => (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-4">
        הגדר את לוח הזמנים הכללי עבור התוכנית "{courseName}"
      </div>

      {/* Course Lessons Overview with Tasks */}
      {lessons.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 max-h-96 overflow-y-auto">
          <h3 className="font-semibold text-blue-900 mb-3">שיעורים בתוכנית ({lessons.length})</h3>
          <div className="space-y-4">
            {lessons.map((lesson, index) => (
              <div key={lesson.id} className="bg-white rounded-lg p-3 border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-blue-800">
                    <span className="font-medium">{index + 1}.</span> {lesson.title}
                  </div>
                  {lesson.tasks && lesson.tasks.length > 0 && (
                    <span className="text-blue-600 text-xs bg-blue-100 px-2 py-1 rounded">
                      {lesson.tasks.length} משימות
                    </span>
                  )}
                </div>
                
                {/* Show tasks for this lesson */}
                {lesson.tasks && lesson.tasks.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {lesson.tasks
                      .sort((a: any, b: any) => a.order_index - b.order_index)
                      .map((task: any) => (
                        <div key={task.id} className="bg-gray-50 p-2 rounded text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-gray-700">{task.title}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">{task.estimated_duration} דק'</span>
                              {task.is_mandatory ? (
                                <span className="bg-red-100 text-red-600 px-1 py-0.5 rounded text-xs">חובה</span>
                              ) : (
                                <span className="bg-gray-100 text-gray-600 px-1 py-0.5 rounded text-xs">רשות</span>
                              )}
                            </div>
                          </div>
                          {task.description && (
                            <p className="text-gray-600 text-xs">{task.description}</p>
                          )}
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
          {/* Course Date Info */}
          {formData.start_date && formData.end_date && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium">תקופת הקורס:</span> {" "}
                {formData.start_date && formatDate(new Date(formData.start_date), "dd/MM/yyyy")} - {" "}
                {formData.end_date && formatDate(new Date(formData.end_date), "dd/MM/yyyy")}
              </div>
            </div>
          )}

        {/* Days of week selection */}
        <div className="space-y-2">
          <Label>ימים בשבוע</Label>
          <div className="flex flex-wrap gap-2">
            {dayNames.map((day, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  id={`day-${index}`}
                  checked={courseSchedule.days_of_week.includes(index)}
                  onCheckedChange={() => toggleDayOfWeek(index)}
                />
                <Label htmlFor={`day-${index}`} className="text-sm">
                  {day}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Time slots for selected days */}
        {courseSchedule.days_of_week.length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">זמנים לכל יום:</Label>
            {courseSchedule.days_of_week.sort().map((dayIndex) => {
              const timeSlot = courseSchedule.time_slots.find(ts => ts.day === dayIndex);
              return (
                <div key={dayIndex} className="border rounded p-3 bg-gray-50">
                  <div className="flex items-center gap-4">
                    <span className="min-w-[60px] text-sm font-medium">
                      {dayNames[dayIndex]}:
                    </span>
                    <div className="flex gap-2 flex-1">
                      <div className="flex-1">
                        <Label className="text-xs">התחלה</Label>
                        <Input
                          type="time"
                          value={timeSlot?.start_time || ""}
                          onChange={(e) => updateTimeSlot(dayIndex, "start_time", e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs">סיום</Label>
                        <Input
                          type="time"
                          value={timeSlot?.end_time || ""}
                          onChange={(e) => updateTimeSlot(dayIndex, "end_time", e.target.value)}
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

        {/* Additional schedule parameters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="total_lessons">מספר שיעורים כולל</Label>
            <Input
              id="total_lessons"
              type="number"
              min="1"
              value={courseSchedule.total_lessons || ""}
              onChange={(e) =>
                setCourseSchedule(prev => ({
                  ...prev,
                  total_lessons: parseInt(e.target.value) || 1
                }))
              }
              placeholder="מספר שיעורים"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lesson_duration">משך שיעור (דקות)</Label>
            <Input
              id="lesson_duration"
              type="number"
              min="15"
              step="15"
              value={courseSchedule.lesson_duration_minutes || ""}
              onChange={(e) =>
                setCourseSchedule(prev => ({
                  ...prev,
                  lesson_duration_minutes: parseInt(e.target.value) || 60
                }))
              }
              placeholder="60"
            />
          </div>
        </div>
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
              : "הגדרת לוח זמנים"
            }
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? (mode === 'edit' 
                  ? `עריכת הקצאת התוכנית "${editData?.name || courseName}"` 
                  : `שיוך התוכנית "${courseName}" למדריך, כיתה ומוסד לימודים`
                )
              : `הגדרת לוח הזמנים הכללי עבור התוכנית "${courseName}"`}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? renderCourseAssignmentStep() : renderSchedulingStep()}
      </DialogContent>
    </Dialog>
  );
};

export default CourseAssignDialog;