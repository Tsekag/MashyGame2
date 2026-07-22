import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { GameProvider } from './contexts/GameContext';
import { AuthForm } from './components/AuthForm';
import { Navigation } from './components/Navigation';
import { GenreSelection } from './components/GenreSelection';
import { SpinningWheel } from './components/SpinningWheel';
import { Card3DDisplay } from './components/Card3DDisplay';
import { CommunityGallery } from './components/CommunityGallery';
import { Dashboard } from './components/Dashboard';
import { AdminLayout } from './layouts/AdminLayout';
import { AdminDashboard } from './pages/AdminDashboard';
import { GenresPage } from './pages/GenresPage';
import { CharactersPage } from './pages/CharactersPage';
import { LoginPage } from './pages/LoginPage';
import { ProtectedRoute } from './components/ProtectedRoute';

// ErrorBoundary to catch runtime errors
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, info: any) {
    console.error('ErrorBoundary caught an error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-900">
          <h2 className="text-white text-2xl">Oops! Something went wrong.</h2>
        </div>
      );
    }
    return this.props.children;
  }
}

// Main AppContent component
function AppContent() {
  const { user, isLoading } = useAuth();
  
  const [currentView, setCurrentViewState] = useState<string>(() => {
    try {
      return sessionStorage.getItem('currentView') || 'dashboard';
    } catch {
      return 'dashboard';
    }
  });
  const setCurrentView = (view: string) => {
    try { sessionStorage.setItem('currentView', view); } catch {}
    setCurrentViewState(view);
  };
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    const handleNavigateToCards = () => setCurrentView('cards');
    const handleNavigateToGallery = () => setCurrentView('gallery');

    window.addEventListener('navigate-to-cards', handleNavigateToCards);
    window.addEventListener('navigate-to-gallery', handleNavigateToGallery);

    return () => {
      window.removeEventListener('navigate-to-cards', handleNavigateToCards);
      window.removeEventListener('navigate-to-gallery', handleNavigateToGallery);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 to-indigo-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthForm
        mode={authMode}
        onToggleMode={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
      />
    );
  }

  if (user.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'genres':
        return <GenreSelection onNavigateToSpin={() => setCurrentView('spin')} />;
      case 'spin':
        return <SpinningWheel onNavigateToCards={() => setCurrentView('cards')} />;
      case 'cards':
        return <Card3DDisplay />;
      case 'gallery':
        return <CommunityGallery />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen">
      <Navigation currentView={currentView} onViewChange={setCurrentView} />
      {renderCurrentView()}
    </div>
  );
}

// Root App component
function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <GameProvider>
            <Routes>
              {/* Admin Routes */}
              <Route path="/admin/login" element={<LoginPage />} />
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="genres" element={<GenresPage />} />
                <Route path="characters" element={<CharactersPage />} />
                {/* Add analytics/settings here later */}
              </Route>
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              
              {/* Main App Routes */}
              <Route path="/" element={<AppContent />} />
              <Route path="/*" element={<AppContent />} />
            </Routes>
          </GameProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
