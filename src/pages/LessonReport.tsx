import React, { useRef, useState } from 'react';
import { Camera, FileText, CheckCircle, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const LessonReport = () => {
  const fileInputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [lessonTitle, setLessonTitle] = useState('');
  const [participants, setParticipants] = useState('');
  const [notes, setNotes] = useState('');
  const [feedback, setFeedback] = useState('');
  const [marketingConsent, setMarketingConsent] = useState(false);

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

  const handleSubmit = () => {
    const formData = new FormData();
    formData.append('lessonTitle', lessonTitle);
    formData.append('participants', participants);
    formData.append('notes', notes);
    formData.append('feedback', feedback);
    formData.append('marketingConsent', marketingConsent);

    files.forEach((file) => {
      formData.append('files', file);
    });

    // סימולציה של שליחה
    console.log('📤 נתונים מוכנים לשליחה לשרת:');
    console.log({
      lessonTitle,
      participants,
      notes,
      feedback,
      marketingConsent,
      files,
    });

    // לדוגמה: שליחה עתידית
    /*
    fetch('/api/submit-report', {
      method: 'POST',
      body: formData,
    }).then(...);
    */
    alert('דיווח נשלח בהצלחה!');

    // איפוס השדות לאחר שליחה
    setLessonTitle('');
    setParticipants('');
    setNotes('');
    setFeedback('');
    setFiles([]);
    setMarketingConsent(false);


    // איפוס קובץ הבחירה
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
                <Label htmlFor="lesson-title">כותרת השיעור</Label>
                <Input
                  id="lesson-title"
                  placeholder="הכנס כותרת השיעור"
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
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

              <Button className="w-full" onClick={handleSubmit}>
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
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer"
                onClick={handleClick}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
              >
                <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">גרור קבצים לכאן או לחץ להעלאה</p>
                <Button variant="outline">בחר קבצים</Button>
                <input
                  type="file"
                  multiple
                  hidden
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                />
              </div>

              {/* List of selected files */}
              {files.length > 0 && (
                <div className="bg-gray-100 p-3 rounded-lg space-y-2">
                  <h4 className="text-sm font-semibold text-right">קבצים שנבחרו:</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {files.map((file, index) => (
                      <li key={index} className="flex justify-between items-center">
                        <span>{file.name}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveFile(index)}
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
