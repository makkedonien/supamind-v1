import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Rss, Mic, BookOpen, User, LogOut } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useLogout } from '@/services/authService';
import { useAuth } from '@/contexts/AuthContext';
import Logo from '@/components/ui/Logo';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const Sidebar = ({ isCollapsed, onToggle }: SidebarProps) => {
  const location = useLocation();
  const { logout } = useLogout();
  const { user } = useAuth();

  const menuItems = [
    {
      icon: Rss,
      label: 'Feed',
      path: '/',
      isActive: location.pathname === '/'
    },
    {
      icon: Mic,
      label: 'Microcasts',
      path: '/microcasts',
      isActive: location.pathname === '/microcasts'
    },
    {
      icon: BookOpen,
      label: 'Notebooks',
      path: '/notebooks',
      isActive: location.pathname === '/notebooks' || location.pathname.startsWith('/notebook')
    }
  ];

  return (
    <div className={cn(
      "bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header with Logo */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Logo size="md" />
            {!isCollapsed && (
              <span className="text-xl font-medium text-gray-900">Supamind</span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="p-1.5 hover:bg-gray-100"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    item.isActive
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Section at Bottom */}
      <div className="p-4 border-t border-gray-200">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className={cn(
                "w-full justify-start p-3 h-auto hover:bg-gray-100",
                isCollapsed && "justify-center"
              )}
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-purple-600 transition-colors">
                  <User className="h-4 w-4 text-white" />
                </div>
                {!isCollapsed && (
                  <div className="flex flex-col items-start text-left min-w-0">
                    <span className="text-sm font-medium text-gray-900 truncate max-w-[140px]">
                      {user?.email?.split('@')[0] || 'User'}
                    </span>
                    <span className="text-xs text-gray-500 truncate max-w-[140px]">
                      {user?.email || ''}
                    </span>
                  </div>
                )}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={logout} className="cursor-pointer">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default Sidebar;