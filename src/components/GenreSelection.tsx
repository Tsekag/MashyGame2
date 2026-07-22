import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';
import { genreAPI, authAPI } from '../services/api';   // ✅ use our API wrapper

interface Genre {
  id: number;
  name: string;
  emoji?: string;  // Make emoji optional to match API
}

interface GenreSelectionProps {
  onNavigateToSpin: () => void;
}

export function GenreSelection({ onNavigateToSpin }: GenreSelectionProps) {
  const { user } = useAuth();
  const { selectedGenres, setSelectedGenres } = useGame();
  
  const [isAnimating, setIsAnimating] = useState(false);
  const [justSelected, setJustSelected] = useState<string | null>(null);
  const [availableGenres, setAvailableGenres] = useState<Genre[]>([]);

  // ✅ Load genres from backend via API client
  useEffect(() => {
    const loadGenres = async () => {
      try {
        const genres = await genreAPI.getAll();
        // Convert id to number to match local Genre interface
        setAvailableGenres(
          genres.map((g: any) => ({
            ...g,
            id: typeof g.id === 'string' ? parseInt(g.id, 10) : g.id,
          }))
        );
      } catch (err) {
        console.error('Error fetching genres:', err);
      }
    };
    loadGenres();
  }, []);

  // Visual feedback animation
  useEffect(() => {
    if (justSelected) {
      const timeout = setTimeout(() => {
        setJustSelected(null);
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [justSelected]);

  const handleGenreToggle = (genreId: string) => {
    setIsAnimating(true);
    setJustSelected(genreId);
    
    let newGenres;
    if (selectedGenres.includes(genreId)) {
      newGenres = selectedGenres.filter(id => id !== genreId);
    } else if (selectedGenres.length < 6) {
      newGenres = [...selectedGenres, genreId];
    } else {
      return; // Max 6 reached
    }
    
    setSelectedGenres(newGenres);
    setTimeout(() => setIsAnimating(false), 200);
  };

  const handleStartSpinner = async () => {
    try {
      // Save selected genres to backend
      await authAPI.updateGenres(selectedGenres);
      onNavigateToSpin();
    } catch (error) {
      console.error('Failed to save genres:', error);
      // Still navigate, or show error
      onNavigateToSpin();
    }
  };

  const canProceed = selectedGenres.length >= 3;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Choose Your Adventure, {user?.username}!
          </h1>
          <p className="text-xl text-gray-300 mb-6">
            Select 3-6 genres to create epic character mashups
          </p>
          <div className="bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 inline-block">
            <span className="text-white font-semibold">
              {selectedGenres.length}/6 genres selected
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {availableGenres.map((genre) => {
            const genreId = genre.id.toString();
            const isSelected = selectedGenres.includes(genreId);
            const isJustSelected = justSelected === genreId;
            
            return (
              <button
                key={genreId}
                onClick={() => handleGenreToggle(genreId)}
                disabled={!isSelected && selectedGenres.length >= 6}
                className={`
                  relative p-6 rounded-2xl border-2 transition-all duration-300 transform
                  ${isSelected 
                    ? `bg-gradient-to-br from-indigo-500 to-purple-500 border-white scale-105 shadow-xl` 
                    : 'bg-white/10 border-white/30 hover:bg-white/20 hover:scale-105 hover:shadow-lg'
                  }
                  ${isJustSelected ? 'animate-pulse' : ''}
                  ${!isSelected && selectedGenres.length >= 6 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  ${isAnimating ? 'scale-95' : ''}
                `}
              >
                <div className="text-4xl mb-3">{genre.emoji || ''}</div> {/* Dynamic emoji, empty string if undefined */}
                <div className="text-white font-semibold text-lg">
                  {genre.name}
                </div>
                {isSelected && (
                  <div className="absolute -top-2 -right-2 bg-white text-green-600 rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg">
                    ✓
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {canProceed && (
          <div className="text-center">
            <button
              onClick={handleStartSpinner}
              className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold py-4 px-8 rounded-full text-xl transition-all duration-200 transform hover:scale-105 shadow-2xl"
            >
              🎯 Start the Mashup Spinner!
            </button>
          </div>
        )}
        
        {selectedGenres.length > 0 && selectedGenres.length < 3 && (
          <div className="text-center">
            <p className="text-yellow-300 text-lg">
              Select at least {3 - selectedGenres.length} more genre{3 - selectedGenres.length !== 1 ? 's' : ''} to continue!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
