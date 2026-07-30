import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User, Home, Palette, Camera, BarChart3, Menu, X } from 'lucide-react';
import '../index.css';

interface NavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export function Navigation({ currentView, onViewChange }: NavigationProps) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'genres', label: 'Genres', icon: Home },
    { id: 'spin', label: 'Spin', icon: Palette },
    { id: 'cards', label: '3D Cards', icon: Camera },
    { id: 'gallery', label: 'Gallery', icon: User }
  ];

  const handleNav = (id: string) => {
    onViewChange(id);
    setMobileOpen(false);
  };

  return (
    <nav className="bg-black/20 backdrop-blur-md border-b border-white/20 px-4 sm:px-6 py-3 sm:py-4 neon-nav">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4 sm:space-x-8">
          <h1 className="text-lg sm:text-2xl font-bold text-white neon-text">🎮 MashupGame</h1>

          <div className="hidden md:flex space-x-4 lg:space-x-6">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => handleNav(id)}
                className={`
                  flex items-center space-x-2 px-3 lg:px-4 py-2 rounded-lg transition-all duration-200 neon-button
                  ${currentView === id
                    ? 'bg-white/20 text-white active-neon'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          <span className="hidden sm:inline text-white font-semibold neon-text text-sm">
            {user?.username}
          </span>
          <button
            onClick={logout}
            className="hidden sm:flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-colors duration-200 neon-button logout-neon text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden mt-3 pb-2 border-t border-white/10 pt-3 mobile-menu-open">
          <div className="flex flex-col space-y-1 px-2">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => handleNav(id)}
                className={`
                  flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200
                  ${currentView === id
                    ? 'bg-white/20 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{label}</span>
              </button>
            ))}
            <div className="border-t border-white/10 mt-2 pt-2 flex items-center justify-between px-4">
              <span className="text-white text-sm">{user?.username}</span>
              <button
                onClick={logout}
                className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
