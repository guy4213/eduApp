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

interface CourseCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCourseCreated: () => void;
  editCourse?: {
    id: string;
    name: string;
    grade_level: string;
    max_participants: number;
    price_per_lesson: number;
    tasks: any[];
  } | null;
}

const CourseCreateDialog = ({ open, onOpenChange, onCourseCreated, editCourse }: CourseCreateDialogProps) => {
  const { institutions } = useCourseData();
  const { loading, handleSubmit } = useCourseSubmit(onCourseCreated, onOpenChange);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    grade_level: '',
    max_participants: '',
    price_per_lesson: '',
  });

  useEffect(() => {
    if (open) {
      if (editCourse) {
        // Pre-fill form with existing course data
        setFormData({
          name: editCourse.name,
          grade_level: editCourse.grade_level,
          max_participants: editCourse.max_participants.toString(),
          price_per_lesson: editCourse.price_per_lesson.toString(),
        });
        
        loadExistingLessons(editCourse.id);
      } else {
        // Reset form for new course
        setFormData({
          name: '',
          grade_level: '',
          max_participants: '',
          price_per_lesson: '',
        });
        setLessons([]);
      }
    }
  }, [open, editCourse]);

  const loadExistingLessons = async (courseId: string) => {
    try {
      const { data: lessonsData, error } = await supabase
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
        .eq('course_id', courseId)
        .order('created_at');

      if (error) throw error;

      if (lessonsData) {
        const formattedLessons: Lesson[] = lessonsData.map(lesson => ({
          id: lesson.id, // שימוש ב-ID האמיתי מהמסד נתונים
          title: lesson.title,
          tasks: lesson.lesson_tasks.map(task => ({
            id: task.id, // שימוש ב-ID האמיתי של המשימה
            title: task.title,
            description: task.description,
            estimated_duration: task.estimated_duration,
            is_mandatory: task.is_mandatory,
            order_index: task.order_index
          })).sort((a, b) => a.order_index - b.order_index)
        }));

        setLessons(formattedLessons);
      }
    } catch (error) {
      console.error('Error loading existing lessons:', error);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[400px] sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editCourse ? 'עריכת תוכנית לימוד' : 'יצירת תוכנית לימוד חדשה'}</DialogTitle>
          <DialogDescription>{editCourse ? 'ערוך את פרטי תוכנית הלימוד' : 'מלא את הפרטים כדי ליצור תוכנית לימוד חדשה'}</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">פרטי התוכנית</TabsTrigger>
              <TabsTrigger value="lessons">שיעורים ומשימות</TabsTrigger>
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
