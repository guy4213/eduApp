
import React from 'react';
import { Home, User, Calendar, Bell, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MobileNavigation = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 md:hidden">
      <div className="flex justify-around items-center">
        <Button variant="ghost" size="sm" className="flex flex-col items-center p-2">
          <Home className="h-5 w-5 mb-1" />
          <span className="text-xs">Home</span>
        </Button>
        <Button variant="ghost" size="sm" className="flex flex-col items-center p-2">
          <User className="h-5 w-5 mb-1" />
          <span className="text-xs">Profile</span>
        </Button>
        <Button variant="ghost" size="sm" className="flex flex-col items-center p-2 text-teal-600">
          <Calendar className="h-5 w-5 mb-1" />
          <span className="text-xs font-medium">Schedule</span>
        </Button>
        <Button variant="ghost" size="sm" className="flex flex-col items-center p-2">
          <Bell className="h-5 w-5 mb-1" />
          <span className="text-xs">Alerts</span>
        </Button>
        <Button variant="ghost" size="sm" className="flex flex-col items-center p-2">
          <MoreHorizontal className="h-5 w-5 mb-1" />
          <span className="text-xs">More</span>
        </Button>
      </div>
    </div>
  );
};

export default MobileNavigation;
