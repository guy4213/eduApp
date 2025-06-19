
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { BookOpen, Calendar, FileText, Users, BarChart3, LogOut, Menu, X } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const Navigation = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

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
    <>
      {/* Desktop Navigation */}
      <header className="hidden md:block bg-gradient-to-l from-blue-600 to-blue-700 shadow-lg border-b border-blue-800">
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
            
            {/* Logo & Hamburger Menu */}
            <div className="flex items-center space-x-8 space-x-reverse">
              {/* Hamburger Menu */}
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 bg-white">
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between p-4 border-b">
                      <h2 className="text-lg font-semibold">תפריט ניווט</h2>
                    </div>
                    <nav className="flex-1 p-4">
                      <div className="space-y-2">
                        {navigationItems.map((item) => {
                          const Icon = item.icon;
                          const isActive = location.pathname === item.path;
                          return (
                            <Link
                              key={item.path}
                              to={item.path}
                              onClick={() => setIsOpen(false)}
                              className={`flex items-center space-x-3 space-x-reverse px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                                isActive
                                  ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-700'
                                  : 'text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              <span>{item.label}</span>
                              <Icon className="h-5 w-5" />
                            </Link>
                          );
                        })}
                      </div>
                    </nav>
                  </div>
                </SheetContent>
              </Sheet>
              
              {/* Logo */}
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-white mr-3">מערכת ניהול מנחים</h1>
                <BookOpen className="h-8 w-8 text-blue-200" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="md:hidden bg-gradient-to-l from-blue-600 to-blue-700 shadow-lg">
        <div className="px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <BookOpen className="h-6 w-6 text-blue-200 mr-2" />
              <h1 className="text-lg font-bold text-white">מערכת ניהול</h1>
            </div>
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 bg-white">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold">תפריט ניווט</h2>
                  </div>
                  <nav className="flex-1 p-4">
                    <div className="space-y-2 mb-6">
                      {navigationItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsOpen(false)}
                            className={`flex items-center space-x-3 space-x-reverse px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                              isActive
                                ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-700'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <span>{item.label}</span>
                            <Icon className="h-5 w-5" />
                          </Link>
                        );
                      })}
                    </div>
                    <div className="border-t pt-4">
                      <div className="mb-4">
                        <span className="text-sm text-gray-600">
                          משתמש: {user?.user_metadata?.full_name || user?.email}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        onClick={handleSignOut}
                        className="w-full flex items-center justify-center space-x-2 space-x-reverse"
                      >
                        <span>יציאה</span>
                        <LogOut className="h-4 w-4" />
                      </Button>
                    </div>
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </>
  );
};

export default Navigation;
