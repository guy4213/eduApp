
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { BookOpen, Calendar, FileText, Users, BarChart3, Settings, LogOut, Menu } from 'lucide-react';

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
    <header className="bg-gradient-to-l from-blue-600 to-blue-700 shadow-lg border-b border-blue-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* User Info & Logout */}
          <div className="flex items-center space-x-4 space-x-reverse">
            <span className="text-sm text-blue-100 font-medium">
              שלום, {user?.user_metadata?.full_name || user?.email}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="flex items-center space-x-2 space-x-reverse bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              <span>יציאה</span>
            </Button>
          </div>
          
          {/* Logo & Navigation */}
          <div className="flex items-center space-x-8 space-x-reverse">
            {/* Navigation Menu */}
            <nav className="hidden md:flex space-x-6 space-x-reverse">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 space-x-reverse px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-white text-blue-700 shadow-md'
                        : 'text-blue-100 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span>{item.label}</span>
                    <Icon className="h-4 w-4" />
                  </Link>
                );
              })}
            </nav>
            
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-white mr-3">מערכת ניהול מנחים</h1>
              <BookOpen className="h-8 w-8 text-blue-200" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navigation;
