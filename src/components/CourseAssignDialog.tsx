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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
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

interface CourseAssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  courseName: string;
  onAssignmentComplete: () => void;
}

const CourseAssignDialog = ({ 
  open, 
  onOpenChange, 
  courseId, 
  courseName, 
  onAssignmentComplete 
}: CourseAssignDialogProps) => {
  const { toast } = useToast();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    institution_id: '',
    instructor_id: '',
    grade_level: '',
  });

  useEffect(() => {
    if (open) {
      fetchInstitutions();
      fetchInstructors();
    }
  }, [open]);

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

  console.log("INSTRUCTORS  :   ",instructors)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('courses')
        .update({
          institution_id: formData.institution_id || null,
          instructor_id: formData.instructor_id || null,
          grade_level: formData.grade_level || null,
        })
        .eq('id', courseId);

      if (error) throw error;

      toast({
        title: "הצלחה",
        description: "התוכנית נשייכה בהצלחה",
      });

      onAssignmentComplete();
      onOpenChange(false);
    } catch (error) {
      console.error('Error assigning course:', error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בשיוך התוכנית",
        variant: "destructive"
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[400px] sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>שיוך תוכנית לימוד</DialogTitle>
          <DialogDescription>
            שיוך התוכנית "{courseName}" למדריך, כיתה ומוסד לימודים
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              {loading ? 'משייך...' : 'שייך תוכנית'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CourseAssignDialog;