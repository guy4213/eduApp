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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Lesson } from './CourseLessonsSection';

interface LessonEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lesson: Lesson | null;
  onSave: (lesson: Lesson) => void;
}

const LessonEditDialog = ({ open, onOpenChange, lesson, onSave }: LessonEditDialogProps) => {
  const [editData, setEditData] = useState({
    title: '',
    description: '',
  });

  useEffect(() => {
    if (lesson) {
      setEditData({
        title: lesson.title,
        description: lesson.description || '',
      });
    }
  }, [lesson]);

  const handleSave = () => {
    if (!lesson || !editData.title.trim()) return;

    const updatedLesson: Lesson = {
      ...lesson,
      title: editData.title,
      description: editData.description,
    };

    onSave(updatedLesson);
    onOpenChange(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>עריכת שיעור</DialogTitle>
          <DialogDescription>ערוך את פרטי השיעור</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="lesson-title">כותרת השיעור</Label>
            <Input
              id="lesson-title"
              value={editData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="הכנס כותרת שיעור..."
            />
          </div>
          <div>
            <Label htmlFor="lesson-description">תיאור השיעור</Label>
            <Textarea
              id="lesson-description"
              value={editData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="תיאור השיעור (רשות)..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            ביטול
          </Button>
          <Button onClick={handleSave} disabled={!editData.title.trim()}>
            שמור שינויים
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LessonEditDialog;