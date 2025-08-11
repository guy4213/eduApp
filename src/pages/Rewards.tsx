import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Trophy,
  Plus,
  TrendingUp,
  Target,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  Phone,
  DollarSign,
  Flame,
  Crown,
  CalendarDays,
  Filter,
} from "lucide-react";
import SalesLeadAssignmentDialog from "@/components/SalesLeadAssignmentDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface SalesLead {
  id: string;
  institution_name: string;
  instructor_id: string | null;
  contact_person: string | null;
  contact_phone: string | null;
  status: string | null;
  potential_value: number | null;
  commission_percentage: number | null;
  notes: string | null;
  created_at: string | null;
  closed_at: string | null;
  instructor?: {
    id: string;
    full_name: string;
    phone: string | null;
  };
}

interface MonthlySummary {
  teaching_incentives: number;
  closing_bonuses: number;
  team_rewards: number;
  total: number;
}

const leadStatuses = [
  { value: "new", label: "חדש" },
  { value: "contacted", label: "נוצר קשר" },
  { value: "meeting_scheduled", label: "נקבעה פגישה" },
  { value: "proposal_sent", label: "נשלחה הצעה" },
  { value: "negotiation", label: "במשא ומתן" },
  { value: "follow_up", label: "מעקב" },
  { value: "closed_won", label: "נסגר - זכייה" },
  { value: "closed_lost", label: "נסגר - הפסד" },
];

export default function Rewards() {
  const  {user}= useAuth();
  const [salesLeads, setSalesLeads] = useState<SalesLead[]>([]);
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary>({
    teaching_incentives: 2600,
    closing_bonuses: 1350,
    team_rewards: 400,
    total: 4350
  });
  
  // Date filtering state (for all authenticated users)
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [filteredSalesLeads, setFilteredSalesLeads] = useState<SalesLead[]>([]);

  const getStatusIcon = (status: string | null) => {
    if (!status) return <AlertCircle className="h-5 w-5 text-gray-600" />;
    
    switch (status) {
      case 'new':
        return <Plus className="h-5 w-5 text-blue-600" />;
      case 'contacted':
        return <Phone className="h-5 w-5 text-yellow-600" />;
      case 'meeting_scheduled':
        return <Calendar className="h-5 w-5 text-blue-600" />;
      case 'proposal_sent':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'negotiation':
        return <TrendingUp className="h-5 w-5 text-orange-600" />;
      case 'follow_up':
        return <Clock className="h-5 w-5 text-orange-600" />;
      case 'closed_won':
        return <Trophy className="h-5 w-5 text-purple-600" />;
      case 'closed_lost':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusLabel = (status: string | null) => {
    if (!status) return 'ללא סטטוס';
    
    switch (status) {
      case 'new':
        return 'חדש';
      case 'contacted':
        return 'נוצר קשר';
      case 'meeting_scheduled':
        return 'נקבעה פגישה';
      case 'proposal_sent':
        return 'נשלחה הצעה';
      case 'negotiation':
        return 'במשא ומתן';
      case 'follow_up':
        return 'מעקב';
      case 'closed_won':
        return 'נסגר - זכייה';
      case 'closed_lost':
        return 'נסגר - הפסד';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string | null) => {
    if (!status) return 'bg-gray-100 text-gray-800 border-gray-200';
    
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'contacted':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'meeting_scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'proposal_sent':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'negotiation':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'follow_up':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'closed_won':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'closed_lost':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getProgressFromStatus = (status: string | null) => {
    if (!status) return 0;
    
    switch (status) {
      case 'new':
        return 10;
      case 'contacted':
        return 25;
      case 'meeting_scheduled':
        return 50;
      case 'proposal_sent':
        return 75;
      case 'negotiation':
        return 85;
      case 'follow_up':
        return 60;
      case 'closed_won':
        return 100;
      case 'closed_lost':
        return 0;
      default:
        return 0;
    }
  };

  useEffect(() => {
    fetchSalesLeads();
  }, []);

  // Date filtering effect (for all authenticated users)
  useEffect(() => {
    if (!salesLeads.length) return;
    
    let filtered = [...salesLeads];
    
    if (dateFrom) {
      filtered = filtered.filter(lead => 
        lead.created_at && new Date(lead.created_at) >= dateFrom
      );
    }
    
    if (dateTo) {
      const endOfDay = new Date(dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      filtered = filtered.filter(lead => 
        lead.created_at && new Date(lead.created_at) <= endOfDay
      );
    }
    
    setFilteredSalesLeads(filtered);
  }, [dateFrom, dateTo, salesLeads]);

  const clearDateFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const calculateMonthlySummary = (leads: SalesLead[]) => {
    const totalPotentialValue = leads.reduce((sum, lead) => {
      return sum + (lead.potential_value || 0);
    }, 0);

    // Calculate different reward types based on potential values
    // You can adjust these percentages as needed
    const teaching_incentives = Math.floor(totalPotentialValue * 0.4); // 40% for teaching incentives
    const closing_bonuses = Math.floor(totalPotentialValue * 0.3); // 30% for closing bonuses  
    const team_rewards = Math.floor(totalPotentialValue * 0.1); // 10% for team rewards
    const total = totalPotentialValue;

    return {
      teaching_incentives,
      closing_bonuses,
      team_rewards,
      total
    };
  };

  const fetchSalesLeads = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sales_leads')
        .select(`
          *,
          instructor:profiles(id, full_name, phone)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching sales leads:', error);
        return;
      }
      console.log("SALES",data)
      setSalesLeads(data || []);
      setFilteredSalesLeads(data || []);
      
      // Calculate and update monthly summary based on actual data
      if (data) {
        const calculatedSummary = calculateMonthlySummary(data);
        setMonthlySummary(calculatedSummary);
      }
    } catch (error) {
      console.error('Error fetching sales leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('he-IL');
  };

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('sales_leads')
        .update({ 
          status: newStatus,
          // If closing the lead, set closed_at date
          ...(newStatus.startsWith('closed_') ? { closed_at: new Date().toISOString() } : {})
        })
        .eq('id', leadId);

      if (error) {
        console.error('Error updating lead status:', error);
        return;
      }

      // Update local state
      setSalesLeads(prev => prev.map(lead => 
        lead.id === leadId 
          ? { 
              ...lead, 
              status: newStatus,
              ...(newStatus.startsWith('closed_') ? { closed_at: new Date().toISOString() } : {})
            }
          : lead
      ));

      // Recalculate monthly summary
      const updatedLeads = salesLeads.map(lead => 
        lead.id === leadId 
          ? { 
              ...lead, 
              status: newStatus,
              ...(newStatus.startsWith('closed_') ? { closed_at: new Date().toISOString() } : {})
            }
          : lead
      );
      const calculatedSummary = calculateMonthlySummary(updatedLeads);
      setMonthlySummary(calculatedSummary);
      
    } catch (error) {
      console.error('Error updating lead status:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Trophy className="h-8 w-8 text-yellow-600 ml-3" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              תגמולים ומכירות
            </h1>
          </div>
          <p className="text-xl text-gray-700 mb-2">
            שלום {user.user_metadata.full_name}! אתה בדרך לסגור את החודש הגדול שלך 
            <Flame className="h-6 w-6 text-orange-500 inline mx-2" />
          </p>
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-4 inline-block">
            <p className="text-lg font-semibold text-purple-800 flex items-center justify-center">
              <Crown className="h-5 w-5 ml-2 text-yellow-600" />
              אתה 2 סגירות בלבד ממדריך החודש!
            </p>
          </div>
        </div>

        {/* Pipeline Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Target className="h-6 w-6 ml-2 text-blue-600" />
              פייפליין – התקדמות מול מוסדות
            </h2>
            <Button 
              className="flex items-center space-x-2 space-x-reverse bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg"
              onClick={() => setIsAssignmentDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
              <span>הקצה ליד למדריך</span>
            </Button>
          </div>

          {/* Date Filter for All Authenticated Users */}
          <Card className="border-primary/20 shadow-md mb-6">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-primary">
                <Filter className="h-5 w-5 ml-2" />
                סינון לפי תאריך יצירה
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1">
                  <Label htmlFor="date-from">מתאריך</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarDays className="ml-2 h-4 w-4" />
                        {dateFrom ? format(dateFrom, 'dd/MM/yyyy', { locale: he }) : 'בחר תאריך התחלה'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={dateFrom}
                        onSelect={setDateFrom}
                        initialFocus
                        locale={he}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="flex-1">
                  <Label htmlFor="date-to">עד תאריך</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarDays className="ml-2 h-4 w-4" />
                        {dateTo ? format(dateTo, 'dd/MM/yyyy', { locale: he }) : 'בחר תאריך סיום'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={dateTo}
                        onSelect={setDateTo}
                        initialFocus
                        locale={he}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <Button 
                  variant="outline" 
                  onClick={clearDateFilters}
                  className="px-6"
                >
                  נקה סינון
                </Button>
              </div>
              
              {(dateFrom || dateTo) && (
                <div className="mt-4 p-3 bg-primary/5 rounded-lg">
                  <p className="text-sm text-primary font-medium">
                    מציג {filteredSalesLeads.length} לידים מתוך {salesLeads.length}
                    {dateFrom && ` מתאריך ${format(dateFrom, 'dd/MM/yyyy', { locale: he })}`}
                    {dateTo && ` עד תאריך ${format(dateTo, 'dd/MM/yyyy', { locale: he })}`}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <span className="mr-2 text-gray-600">טוען לידים...</span>
            </div>
          ) : filteredSalesLeads.length === 0 ? (
            <Card className="text-center py-16 shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardContent>
                <Target className="h-16 w-16 text-gray-400 mx-auto mb-6" />
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {salesLeads.length === 0 ? 'אין לידים במערכת' : 'אין לידים בטווח התאריכים שנבחר'}
                </h3>
                <p className="text-gray-600 mb-6 text-lg">
                  {salesLeads.length === 0 ? 'התחל ליצור לידים עבור המדריכים' : 'נסה לשנות את טווח התאריכים או לנקות את הסינון'}
                </p>
                <Button 
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg"
                  onClick={() => setIsAssignmentDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  צור ליד חדש
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredSalesLeads.map((lead) => (
                <Card key={lead.id} className="shadow-lg border-0 bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {getStatusIcon(lead.status)}
                        <CardTitle className="text-xl mr-3">{lead.institution_name}</CardTitle>
                      </div>
                      <div className="min-w-[180px]">
                        <Select 
                          value={lead.status || "new"} 
                          onValueChange={(value) => updateLeadStatus(lead.id, value)}
                        >
                          <SelectTrigger className={`${getStatusColor(lead.status)} border-0 font-medium`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {leadStatuses.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">מדריך:</p>
                        <p className="text-gray-900 flex items-center">
                          <Crown className="h-4 w-4 ml-1 text-purple-500" />
                          {lead.instructor?.full_name || 'לא הוקצה'}
                        </p>
                        {lead.instructor?.phone && (
                          <p className="text-sm text-gray-500">{lead.instructor.phone}</p>
                        )}
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">איש קשר:</p>
                        <p className="text-gray-900">{lead.contact_person || 'לא צוין'}</p>
                        {lead.contact_phone && (
                          <p className="text-sm text-gray-500 flex items-center">
                            <Phone className="h-3 w-3 ml-1" />
                            {lead.contact_phone}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">ערך פוטנציאלי:</p>
                        <p className="text-lg font-bold text-green-600 flex items-center ">
                          {lead.potential_value?.toLocaleString() || '0'}₪
                        </p>
                        {lead.commission_percentage && (
                          <p className="text-sm text-gray-500">עמלה: {lead.commission_percentage}%</p>
                        )}ז
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">התקדמות:</p>
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <Progress 
                            value={getProgressFromStatus(lead.status)} 
                            className="flex-1 h-3"
                          />
                          <span className="text-sm font-bold text-gray-700 min-w-[35px]">
                            {getProgressFromStatus(lead.status)}%
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">תאריך יצירה:</p>
                        <p className="text-sm text-gray-600">
                          {formatDate(lead.created_at)}
                        </p>
                      </div>
                      
                      {lead.closed_at && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">תאריך סגירה:</p>
                          <p className="text-sm text-gray-600">
                            {formatDate(lead.closed_at)}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {lead.notes && (
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                        <p className="text-sm font-medium text-blue-900 mb-1">הערות:</p>
                        <p className="text-blue-800">
                          {lead.notes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Monthly Summary */}
        <Card className="shadow-xl border-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <DollarSign className="h-7 w-7 ml-2" />
              סיכום תגמולים – יוני 2025
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-6">
              {/* <div className="text-center">
                <p className="text-purple-100 text-sm mb-1">תמריצי הוראה</p>
                <p className="text-2xl font-bold">₪{monthlySummary.teaching_incentives.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-purple-100 text-sm mb-1">בונוסים סגירת מוסדות</p>
                <p className="text-2xl font-bold">₪{monthlySummary.closing_bonuses.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-purple-100 text-sm mb-1">תגמולים קבוצתיים</p>
                <p className="text-2xl font-bold">₪{monthlySummary.team_rewards.toLocaleString()}</p>
              </div> */}
              <div className="text-center bg-white/20 rounded-lg p-4">
                <p className="text-purple-100 text-sm mb-1">סה״כ צפוי</p>
                <p className="text-3xl font-bold flex items-center justify-center">
                  ₪{monthlySummary.total.toLocaleString()}
                  <Flame className="h-6 w-6 ml-2 text-orange-300" />
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sales Lead Assignment Dialog */}
        <SalesLeadAssignmentDialog
          open={isAssignmentDialogOpen}
          onOpenChange={setIsAssignmentDialogOpen}
          onLeadCreated={() => {
            fetchSalesLeads(); // Refresh the leads list
          }}
        />
      </main>
    </div>
  );
};