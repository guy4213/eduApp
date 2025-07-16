import React, { useState, useEffect, ReactEventHandler } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

interface LessonSchedule {
  lesson_id: string;
  lesson_title: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
}

interface CourseAssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  courseName: string;
  instanceId:string;
  onAssignmentComplete: () => void;
}

const CourseAssignDialog = ({ 
  open, 
  onOpenChange, 
  courseId, 
  courseName, 
  instanceId,
  onAssignmentComplete 
}: CourseAssignDialogProps) => {
  const { toast } = useToast();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [lessonSchedules, setLessonSchedules] = useState<LessonSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Course assignment, 2: Lesson scheduling
  const [formData, setFormData] = useState({
    institution_id: '',
    instructor_id: '',
    grade_level: '',
  });
  const [courseInstanceId, setCourseInstanceId] = useState<string | null>(null);

  console.log("courseId  ",courseId)
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
        .from('educational_institutions')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setInstitutions(data || []);
    } catch (error) {
      console.error('Error fetching institutions:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לטעון את רשימת המוסדות",
        variant: "destructive"
      });
    }
  };

  const fetchInstructors = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'instructor')
        .order('full_name');

      if (error) throw error;
      setInstructors(data || []);
    } catch (error) {
      console.error('Error fetching instructors:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לטעון את רשימת המדריכים",
        variant: "destructive"
      });
    }
  };

  const fetchCourseLessons = async () => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('id, title')
        .eq('course_id', courseId)
        .order('created_at');

      if (error) throw error;
      setLessons(data || []);
      
      // Initialize lesson schedules
      const initialSchedules = (data || []).map(lesson => ({
        lesson_id: lesson.id,
        lesson_title: lesson.title,
        scheduled_date: '',
        start_time: '',
        end_time: ''
      }));
      setLessonSchedules(initialSchedules);
    } catch (error) {
      console.error('Error fetching lessons:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לטעון את רשימת השיעורים",
        variant: "destructive"
      });
    }
  };

 const handleCourseAssignment = async (): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('course_instances')
      .insert([
        {
          course_id: courseId,
          institution_id: formData.institution_id,
          instructor_id: formData.instructor_id,
          grade_level: formData.grade_level,
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return data.id;
  } catch (error) {
    console.error('Error assigning course:', error);
    toast({
      title: 'שגיאה',
      description: 'אירעה שגיאה בשיוך התוכנית',
      variant: 'destructive',
    });
    return null;
  }
};
 const handleFinalSave = async () => {
  setLoading(true);
  try {
    // 1. שיוך
    const instanceId = await handleCourseAssignment();
    if (!instanceId) return;

    // 2. תזמון
    const inserts = lessonSchedules.map(schedule => ({
      course_instance_id: instanceId,
      lesson_id: schedule.lesson_id,
      scheduled_start: schedule.scheduled_date && schedule.start_time 
        ? `${schedule.scheduled_date}T${schedule.start_time}:00`
        : null,
      scheduled_end: schedule.scheduled_date && schedule.end_time 
        ? `${schedule.scheduled_date}T${schedule.end_time}:00`
        : null,
    }));

    const { error } = await supabase
      .from('lesson_schedules')
      .insert(inserts);

    if (error) throw error;

    toast({
      title: 'הצלחה',
      description: 'התוכנית והשיעורים נשמרו בהצלחה!',
    });

    onAssignmentComplete();
    onOpenChange(false);
  } catch (error) {
    console.error('Error saving schedule:', error);
    toast({
      title: 'שגיאה',
      description: 'אירעה שגיאה בשמירה',
      variant: 'destructive',
    });
  } finally {
    setLoading(false);
  }
};

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateLessonSchedule = (lessonId: string, field: string, value: string) => {
    setLessonSchedules(prev => 
      prev.map(schedule => 
        schedule.lesson_id === lessonId 
          ? { ...schedule, [field]: value }
          : schedule
      )
    );
  };

  const renderCourseAssignmentStep = () => (
    <form
  onSubmit={(e) => {
    e.preventDefault();

    // ולידציה
    if (!formData.institution_id || !formData.instructor_id || !formData.grade_level.trim()) {
      toast({
        title: "שגיאה בטופס",
        description: "אנא בחר מוסד, מדריך והזן כיתה לפני המשך.",
        variant: "destructive",
      });
      return;
    }

    // אם הכול תקין - עבור לשלב 2
    setStep(2);
  }}
  className="space-y-4"
>
      <div className="space-y-2">
        <Label htmlFor="institution">מוסד חינוכי</Label>
        <Select
          value={formData.institution_id}
          onValueChange={(value) => handleInputChange('institution_id', value)}
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
          onValueChange={(value) => handleInputChange('instructor_id', value)}
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
          onChange={(e) => handleInputChange('grade_level', e.target.value)}
          placeholder="למשל: כיתה ז'"
        />
      </div>

      <DialogFooter className="flex justify-between">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          ביטול
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'משייך...' : 'המשך לתזמון שיעורים'}
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
        {lessonSchedules.map((schedule, index) => (
          <div key={schedule.lesson_id} className="border rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-right">{schedule.lesson_title}</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Date Picker */}
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
                        ? format(new Date(schedule.scheduled_date), "dd/MM/yyyy") 
                        : "בחר תאריך"
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={schedule.scheduled_date ? new Date(schedule.scheduled_date) : undefined}
                      onSelect={(date) => 
                        updateLessonSchedule(
                          schedule.lesson_id, 
                          'scheduled_date', 
                          date ? date.toISOString().split('T')[0] : ''
                        )
                      }
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Start Time */}
              <div className="space-y-2">
                <Label>שעת התחלה</Label>
                <Input
                  type="time"
                  value={schedule.start_time}
                  onChange={(e) => updateLessonSchedule(schedule.lesson_id, 'start_time', e.target.value)}
                />
              </div>

              {/* End Time */}
              <div className="space-y-2">
                <Label>שעת סיום</Label>
                <Input
                  type="time"
                  value={schedule.end_time}
                  onChange={(e) => updateLessonSchedule(schedule.lesson_id, 'end_time', e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <DialogFooter className="flex justify-between">
        <Button type="button" variant="outline" onClick={() => setStep(1)}>
          חזור
        </Button>
        <Button onClick={handleFinalSave} disabled={loading}>
          {loading ? 'שומר...' : 'סיים ושמור'}
        </Button>
      </DialogFooter>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? 'שיוך תוכנית לימוד' : 'תזמון שיעורים'}
          </DialogTitle>
          <DialogDescription>
            {step === 1 
              ? `שיוך התוכנית "${courseName}" למדריך, כיתה ומוסד לימודים`
              : `תזמון השיעורים עבור התוכנית "${courseName}"`
            }
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? renderCourseAssignmentStep() : renderLessonSchedulingStep()}
      </DialogContent>
    </Dialog>
  );
};

export default CourseAssignDialog;