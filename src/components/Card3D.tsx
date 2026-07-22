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

export function Card3D({ character, index }: Card3DProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [imageSrc, setImageSrc] = useState(character.image);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setImageSrc(character.image);
  }, [character.image]);

  // entrance animation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (cardRef.current) {
        cardRef.current.style.transform = `
          translateY(0px) 
          rotateX(0deg) 
          rotateY(0deg) 
          scale(1)
        `;
        cardRef.current.style.opacity = '1';
      }
    }, index * 200);
    return () => clearTimeout(timer);
  }, [index]);

  // track mouse movement for 3D hover
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    const rotateX = (mouseY / rect.height) * -30;
    const rotateY = (mouseX / rect.width) * 30;
    setMousePosition({ x: rotateX, y: rotateY });
  };

  // apply transform based on flip + hover
  useEffect(() => {
    if (cardRef.current) {
      const baseFlip = isFlipped ? 180 : 0;
      if (isHovered) {
        cardRef.current.style.transform = `
          perspective(1000px)
          rotateX(${mousePosition.x}deg)
          rotateY(${mousePosition.y + baseFlip}deg)
          translateZ(50px)
          scale(1.05)
        `;
      } else {
        cardRef.current.style.transform = `
          perspective(1000px)
          rotateX(0deg)
          rotateY(${baseFlip}deg)
          translateZ(0px)
          scale(1)
        `;
      }
    }
  }, [mousePosition, isHovered, isFlipped]);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePosition({ x: 0, y: 0 });
  };

  const handleClick = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="perspective-1000 mb-8">
      <div
        ref={cardRef}
        className={`
          relative w-80 h-96 cursor-pointer 
          transition-all duration-500 ease-out
          transform-style-preserve-3d opacity-0
          card-transition
          ${isFlipped ? 'rotate-y-180' : ''}
        `}
        style={{
          transform: 'translateY(50px) rotateX(15deg) scale(0.8)',
          transformStyle: 'preserve-3d'
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsFlipped((prev) => !prev);
          }}
          className="absolute top-3 right-3 z-20 inline-flex items-center gap-2 rounded-full bg-black/50 px-3 py-1.5 text-xs font-semibold text-white hover:bg-black/70 transition-colors"
          title={isFlipped ? 'Hide description' : 'Show description'}
        >
          {isFlipped ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {isFlipped ? 'Hide' : 'Show'}
        </button>

        {/* Front of card */}
        <div className="absolute inset-0 w-full h-full backface-hidden">
          <div className="relative w-full h-full bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 card-glow sparkle">
            <div className="absolute inset-0 bg-black/20"></div>
            <img 
              src={imageSrc}
              alt={character.name}
              className="w-full h-2/3 object-cover"
              onError={() => setImageSrc('https://via.placeholder.com/320x240?text=Image+Missing')}
            />
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
              <h3 className="text-2xl font-bold gradient-text mb-2">{character.name}</h3>
              <p className="text-gray-200 text-sm uppercase tracking-wider font-semibold">
                {character.genre}
              </p>
              <div className="mt-3 text-xs text-gray-300">
                Click to flip →
              </div>
            </div>
            
            {isHovered && (
              <div className="absolute inset-0 rounded-2xl border-2 border-cyan-400 shadow-lg shadow-cyan-400/50 animate-pulse"></div>
            )}
          </div>
        </div>

        {/* Back of card */}
        <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180">
          <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-6 flex flex-col justify-center items-center text-center shadow-2xl border-2 border-white/20 card-glow sparkle">
            <h3 className="text-3xl font-bold gradient-text mb-6">{character.name}</h3>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 mb-6">
              <p className="text-gray-200 text-lg leading-relaxed">
                {character.description}
              </p>
            </div>
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-4 py-2 rounded-full font-semibold text-sm">
              {character.genre.charAt(0).toUpperCase() + character.genre.slice(1)} Hero
            </div>
            <div className="mt-6 text-xs text-gray-300">
              ← Click to flip back
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
