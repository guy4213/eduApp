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

interface CourseCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCourseCreated: () => void;
}

const CourseCreateDialog = ({ open, onOpenChange, onCourseCreated }: CourseCreateDialogProps) => {
  const { institutions } = useCourseData();
  const { loading, handleSubmit } = useCourseSubmit(onCourseCreated, onOpenChange);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    grade_level: '',
    max_participants: '',
    price_per_lesson: '',
    institution_id: '',
  });

  useEffect(() => {
    if (open) {
      setFormData({
        name: '',
        grade_level: '',
        max_participants: '',
        price_per_lesson: '',
        institution_id: '',
      });
      setLessons([]);
    }
  }, [open]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSubmit(formData, lessons);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[400px] sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>יצירת קורס חדש</DialogTitle>
          <DialogDescription>מלא את הפרטים כדי ליצור קורס חדש</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">פרטי הקורס</TabsTrigger>
              <TabsTrigger value="lessons">שיעורים ומשימות</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <CourseDetailsForm
                formData={formData}
                institutions={institutions}
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
              {loading ? 'יוצר...' : 'צור קורס'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CourseCreateDialog;
