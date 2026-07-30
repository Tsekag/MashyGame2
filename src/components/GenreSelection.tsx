import { useState, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import { genreAPI, authAPI } from '../services/api';
import { resolveImageUrl } from '../config/api';
import { Check } from 'lucide-react';

interface Genre {
  id: number;
  name: string;
  image_url?: string;
}

interface GenreSelectionProps {
  onNavigateToSpin: () => void;
}

export function GenreSelection({ onNavigateToSpin }: GenreSelectionProps) {
  const { selectedGenres, setSelectedGenres } = useGame();

  const [justSelected, setJustSelected] = useState<string | null>(null);
  const [availableGenres, setAvailableGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageLoadError, setImageLoadError] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const loadGenres = async () => {
      try {
        const genres = await genreAPI.getAll();
        setAvailableGenres(
          genres.map((g: any) => ({
            ...g,
            id: typeof g.id === 'string' ? parseInt(g.id, 10) : g.id,
          }))
        );
      } catch (err) {
        console.error('Error fetching genres:', err);
      } finally {
        setLoading(false);
      }
    };
    loadGenres();
  }, []);

  useEffect(() => {
    if (justSelected) {
      const timeout = setTimeout(() => setJustSelected(null), 300);
      return () => clearTimeout(timeout);
    }
  }, [justSelected]);

  const handleGenreToggle = (genreId: string) => {
    setJustSelected(genreId);

    let newGenres;
    if (selectedGenres.includes(genreId)) {
      newGenres = selectedGenres.filter(id => id !== genreId);
    } else if (selectedGenres.length < 6) {
      newGenres = [...selectedGenres, genreId];
    } else {
      return;
    }

    setSelectedGenres(newGenres);
  };

  const handleStartSpinner = async () => {
    try {
      await authAPI.updateGenres(selectedGenres);
      onNavigateToSpin();
    } catch (error) {
      console.error('Failed to save genres:', error);
      onNavigateToSpin();
    }
  };

  const canProceed = selectedGenres.length >= 3;
  const DEFAULT_IMAGE = 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%231f2937"/%3E%3Ctext x="50%25" y="50%25" fill="%237b5fff" font-family="Arial, sans-serif" font-size="24" text-anchor="middle" dominant-baseline="middle"%3EGenre%3C/text%3E%3C/svg%3E';

  if (loading) {
    return (
      <div className="genre-selection-page flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="genre-selection-page">
      <div className="genre-selection-container">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="genre-title">Select Your Genre</h1>
          <p className="text-gray-400 text-sm sm:text-base mt-3 max-w-md mx-auto">
            Choose 3–6 genres to create epic character mashups
          </p>
          <div className="genre-counter mt-4">
            <span>{selectedGenres.length}/6 selected</span>
          </div>
        </div>

        {/* Genre Grid */}
        <div className="genre-grid">
          {availableGenres.map((genre) => {
            const genreId = genre.id.toString();
            const isSelected = selectedGenres.includes(genreId);
            const isJustSelected = justSelected === genreId;
            const isDisabled = !isSelected && selectedGenres.length >= 6;

            return (
              <button
                key={genreId}
                onClick={() => handleGenreToggle(genreId)}
                disabled={isDisabled}
                aria-pressed={isSelected}
                aria-label={`${genre.name}${isSelected ? ', selected' : ''}`}
                className={`genre-card ${isSelected ? 'genre-card-selected' : ''} ${isJustSelected ? 'genre-card-pulse' : ''} ${isDisabled ? 'genre-card-disabled' : ''}`}
              >
                <div className="genre-card-image">
                  {genre.image_url && !imageLoadError[genre.id] ? (
                    <img
                      src={resolveImageUrl(genre.image_url)}
                      alt={genre.name}
                      loading="lazy"
                      className="w-full h-full object-cover"
                      onError={() => setImageLoadError((prev) => ({ ...prev, [genre.id]: true }))}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-950 via-purple-800 to-indigo-700 flex items-center justify-center text-white text-xs sm:text-sm font-semibold uppercase tracking-wider px-3 text-center">
                      {genre.name}
                    </div>
                  )}
                  {isSelected && (
                    <div className="genre-card-check">
                      <Check className="w-5 h-5 text-white" strokeWidth={3} />
                    </div>
                  )}
                </div>
                <div className="genre-card-label">
                  <span>{genre.name}</span>
                </div>
              </button>
            );
          })}
        </div>

        {availableGenres.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg">No genres available yet.</p>
          </div>
        )}

        {/* Action Area */}
        <div className="mt-8 sm:mt-12 text-center space-y-4">
          {canProceed && (
            <button onClick={handleStartSpinner} className="genre-spin-btn">
              Spin Now
            </button>
          )}

          {selectedGenres.length > 0 && selectedGenres.length < 3 && (
            <p className="text-purple-300 text-sm sm:text-base">
              Select at least {3 - selectedGenres.length} more genre{3 - selectedGenres.length !== 1 ? 's' : ''} to continue
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
