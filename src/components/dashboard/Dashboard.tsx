
import React from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, BookOpen, BarChart3, Settings, LogOut } from 'lucide-react';

const Dashboard = () => {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  const menuItems = [
    { icon: Calendar, title: 'יומן אישי', description: 'צפייה במערכת השעות והשיעורים הקרובים' },
    { icon: BookOpen, title: 'דיווח שיעור', description: 'דיווח על שיעור שהתקיים או בתהליך' },
    { icon: Users, title: 'קורסים', description: 'ניהול הקורסים והכיתות שלי' },
    { icon: BarChart3, title: 'דוחות ושכר', description: 'צפייה בדוחות חודשיים וחישוב שכר' },
    { icon: Settings, title: 'הגדרות פרופיל', description: 'עריכת פרטים אישיים והגדרות המערכת' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-primary ml-3" />
              <h1 className="text-xl font-semibold text-gray-900">מערכת ניהול מנחים</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">שלום, {user?.user_metadata?.full_name || user?.email}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>יציאה</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">דשבורד ראשי</h2>
          <p className="text-gray-600">ברוך הבא למערכת ניהול המנחים והמרצים</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-blue-600" />
                <div className="mr-4">
                  <p className="text-2xl font-semibold text-gray-900">5</p>
                  <p className="text-gray-600">שיעורים השבוע</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-600" />
                <div className="mr-4">
                  <p className="text-2xl font-semibold text-gray-900">12</p>
                  <p className="text-gray-600">תלמידים פעילים</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-purple-600" />
                <div className="mr-4">
                  <p className="text-2xl font-semibold text-gray-900">3</p>
                  <p className="text-gray-600">קורסים פעילים</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-orange-600" />
                <div className="mr-4">
                  <p className="text-2xl font-semibold text-gray-900">₪2,400</p>
                  <p className="text-gray-600">שכר החודש</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center">
                  <item.icon className="h-8 w-8 text-primary ml-4" />
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  {item.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>פעילות אחרונה</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-gray-400 ml-3" />
                    <div>
                      <p className="font-medium">שיעור בינה מלאכותית - כיתה ח'</p>
                      <p className="text-sm text-gray-500">בית ספר הרצל • 14:00-15:30</p>
                    </div>
                  </div>
                  <span className="text-green-600 text-sm font-medium">הושלם</span>
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-gray-400 ml-3" />
                    <div>
                      <p className="font-medium">העלאת תמונות משיעור</p>
                      <p className="text-sm text-gray-500">תיכון אלון • 5 קבצים</p>
                    </div>
                  </div>
                  <span className="text-blue-600 text-sm font-medium">נשמר</span>
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center">
                    <BarChart3 className="h-5 w-5 text-gray-400 ml-3" />
                    <div>
                      <p className="font-medium">דוח חודשי דצמבר</p>
                      <p className="text-sm text-gray-500">18 שיעורים • ₪2,400</p>
                    </div>
                  </div>
                  <span className="text-orange-600 text-sm font-medium">ממתין לאישור</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
