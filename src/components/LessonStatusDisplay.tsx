import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock,
  Users,
  CheckSquare,
  Calendar
} from 'lucide-react';
import { LessonStatus, getLessonStatusSummary } from '@/services/lessonStatusService';

interface LessonStatusDisplayProps {
  lessonStatuses: LessonStatus[];
  showDetails?: boolean;
  compact?: boolean;
}

const LessonStatusDisplay: React.FC<LessonStatusDisplayProps> = ({ 
  lessonStatuses, 
  showDetails = true,
  compact = false 
}) => {
  const summary = getLessonStatusSummary(lessonStatuses);

  const getStatusIcon = (status: LessonStatus['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'not_completed':
        return <XCircle className="h-4 w-4 text-orange-500" />;
      case 'issues':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'not_reported':
        return <Clock className="h-4 w-4 text-gray-400" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: LessonStatus['status']) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-200">
            <CheckCircle2 className="h-3 w-3 ml-1" />
            התקיים
          </Badge>
        );
      case 'not_completed':
        return (
          <Badge className="bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200">
            <XCircle className="h-3 w-3 ml-1" />
            לא התקיים
          </Badge>
        );
      case 'issues':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-200">
            <AlertTriangle className="h-3 w-3 ml-1" />
            בעיות
          </Badge>
        );
      case 'not_reported':
        return (
          <Badge variant="outline" className="text-gray-600 border-gray-300">
            <Clock className="h-3 w-3 ml-1" />
            לא דווח
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-gray-600 border-gray-300">
            <Clock className="h-3 w-3 ml-1" />
            לא ידוע
          </Badge>
        );
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL');
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {getStatusIcon('completed')}
          <span className="text-sm text-green-600 font-medium">{summary.completed}</span>
        </div>
        <div className="flex items-center gap-1">
          {getStatusIcon('issues')}
          <span className="text-sm text-red-600 font-medium">{summary.issues}</span>
        </div>
        <div className="flex items-center gap-1">
          {getStatusIcon('not_completed')}
          <span className="text-sm text-orange-500 font-medium">{summary.notCompleted}</span>
        </div>
        <div className="flex items-center gap-1">
          {getStatusIcon('not_reported')}
          <span className="text-sm text-gray-400 font-medium">{summary.notReported}</span>
        </div>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          סטטוס שיעורים
          <Badge variant="outline" className="mr-2">
            {summary.completionRate}% הושלמו
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-center gap-1 mb-1">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">התקיים</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{summary.completed}</div>
          </div>
          
          <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center justify-center gap-1 mb-1">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">בעיות</span>
            </div>
            <div className="text-2xl font-bold text-red-600">{summary.issues}</div>
          </div>
          
          <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-center justify-center gap-1 mb-1">
              <XCircle className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium text-orange-800">לא התקיים</span>
            </div>
            <div className="text-2xl font-bold text-orange-500">{summary.notCompleted}</div>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-600">לא דווח</span>
            </div>
            <div className="text-2xl font-bold text-gray-400">{summary.notReported}</div>
          </div>
        </div>

        {/* Detailed lesson list */}
        {showDetails && (
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-800 mb-3">פירוט שיעורים:</h4>
            {lessonStatuses.map((lesson) => (
              <div 
                key={lesson.lessonId} 
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(lesson.status)}
                  <div>
                    <div className="font-medium text-gray-900">
                      שיעור {lesson.lessonNumber}: {lesson.lessonTitle}
                    </div>
                    {lesson.reportDate && (
                      <div className="text-sm text-gray-500">
                        דווח ב-{formatDate(lesson.reportDate)}
                      </div>
                    )}
                    {lesson.status === 'issues' && lesson.feedback && (
                      <div className="text-sm text-red-600 mt-1 max-w-md">
                        <strong>בעיה:</strong> {lesson.feedback}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {lesson.isCompleted && (
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Users className="h-3 w-3" />
                      <span>{lesson.participantsCount || 0}/{lesson.totalStudents || 0}</span>
                    </div>
                  )}
                  
                  {lesson.totalTasksCount > 0 && (
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <CheckSquare className="h-3 w-3" />
                      <span>{lesson.completedTasksCount || 0}/{lesson.totalTasksCount}</span>
                    </div>
                  )}
                  
                  {getStatusBadge(lesson.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LessonStatusDisplay;