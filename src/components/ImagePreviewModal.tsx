import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Calendar, Heart, Sparkles, User, X } from 'lucide-react';

export interface PreviewImage {
  src: string;
  title?: string;
  description?: string;
  username?: string;
  likes?: number;
  createdAt?: string;
}

interface ImagePreviewModalProps {
  images: PreviewImage[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export function ImagePreviewModal({
  images,
  initialIndex,
  isOpen,
  onClose,
}: ImagePreviewModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isAnimating, setIsAnimating] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }, [initialIndex, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }

      if (images.length <= 1) return;

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        goToIndex((currentIndex + 1) % images.length, 'right');
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goToIndex((currentIndex - 1 + images.length) % images.length, 'left');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, images.length, isOpen, onClose]);

  const goToIndex = (nextIndex: number, direction: 'left' | 'right') => {
    if (isAnimating || nextIndex === currentIndex) return;
    setSlideDirection(direction);
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex(nextIndex);
      setIsAnimating(false);
      setSlideDirection(null);
    }, 180);
  };

  const activeImage = useMemo(() => {
    if (!images.length) return null;
    return images[currentIndex] ?? images[0];
  }, [currentIndex, images]);

  if (!isOpen || !activeImage) return null;

  const formattedDate = activeImage.createdAt
    ? new Date(activeImage.createdAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <div
      className="image-lightbox-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="image-lightbox-panel"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={activeImage.title || 'Artwork preview'}
      >
        {/* Header bar */}
        <div className="image-lightbox-header">
          <div className="image-lightbox-header-left">
            <Sparkles className="h-4 w-4 text-purple-300 shrink-0" />
            <span className="image-lightbox-counter">
              {currentIndex + 1} / {images.length}
            </span>
            {activeImage.title && (
              <span className="image-lightbox-header-title">{activeImage.title}</span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="image-lightbox-close"
            aria-label="Close image preview"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Main content: image + info side-by-side on desktop, stacked on mobile */}
        <div className="image-lightbox-body">
          <div className="image-lightbox-image-wrap">
            <div
              className={`image-lightbox-image-stage ${
                isAnimating
                  ? slideDirection === 'right'
                    ? 'image-lightbox-slide-out-left'
                    : 'image-lightbox-slide-out-right'
                  : 'image-lightbox-slide-in'
              }`}
            >
              <img
                src={activeImage.src}
                alt={activeImage.title || 'Uploaded artwork'}
                className="image-lightbox-img"
              />
            </div>

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => goToIndex((currentIndex - 1 + images.length) % images.length, 'left')}
                  className="image-lightbox-nav image-lightbox-nav--prev"
                  aria-label="Show previous image"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => goToIndex((currentIndex + 1) % images.length, 'right')}
                  className="image-lightbox-nav image-lightbox-nav--next"
                  aria-label="Show next image"
                >
                  <ArrowRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>

          <aside className="image-lightbox-info">
            <div className="image-lightbox-info-scroll">
              {activeImage.title && (
                <h2 className="image-lightbox-title">{activeImage.title}</h2>
              )}

              <div className="image-lightbox-meta">
                {activeImage.username && (
                  <span className="image-lightbox-meta-chip">
                    <User className="h-3.5 w-3.5" />
                    {activeImage.username}
                  </span>
                )}
                {typeof activeImage.likes === 'number' && (
                  <span className="image-lightbox-meta-chip image-lightbox-meta-chip--likes">
                    <Heart className="h-3.5 w-3.5" />
                    {activeImage.likes}
                  </span>
                )}
                {formattedDate && (
                  <span className="image-lightbox-meta-chip">
                    <Calendar className="h-3.5 w-3.5" />
                    {formattedDate}
                  </span>
                )}
              </div>

              <div className="image-lightbox-description-block">
                <div className="image-lightbox-description-label">
                  <Sparkles className="h-3.5 w-3.5" />
                  Creative Vision
                </div>
                <p className="image-lightbox-description">
                  {activeImage.description?.trim() || 'No description provided for this artwork.'}
                </p>
              </div>
            </div>

            {images.length > 1 && (
              <div className="image-lightbox-thumbs">
                {images.map((img, idx) => (
                  <button
                    key={`${img.src}-${idx}`}
                    type="button"
                    onClick={() => goToIndex(idx, idx > currentIndex ? 'right' : 'left')}
                    className={`image-lightbox-thumb ${idx === currentIndex ? 'image-lightbox-thumb--active' : ''}`}
                    aria-label={`View image ${idx + 1}: ${img.title || 'Untitled'}`}
                    aria-current={idx === currentIndex ? 'true' : undefined}
                  >
                    <img src={img.src} alt="" />
                  </button>
                ))}
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
