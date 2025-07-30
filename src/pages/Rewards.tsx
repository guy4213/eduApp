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

interface Institution {
  id: string;
  name: string;
  status: 'proposal_sent' | 'initial_call' | 'meeting_scheduled' | 'follow_up' | 'closed';
  next_step: string;
  potential_reward: number;
  progress: number;
  notes: string;
  meeting_date?: string;
}

interface MonthlySummary {
  teaching_incentives: number;
  closing_bonuses: number;
  team_rewards: number;
  total: number;
}

export default function Rewards() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary>({
    teaching_incentives: 2600,
    closing_bonuses: 1350,
    team_rewards: 400,
    total: 4350
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'proposal_sent':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'initial_call':
        return <Phone className="h-5 w-5 text-yellow-600" />;
      case 'meeting_scheduled':
        return <Calendar className="h-5 w-5 text-blue-600" />;
      case 'follow_up':
        return <Clock className="h-5 w-5 text-orange-600" />;
      case 'closed':
        return <Trophy className="h-5 w-5 text-purple-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'proposal_sent':
        return 'נשלחה הצעה';
      case 'initial_call':
        return 'שיחת טלפון ראשונית';
      case 'meeting_scheduled':
        return 'קביעת פגישה';
      case 'follow_up':
        return 'מעקב';
      case 'closed':
        return 'נסגר';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'proposal_sent':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'initial_call':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'meeting_scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'follow_up':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'closed':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-blue-500';
    if (progress >= 40) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  useEffect(() => {
    // Mock data for demonstration
    const mockInstitutions: Institution[] = [
      {
        id: '1',
        name: 'אשלים ראשון לציון',
        status: 'proposal_sent',
        next_step: 'פגישה ביום חמישי',
        potential_reward: 400,
        progress: 80,
        notes: 'קרוב! עוד פגישה אחת לסגירה 💥',
        meeting_date: '2025-01-30'
      },
      {
        id: '2',
        name: 'נועם רחובות',
        status: 'initial_call',
        next_step: 'שלח תזכורת כדי לעבור לשלב הבא',
        potential_reward: 250,
        progress: 40,
        notes: 'תגובה חיובית מהרכז!',
      },
      {
        id: '3',
        name: 'דה שליט רחובות',
        status: 'meeting_scheduled',
        next_step: 'תזכורת נשלחה – שמור מומנטום!',
        potential_reward: 700,
        progress: 60,
        notes: 'הוצעה פגישה ליום שני',
        meeting_date: '2025-01-27'
      }
    ];

    setInstitutions(mockInstitutions);
  }, []);

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
            שלום דביר! אתה בדרך לסגור את החודש הגדול שלך 
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

          <div className="space-y-4">
            {institutions.map((institution) => (
              <Card key={institution.id} className="shadow-lg border-0 bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {getStatusIcon(institution.status)}
                      <CardTitle className="text-xl mr-3">{institution.name}</CardTitle>
                    </div>
                    <Badge className={getStatusColor(institution.status)}>
                      ✅ {getStatusLabel(institution.status)} ✔️
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">השלב הבא:</p>
                      <p className="text-gray-900 flex items-center">
                        <Calendar className="h-4 w-4 ml-1 text-blue-500" />
                        {institution.next_step}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">תגמול פוטנציאלי:</p>
                      <p className="text-lg font-bold text-green-600 flex items-center">
                        <DollarSign className="h-4 w-4 ml-1" />
                        ₪{institution.potential_reward}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">התקדמות:</p>
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <Progress 
                          value={institution.progress} 
                          className="flex-1 h-3"
                        />
                        <span className="text-sm font-bold text-gray-700 min-w-[35px]">
                          {institution.progress}%
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {institution.notes && (
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <p className="text-blue-800 font-medium">
                        {institution.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="text-center">
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
              </div>
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
            // Optionally refresh the institutions list or show a success message
            console.log("Lead created successfully!");
          }}
        />
      </main>
    </div>
  );
};