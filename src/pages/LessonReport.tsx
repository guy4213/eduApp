
import React, { useRef, useState } from 'react';
import { Camera, FileText, CheckCircle, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const LessonReport = () => {
  const fileInputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [lessonTitle, setLessonTitle] = useState('');
  const [participants, setParticipants] = useState('');
  const [notes, setNotes] = useState('');
  const [feedback, setFeedback] = useState('');
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (event) => {
    const selectedFiles = Array.from(event.target.files);
    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer.files);
    setFiles((prev) => [...prev, ...droppedFiles]);
  };

  const handleClick = () => {
    fileInputRef.current.click();
  };

  const handleRemoveFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (file, lessonReportId) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}-${Date.now()}.${fileExt}`;
      const filePath = `lesson-reports/${lessonReportId}/${fileName}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('lesson-files')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Save file record to database
      const { error: dbError } = await supabase
        .from('lesson_files')
        .insert({
          lesson_report_id: lessonReportId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          file_type: file.type,
          is_for_marketing: marketingConsent
        });

      if (dbError) {
        console.error('Database error:', dbError);
        throw dbError;
      }

      return true;
    } catch (error) {
      console.error('File upload failed:', error);
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!lessonTitle.trim()) {
      toast({
        title: "שגיאה",
        description: "נדרש להזין כותרת שיעור",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('משתמש לא מחובר');
      }

      // Create lesson report
      const { data: reportData, error: reportError } = await supabase
        .from('lesson_reports')
        .insert({
          lesson_title: lessonTitle,
          participants_count: parseInt(participants) || 0,
          notes: notes,
          feedback: feedback,
          marketing_consent: marketingConsent,
          instructor_id: user.id
        })
        .select()
        .single();

      if (reportError) {
        console.error('Report creation error:', reportError);
        throw reportError;
      }

      // Upload files if any
      if (files.length > 0) {
        const uploadPromises = files.map(file => uploadFile(file, reportData.id));
        const uploadResults = await Promise.all(uploadPromises);
        
        const failedUploads = uploadResults.filter(result => !result).length;
        if (failedUploads > 0) {
          toast({
            title: "אזהרה",
            description: `${failedUploads} קבצים לא הועלו בהצלחה`,
            variant: "destructive"
          });
        }
      }

      toast({
        title: "הצלחה!",
        description: "דיווח השיעור נשמר בהצלחה",
      });

      // Reset form
      setLessonTitle('');
      setParticipants('');
      setNotes('');
      setFeedback('');
      setFiles([]);
      setMarketingConsent(false);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: "שגיאה",
        description: error.message || "אירעה שגיאה בשמירת הדיווח",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
                <Label htmlFor="lesson-title">כותרת השיעור *</Label>
                <Input
                  id="lesson-title"
                  placeholder="הכנס כותרת השיעור"
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="participants">מספר משתתפים</Label>
                <Input
                  id="participants"
                  type="number"
                  placeholder="0"
                  value={participants}
                  onChange={(e) => setParticipants(e.target.value)}
                  min="0"
                />
              </div>

              <div>
                <Label htmlFor="notes">הערות מהשיעור</Label>
                <Textarea
                  id="notes"
                  placeholder="תאר את מהלך השיעור, תגובות התלמידים וכו'"
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="feedback">משוב כללי</Label>
                <Textarea
                  id="feedback"
                  placeholder="משוב על השיעור - מה עבד טוב ומה ניתן לשפר"
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                />
              </div>

              <Button 
                className="w-full" 
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                <CheckCircle className="h-4 w-4 ml-2" />
                {isSubmitting ? 'שומר...' : 'שמור דיווח'}
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
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
                onClick={handleClick}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
              >
                <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">גרור קבצים לכאן או לחץ להעלאה</p>
                <Button variant="outline" type="button">בחר קבצים</Button>
                <input
                  type="file"
                  multiple
                  hidden
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*,video/*,.pdf,.doc,.docx"
                />
              </div>

              {/* List of selected files */}
              {files.length > 0 && (
                <div className="bg-gray-100 p-3 rounded-lg space-y-2">
                  <h4 className="text-sm font-semibold text-right">קבצים שנבחרו:</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {files.map((file, index) => (
                      <li key={index} className="flex justify-between items-center">
                        <span className="truncate">{file.name}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveFile(index)}
                          type="button"
                        >
                          <X className="w-4 h-4 text-red-500" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-2 text-right">
                <Label className="flex items-center justify-end">
                  <input
                    type="checkbox"
                    className="ml-2"
                    checked={marketingConsent}
                    onChange={(e) => setMarketingConsent(e.target.checked)}
                  />
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
