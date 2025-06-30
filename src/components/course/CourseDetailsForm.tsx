
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Institution {
  id: string;
  name: string;
}

interface Curriculum {
  id: string;
  name: string;
}

interface CourseDetailsFormProps {
  formData: {
    name: string;
    grade_level: string;
    max_participants: string;
    price_per_lesson: string;
    institution_id: string;
    curriculum_id: string;
  };
  institutions: Institution[];
  curricula: Curriculum[];
  onInputChange: (field: string, value: string) => void;
}

const CourseDetailsForm = ({ formData, institutions, curricula, onInputChange }: CourseDetailsFormProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">שם הקורס *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => onInputChange('name', e.target.value)}
          placeholder="הזן שם קורס"
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
          <Label htmlFor="price_per_lesson">מחיר לשיעור (₪)</Label>
          <Input
            id="price_per_lesson"
            type="number"
            step="0.01"
            value={formData.price_per_lesson}
            onChange={(e) => onInputChange('price_per_lesson', e.target.value)}
            placeholder="150"
            min="0"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="institution">מוסד חינוכי</Label>
        <Select
          value={formData.institution_id}
          onValueChange={(value) => onInputChange('institution_id', value)}
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
          onValueChange={(value) => onInputChange('curriculum_id', value)}
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
    </div>
  );
};

export default CourseDetailsForm;
