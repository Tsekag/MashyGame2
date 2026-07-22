// src/layouts/AdminLayout.tsx

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Bell, 
  User, 
  Settings, 
  LogOut,
  Menu,
  X,
  BookOpen,
  Users,
  BarChart3,
  Home
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { logout, user: authUser } = useAuth();

  const handleLogout = () => {
    // Use AuthContext logout which handles server-side cookie clearing
    try {
      logout();
    } catch (e) {
      // best-effort cleanup
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      localStorage.removeItem('auth_token');
    }
    navigate('/admin/login');
  };

  const user = authUser ?? (() => {
    const userStr = localStorage.getItem('adminUser');
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  })();

  const navigationItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: Home },
    { name: 'Genres', href: '/admin/dashboard/genres', icon: BookOpen },
    { name: 'Characters', href: '/admin/dashboard/characters', icon: Users },
    { name: 'Analytics', href: '/admin/dashboard/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/admin/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Top Navigation */}
      <nav className="bg-black border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Logo and Navigation */}
          <div className="flex items-center space-x-8">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white text-lg font-bold">*</span>
              </div>
              <span className="text-white text-xl font-bold">logo</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-6">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <button
                    key={item.name}
                    onClick={() => navigate(item.href)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-purple-600 text-white' 
                        : 'text-gray-300 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right side - Notifications and User */}
          <div className="flex items-center space-x-4">
            <button className="text-white hover:text-purple-400 transition-colors p-2">
              <Bell size={20} />
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                <User size={16} className="text-white" />
              </div>
              <span className="text-white text-sm hidden sm:block">
                {user?.username || 'Admin'}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="text-white hover:text-red-400 transition-colors p-2"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
            
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden text-white p-2"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed top-0 left-0 h-full w-64 bg-gray-900 p-6">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white text-lg font-bold">*</span>
                </div>
                <span className="text-white text-xl font-bold">logo</span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-white p-2"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      navigate(item.href);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 text-left py-3 px-4 rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-purple-600 text-white' 
                        : 'text-gray-300 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    <Icon size={20} />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="p-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-black border-t border-gray-800 px-6 py-4">
        <div className="text-gray-400 text-sm">
          Made with Visily
        </div>
      </footer>
    </div>
  );
};
