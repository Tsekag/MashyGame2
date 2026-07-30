import React, { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface Card3DProps {
  character: {
    id: string;
    name: string;
    image: string;
    genre: string;
    description: string;
  };
  index: number;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1024px), (hover: none)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return reduced;
}

function getCharacterTeaser(description: string): string {
  if (!description?.trim()) {
    return 'A legendary hero ready to leap into your next mashup masterpiece!';
  }

  const trimmed = description.trim();
  const sentenceMatch = trimmed.match(/^[^.!?]+[.!?]?/);
  const firstSentence = sentenceMatch?.[0]?.trim() ?? trimmed;

  if (firstSentence.length <= 110) return firstSentence;
  return `${firstSentence.slice(0, 107).trim()}...`;
}

export function Card3D({ character, index }: Card3DProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [imageSrc, setImageSrc] = useState(character.image);
  const cardRef = useRef<HTMLDivElement>(null);
  const reduceMotion = usePrefersReducedMotion();

  const characterTeaser = getCharacterTeaser(character.description);

  useEffect(() => {
    setImageSrc(character.image);
  }, [character.image]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (cardRef.current) {
        cardRef.current.style.transform = 'translateY(0px) rotateX(0deg) rotateY(0deg) scale(1)';
        cardRef.current.style.opacity = '1';
      }
    }, index * 200);
    return () => clearTimeout(timer);
  }, [index]);

  const handleClick = () => setIsFlipped((prev) => !prev);

  const fallbackImage =
    'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="320" height="240" viewBox="0 0 320 240"%3E%3Crect width="320" height="240" fill="%23111"/%3E%3Ctext x="50%25" y="50%25" fill="%23fff" font-family="Arial, sans-serif" font-size="16" text-anchor="middle" dominant-baseline="middle"%3EImage Missing%3C/text%3E%3C/svg%3E';

  return (
    <div className={`card-3d-wrapper ${reduceMotion ? 'card-3d-wrapper--static' : ''}`}>
      <div
        ref={cardRef}
        className={`card-3d-inner ${isFlipped ? 'rotate-y-180' : ''}`}
        style={{
          transform: 'translateY(32px) scale(0.94)',
          transformStyle: 'preserve-3d',
        }}
        onClick={handleClick}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsFlipped((prev) => !prev);
          }}
          className="card-3d-toggle"
          title={isFlipped ? 'Hide description' : 'Show description'}
        >
          {isFlipped ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{isFlipped ? 'Hide' : 'Show'}</span>
        </button>

        <div className="card-3d-face backface-hidden">
          <div className="card-alive-frame sparkle-alive">
            <div className="card-3d-front">
              <span className="card-sparkle-corner card-sparkle-corner--bl" aria-hidden="true" />
              <span className="card-sparkle-corner card-sparkle-corner--br" aria-hidden="true" />

              <div className="card-3d-wrapper-bg" aria-hidden="true">
                <div className="card-3d-wrapper-bg__fill" data-genre={character.genre.toLowerCase()} />
              </div>

              <img
                src={imageSrc}
                alt={character.name}
                className="card-3d-character"
                onError={() => setImageSrc(fallbackImage)}
              />

              <div className="card-3d-title">
                <p className="card-3d-genre-tag">{character.genre}</p>
                <h3 className="card-3d-name">{character.name}</h3>
                <p className="card-3d-teaser">{characterTeaser}</p>
                <p className="card-3d-hint">Hover to reveal · Tap to flip</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card-3d-face backface-hidden card-3d-back">
          <div className="card-alive-frame sparkle-alive">
            <div className="card-3d-back-inner">
              <span className="card-sparkle-corner card-sparkle-corner--bl" aria-hidden="true" />
              <span className="card-sparkle-corner card-sparkle-corner--br" aria-hidden="true" />

              <span className="card-3d-lore-label">Character Lore</span>
              <h3 className="card-3d-name gradient-text">{character.name}</h3>

              <div className="card-3d-description">
                <p className="card-3d-description-lead">
                  Meet <strong>{character.name}</strong> — a {character.genre} icon with a story worth mashing up!
                </p>
                <p>{character.description}</p>
              </div>

              <span className="card-3d-badge">
                {character.genre.charAt(0).toUpperCase() + character.genre.slice(1)} Hero
              </span>
              <p className="card-3d-hint">Tap to flip back</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
