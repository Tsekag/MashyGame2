import React, { useState, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import { Card3D } from './Card3D';
import { MashupSlotCard } from './MashupSlotCard';
import { Upload, Sparkles } from 'lucide-react';
import { UploadArtworkModal } from './UploadArtworkModal';

export function Card3DDisplay() {
  const { spinResult, uploadArtwork } = useGame();

  const [isLoaded, setIsLoaded] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [mashupFile, setMashupFile] = useState<File | null>(null);
  const [mashupPreviewUrl, setMashupPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (spinResult) {
      const timer = setTimeout(() => {
        setIsLoaded(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [spinResult]);

  const handleUpload = async (file: File, title: string, description: string) => {
    if (!spinResult) return;
    setIsUploading(true);
    setUploadError('');
    try {
      const success = await uploadArtwork(file, title, description, spinResult);
      if (success) {
        setShowUploadModal(false);
        window.dispatchEvent(new CustomEvent('navigate-to-gallery'));
      } else {
        setUploadError('Upload failed. Please try again.');
      }
    } catch {
      setUploadError('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  if (!spinResult) {
    return (
      <div className="game-page-bg min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading your mashup...</p>
        </div>
      </div>
    );
  }

  const handlePlayAgain = () => {
    window.dispatchEvent(new CustomEvent('navigate-to-spin'));
  };

  return (
    <div className="cards-page">
      <div className="cards-page-container">
        <header className="cards-page-header">
          <h1 className="cards-page-title gradient-text">Your Characters Await!</h1>
          <p className="cards-page-subtitle">
            Hover a card — the frame tilts like a game card and your character leaps forward in 3D!
          </p>
        </header>

        <div className={`cards-grid ${isLoaded ? 'cards-grid-loaded' : ''}`}>
          <Card3D character={spinResult.character1} index={0} />

          <div className="cards-mashup-symbol" aria-hidden="true">
            <span className="mashup-ring mashup-ring-outer" />
            <span className="mashup-ring mashup-ring-inner" />
            <span className="mashup-plus">+</span>
            <span className="mashup-spark mashup-spark-1">✦</span>
            <span className="mashup-spark mashup-spark-2">✦</span>
            <span className="mashup-spark mashup-spark-3">✦</span>
          </div>

          <Card3D character={spinResult.character2} index={1} />
        </div>

        <div className="cards-actions">
          <button type="button" onClick={handlePlayAgain} className="cards-play-again-btn">
            Play Again
          </button>

          <div className="cards-upload-panel">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-yellow-300" />
              <h3 className="cards-upload-title">Ready to Create?</h3>
              <Sparkles className="w-5 h-5 text-yellow-300" />
            </div>
            <p className="cards-upload-text">
              Draw, paint, or digitally create your mashup of these two characters!
              Complete the quest and share your masterpiece with the community.
            </p>
            <button
              type="button"
              onClick={() => setShowUploadModal(true)}
              className="cards-upload-btn"
            >
              <Upload className="w-5 h-5" />
              Begin Creative Quest
            </button>
          </div>
        </div>
      </div>

      <UploadArtworkModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSubmit={handleUpload}
        isUploading={isUploading}
        uploadError={uploadError}
        variant="mashup"
      />
    </div>
  );
}
