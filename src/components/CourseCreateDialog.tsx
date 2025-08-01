import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CourseDetailsForm from './course/CourseDetailsForm';
import CourseLessonsSection, { Lesson } from './course/CourseLessonsSection';
import { useCourseData } from './course/useCourseData';
import { useCourseSubmit } from './course/useCourseSubmit';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

interface CourseCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCourseCreated: () => void;
  editCourse?: {
    id: string;
    instance_id:string;
    name: string;
    grade_level: string;
    max_participants: number;
    price_per_lesson: number;
    tasks: any[];
    start_date:string;
    approx_end_date:string;
  } | null;
  
}

interface LessonSchedule {
  id?: string;
  lesson_id: string;
  lesson_title: string;
  scheduled_start: string | null;
  scheduled_end: string | null;
  course_instance_id: string | null;
}

const CourseCreateDialog = ({ open, onOpenChange, onCourseCreated, editCourse }: CourseCreateDialogProps) => {
  const { institutions } = useCourseData();
  const { loading, handleSubmit } = useCourseSubmit(onCourseCreated, onOpenChange);
  const { toast } = useToast();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [lessonSchedules, setLessonSchedules] = useState<LessonSchedule[]>([]);
  const [formData, setFormData] = useState({
    name: '',
  });

  useEffect(() => {
    if (open) {
      if (editCourse) {
        // Pre-fill form with existing course data
        setFormData({
          name: editCourse.name,
        });
        
        loadExistingLessons(editCourse.id);
        loadExistingSchedules(editCourse.instance_id);
      } else {
        // Reset form for new course
        setFormData({
          name: '',
        });
        setLessons([]);
        setLessonSchedules([]);
      }
    }
  }, [open, editCourse]);

  const loadExistingLessons = async (courseId: string) => {
    try {
      // Get the course_id from the instance_id
      const { data: instanceData, error: instanceError } = await supabase
        .from('course_instances')
        .select('course_id')
        .eq('id', courseId)
        .single();

      if (instanceError) throw instanceError;

      // Load lessons and tasks from the database
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select(`
          id,
          title,
          lesson_tasks (
            id,
            title,
            description,
            estimated_duration,
            is_mandatory,
            order_index
          )
        `)
        .eq('course_id', instanceData.course_id)
        .order('id');

      if (lessonsError) throw lessonsError;

      const formattedLessons = lessonsData.map(lesson => ({
        id: lesson.id,
        title: lesson.title,
        tasks: lesson.lesson_tasks.map(task => ({
          id: task.id,
          title: task.title,
          description: task.description,
          estimated_duration: task.estimated_duration,
          is_mandatory: task.is_mandatory,
          order_index: task.order_index
        })).sort((a, b) => a.order_index - b.order_index)
      }));

      setLessons(formattedLessons);
    } catch (error) {
      console.error('Error loading existing lessons:', error);
      // Fallback to using editCourse.tasks if database loading fails
      if (editCourse?.tasks) {
        const lessonsMap = new Map();

        editCourse.tasks.forEach(task => {
          const lessonId = task.lesson_id || `lesson-${task.lesson_number}`;

          if (!lessonsMap.has(lessonId)) {
            lessonsMap.set(lessonId, {
              id: lessonId,
              title: task.lesson_title || `שיעור ${task.lesson_number}`,
              tasks: []
            });
          }

          lessonsMap.get(lessonId).tasks.push({
            id: task.id,
            title: task.title,
            description: task.description,
            estimated_duration: task.estimated_duration,
            is_mandatory: task.is_mandatory,
            order_index: task.order_index
          });
        });

        const formattedLessons = Array.from(lessonsMap.values()).sort((a, b) => 
          parseInt(a.id.split('-')[1]) - parseInt(b.id.split('-')[1])
        );
        
        setLessons(formattedLessons);
      }
    }
  };

  const loadExistingSchedules = async (instanceId: string) => {
    try {
      const { data: schedulesData, error } = await supabase
        .from('lesson_schedules')
        .select(`
          id,
          lesson_id,
          scheduled_start,
          scheduled_end,
          course_instance_id,
          lesson:lesson_id (
            title
          )
        `)
        .eq('course_instance_id', instanceId);

      if (error) throw error;

      const formattedSchedules: LessonSchedule[] = (schedulesData || []).map(schedule => ({
        id: schedule.id,
        lesson_id: schedule.lesson_id || '',
        lesson_title: schedule.lesson?.title || 'ללא כותרת',
        scheduled_start: schedule.scheduled_start,
        scheduled_end: schedule.scheduled_end,
        course_instance_id: schedule.course_instance_id,
      }));

      setLessonSchedules(formattedSchedules);
    } catch (error) {
      console.error('Error loading lesson schedules:', error);
      setLessonSchedules([]);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSubmit(formData, lessons, editCourse?.id);
  };

  const updateSchedule = (lessonId: string, field: 'scheduled_start' | 'scheduled_end', value: string) => {
    setLessonSchedules(prev => 
      prev.map(schedule => 
        schedule.lesson_id === lessonId 
          ? { ...schedule, [field]: value }
          : schedule
      )
    );
  };

  const saveSchedules = async () => {
    if (!editCourse?.instance_id) return;

    try {
      // Filter schedules that have both start and end times
      const validSchedules = lessonSchedules.filter(
        schedule => schedule.scheduled_start && schedule.scheduled_end
      );

      // Update existing schedules and insert new ones
      for (const schedule of validSchedules) {
        if (schedule.id) {
          // Update existing schedule
          const { error } = await supabase
            .from('lesson_schedules')
            .update({
              scheduled_start: schedule.scheduled_start,
              scheduled_end: schedule.scheduled_end,
            })
            .eq('id', schedule.id);

          if (error) throw error;
        } else {
          // Insert new schedule
          const { error } = await supabase
            .from('lesson_schedules')
            .insert({
              lesson_id: schedule.lesson_id,
              course_instance_id: editCourse.instance_id,
              scheduled_start: schedule.scheduled_start,
              scheduled_end: schedule.scheduled_end,
            });

          if (error) throw error;
        }
      }

      toast({
        title: "הצלחה",
        description: "לוחות הזמנים עודכנו בהצלחה",
      });
    } catch (error) {
      console.error('Error saving schedules:', error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בשמירת לוחות הזמנים",
        variant: "destructive",
      });
    }
  };

  const formatDateTimeForInput = (isoString: string | null) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const formatInputToDateTime = (inputValue: string) => {
    if (!inputValue) return null;
    return new Date(inputValue).toISOString();
  };

  const renderScheduleManagement = () => (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-4">
        ניהול זמני השיעורים עבור התוכנית
      </div>

      {lessons.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          לא נמצאו שיעורים. אנא הוסף שיעורים בלשונית "שיעורים ומשימות" תחילה.
        </div>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {lessons.map((lesson) => {
            const schedule = lessonSchedules.find(s => s.lesson_id === lesson.id) || {
              lesson_id: lesson.id,
              lesson_title: lesson.title,
              scheduled_start: null,
              scheduled_end: null,
              course_instance_id: editCourse?.instance_id || null,
            };

            return (
              <div key={lesson.id} className="border rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-right">{lesson.title}</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>תאריך ושעת התחלה</Label>
                    <Input
                      type="datetime-local"
                      value={formatDateTimeForInput(schedule.scheduled_start)}
                      onChange={(e) => {
                        const newDateTime = formatInputToDateTime(e.target.value);
                        
                        // Update existing schedule or create new one
                        setLessonSchedules(prev => {
                          const existingIndex = prev.findIndex(s => s.lesson_id === lesson.id);
                          if (existingIndex >= 0) {
                            const updated = [...prev];
                            updated[existingIndex] = { ...updated[existingIndex], scheduled_start: newDateTime };
                            return updated;
                          } else {
                            return [...prev, { ...schedule, scheduled_start: newDateTime }];
                          }
                        });
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>תאריך ושעת סיום</Label>
                    <Input
                      type="datetime-local"
                      value={formatDateTimeForInput(schedule.scheduled_end)}
                      onChange={(e) => {
                        const newDateTime = formatInputToDateTime(e.target.value);
                        
                        // Update existing schedule or create new one
                        setLessonSchedules(prev => {
                          const existingIndex = prev.findIndex(s => s.lesson_id === lesson.id);
                          if (existingIndex >= 0) {
                            const updated = [...prev];
                            updated[existingIndex] = { ...updated[existingIndex], scheduled_end: newDateTime };
                            return updated;
                          } else {
                            return [...prev, { ...schedule, scheduled_end: newDateTime }];
                          }
                        });
                      }}
                    />
                  </div>
                </div>

                {schedule.scheduled_start && schedule.scheduled_end && (
                  <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                    ✓ שיעור מתוכנן: {new Date(schedule.scheduled_start).toLocaleString('he-IL')} - {new Date(schedule.scheduled_end).toLocaleString('he-IL')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {editCourse && lessons.length > 0 && (
        <div className="pt-4 border-t">
          <Button onClick={saveSchedules} disabled={loading}>
            {loading ? 'שומר...' : 'שמור לוחות זמנים'}
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[400px] sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editCourse ? 'עריכת תוכנית לימוד' : 'יצירת תוכנית לימוד חדשה'}</DialogTitle>
          <DialogDescription>{editCourse ? 'ערוך את פרטי תוכנית הלימוד' : 'מלא את הפרטים כדי ליצור תוכנית לימוד חדשה'}</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">פרטי התוכנית</TabsTrigger>
              <TabsTrigger value="lessons">שיעורים ומשימות</TabsTrigger>
              <TabsTrigger value="schedules" disabled={!editCourse}>לוחות זמנים</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <CourseDetailsForm
                formData={formData}
                onInputChange={handleInputChange}
              />
            </TabsContent>

            <TabsContent value="lessons" className="space-y-4">
              <CourseLessonsSection lessons={lessons} onLessonsChange={setLessons} />
            </TabsContent>

            <TabsContent value="schedules" className="space-y-4">
              {renderScheduleManagement()}
            </TabsContent>
          </Tabs>

          <DialogFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ביטול
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (editCourse ? 'מעדכן...' : 'יוצר...') : (editCourse ? 'עדכן תוכנית לימוד' : 'צור תוכנית לימוד')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CourseCreateDialog;