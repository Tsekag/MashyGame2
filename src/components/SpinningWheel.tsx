import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import type { Character } from '../contexts/GameContext';
import { characterAPI, genreAPI } from '../services/api';   // ✅ use API client

interface SpinningWheelProps {
  onNavigateToCards: () => void;
}

export function SpinningWheel({ onNavigateToCards }: SpinningWheelProps) {
  const { selectedGenres, setSpinResult } = useGame();
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [currentResult, setCurrentResult] = useState<any>(null);
  const [showNavigateButton, setShowNavigateButton] = useState(false);

  const [characters, setCharacters] = useState<Character[]>([]);
  const [genresMap, setGenresMap] = useState<Record<string, string>>({});
  const [spinPhase, setSpinPhase] = useState<'idle' | 'pick1' | 'pick2' | 'locked'>('idle');
  const [tickerGenre, setTickerGenre] = useState('');
  const [lockedGenres, setLockedGenres] = useState<[string, string] | null>(null);

  const wheelRef = useRef<HTMLDivElement>(null);
  const spinTimersRef = useRef<number[]>([]);

  // 🔹 Fetch characters for selected genres via API client
  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const promises = selectedGenres.map((genre) =>
          characterAPI.getByGenre(genre)
        );
        const results = await Promise.all(promises);

        // results = [Character[], Character[]...]
        const allCharacters = results.flat();
        setCharacters(allCharacters);
      } catch (err) {
        console.error('Error fetching characters:', err);
      }
    };

    if (selectedGenres.length > 0) {
      fetchCharacters();
    }
  }, [selectedGenres]);

  // Load genres mapping (id -> name) so we can display names instead of numeric ids
  useEffect(() => {
    let mounted = true;
    const loadGenres = async () => {
      try {
        const res = await genreAPI.getAll();
        // res expected to be an array of genres: [{ id, name }, ...]
        const map: Record<string, string> = {};
        (res || []).forEach((g: any) => {
          map[g.id?.toString() ?? String(g.id)] = g.name;
        });
        if (mounted) setGenresMap(map);
      } catch (err) {
        console.warn('Failed to load genre names:', err);
      }
    };
    loadGenres();
    return () => {
      mounted = false;
    };
  }, []);

  const formatGenre = (id: string) => {
    const name = genresMap[id] ? genresMap[id] : id;
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  const genreNames = selectedGenres.map(formatGenre);

  // Cycle genre names in ticker while spinning
  useEffect(() => {
    if (!isSpinning || genreNames.length === 0) return;
    let idx = 0;
    setTickerGenre(genreNames[0]);
    const interval = window.setInterval(() => {
      idx = (idx + 1) % genreNames.length;
      setTickerGenre(genreNames[idx]);
    }, 140);
    return () => clearInterval(interval);
  }, [isSpinning, genreNames.join('|')]);

  useEffect(() => {
    return () => {
      spinTimersRef.current.forEach(clearTimeout);
    };
  }, []);

  const clearSpinTimers = () => {
    spinTimersRef.current.forEach(clearTimeout);
    spinTimersRef.current = [];
  };

  const scheduleSpinTimer = (fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    spinTimersRef.current.push(id);
  };

  // 🔹 Spin logic
  const spinWheel = () => {
    if (isSpinning) return;

    setIsSpinning(true);
    setShowResult(false);
    setShowNavigateButton(false);
    setLockedGenres(null);
    setSpinPhase('pick1');
    clearSpinTimers();

    if (characters.length < 2) {
      alert('Not enough characters. Please select more genres.');
      setIsSpinning(false);
      setSpinPhase('idle');
      return;
    }

    // Build a map of genre -> characters for the currently loaded characters
    const genreMap: Record<string, Character[]> = {};
    characters.forEach((c) => {
      if (!genreMap[c.genre]) genreMap[c.genre] = [];
      genreMap[c.genre].push(c);
    });

    // Get genres that actually have characters
    const availableGenres = Object.keys(genreMap);
    if (availableGenres.length < 2) {
      alert('Not enough genres with characters available. Please select different genres.');
      setIsSpinning(false);
      setSpinPhase('idle');
      return;
    }

    // Helper: pick random item from array
    const pickRandom = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

    // Pick two different genres at random
    let genreA = pickRandom(availableGenres);
    let genreB = pickRandom(availableGenres);
    // Ensure genres are different; if they match, try to pick another B up to a few times
    let attempts = 0;
    while (genreA === genreB && attempts < 10) {
      genreB = pickRandom(availableGenres);
      attempts += 1;
    }

    // As a fallback, if still same (very unlikely), pick the next available genre
    if (genreA === genreB) {
      genreB = availableGenres.find((g) => g !== genreA) as string;
    }

    const charactersA = genreMap[genreA] || [];
    const charactersB = genreMap[genreB] || [];

    // Ensure we have characters in both genres
    if (charactersA.length === 0 || charactersB.length === 0) {
      alert('Not enough characters in selected genres. Please adjust selections.');
      setIsSpinning(false);
      setSpinPhase('idle');
      return;
    }

    const character1 = pickRandom(charactersA);
    const character2 = pickRandom(charactersB);

    const result = { character1, character2, genres: selectedGenres };
    const genreAName = formatGenre(genreA);
    const genreBName = formatGenre(genreB);

    const finalRotation = rotation + 1800 + Math.random() * 720;
    setRotation(finalRotation);
    if (wheelRef.current) {
      wheelRef.current.style.transform = `rotate(${finalRotation}deg)`;
    }

    scheduleSpinTimer(() => {
      setLockedGenres([genreAName, '']);
      setSpinPhase('pick2');
    }, 1100);

    scheduleSpinTimer(() => {
      setLockedGenres([genreAName, genreBName]);
      setSpinPhase('locked');
    }, 2200);

    scheduleSpinTimer(() => {
      setIsSpinning(false);
      setSpinPhase('idle');
      setCurrentResult(result);
      setShowResult(true);
      setSpinResult(result);
      scheduleSpinTimer(() => setShowNavigateButton(true), 500);
    }, 3000);
  };

  const handleViewCards = () => onNavigateToCards();

  // 🔹 No genres selected
  if (selectedGenres.length === 0) {
    return (
      <div className="spinner-page">
        <div className="spinner-card">
          <h2>⚠️ No Genres Selected</h2>
          <p>Please go back and select at least 3 genres to spin the wheel.</p>
          <button onClick={() => window.history.back()}>← Back to Genre Selection</button>
        </div>
      </div>
    );
  }

  return (
    <div className="spinner-page">
      <div className="spinner-container">
        <h1>🎰 Mashup Spinner</h1>
        <p>
          Spinning from your selected genres:{' '}
            {selectedGenres.map(g => (genresMap[g] ? genresMap[g] : g)).map(name => name.charAt(0).toUpperCase() + name.slice(1)).join(', ')}
        </p>

        <div className={`spinner-wrapper ${isSpinning ? 'spinner-wrapper--spinning' : ''} ${spinPhase === 'pick2' ? 'spinner-wrapper--pick2' : ''} ${spinPhase === 'locked' ? 'spinner-wrapper--locked' : ''}`}>
          {/* Ambient glow ring */}
          <div className="wheel-ambient-glow" aria-hidden="true" />
          <div className="wheel-orbit-particles" aria-hidden="true">
            <span /><span /><span /><span /><span /><span />
          </div>

          <div ref={wheelRef} className={`wheel ${isSpinning ? 'wheel--active' : ''}`}>
            {selectedGenres.map((genre, index) => (
              <div
                key={genre}
                className="wheel-segment"
                style={{
                  transform: `rotate(${(360 / selectedGenres.length) * index}deg)`,
                }}
              >
                <span
                  className="wheel-segment-label"
                  style={{
                    transform: `rotate(${-(360 / selectedGenres.length) * index}deg)`,
                  }}
                >
                  {formatGenre(genre)}
                </span>
              </div>
            ))}
            <div className="wheel-center-hub" aria-hidden="true">
              <div className="wheel-center-mask" />
              <div className="wheel-center-ring" />
              <div className="wheel-center-core">
                {isSpinning ? (
                  <span className="wheel-center-spin-icon">⚡</span>
                ) : (
                  <span className="wheel-center-star">★</span>
                )}
              </div>
            </div>
          </div>

          {/* Enhanced pointer assembly */}
          <div className={`wheel-pointer-assembly ${isSpinning ? 'wheel-pointer-assembly--spinning' : ''} ${spinPhase === 'pick1' ? 'wheel-pointer-assembly--pick1' : ''} ${spinPhase === 'pick2' ? 'wheel-pointer-assembly--pick2' : ''} ${spinPhase === 'locked' ? 'wheel-pointer-assembly--locked' : ''}`} aria-hidden="true">
            <div className="wheel-pointer-glow" />
            <div className="wheel-pointer-beam" />
            <div className="wheel-pointer-body">
              <div className="wheel-pointer-shine" />
            </div>
            <div className="wheel-pointer-tip" />
            <div className="wheel-pointer-spark wheel-pointer-spark--1">✦</div>
            <div className="wheel-pointer-spark wheel-pointer-spark--2">✦</div>
            <div className="wheel-pointer-spark wheel-pointer-spark--3">✦</div>
          </div>

          {isSpinning && (
            <div className="wheel-spin-status" role="status" aria-live="polite">
              {spinPhase === 'pick1' && (
                <>
                  <span className="wheel-spin-status-label">Selecting Genre 1</span>
                  <span key={tickerGenre} className="wheel-spin-status-genre wheel-spin-status-genre--ticker">{tickerGenre}</span>
                </>
              )}
              {spinPhase === 'pick2' && lockedGenres && (
                <>
                  <span className="wheel-spin-status-locked">
                    <span className="wheel-genre-badge wheel-genre-badge--1">{lockedGenres[0]}</span>
                    <span className="wheel-spin-status-plus">+</span>
                    <span key={tickerGenre} className="wheel-spin-status-genre wheel-spin-status-genre--ticker">{tickerGenre}</span>
                  </span>
                  <span className="wheel-spin-status-label">Selecting Genre 2</span>
                </>
              )}
              {spinPhase === 'locked' && lockedGenres && (
                <>
                  <span className="wheel-spin-status-label wheel-spin-status-label--done">Fusion Locked!</span>
                  <span className="wheel-spin-status-locked">
                    <span className="wheel-genre-badge wheel-genre-badge--1">{lockedGenres[0]}</span>
                    <span className="wheel-spin-status-plus">×</span>
                    <span className="wheel-genre-badge wheel-genre-badge--2">{lockedGenres[1]}</span>
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {!showResult && (
          <button onClick={spinWheel} disabled={isSpinning} className={isSpinning ? 'spinner-btn--active' : ''}>
            {isSpinning ? '🌀 Choosing your genres...' : '🎯 SPIN THE WHEEL!'}
          </button>
        )}

        {showResult && currentResult && (
          <div className="spin-result-card">
            <div className="spin-result-actions">
              <button onClick={spinWheel}>🔄 Spin Again</button>
              {showNavigateButton && (
                <button onClick={handleViewCards}>👀 View 3D Cards</button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
