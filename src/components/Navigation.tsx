import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User, Home, Palette, Camera, BarChart3 } from 'lucide-react';
import '../index.css'; // Make sure CSS is imported

interface NavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export function Navigation({ currentView, onViewChange }: NavigationProps) {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'genres', label: 'Choose Genres', icon: Home },
    { id: 'spin', label: 'Spin Wheel', icon: Palette },
    { id: 'cards', label: '3D Cards', icon: Camera },
    { id: 'gallery', label: 'Gallery', icon: User }
  ];

  return (
    <nav className="bg-black/20 backdrop-blur-md border-b border-white/20 px-6 py-4 neon-nav">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <h1 className="text-2xl font-bold text-white neon-text">🎮 MashupGame</h1>
          
          <div className="hidden md:flex space-x-6">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => onViewChange(id)}
                className={`
                  flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 neon-button
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

        <div className="flex items-center space-x-4">
          <span className="text-white font-semibold neon-text">
            Welcome, {user?.username}!
          </span>
          <button
            onClick={logout}
            className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 neon-button logout-neon"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
