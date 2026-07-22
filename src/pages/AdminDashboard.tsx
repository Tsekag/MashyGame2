// src/pages/AdminDashboard.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, BookOpen, Settings, BarChart3 } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  const adminCards = [
    {
      title: 'Manage Genres',
      description: 'Add, edit, delete, and manage game genres',
      icon: <BookOpen className="w-8 h-8" />,
      color: 'from-purple-500 to-pink-500',
      route: '/admin/dashboard/genres'
    },
    {
      title: 'Manage Characters',
      description: 'Add, edit, delete, and manage game characters',
      icon: <Users className="w-8 h-8" />,
      color: 'from-green-500 to-emerald-500',
      route: '/admin/dashboard/characters'
    },
    {
      title: 'Analytics',
      description: 'View game statistics and user engagement',
      icon: <BarChart3 className="w-8 h-8" />,
      color: 'from-blue-500 to-cyan-500',
      route: '/admin/dashboard/analytics'
    },
    {
      title: 'Settings',
      description: 'Configure admin panel and system settings',
      icon: <Settings className="w-8 h-8" />,
      color: 'from-gray-500 to-slate-500',
      route: '/admin/dashboard/settings'
    }
  ];

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Admin Dashboard
          </h1>
          <p className="text-xl text-gray-300">
            Manage your game content and settings
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {adminCards.map((card, index) => (
            <button
              key={index}
              onClick={() => navigate(card.route)}
              className="group bg-gray-900 rounded-2xl p-8 border border-gray-800 hover:border-gray-700 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            >
              <div className="flex items-center mb-6">
                <div className={`w-16 h-16 bg-gradient-to-r ${card.color} rounded-xl flex items-center justify-center text-white mr-6 group-hover:scale-110 transition-transform duration-300`}>
                  {card.icon}
                </div>
                <div className="text-left">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {card.title}
                  </h3>
                  <p className="text-gray-400">
                    {card.description}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-sm">Click to manage</span>
                <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center group-hover:bg-gray-700 transition-colors">
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

