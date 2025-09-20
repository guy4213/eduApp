// AdminSettings.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Settings, 
  Users, 
  Building2, 
  Calendar, 
  Clock,
  Trash,
  Edit,
  Plus,
  AlertCircle,
  Save,
  X,
  Loader2,
  CalendarX,
  UserX
} from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { toast } from "@/components/ui/use-toast";
import MobileNavigation from "@/components/layout/MobileNavigation";

// Types
interface BlockedDate {
  id: string;
  date?: string; // For single dates (legacy)
  start_date?: string; // For ranges
  end_date?: string; // For ranges
  reason?: string;
  created_at?: string;
}

interface SystemDefaults {
  id?: string;
  default_lesson_duration: number;
  default_task_duration: number;

}

interface Institution {
  id: string;
  name: string;
  city: string;
  address?: string;
  contact_phone?: string;
  contact_person?: string;
  contact_email?: string;
  notes?: string;
  created_at?: string;
}



interface Instructor {
  id: string;
  full_name: string;
  phone?: string;
  role?: string;
  hourly_rate?: number;
  created_at?: string;
  updated_at?: string;
  email?: string;
  birthdate?: string; // Use string for date input compatibility
  current_work_hours?: number;
  benefits?: string;
  img?: string;
}

interface Assignment {
  id: string;
  course_name: string;
  institution_name: string;
  start_date: string;
  end_date: string;
}

const AdminSettings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('defaults');
  const [loading, setLoading] = useState(false);
  const [savingDefaults, setSavingDefaults] = useState(false);
  const [showEditInstructorModal, setShowEditInstructorModal] = useState(false);
  const [instructorForm, setInstructorForm] = useState<Partial<Instructor>>({});
  // States for defaults
  const [defaults, setDefaults] = useState<SystemDefaults>({
    default_lesson_duration: 45,
    default_task_duration: 15,
   
  });
  const [newBlockedDate, setNewBlockedDate] = useState({ 
  type: 'single', // 'single' or 'range'
  date: '', 
  start_date: '',
  end_date: '',
  reason: '' 
});
  // States for institutions
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [editingInstitution, setEditingInstitution] = useState<Institution | null>(null);
  const [showInstitutionModal, setShowInstitutionModal] = useState(false);
  const [institutionForm, setInstitutionForm] = useState<Partial<Institution>>({
    name: '',
    city: '',
    address: '',
    contact_phone: '',
    contact_person: '',
    contact_email: '',
    notes: ''
  });
  
  // States for instructors  
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [instructorAssignments, setInstructorAssignments] = useState<Assignment[]>([]);
  const [reassignToInstructor, setReassignToInstructor] = useState('');
  
  // States for blocked dates
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [showBlockedDateModal, setShowBlockedDateModal] = useState(false);

  // Check user permissions
  const userRole = user?.user_metadata?.role;
  const hasAccess = ['admin', 'pedagogical_manager'].includes(userRole);



 // Function to open the edit modal
  const openEditInstructorModal = (instructor: Instructor) => {
    setSelectedInstructor(instructor);
    setInstructorForm(instructor); // Load current instructor data into the form
    setShowEditInstructorModal(true);
  };

  // Function to handle form input changes
  const handleInstructorFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value, type } = e.target;
    setInstructorForm(prev => ({
      ...prev,
      [id]: type === 'number' ? (value === '' ? null : parseFloat(value)) : value,
    }));
  };
  
  // Function to save the updated profile
//   const handleUpdateInstructor = async () => {
//     if (!selectedInstructor) return;
//         console.log("אובייקט הנשלח לעדכון ב-Supabase:", instructorForm);

//     setLoading(true);
//     try {
//         const { error } = await supabase
//             .from('profiles')
//             .update({ ...instructorForm, updated_at: new Date().toISOString() })
//             .eq('id', selectedInstructor.id);

//         if (error) {
//             throw error;
//         }

//         toast({ title: "✅ פרופיל המדריך עודכן בהצלחה" });
//         setShowEditInstructorModal(false);
//         fetchInstructors(); // Refresh the instructor list with new data
//     } catch (error: any) {
//         toast({
//             title: "❌ שגיאה בעדכון הפרופיל",
//             description: error.message,
//             variant: "destructive",
//         });
//     } finally {
//         setLoading(false);
//     }
//   };


const handleUpdateInstructor = async () => {
  if (!selectedInstructor) return;
  
  setLoading(true);
  try {
    const emailChanged = instructorForm.email !== selectedInstructor.email;
    const nameChanged = instructorForm.full_name !== selectedInstructor.full_name;

    // Update auth data if needed
    if (emailChanged || nameChanged) {
      const newMetadata = {
        ...selectedInstructor,
        full_name: instructorForm.full_name,
        name: instructorForm.full_name
      };

      const { error: authError } = await supabase.rpc('update_user_auth_data', {
        target_user_id: selectedInstructor.id,
        new_email: emailChanged ? instructorForm.email : null,
        new_metadata: nameChanged ? newMetadata : null
      });

      if (authError) {
        throw new Error(`שגיאה בעדכון נתוני האימות: ${authError.message}`);
      }
    }

    // Update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        ...instructorForm, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', selectedInstructor.id);

    if (profileError) throw profileError;

    toast({ title: "✅ פרופיל המדריך עודכן בהצלחה" });
    setShowEditInstructorModal(false);
    fetchInstructors();

  } catch (error: any) {
    toast({
      title: "❌ שגיאה בעדכון הפרופיל",
      description: error.message,
      variant: "destructive",
    });
  } finally {
    setLoading(false);
  }
};
  // Fetch system defaults
  const fetchDefaults = async () => {
    try {
      const { data, error } = await supabase
        .from('system_defaults')
        .select('*')
        .single();
      
      if (error && error.code === 'PGRST116') {
        // No defaults exist, create them
        const { data: newDefaults } = await supabase
          .from('system_defaults')
          .insert([{
            default_lesson_duration: 45,
            default_task_duration: 15,
            default_break_duration: 10
          }])
          .select()
          .single();
        
        if (newDefaults) setDefaults(newDefaults);
      } else if (data) {
        setDefaults(data);
      }
    } catch (error) {
      console.error('Error fetching defaults:', error);
    }
  };

  // Update defaults
  const updateDefaults = async () => {
    setSavingDefaults(true);
    try {
      const { error } = await supabase
        .from('system_defaults')
        .update({
          ...defaults,
          updated_at: new Date().toISOString(),
        })
        .eq('id', defaults.id); // Assuming an ID exists
      
      if (!error) {
        toast({
          title: "✅ ההגדרות עודכנו בהצלחה",
          description: "ברירות המחדל החדשות ישמשו בהקצאות חדשות"
        });
      }
    } catch (error) {
      toast({
        title: "❌ שגיאה בעדכון ההגדרות",
        variant: "destructive"
      });
    } finally {
      setSavingDefaults(false);
    }
  };

  // Fetch institutions
  const fetchInstitutions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('educational_institutions')
        .select('*')
        .order('name');
      
      if (data) setInstitutions(data);
    } catch (error) {
      console.error('Error fetching institutions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save institution
  const saveInstitution = async () => {
    if (!institutionForm.name || !institutionForm.city) {
        toast({ title: "שדות חובה חסרים", description: "אנא מלא שם מוסד ועיר.", variant: "destructive" });
        return;
    }
    setLoading(true);
    try {
      if (editingInstitution) {
        // Update existing
        const { error } = await supabase
          .from('educational_institutions')
          .update(institutionForm)
          .eq('id', editingInstitution.id);
        
        if (!error) {
          toast({ title: "✅ המוסד עודכן בהצלחה" });
        }
      } else {
        // Create new
        const { error } = await supabase
          .from('educational_institutions')
          .insert([institutionForm]);
        
        if (!error) {
          toast({ title: "✅ המוסד נוסף בהצלחה" });
        }
      }
      
      fetchInstitutions();
      closeInstitutionModal();
    } catch (error) {
      toast({
        title: "❌ שגיאה בשמירת המוסד",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete institution
  const deleteInstitution = async (id: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק מוסד זה?')) return;
    
    setLoading(true);
    try {
      // Check if institution has assignments
      const { data: assignments } = await supabase
        .from('course_instances')
        .select('id')
        .eq('institution_id', id)
        .limit(1);
      
      if (assignments && assignments.length > 0) {
        toast({
          title: "⚠️ לא ניתן למחוק",
          description: "למוסד זה יש הקצאות פעילות",
          variant: "destructive"
        });
        return;
      }
      
      const { error } = await supabase
        .from('educational_institutions')
        .delete()
        .eq('id', id);
      
      if (!error) {
        fetchInstitutions();
        toast({ title: "✅ המוסד נמחק בהצלחה" });
      }
    } catch (error) {
      toast({
        title: "❌ שגיאה במחיקת המוסד",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Open institution modal
  const openInstitutionModal = (institution?: Institution) => {
    if (institution) {
      setEditingInstitution(institution);
      setInstitutionForm(institution);
    } else {
      setEditingInstitution(null);
      setInstitutionForm({
        name: '',
        city: '',
        address: '',
        contact_phone: '',
        contact_person: '',
        contact_email: '',
        notes: ''
      });
    }
    setShowInstitutionModal(true);
  };

  // Close institution modal
  const closeInstitutionModal = () => {
    setShowInstitutionModal(false);
    setEditingInstitution(null);
    setInstitutionForm({
      name: '',
      city: '',
      address: '',
      contact_phone: '',
      contact_person: '',
      contact_email: '',
      notes: ''
    });
  };

  // Fetch instructors
  const fetchInstructors = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'instructor')
        .order('full_name');
      
      if (data) setInstructors(data);
    } catch (error) {
      console.error('Error fetching instructors:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check instructor assignments
  const checkInstructorAssignments = async (instructorId: string) => {
    try {
      const { data, error } = await supabase
        .from('course_instances')
        .select(`
          id,
          courses (name),
          educational_institutions (name),
          start_date,
          end_date
        `)
        .eq('instructor_id', instructorId);
      
      if (data) {
        const assignments = data.map(item => ({
          id: item.id,
          course_name: (item.courses as any)?.name || 'ללא שם',
          institution_name: (item.educational_institutions as any)?.name || 'ללא שם',
          start_date: item.start_date,
          end_date: item.end_date
        }));
        
        setInstructorAssignments(assignments);
        return assignments.length > 0;
      }
      return false;
    } catch (error) {
      console.error('Error checking assignments:', error);
      return false;
    }
  };

    // --- NEW SECURE DELETE INSTRUCTOR LOGIC ---
    // const handleDeleteInstructor = async () => {
    //     if (!selectedInstructor) return;
    
    //     setLoading(true);
    //     try {
    //         // Step 1: Notify admins if there are assignments (optional but good practice)
    //         if (instructorAssignments.length > 0) {
    //             const { error: notifyError } = await supabase.functions.invoke('notify-admins-on-delete', {
    //                 body: {
    //                     instructorName: selectedInstructor.full_name,
    //                     assignments: instructorAssignments,
    //                 },
    //             });
    //             if (notifyError) console.error("Failed to send notification email:", notifyError);
    //         }
    
    //         // Step 2: Reassign or nullify assignments
    //         if (reassignToInstructor) {
    //             await supabase
    //                 .from('course_instances')
    //                 .update({ instructor_id: reassignToInstructor })
    //                 .eq('instructor_id', selectedInstructor.id);
    //         } else if (instructorAssignments.length > 0) {
    //              await supabase
    //                 .from('course_instances')
    //                 .update({ instructor_id: null })
    //                 .eq('instructor_id', selectedInstructor.id);
    //         }
    
    //         // Step 3: Call the secure Supabase function to delete the user
    //         const { error: deleteError } = await supabase.functions.invoke('delete-user', {
    //             body: { user_id: selectedInstructor.id },
    //         });
    
    //         if (deleteError) {
    //             throw new Error(deleteError.message);
    //         }
    
    //         toast({ title: "✅ המדריך הוסר בהצלחה מהמערכת" });
    //         fetchInstructors(); // Refresh the list
    //         // Close and reset modal state
    //         setShowDeleteConfirm(false);
    //         setSelectedInstructor(null);
    //         setInstructorAssignments([]);
    //         setReassignToInstructor('');
    
    //     } catch (error: any) {
    //         toast({
    //             title: "❌ שגיאה בהסרת המדריך",
    //             description: error.message || "אירעה שגיאה לא צפויה.",
    //             variant: "destructive"
    //         });
    //     } finally {
    //         setLoading(false);
    //     }
    // };


    const handleDeleteInstructor = async () => {
    if (!selectedInstructor) {
        toast({ title: "שגיאה: לא נבחר מדריך למחיקה", variant: "destructive" });
        return;
    }

    setLoading(true);
    try {
        // שלב 1: עדכון הקצאות קיימות (מתבצע בצד הלקוח לפני המחיקה)
        if (reassignToInstructor) {
            await supabase
                .from('course_instances')
                .update({ instructor_id: reassignToInstructor })
                .eq('instructor_id', selectedInstructor.id);
        } else if (instructorAssignments.length > 0) {
             await supabase
                .from('course_instances')
                .update({ instructor_id: null })
                .eq('instructor_id', selectedInstructor.id);
        }

        // שלב 2: קריאה לפונקציה שלך בשם הנכון - 'delete-user'
        const { error } = await supabase.functions.invoke('delete-user', {
            body: {
                userId: selectedInstructor.id,
                instructorName: selectedInstructor.full_name,
                assignments: instructorAssignments,
            },
        });

        if (error) {
            throw new Error(`שגיאה מפונקציית השרת: ${error.message}`);
        }

        toast({ title: "✅ המדריך הוסר והתראה נשלחה" });
        
        // שלב 3: ניקוי ורענון הממשק
        fetchInstructors();
        setShowDeleteConfirm(false);
        setSelectedInstructor(null);
        setInstructorAssignments([]);
        setReassignToInstructor('');

    } catch (error: any) {
        toast({
            title: "❌ שגיאה בתהליך המחיקה",
            description: error.message || "אירעה שגיאה לא צפויה.",
            variant: "destructive",
        });
    } finally {
        setLoading(false);
    }
};
  // Fetch blocked dates
// const fetchBlockedDates = async () => {
//   console.log("Fetching blocked dates...");
//   try {
//     const { data, error } = await supabase
//       .from('blocked_dates')
//       .select('*')
//       .order('created_at', { ascending: false }); // פשוט - סדר לפי תאריך יצירה
    
//     console.log("fetchBlockedDates response:", { data, error });
    
//     if (data) {
//       console.log("Setting blocked dates:", data);
//       setBlockedDates(data);
//     }
//     if (error) {
//       console.error("fetchBlockedDates error:", error);
//     }
//   } catch (error) {
//     console.error('Error fetching blocked dates:', error);
//   }
// };
 
const fetchBlockedDates = async () => {
  try {
    const { data, error } = await supabase
      .from('blocked_dates')
      .select('*');
    
    if (data) {
      // סדר בצד הלקוח - תאריכי range לפני תאריכים בודדים
      const sortedData = data.sort((a, b) => {
        const dateA = a.start_date || a.date;
        const dateB = b.start_date || b.date;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });
      
      setBlockedDates(sortedData);
    }
  } catch (error) {
    console.error('Error fetching blocked dates:', error);
  }
};

const addBlockedDate = async () => {
  const { type, date, start_date, end_date, reason } = newBlockedDate;
  
  console.log("newBlockedDate:", newBlockedDate); // הוסף את זה
  
  if (type === 'single' && !date) {
    toast({ title: "אנא בחר תאריך", variant: "destructive" });
    return;
  }
  
  if (type === 'range' && (!start_date || !end_date)) {
    toast({ title: "אנא בחר תאריך התחלה וסיום", variant: "destructive" });
    return;
  }
  
  if (type === 'range' && new Date(start_date) > new Date(end_date)) {
    toast({ title: "תאריך ההתחלה חייב להיות לפני תאריך הסיום", variant: "destructive" });
    return;
  }
  
  setLoading(true);
  try {
    const insertData = type === 'single' 
      ? { date, reason, created_by: user?.id }
      : { start_date, end_date, reason, created_by: user?.id };
      
    console.log("insertData:", insertData); // הוסף את זה
      
    const { data, error } = await supabase  // הוסף data כדי לראות מה חוזר
      .from('blocked_dates')
      .insert(insertData)
      .select(); // הוסף select כדי לקבל את הנתונים שנוספו
    
    console.log("supabase response:", { data, error }); // הוסף את זה
    
    if (error) {
      console.error("Supabase error:", error); // הוסף את זה
      throw error;
    }
    
    if (!error) {
      await fetchBlockedDates(); // הוסף await כדי לוודא שהפונקציה מסתיימת
      setNewBlockedDate({ type: 'single', date: '', start_date: '', end_date: '', reason: '' });
      setShowBlockedDateModal(false);
      toast({ 
        title: "✅ תאריך/ים נוסף/ו לרשימה החסומה",
        description: type === 'range' 
          ? `טווח תאריכים: ${formatDate(start_date)} עד ${formatDate(end_date)}`
          : `תאריך יחיד: ${formatDate(date)}`
      });
    }
  } catch (error: any) {
    console.error("Catch error:", error); // הוסף את זה
    toast({
      title: "❌ שגיאה בהוספת תאריך חסום",
      description: error.message,
      variant: "destructive"
    });
  } finally {
    setLoading(false);
  }
};



  // Delete blocked date
  const deleteBlockedDate = async (id: string) => {
    if (!confirm('האם להסיר תאריך זה מהרשימה החסומה?')) return;
    
    try {
      const { error } = await supabase
        .from('blocked_dates')
        .delete()
        .eq('id', id);
      
      if (!error) {
        fetchBlockedDates();
        toast({ title: "✅ התאריך הוסר מהרשימה החסומה" });
      }
    } catch (error) {
      toast({
        title: "❌ שגיאה בהסרת התאריך",
        variant: "destructive"
      });
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', {day: '2-digit', month: '2-digit', year: 'numeric'});
  };

  const formatBlockedDate = (blockedDate: BlockedDate) => {
  if (blockedDate.date) {
    // Single date (legacy format)
    return formatDate(blockedDate.date);
  } else if (blockedDate.start_date && blockedDate.end_date) {
    // Date range
    const startFormatted = formatDate(blockedDate.start_date);
    const endFormatted = formatDate(blockedDate.end_date);
    
    if (blockedDate.start_date === blockedDate.end_date) {
      return startFormatted; // Same day range
    }
    return `${startFormatted} - ${endFormatted}`;
  }
  return 'N/A';
};

  useEffect(() => {
    if (hasAccess) {
      fetchDefaults();
      fetchInstitutions();
      fetchInstructors();
      fetchBlockedDates();
    }
  }, [hasAccess]);

  // Check permissions
  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
        <Card className="text-center py-16">
          <CardContent>
            <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">אין הרשאה</h3>
            <p className="text-gray-600">רק מנהלים ומנהלים פדגוגיים יכולים לגשת להגדרות מערכת</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="md:hidden">
        <MobileNavigation />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Settings className="h-8 w-8 text-blue-600" />
            הגדרות מערכת
          </h1>
          <p className="text-gray-600">ניהול הגדרות כלליות, מוסדות, מדריכים ותאריכים חסומים</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
            <TabsTrigger value="defaults" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>ברירות מחדל</span>
            </TabsTrigger>
            <TabsTrigger value="institutions" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span>מוסדות</span>
            </TabsTrigger>
            <TabsTrigger value="instructors" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>מדריכים</span>
            </TabsTrigger>
            <TabsTrigger value="blocked-dates" className="flex items-center gap-2">
              <CalendarX className="h-4 w-4" />
              <span>תאריכים חסומים</span>
            </TabsTrigger>
          </TabsList>

          {/* ברירות מחדל */}
          <TabsContent value="defaults">
            <Card>
              <CardHeader>
                <CardTitle>הגדרות ברירת מחדל למערכת</CardTitle>
                <CardDescription>
                  הגדרות אלו ישמשו כברירת מחדל בעת יצירת קורסים והקצאות חדשות
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="lesson-duration">משך שיעור סטנדרטי (דקות)</Label>
                    <Input
                      id="lesson-duration"
                      type="number"
                      min="15"
                      max="180"
                      value={defaults.default_lesson_duration}
                      onChange={(e) => setDefaults({
                        ...defaults,
                        default_lesson_duration: parseInt(e.target.value) || 45
                      })}
                    />
                    <p className="text-xs text-gray-500">זמן ברירת מחדל לשיעור</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="task-duration">משך משימה סטנדרטי (דקות)</Label>
                    <Input
                      id="task-duration"
                      type="number"
                      min="5"
                      max="60"
                      value={defaults.default_task_duration}
                      onChange={(e) => setDefaults({
                        ...defaults,
                        default_task_duration: parseInt(e.target.value) || 15
                      })}
                    />
                    <p className="text-xs text-gray-500">זמן ברירת מחדל למשימה</p>
                  </div>
                  
                  {/* <div className="space-y-2">
                    <Label htmlFor="break-duration">הפסקה בין שיעורים (דקות)</Label>
                    <Input
                      id="break-duration"
                      type="number"
                      min="0"
                      max="30"
                      value={defaults.default_break_duration}
                      onChange={(e) => setDefaults({
                        ...defaults,
                        default_break_duration: parseInt(e.target.value) || 10
                      })}
                    />
                    <p className="text-xs text-gray-500">זמן הפסקה בין שיעורים</p>
                  </div> */}
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    onClick={updateDefaults} 
                    disabled={savingDefaults}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {savingDefaults ? (
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 ml-2" />
                    )}
                    שמור שינויים
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* מוסדות חינוך */}
          <TabsContent value="institutions">
            <Card>
              <CardHeader>
                <div className="flex justify-between flex-row-reverse  items-center">
                  <div>
                    <CardTitle>ניהול מוסדות חינוך</CardTitle>
                    <CardDescription>רשימת כל המוסדות במערכת</CardDescription>
                  </div>
                  <Button onClick={() => openInstitutionModal()} className="bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4 ml-2" />
                    הוסף מוסד
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                ) : institutions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Building2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>אין מוסדות חינוך במערכת</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto ">
                    <Table className='rtl'>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">שם המוסד</TableHead>
                          <TableHead className="text-right" >עיר</TableHead>
                          <TableHead className="text-right">איש קשר</TableHead>
                          <TableHead className="text-right">טלפון</TableHead>
                          <TableHead  className="text-center">פעולות</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody >
                        {institutions.map((institution) => (
                          <TableRow key={institution.id}>
                            <TableCell className="font-medium">{institution.name}</TableCell>
                            <TableCell>{institution.city}</TableCell>
                            <TableCell>{institution.contact_person || '-'}</TableCell>
                            <TableCell>{institution.contact_phone || '-'}</TableCell>
                            <TableCell>
                              <div className="flex justify-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openInstitutionModal(institution)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => deleteInstitution(institution.id)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* מדריכים */}
          {/* <TabsContent value="instructors">
            <Card>
              <CardHeader>
                <CardTitle>ניהול מדריכים</CardTitle>
                <CardDescription>
                  רשימת המדריכים במערכת - ניתן להסיר מדריכים בלבד (הוספת מדריכים מתבצעת בדף המשתמשים)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                ) : instructors.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>אין מדריכים במערכת</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table className='rtl'>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">שם המדריך</TableHead>
                          <TableHead className="text-right px-[5rem]">אימייל</TableHead>
                          <TableHead className="text-right px-[2rem]">טלפון</TableHead>
                          <TableHead className="text-right ">תאריך הצטרפות</TableHead>
                          <TableHead className="text-center">פעולות</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {instructors.map((instructor) => (
                          <TableRow key={instructor.id}>
                            <TableCell className="font-medium">{instructor.full_name}</TableCell>
                            <TableCell>{instructor.email || '-'}</TableCell>
                            <TableCell>{instructor.phone || '-'}</TableCell>
                            <TableCell className='pr-[2rem]'>{formatDate(instructor.created_at || '')}</TableCell>
                            <TableCell>
                              <div className="flex justify-center">
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={async () => {
                                    setLoading(true);
                                    await checkInstructorAssignments(instructor.id);
                                    setSelectedInstructor(instructor);
                                    setShowDeleteConfirm(true);
                                    setLoading(false);
                                  }}
                                >
                                  <UserX className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent> */}
<TabsContent value="instructors">
  <Card>
    <CardHeader>
      <CardTitle>ניהול מדריכים</CardTitle>
      <CardDescription>
        רשימת המדריכים במערכת. ניתן לערוך את פרטיהם או להסירם.
      </CardDescription>
    </CardHeader>
    <CardContent>
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : instructors.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>אין מדריכים במערכת</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table className='rtl'>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">שם המדריך</TableHead>
                <TableHead className="text-right px-[5rem]">אימייל</TableHead>
                <TableHead className="text-right px-[2rem]">טלפון</TableHead>
                <TableHead className="text-right ">תאריך הצטרפות</TableHead>
                <TableHead className="text-center">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {instructors.map((instructor) => (
                <TableRow key={instructor.id}>
                  <TableCell className="font-medium">{instructor.full_name}</TableCell>
                  <TableCell>{instructor.email || '-'}</TableCell>
                  <TableCell>{instructor.phone || '-'}</TableCell>
                  <TableCell className='pr-[2rem]'>{formatDate(instructor.created_at || '')}</TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-2">
                      {/* --- NEW EDIT BUTTON --- */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditInstructorModal(instructor)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={async () => {
                          setLoading(true);
                          await checkInstructorAssignments(instructor.id);
                          setSelectedInstructor(instructor);
                          setShowDeleteConfirm(true);
                          setLoading(false);
                        }}
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </CardContent>
  </Card>
</TabsContent>
          {/* תאריכים חסומים */}
          <TabsContent value="blocked-dates">
            <Card>
              <CardHeader>
                <div className="flex flex-row-reverse justify-between items-center">
                  <div>
                    <CardTitle>תאריכים חסומים במערכת</CardTitle>
                    <CardDescription>תאריכים שבהם לא ניתן לתזמן שיעורים (חגים, חופשות וכו')</CardDescription>
                  </div>
                  <Button 
                    onClick={() => setShowBlockedDateModal(true)}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <CalendarX className="h-4 w-4 ml-2" />
                    הוסף תאריך חסום
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {blockedDates.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>אין תאריכים חסומים במערכת</p>
                  </div>
                ) 
                //   <div className="grid gap-3">
                //     {blockedDates.map((blockedDate) => (
                //       <div 
                //         key={blockedDate.id}
                //         className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200"
                //       >
                //         <div className="flex items-center gap-3">
                //           <CalendarX className="h-5 w-5 text-orange-600" />
                //           <div>
                //             <span className="font-medium">{formatDate(blockedDate.date)}</span>
                //             {blockedDate.reason && (
                //               <span className="text-sm text-gray-600 mr-2">- {blockedDate.reason}</span>
                //             )}
                //           </div>
                //         </div>
                //         <Button
                //           size="sm"
                //           variant="ghost"
                //           onClick={() => deleteBlockedDate(blockedDate.id)}
                //         >
                //           <X className="h-4 w-4 text-red-600" />
                //         </Button>
                //       </div>
                //     ))}
                //   </div>
//             : (    <div className="grid gap-3">
//   {blockedDates.map((blockedDate) => (
//     <div 
//       key={blockedDate.id}
//       className="flex items-center flex-row-reverse justify-between p-3 bg-orange-50 rounded-lg border border-orange-200"
//     >
//       <div className="flex items-center  gap-3">
//         <CalendarX className="h-5 w-5 text-orange-600" />
//         <div>
//           <span className="font-medium">{formatBlockedDate(blockedDate)}-</span>
//           {blockedDate.reason && (
//             <span className="text-sm text-gray-600 mr-2"> {blockedDate.reason}</span>
//           )}
//           {/* Show if it's a range */}
//           {blockedDate.start_date && blockedDate.end_date && blockedDate.start_date !== blockedDate.end_date && (
//             <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded mr-2">
//               טווח תאריכים
//             </span>
//           )}
//         </div>
//       </div>
//       <Button
//         size="sm"
//         variant="ghost"
//         onClick={() => deleteBlockedDate(blockedDate.id)}
//       >
//         <X className="h-4 w-4 text-red-600" />
//       </Button>
//     </div>
//   ))}
// </div>
: (
  <div className="grid gap-3">
    {blockedDates.map((blockedDate) => (
      <div 
        key={blockedDate.id}
        className="flex items-center flex-row-reverse justify-between p-3 bg-orange-50 rounded-lg border border-orange-200"
      >
        <div className="flex items-center gap-2">
         
          <div  className="flex items-center flex-row-reverse  "  >
            <span className="font-medium">-  {formatBlockedDate(blockedDate)}</span>
            {blockedDate.reason && (
              <span className="text-sm text-gray-600 mr-1">{blockedDate.reason}</span>
            )}
            {/* Show if it's a range */}
            {blockedDate.start_date && blockedDate.end_date && blockedDate.start_date !== blockedDate.end_date && (
              <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded mr-2">
                טווח תאריכים
              </span>
            )}
          </div>
           <CalendarX className="h-5 w-5 text-orange-600" />
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => deleteBlockedDate(blockedDate.id)}
        >
          <X className="h-4 w-4 text-red-600" />
        </Button>
      </div>
    ))}
  </div>
)}
               
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* --- MODALS --- */}

        {/* Institution Modal */}
        <Dialog open={showInstitutionModal} onOpenChange={setShowInstitutionModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingInstitution ? 'עריכת מוסד חינוכי' : 'הוספת מוסד חינוכי'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">שם המוסד *</Label>
                  <Input
                    id="name"
                    value={institutionForm.name}
                    onChange={(e) => setInstitutionForm({ ...institutionForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="city">עיר *</Label>
                  <Input
                    id="city"
                    value={institutionForm.city}
                    onChange={(e) => setInstitutionForm({ ...institutionForm, city: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="address">כתובת</Label>
                <Input
                  id="address"
                  value={institutionForm.address}
                  onChange={(e) => setInstitutionForm({ ...institutionForm, address: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact_person">איש קשר</Label>
                  <Input
                    id="contact_person"
                    value={institutionForm.contact_person}
                    onChange={(e) => setInstitutionForm({ ...institutionForm, contact_person: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="contact_phone">טלפון</Label>
                  <Input
                    id="contact_phone"
                    value={institutionForm.contact_phone}
                    onChange={(e) => setInstitutionForm({ ...institutionForm, contact_phone: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="contact_email">אימייל איש קשר</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={institutionForm.contact_email}
                  onChange={(e) => setInstitutionForm({ ...institutionForm, contact_email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="notes">הערות</Label>
                <Textarea
                  id="notes"
                  value={institutionForm.notes}
                  onChange={(e) => setInstitutionForm({ ...institutionForm, notes: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
                <Button variant="ghost" onClick={closeInstitutionModal}>ביטול</Button>
                <Button onClick={saveInstitution} disabled={loading}>
                    {loading ? <Loader2 className="animate-spin" /> : 'שמור'}
                </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Instructor Confirmation Modal */}
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>האם אתה בטוח?</DialogTitle>
                    <DialogDescription>
                        אתה עומד למחוק את המדריך <strong>{selectedInstructor?.full_name}</strong>. פעולה זו היא סופית.
                    </DialogDescription>
                </DialogHeader>
                {instructorAssignments.length > 0 && (
                    <Alert variant="destructive" className="mt-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            <p className="font-bold">שימו לב: למדריך זה משויכות {instructorAssignments.length} הקצאות פעילות.</p>
                            <p>יש לבחור מדריך חלופי להקצאות אלו, או שהן יישארו ללא מדריך משויך.</p>
                            <div className="my-4 space-y-2">
                                <Label>שייך מחדש למדריך:</Label>
                                <Select onValueChange={setReassignToInstructor} value={reassignToInstructor}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="בחר מדריך חלופי..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {instructors
                                            .filter(inst => inst.id !== selectedInstructor?.id)
                                            .map(inst => (
                                                <SelectItem key={inst.id} value={inst.id}>
                                                    {inst.full_name}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </AlertDescription>
                    </Alert>
                )}
                <DialogFooter>
                    <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>ביטול</Button>
                    <Button variant="destructive" onClick={handleDeleteInstructor} disabled={loading}>
                        {loading ? <Loader2 className="animate-spin" /> : 'אני מבין, מחק את המדריך'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* Add Blocked Date Modal
        <Dialog open={showBlockedDateModal} onOpenChange={setShowBlockedDateModal}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>הוספת תאריך חסום</DialogTitle>
                    <DialogDescription>
                        בחר תאריך וסיבה (אופציונלי) לחסימה. לא ניתן יהיה לתזמן שיעורים בתאריך זה.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div>
                        <Label htmlFor="blocked-date">תאריך</Label>
                        <Input 
                            id="blocked-date"
                            type="date"
                            value={newBlockedDate.date}
                            onChange={(e) => setNewBlockedDate({...newBlockedDate, date: e.target.value})}
                        />
                    </div>
                    <div>
                        <Label htmlFor="reason">סיבה (חג, חופשה וכו')</Label>
                        <Input 
                            id="reason"
                            type="text"
                            value={newBlockedDate.reason}
                            onChange={(e) => setNewBlockedDate({...newBlockedDate, reason: e.target.value})}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setShowBlockedDateModal(false)}>ביטול</Button>
                    <Button onClick={addBlockedDate} disabled={loading}>
                        {loading ? <Loader2 className="animate-spin" /> : 'הוסף תאריך'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog> */}





        {/* Updated Add Blocked Date Modal */}
<Dialog open={showBlockedDateModal} onOpenChange={setShowBlockedDateModal}>
  <DialogContent dir="rtl">
    <DialogHeader>
      <DialogTitle>הוספת תאריך/ים חסום/ים</DialogTitle>
      <DialogDescription>
        בחר תאריך בודד או טווח תאריכים שבהם לא ניתן יהיה לתזמן שיעורים.
      </DialogDescription>
    </DialogHeader>
    <div className="grid gap-4 py-4">
      {/* Type selector */}
      <div className="space-y-3">
        <Label>סוג החסימה</Label>
        <div className="flex gap-4">
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="single"
              name="dateType"
              value="single"
              checked={newBlockedDate.type === 'single'}
              onChange={(e) => setNewBlockedDate({
                ...newBlockedDate, 
                type: e.target.value as 'single' | 'range',
                date: '', start_date: '', end_date: '' // Reset dates when changing type
              })}
            />
            <Label htmlFor="single">תאריך בודד</Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="range"
              name="dateType"
              value="range"
              checked={newBlockedDate.type === 'range'}
              onChange={(e) => setNewBlockedDate({
                ...newBlockedDate, 
                type: e.target.value as 'single' | 'range',
                date: '', start_date: '', end_date: '' // Reset dates when changing type
              })}
            />
            <Label htmlFor="range">טווח תאריכים</Label>
          </div>
        </div>
      </div>

      {/* Date inputs based on selected type */}
      {newBlockedDate.type === 'single' ? (
        <div>
          <Label htmlFor="blocked-date">תאריך</Label>
          <Input 
            id="blocked-date"
            type="date"
            value={newBlockedDate.date}
            onChange={(e) => setNewBlockedDate({...newBlockedDate, date: e.target.value})}
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="start-date">תאריך התחלה</Label>
            <Input 
              id="start-date"
              type="date"
              value={newBlockedDate.start_date}
              onChange={(e) => setNewBlockedDate({...newBlockedDate, start_date: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="end-date">תאריך סיום</Label>
            <Input 
              id="end-date"
              type="date"
              value={newBlockedDate.end_date}
              min={newBlockedDate.start_date} // Prevent end date before start date
              onChange={(e) => setNewBlockedDate({...newBlockedDate, end_date: e.target.value})}
            />
          </div>
        </div>
      )}

      {/* Reason field */}
      <div>
        <Label htmlFor="reason">סיבה (חג, חופשה וכו')</Label>
        <Input 
          id="reason"
          type="text"
          value={newBlockedDate.reason}
          placeholder={newBlockedDate.type === 'single' 
            ? "לדוגמה: יום כיפור" 
            : "לדוגמה: חופש פסח"
          }
          onChange={(e) => setNewBlockedDate({...newBlockedDate, reason: e.target.value})}
        />
      </div>
    </div>
    <DialogFooter>
      <Button 
        variant="ghost" 
        onClick={() => {
          setShowBlockedDateModal(false);
          setNewBlockedDate({ type: 'single', date: '', start_date: '', end_date: '', reason: '' });
        }}
      >
        ביטול
      </Button>
      <Button onClick={addBlockedDate} disabled={loading}>
        {loading ? <Loader2 className="animate-spin" /> : 
          `הוסף ${newBlockedDate.type === 'single' ? 'תאריך' : 'טווח תאריכים'}`
        }
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

{/* Updated display of blocked dates in the main content */}

{/* --- Instructor Edit Modal --- */}
<Dialog open={showEditInstructorModal} onOpenChange={setShowEditInstructorModal}>
  <DialogContent className="max-w-3xl" dir="rtl">
    <DialogHeader>
      <DialogTitle>עריכת פרופיל מדריך: {selectedInstructor?.full_name}</DialogTitle>
      <DialogDescription>
        עדכן את פרטי הפרופיל של המדריך. שינויים יישמרו מיידית.
      </DialogDescription>
    </DialogHeader>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
      {/* Column 1 */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="full_name">שם מלא</Label>
          <Input id="full_name" value={instructorForm.full_name || ''} onChange={handleInstructorFormChange} />
        </div>
        <div>
          <Label htmlFor="email">אימייל </Label>
          <Input id="email" value={instructorForm.email || ''} onChange={handleInstructorFormChange}  />
        </div>
        <div>
          <Label htmlFor="phone">טלפון</Label>
          <Input id="phone" value={instructorForm.phone || ''} onChange={handleInstructorFormChange} />
        </div>
        <div>
          <Label htmlFor="birthdate">תאריך לידה</Label>
          <Input id="birthdate" type="date" value={instructorForm.birthdate ? instructorForm.birthdate.split('T')[0] : ''} onChange={handleInstructorFormChange} />
        </div>
         <div>
          <Label htmlFor="img">קישור לתמונה</Label>
          <Input id="img" value={instructorForm.img || ''} onChange={handleInstructorFormChange} />
        </div>
      </div>
      {/* Column 2 */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="hourly_rate">תעריף שעתי</Label>
          <Input id="hourly_rate" type="number" placeholder="לדוגמה: 150.50" value={instructorForm.hourly_rate || ''} onChange={handleInstructorFormChange} />
        </div>
        <div>
          <Label htmlFor="current_work_hours">שעות עבודה נוכחיות</Label>
          <Input id="current_work_hours" type="number" value={instructorForm.current_work_hours || ''} onChange={handleInstructorFormChange} />
        </div>
        <div>
          <Label htmlFor="benefits">הטבות</Label>
          <Textarea id="benefits" placeholder="פרט הטבות..." value={instructorForm.benefits || ''} onChange={handleInstructorFormChange} />
        </div>
      </div>
    </div>
    <DialogFooter>
      <Button variant="ghost" onClick={() => setShowEditInstructorModal(false)}>ביטול</Button>
      <Button onClick={handleUpdateInstructor} disabled={loading}>
        {loading ? <Loader2 className="animate-spin" /> : 'שמור שינויים'}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
      </div>
    </div>
  );
};

export default AdminSettings;