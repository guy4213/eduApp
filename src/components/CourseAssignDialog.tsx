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
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

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
  order_index: number;
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

interface CourseAssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  courseName: string;
  instanceId: string;
  onAssignmentComplete: () => void;
}

const CourseAssignDialog = ({
  open,
  onOpenChange,
  courseId,
  courseName,
  instanceId,
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

  useEffect(() => {
    if (open) {
      fetchInstitutions();
      fetchInstructors();
      fetchCourseLessons();
      setStep(1);
      setLessonSchedules([]);
    }
  }, [open, courseId]);

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
    try {
      const { data, error } = await supabase
        .from("lessons")
        .select("id, title")
        .eq("course_id", courseId)
        .order("created_at");

      if (error) throw error;
      setLessons((data || []).map((lesson) => ({ ...lesson, order_index: 0 })));
      const courseStartDate = formData.start_date || ""; // Ensure fallback if not filled yet

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

  const handleCourseAssignment = async (): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from("course_instances")
        .insert([
          {
            course_id: courseId,
            institution_id: formData.institution_id,
            instructor_id: formData.instructor_id,
            grade_level: formData.grade_level,
            price_for_customer: formData.price_for_customer
              ? parseFloat(formData.price_for_customer)
              : null,
            price_for_instructor: formData.price_for_instructor
              ? parseFloat(formData.price_for_instructor)
              : null,
            max_participants: formData.max_participants
              ? parseInt(formData.max_participants)
              : null,
            start_date: formData.start_date || null,
            end_date: formData.end_date || null,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error("Error assigning course:", error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בשיוך התוכנית",
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
    let currentDate = new Date(schedule.instance_start_date);
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

          lastInstanceDate = new Date(currentDate); // Save last valid
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
        // Validate instance start date
        const instanceStart = new Date(schedule.instance_start_date);
        if (instanceStart < courseStart || instanceStart > courseEnd) {
          return {
            valid: false,
            message: `תאריך התחלה של שיעור "${schedule.lesson_title}" מחוץ לתחום התוכנית.`,
          };
        }
      } else {
        // Validate single lesson date
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
  const handleFinalSave = async () => {
    setLoading(true);
    try {
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
      // 1. Create course instance

      const instanceId = await handleCourseAssignment();
      if (!instanceId) return;

      // 2. Generate all lesson schedule instances
      const allInstances = [];
      let totalCount = 0;

      for (const schedule of lessonSchedules) {
        const result = generateLessonInstances(schedule);

        if (!result.success) {
          toast({
            title: "שגיאה",
            variant: "destructive",
            description: result.error, // Includes the reason and final attempted date
          });
          return; // Stop the loop and prevent insertion
        }

        result.instances.forEach((instance) => {
          instance.course_instance_id = instanceId;
        });

        allInstances.push(...result.instances);
        totalCount += result.instances.length;

        // Optional: log or show the final instance date for each lesson
        console.log(result.finalDateMessage);
      }

      // Insert to DB only if all succeeded
      const { error } = await supabase
        .from("lesson_schedules")
        .insert(allInstances);

      if (error) throw error;

      toast({
        title: "הצלחה",
        description: `התוכנית נשמרה עם ${totalCount} מופעי שיעורים!\n${
          allInstances.length > 0
            ? "המפגש האחרון בתוכנית יתקיים בתאריך " +
              allInstances[allInstances.length - 1].scheduled_start.split(
                "T"
              )[0]
            : ""
        }`,
      });
      onAssignmentComplete();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving schedule:", error);
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

          // Update day_schedules accordingly
          let newDaySchedules = [...schedule.day_schedules];

          if (isRemoving) {
            // Remove the day schedule
            newDaySchedules = newDaySchedules.filter(
              (ds) => ds.day !== dayIndex
            );
          } else {
            // Add a new day schedule
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
        setStep(2);
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
          {loading ? "משייך..." : "המשך לתזמון שיעורים"}
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

            {/* Checkbox for creating multiple instances */}
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
              // Single instance UI
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
                          ? format(
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
                        initialFocus
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
              // Multiple instances UI
              <div className="space-y-4">
                {/* Days of week selection */}
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

                {/* Per-day timing configuration */}
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
                            ? format(
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
                          initialFocus
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
            {step === 1 ? "שיוך תוכנית לימוד" : "תזמון שיעורים"}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? `שיוך התוכנית "${courseName}" למדריך, כיתה ומוסד לימודים`
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
