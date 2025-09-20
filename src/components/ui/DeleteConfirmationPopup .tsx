import { useState } from 'react';
import { Trash, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const DeleteConfirmationPopup = ({ assignment, isOpen, onClose, onConfirm }) => {
  const [isDeleting, setIsDeleting] = useState(false);
console.log('assignment in popup:', assignment);
  const formatDate = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}.${month}.${year}`;
};

  // const handleDelete = async () => {
  //   setIsDeleting(true);
    
  //   try {
  //     const { error } = await supabase
  //       .from('course_instances')
  //       .delete()
  //       .eq('id', assignment.instance_id);
      
      
  //     console.log(`מוחק הקצאה: ${assignment.instance_id}`);
      
  //     onConfirm();
  //     onClose();
      
  //   } catch (error) {
  //     console.error('שגיאה במחיקת ההקצאה:', error);
  //     alert('אירעה שגיאה במחיקת ההקצאה');
  //   } finally {
  //     setIsDeleting(false);
  //   }
  // };

   const handleDelete = async () => {
    setIsDeleting(true);
    
    try {
      console.log(`מתחיל מחיקת הקצאה: ${assignment.instance_id}`);
      
      // שלב 1: מחיקת משימות של שיעורים ייחודיים
      const { data: instanceLessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('id')
        .eq('course_instance_id', assignment.instance_id);
      
      if (lessonsError) {
        console.error('שגיאה בקבלת שיעורים ייחודיים:', lessonsError);
        throw lessonsError;
      }
      
      if (instanceLessons && instanceLessons.length > 0) {
        console.log(`נמצאו ${instanceLessons.length} שיעורים ייחודיים למחיקה`);
        
        // מחיקת משימות של השיעורים הייחודיים
        const lessonIds = instanceLessons.map(lesson => lesson.id);
        const { error: tasksDeleteError } = await supabase
          .from('lesson_tasks')
          .delete()
          .in('lesson_id', lessonIds);
        
        if (tasksDeleteError) {
          console.error('שגיאה במחיקת משימות:', tasksDeleteError);
          throw tasksDeleteError;
        }
        
        console.log('משימות של שיעורים ייחודיים נמחקו בהצלחה');
        
        // מחיקת השיעורים הייחודיים עצמם
        const { error: lessonsDeleteError } = await supabase
          .from('lessons')
          .delete()
          .eq('course_instance_id', assignment.instance_id);
        
        if (lessonsDeleteError) {
          console.error('שגיאה במחיקת שיעורים ייחודיים:', lessonsDeleteError);
          throw lessonsDeleteError;
        }
        
        console.log('שיעורים ייחודיים נמחקו בהצלחה');
      }
      
      // שלב 2: מחיקת לוח זמנים של ההקצאה
      const { error: scheduleDeleteError } = await supabase
        .from('course_instance_schedules')
        .delete()
        .eq('course_instance_id', assignment.instance_id);
      
      if (scheduleDeleteError) {
        console.error('שגיאה במחיקת לוח זמנים:', scheduleDeleteError);
        // לא נזרוק שגיאה כאן כי יכול להיות שאין לוח זמנים
        console.log('ממשיכים למחיקת ההקצאה למרות שגיאה בלוח הזמנים');
      } else {
        console.log('לוח זמנים נמחק בהצלחה');
      }
      
      // שלב 3: מחיקת שיעורים מתוזמנים (lesson_schedules) - אם יש

      
      
      // שלב 5: מחיקת ההקצאה עצמה
      const { error: instanceDeleteError } = await supabase
        .from('course_instances')
        .delete()
        .eq('id', assignment.instance_id);
      
      if (instanceDeleteError) {
        console.error('שגיאה במחיקת ההקצאה:', instanceDeleteError);
        throw instanceDeleteError;
      }
      
      console.log(`הקצאה ${assignment.instance_id} נמחקה בהצלחה עם כל הנתונים המשויכים`);
      
      onConfirm();
      onClose();
      
    } catch (error) {
      console.error('שגיאה במחיקת ההקצאה:', error);
      alert('אירעה שגיאה במחיקת ההקצאה. אנא נסה שוב או צור קשר עם המנהל.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        {/* כותרת הפופאפ */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            אישור מחיקה
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isDeleting}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* תוכן הפופאפ */}
        <div className="mb-6">
          <div className="flex items-start mb-4">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mt-1">
              <Trash className="h-5 w-5 text-red-600" />
            </div>
            <div className="mr-3">
              <p className="text-sm font-medium text-gray-900 mb-2">
                האם אתה בטוח שברצונך למחוק הקצאה זו?
              </p>
            </div>
          </div>
          
          {/* פרטי ההקצאה */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="space-y-2">
              <p className="text-md font-semibold text-gray-900">
                {assignment.name}
              </p>
              <div className="text-xs text-gray-600 space-y-1">
                <p><span className="font-medium">מוסד:</span> {assignment.institution_name}</p>
                <p><span className="font-medium">מדריך:</span> {assignment.instructor_name}</p>
                {assignment.grade_level && (
                  <p><span className="font-medium">כיתה:</span> {assignment.grade_level}</p>
                )}
                {assignment.start_date && assignment.approx_end_date && (
                  <p ><span  className="font-medium">תאריכים:</span> {formatDate(assignment.approx_end_date)} -  {formatDate(assignment.start_date)}</p>
                )}
                {/* {assignment.max_participants && (
                  <p><span className="font-medium">מספר משתתפים מקסימלי:</span> {assignment.max_participants}</p>
                )} */}
                {assignment.price_for_customer && (
                  <p><span className="font-medium">מחיר:</span> ₪{assignment.price_for_customer}</p>
                )}
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-gray-200">
              <p className="text-xs text-red-600 font-medium">
                פעולה זו אינה ניתנת לביטול
              </p>
            </div>
          </div>
        </div>

        {/* כפתורי הפעולה */}
        <div className="flex space-x-3 rtl:space-x-reverse">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ביטול
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isDeleting ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2"></div>
                מוחק...
              </div>
            ) : (
              'מחק'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

