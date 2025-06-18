
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { BookOpen, Calendar, FileText, Users, BarChart3, Settings, LogOut } from 'lucide-react';

const Navigation = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const navigationItems = [
    { path: '/', label: 'דשבורד', icon: BookOpen },
    { path: '/calendar', label: 'יומן', icon: Calendar },
    { path: '/lesson-report', label: 'דיווח שיעור', icon: FileText },
    { path: '/courses', label: 'קורסים', icon: Users },
    { path: '/reports', label: 'דוחות ושכר', icon: BarChart3 },
  ];

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-primary ml-3" />
              <h1 className="text-xl font-semibold text-gray-900">מערכת ניהול מנחים</h1>
            </div>
            
            <nav className="hidden md:flex space-x-8">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary text-white'
                        : 'text-gray-700 hover:text-primary hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700">
              שלום, {user?.user_metadata?.full_name || user?.email}
            </span>
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
  );
};

export default Navigation;
