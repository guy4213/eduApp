
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CourseCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCourseCreated: () => void;
}

interface Institution {
  id: string;
  name: string;
}

interface Curriculum {
  id: string;
  name: string;
}

const CourseCreateDialog = ({ open, onOpenChange, onCourseCreated }: CourseCreateDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    grade_level: '',
    max_participants: '',
    price_per_lesson: '',
    institution_id: '',
    curriculum_id: ''
  });

  useEffect(() => {
    if (open) {
      fetchInstitutions();
      fetchCurricula();
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

  const fetchCurricula = async () => {
    try {
      const { data, error } = await supabase
        .from('curricula')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setCurricula(data || []);
    } catch (error) {
      console.error('Error fetching curricula:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לטעון את רשימת תוכניות הלימודים",
        variant: "destructive"
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "שגיאה",
        description: "יש להתחבר כדי ליצור קורס",
        variant: "destructive"
      });
      return;
    }

    if (!formData.name.trim()) {
      toast({
        title: "שגיאה",
        description: "יש להזין שם קורס",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const courseData = {
        name: formData.name.trim(),
        grade_level: formData.grade_level.trim() || null,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
        price_per_lesson: formData.price_per_lesson ? parseFloat(formData.price_per_lesson) : null,
        institution_id: formData.institution_id || null,
        curriculum_id: formData.curriculum_id || null,
        instructor_id: user.id
      };

      const { error } = await supabase
        .from('courses')
        .insert([courseData]);

      if (error) throw error;

      toast({
        title: "הצלחה",
        description: "הקורס נוצר בהצלחה",
        variant: "default"
      });

      // Reset form
      setFormData({
        name: '',
        grade_level: '',
        max_participants: '',
        price_per_lesson: '',
        institution_id: '',
        curriculum_id: ''
      });

      onCourseCreated();
      onOpenChange(false);

    } catch (error) {
      console.error('Error creating course:', error);
      toast({
        title: "שגיאה",
        description: error instanceof Error ? error.message : "אירעה שגיאה ביצירת הקורס",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>יצירת קורס חדש</DialogTitle>
          <DialogDescription>
            מלא את הפרטים כדי ליצור קורס חדש
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">שם הקורס *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="הזן שם קורס"
              required
            />
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max_participants">מספר משתתפים מקסימלי</Label>
              <Input
                id="max_participants"
                type="number"
                value={formData.max_participants}
                onChange={(e) => handleInputChange('max_participants', e.target.value)}
                placeholder="20"
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price_per_lesson">מחיר לשיעור (₪)</Label>
              <Input
                id="price_per_lesson"
                type="number"
                step="0.01"
                value={formData.price_per_lesson}
                onChange={(e) => handleInputChange('price_per_lesson', e.target.value)}
                placeholder="150"
                min="0"
              />
            </div>
          </div>

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
            <Label htmlFor="curriculum">תוכנית לימודים</Label>
            <Select
              value={formData.curriculum_id}
              onValueChange={(value) => handleInputChange('curriculum_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="בחר תוכנית לימודים" />
              </SelectTrigger>
              <SelectContent>
                {curricula.map((curriculum) => (
                  <SelectItem key={curriculum.id} value={curriculum.id}>
                    {curriculum.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
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
