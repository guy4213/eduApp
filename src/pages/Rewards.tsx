// import React, { useEffect, useState } from "react";
// import { useAuth } from "@/components/auth/AuthProvider";
// import { Button } from "@/components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import {
//   Award,
//   Star,
//   Trophy,
//   Gift,
//   Plus,
//   TrendingUp,
//   Target,
//   Zap,
// } from "lucide-react";
// import { supabase } from "@/integrations/supabase/client";
// import MobileNavigation from "@/components/layout/MobileNavigation";

// interface Reward {
//   id: string;
//   title: string;
//   description: string;
//   points_required: number;
//   reward_type: 'bonus' | 'recognition' | 'gift' | 'promotion';
//   status: 'active' | 'inactive';
//   created_at: string;
// }

// interface UserReward {
//   id: string;
//   user_id: string;
//   reward_id: string;
//   earned_at: string;
//   status: 'pending' | 'approved' | 'claimed';
//   reward: Reward;
// }

// interface UserPoints {
//   total_points: number;
//   available_points: number;
//   lifetime_points: number;
// }

// const Rewards = () => {
//   const { user } = useAuth();
//   const [rewards, setRewards] = useState<Reward[]>([]);
//   const [userRewards, setUserRewards] = useState<UserReward[]>([]);
//   const [userPoints, setUserPoints] = useState<UserPoints>({
//     total_points: 0,
//     available_points: 0,
//     lifetime_points: 0
//   });
//   const [loading, setLoading] = useState(true);

//   const isAdmin = user?.user_metadata?.role === 'admin';

//   const getRewardIcon = (type: string) => {
//     switch (type) {
//       case 'bonus':
//         return <Gift className="h-5 w-5" />;
//       case 'recognition':
//         return <Star className="h-5 w-5" />;
//       case 'gift':
//         return <Award className="h-5 w-5" />;
//       case 'promotion':
//         return <Trophy className="h-5 w-5" />;
//       default:
//         return <Award className="h-5 w-5" />;
//     }
//   };

//   const getRewardTypeLabel = (type: string) => {
//     switch (type) {
//       case 'bonus':
//         return 'בונוס כספי';
//       case 'recognition':
//         return 'הכרה';
//       case 'gift':
//         return 'מתנה';
//       case 'promotion':
//         return 'קידום';
//       default:
//         return type;
//     }
//   };

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case 'active':
//         return 'bg-green-100 text-green-800 border-green-200';
//       case 'inactive':
//         return 'bg-gray-100 text-gray-800 border-gray-200';
//       case 'pending':
//         return 'bg-yellow-100 text-yellow-800 border-yellow-200';
//       case 'approved':
//         return 'bg-blue-100 text-blue-800 border-blue-200';
//       case 'claimed':
//         return 'bg-green-100 text-green-800 border-green-200';
//       default:
//         return 'bg-gray-100 text-gray-800 border-gray-200';
//     }
//   };

//   const getStatusLabel = (status: string) => {
//     switch (status) {
//       case 'active':
//         return 'פעיל';
//       case 'inactive':
//         return 'לא פעיל';
//       case 'pending':
//         return 'ממתין לאישור';
//       case 'approved':
//         return 'אושר';
//       case 'claimed':
//         return 'נוצל';
//       default:
//         return status;
//     }
//   };

//   const fetchRewardsData = async () => {
//     try {
//       // Note: These are placeholder queries as the actual rewards tables don't exist yet
//       // In a real implementation, you would create tables like:
//       // - rewards (id, title, description, points_required, reward_type, status, created_at)
//       // - user_rewards (id, user_id, reward_id, earned_at, status)
//       // - user_points (user_id, total_points, available_points, lifetime_points)

//       // For now, we'll show mock data to demonstrate the UI
//       const mockRewards: Reward[] = [
//         {
//           id: '1',
//           title: 'מעביר מצוין',
//           description: 'השלמת 10 שיעורים ברצף עם דירוג מעל 4.5',
//           points_required: 100,
//           reward_type: 'recognition',
//           status: 'active',
//           created_at: new Date().toISOString()
//         },
//         {
//           id: '2',
//           title: 'בונוס ביצועים',
//           description: 'בונוס של 500 שקל עבור השלמת חודש מלא',
//           points_required: 250,
//           reward_type: 'bonus',
//           status: 'active',
//           created_at: new Date().toISOString()
//         },
//         {
//           id: '3',
//           title: 'מתנת הערכה',
//           description: 'שובר מתנה בשווי 200 שקל',
//           points_required: 150,
//           reward_type: 'gift',
//           status: 'active',
//           created_at: new Date().toISOString()
//         }
//       ];

//       const mockUserRewards: UserReward[] = [
//         {
//           id: '1',
//           user_id: user?.id || '',
//           reward_id: '1',
//           earned_at: new Date().toISOString(),
//           status: 'claimed',
//           reward: mockRewards[0]
//         }
//       ];

//       const mockUserPoints: UserPoints = {
//         total_points: 180,
//         available_points: 80,
//         lifetime_points: 320
//       };

//       setRewards(mockRewards);
//       setUserRewards(mockUserRewards);
//       setUserPoints(mockUserPoints);
//     } catch (error) {
//       console.error("Error fetching rewards data:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (user) {
//       fetchRewardsData();
//     }
//   }, [user]);

//   const formatDate = (isoDate: string) => {
//     const date = new Date(isoDate);
//     const day = date.getDate();
//     const month = date.getMonth() + 1;
//     const year = date.getFullYear();
//     return `${day}.${month}.${year}`;
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100">
//         <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
//       <div className="md:hidden">
//         <MobileNavigation />
//       </div>

//       <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         {/* Header */}
//         <div className="flex justify-between items-center mb-8">
//           <div>
//             <h1 className="text-3xl font-bold text-gray-900 mb-2">
//               מערכת תגמולים
//             </h1>
//             <p className="text-gray-600 text-lg">
//               {isAdmin 
//                 ? "ניהול מערכת התגמולים והנקודות" 
//                 : "צפה בתגמולים שלך ובמערכת הנקודות"
//               }
//             </p>
//           </div>
//           {isAdmin && (
//             <Button
//               className="flex items-center space-x-2 space-x-reverse bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg"
//             >
//               <Plus className="h-4 w-4" />
//               <span>תגמול חדש</span>
//             </Button>
//           )}
//         </div>

//         {/* Points Summary */}
//         {!isAdmin && (
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
//             <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-xl border-0">
//               <CardContent className="p-6">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-blue-100 text-sm">נקודות זמינות</p>
//                     <p className="text-3xl font-bold">{userPoints.available_points}</p>
//                   </div>
//                   <Zap className="h-8 w-8 text-blue-200" />
//                 </div>
//               </CardContent>
//             </Card>

//             <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white shadow-xl border-0">
//               <CardContent className="p-6">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-green-100 text-sm">סה"כ נקודות</p>
//                     <p className="text-3xl font-bold">{userPoints.total_points}</p>
//                   </div>
//                   <Target className="h-8 w-8 text-green-200" />
//                 </div>
//               </CardContent>
//             </Card>

//             <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-xl border-0">
//               <CardContent className="p-6">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-purple-100 text-sm">נקודות לכל הזמנים</p>
//                     <p className="text-3xl font-bold">{userPoints.lifetime_points}</p>
//                   </div>
//                   <TrendingUp className="h-8 w-8 text-purple-200" />
//                 </div>
//               </CardContent>
//             </Card>
//           </div>
//         )}

//         {/* User's Earned Rewards */}
//         {!isAdmin && userRewards.length > 0 && (
//           <div className="mb-8">
//             <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
//               <Trophy className="h-6 w-6 ml-2 text-yellow-600" />
//               התגמולים שלי
//             </h2>
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//               {userRewards.map((userReward) => (
//                 <Card key={userReward.id} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
//                   <CardHeader className="pb-3">
//                     <div className="flex items-center justify-between">
//                       <div className="flex items-center text-amber-600">
//                         {getRewardIcon(userReward.reward.reward_type)}
//                         <CardTitle className="text-lg mr-2">{userReward.reward.title}</CardTitle>
//                       </div>
//                       <Badge className={getStatusColor(userReward.status)}>
//                         {getStatusLabel(userReward.status)}
//                       </Badge>
//                     </div>
//                   </CardHeader>
//                   <CardContent>
//                     <p className="text-gray-600 mb-2">{userReward.reward.description}</p>
//                     <p className="text-sm text-gray-500">זוכה בתאריך: {formatDate(userReward.earned_at)}</p>
//                   </CardContent>
//                 </Card>
//               ))}
//             </div>
//           </div>
//         )}

//         {/* Available Rewards */}
//         <div>
//           <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
//             <Award className="h-6 w-6 ml-2 text-purple-600" />
//             {isAdmin ? "ניהול תגמולים" : "תגמולים זמינים"}
//           </h2>

//           {rewards.length === 0 ? (
//             <Card className="text-center py-16 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
//               <CardContent>
//                 <Award className="h-16 w-16 text-gray-400 mx-auto mb-6" />
//                 <h3 className="text-xl font-semibold text-gray-900 mb-3">
//                   אין תגמולים זמינים
//                 </h3>
//                 <p className="text-gray-600 mb-6 text-lg">
//                   {isAdmin 
//                     ? "התחל ליצור תגמולים עבור המדריכים" 
//                     : "לא נמצאו תגמולים זמינים כרגע"
//                   }
//                 </p>
//                 {isAdmin && (
//                   <Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg">
//                     <Plus className="h-4 w-4 mr-2" />
//                     צור תגמול חדש
//                   </Button>
//                 )}
//               </CardContent>
//             </Card>
//           ) : (
//             <div className="space-y-4">
//               {rewards.map((reward) => (
//                 <Card
//                   key={reward.id}
//                   className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow"
//                 >
//                   <CardHeader>
//                     <div className="flex items-center justify-between">
//                       <div className="flex items-center">
//                         <div className="text-purple-600 ml-3">
//                           {getRewardIcon(reward.reward_type)}
//                         </div>
//                         <div>
//                           <CardTitle className="text-xl">{reward.title}</CardTitle>
//                           <CardDescription className="text-gray-600 mt-1">
//                             {reward.description}
//                           </CardDescription>
//                         </div>
//                       </div>
//                       <div className="flex items-center gap-3">
//                         <Badge className={getStatusColor(reward.status)}>
//                           {getStatusLabel(reward.status)}
//                         </Badge>
//                         <div className="text-left">
//                           <div className="text-lg font-bold text-purple-600">
//                             {reward.points_required} נקודות
//                           </div>
//                           <div className="text-sm text-gray-500">
//                             {getRewardTypeLabel(reward.reward_type)}
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   </CardHeader>
                  
//                   {isAdmin && (
//                     <CardContent className="pt-0">
//                       <div className="flex gap-2">
//                         <Button variant="outline" size="sm">
//                           ערוך
//                         </Button>
//                         <Button 
//                           variant="outline" 
//                           size="sm"
//                           className={reward.status === 'active' ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
//                         >
//                           {reward.status === 'active' ? 'השבת' : 'הפעל'}
//                         </Button>
//                       </div>
//                     </CardContent>
//                   )}

//                   {!isAdmin && reward.status === 'active' && (
//                     <CardContent className="pt-0">
//                       <Button 
//                         disabled={userPoints.available_points < reward.points_required}
//                         className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
//                       >
//                         {userPoints.available_points >= reward.points_required 
//                           ? 'החלף נקודות'
//                           : `נדרשות עוד ${reward.points_required - userPoints.available_points} נקודות`
//                         }
//                       </Button>
//                     </CardContent>
//                   )}
//                 </Card>
//               ))}
//             </div>
//           )}
//         </div>
//       </main>
//     </div>
//   );
// };

// export default Rewards;

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
} from "lucide-react";
import SalesLeadAssignmentDialog from "@/components/SalesLeadAssignmentDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

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

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <span className="mr-2 text-gray-600">טוען לידים...</span>
            </div>
          ) : salesLeads.length === 0 ? (
            <Card className="text-center py-16 shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardContent>
                <Target className="h-16 w-16 text-gray-400 mx-auto mb-6" />
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  אין לידים במערכת
                </h3>
                <p className="text-gray-600 mb-6 text-lg">
                  התחל ליצור לידים עבור המדריכים
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
              {salesLeads.map((lead) => (
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
                        <p className="text-lg font-bold text-green-600 flex items-center">
                          <DollarSign className="h-4 w-4 ml-1" />
                          ₪{lead.potential_value?.toLocaleString() || '0'}
                        </p>
                        {lead.commission_percentage && (
                          <p className="text-sm text-gray-500">עמלה: {lead.commission_percentage}%</p>
                        )}
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