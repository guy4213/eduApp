import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface CourseDetailsFormProps {
  formData: {
    name: string;
    grade_level: string;
    max_participants: string;
    price_per_lesson: string;
    start_date: string;
    approx_end_date: string;
  };
  onInputChange: (field: string, value: string) => void;
}

const CourseDetailsForm = ({ formData, onInputChange }: CourseDetailsFormProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">שם תוכנית הלימוד *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => onInputChange('name', e.target.value)}
          placeholder="הזן שם תוכנית לימוד"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="grade_level">כיתה</Label>
        <Input
          id="grade_level"
          value={formData.grade_level}
          onChange={(e) => onInputChange('grade_level', e.target.value)}
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
            onChange={(e) => onInputChange('max_participants', e.target.value)}
            placeholder="20"
            min="1"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="price_per_lesson">מחיר לשיעור</Label>
          <Input
            id="price_per_lesson"
            type="number"
            step="0.01"
            min="0"
            value={formData.price_per_lesson}
            onChange={(e) => onInputChange('price_per_lesson', e.target.value)}
            placeholder="הכנס מחיר לשיעור"
            dir="ltr"
          />
        </div>
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="start_date">תאריך התחלה *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.start_date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.start_date ? format(new Date(formData.start_date), "dd/MM/yyyy") : "בחר תאריך התחלה"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.start_date ? new Date(formData.start_date) : undefined}
                onSelect={(date) => onInputChange('start_date', date ? date.toISOString().split('T')[0] : '')}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div>
          <Label htmlFor="approx_end_date">תאריך סיום משוער *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.approx_end_date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.approx_end_date ? format(new Date(formData.approx_end_date), "dd/MM/yyyy") : "בחר תאריך סיום"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.approx_end_date ? new Date(formData.approx_end_date) : undefined}
                onSelect={(date) => onInputChange('approx_end_date', date ? date.toISOString().split('T')[0] : '')}
                disabled={(date) => formData.start_date ? date < new Date(formData.start_date) : false}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailsForm;