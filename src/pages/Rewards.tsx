import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Award,
  Star,
  Trophy,
  Gift,
  Plus,
  TrendingUp,
  Target,
  Zap,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import MobileNavigation from "@/components/layout/MobileNavigation";

interface Reward {
  id: string;
  title: string;
  description: string;
  points_required: number;
  reward_type: 'bonus' | 'recognition' | 'gift' | 'promotion';
  status: 'active' | 'inactive';
  created_at: string;
}

interface UserReward {
  id: string;
  user_id: string;
  reward_id: string;
  earned_at: string;
  status: 'pending' | 'approved' | 'claimed';
  reward: Reward;
}

interface UserPoints {
  total_points: number;
  available_points: number;
  lifetime_points: number;
}

const Rewards = () => {
  const { user } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [userRewards, setUserRewards] = useState<UserReward[]>([]);
  const [userPoints, setUserPoints] = useState<UserPoints>({
    total_points: 0,
    available_points: 0,
    lifetime_points: 0
  });
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.user_metadata?.role === 'admin';

  const getRewardIcon = (type: string) => {
    switch (type) {
      case 'bonus':
        return <Gift className="h-5 w-5" />;
      case 'recognition':
        return <Star className="h-5 w-5" />;
      case 'gift':
        return <Award className="h-5 w-5" />;
      case 'promotion':
        return <Trophy className="h-5 w-5" />;
      default:
        return <Award className="h-5 w-5" />;
    }
  };

  const getRewardTypeLabel = (type: string) => {
    switch (type) {
      case 'bonus':
        return 'בונוס כספי';
      case 'recognition':
        return 'הכרה';
      case 'gift':
        return 'מתנה';
      case 'promotion':
        return 'קידום';
      default:
        return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'claimed':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'פעיל';
      case 'inactive':
        return 'לא פעיל';
      case 'pending':
        return 'ממתין לאישור';
      case 'approved':
        return 'אושר';
      case 'claimed':
        return 'נוצל';
      default:
        return status;
    }
  };

  const fetchRewardsData = async () => {
    try {
      // Note: These are placeholder queries as the actual rewards tables don't exist yet
      // In a real implementation, you would create tables like:
      // - rewards (id, title, description, points_required, reward_type, status, created_at)
      // - user_rewards (id, user_id, reward_id, earned_at, status)
      // - user_points (user_id, total_points, available_points, lifetime_points)

      // For now, we'll show mock data to demonstrate the UI
      const mockRewards: Reward[] = [
        {
          id: '1',
          title: 'מעביר מצוין',
          description: 'השלמת 10 שיעורים ברצף עם דירוג מעל 4.5',
          points_required: 100,
          reward_type: 'recognition',
          status: 'active',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          title: 'בונוס ביצועים',
          description: 'בונוס של 500 שקל עבור השלמת חודש מלא',
          points_required: 250,
          reward_type: 'bonus',
          status: 'active',
          created_at: new Date().toISOString()
        },
        {
          id: '3',
          title: 'מתנת הערכה',
          description: 'שובר מתנה בשווי 200 שקל',
          points_required: 150,
          reward_type: 'gift',
          status: 'active',
          created_at: new Date().toISOString()
        }
      ];

      const mockUserRewards: UserReward[] = [
        {
          id: '1',
          user_id: user?.id || '',
          reward_id: '1',
          earned_at: new Date().toISOString(),
          status: 'claimed',
          reward: mockRewards[0]
        }
      ];

      const mockUserPoints: UserPoints = {
        total_points: 180,
        available_points: 80,
        lifetime_points: 320
      };

      setRewards(mockRewards);
      setUserRewards(mockUserRewards);
      setUserPoints(mockUserPoints);
    } catch (error) {
      console.error("Error fetching rewards data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRewardsData();
    }
  }, [user]);

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <div className="md:hidden">
        <MobileNavigation />
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              מערכת תגמולים
            </h1>
            <p className="text-gray-600 text-lg">
              {isAdmin 
                ? "ניהול מערכת התגמולים והנקודות" 
                : "צפה בתגמולים שלך ובמערכת הנקודות"
              }
            </p>
          </div>
          {isAdmin && (
            <Button
              className="flex items-center space-x-2 space-x-reverse bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg"
            >
              <Plus className="h-4 w-4" />
              <span>תגמול חדש</span>
            </Button>
          )}
        </div>

        {/* Points Summary */}
        {!isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-xl border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">נקודות זמינות</p>
                    <p className="text-3xl font-bold">{userPoints.available_points}</p>
                  </div>
                  <Zap className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white shadow-xl border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">סה"כ נקודות</p>
                    <p className="text-3xl font-bold">{userPoints.total_points}</p>
                  </div>
                  <Target className="h-8 w-8 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-xl border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">נקודות לכל הזמנים</p>
                    <p className="text-3xl font-bold">{userPoints.lifetime_points}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* User's Earned Rewards */}
        {!isAdmin && userRewards.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Trophy className="h-6 w-6 ml-2 text-yellow-600" />
              התגמולים שלי
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userRewards.map((userReward) => (
                <Card key={userReward.id} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-amber-600">
                        {getRewardIcon(userReward.reward.reward_type)}
                        <CardTitle className="text-lg mr-2">{userReward.reward.title}</CardTitle>
                      </div>
                      <Badge className={getStatusColor(userReward.status)}>
                        {getStatusLabel(userReward.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-2">{userReward.reward.description}</p>
                    <p className="text-sm text-gray-500">זוכה בתאריך: {formatDate(userReward.earned_at)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Available Rewards */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <Award className="h-6 w-6 ml-2 text-purple-600" />
            {isAdmin ? "ניהול תגמולים" : "תגמולים זמינים"}
          </h2>

          {rewards.length === 0 ? (
            <Card className="text-center py-16 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardContent>
                <Award className="h-16 w-16 text-gray-400 mx-auto mb-6" />
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  אין תגמולים זמינים
                </h3>
                <p className="text-gray-600 mb-6 text-lg">
                  {isAdmin 
                    ? "התחל ליצור תגמולים עבור המדריכים" 
                    : "לא נמצאו תגמולים זמינים כרגע"
                  }
                </p>
                {isAdmin && (
                  <Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg">
                    <Plus className="h-4 w-4 mr-2" />
                    צור תגמול חדש
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {rewards.map((reward) => (
                <Card
                  key={reward.id}
                  className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="text-purple-600 ml-3">
                          {getRewardIcon(reward.reward_type)}
                        </div>
                        <div>
                          <CardTitle className="text-xl">{reward.title}</CardTitle>
                          <CardDescription className="text-gray-600 mt-1">
                            {reward.description}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(reward.status)}>
                          {getStatusLabel(reward.status)}
                        </Badge>
                        <div className="text-left">
                          <div className="text-lg font-bold text-purple-600">
                            {reward.points_required} נקודות
                          </div>
                          <div className="text-sm text-gray-500">
                            {getRewardTypeLabel(reward.reward_type)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  {isAdmin && (
                    <CardContent className="pt-0">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          ערוך
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className={reward.status === 'active' ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                        >
                          {reward.status === 'active' ? 'השבת' : 'הפעל'}
                        </Button>
                      </div>
                    </CardContent>
                  )}

                  {!isAdmin && reward.status === 'active' && (
                    <CardContent className="pt-0">
                      <Button 
                        disabled={userPoints.available_points < reward.points_required}
                        className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                      >
                        {userPoints.available_points >= reward.points_required 
                          ? 'החלף נקודות'
                          : `נדרשות עוד ${reward.points_required - userPoints.available_points} נקודות`
                        }
                      </Button>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Rewards;