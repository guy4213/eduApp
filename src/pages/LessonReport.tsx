
import React from 'react';
import { BookOpen, Camera, FileText, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const LessonReport = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">דיווח שיעור</h1>
          <p className="text-gray-600">דיווח על שיעור שהתקיים או בתהליך</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Report Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 ml-2" />
                טופס דיווח
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="lesson-title">כותרת השיעור</Label>
                <Input id="lesson-title" placeholder="הכנס כותרת השיעור" />
              </div>

              <div>
                <Label htmlFor="participants">מספר משתתפים</Label>
                <Input id="participants" type="number" placeholder="0" />
              </div>

              <div>
                <Label htmlFor="notes">הערות מהשיעור</Label>
                <Textarea 
                  id="notes" 
                  placeholder="תאר את מהלך השיעור, תגובות התלמידים וכו'"
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="feedback">משוב כללי</Label>
                <Textarea 
                  id="feedback" 
                  placeholder="משוב על השיעור - מה עבד טוב ומה ניתן לשפר"
                  rows={3}
                />
              </div>

              <Button className="w-full">
                <CheckCircle className="h-4 w-4 ml-2" />
                שמור דיווח
              </Button>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Camera className="h-5 w-5 ml-2" />
                העלאת קבצים
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">גרור קבצים לכאן או לחץ להעלאה</p>
                <Button variant="outline">בחר קבצים</Button>
              </div>

              <div className="space-y-2">
                <Label>
                  <input type="checkbox" className="ml-2" />
                  אישור להשתמש בתמונות לצרכי שיווק
                </Label>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LessonReport;
