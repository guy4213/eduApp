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
    </div>
  );
};

export default CourseDetailsForm;