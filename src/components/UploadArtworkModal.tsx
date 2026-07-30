import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Sparkles, ImageIcon, PenLine, Rocket, X } from 'lucide-react';

interface UploadArtworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (file: File, title: string, description: string) => Promise<void>;
  isUploading: boolean;
  uploadError?: string | null;
  variant?: 'mashup' | 'gallery';
}

export function UploadArtworkModal({
  isOpen,
  onClose,
  onSubmit,
  isUploading,
  uploadError,
  variant = 'gallery',
}: UploadArtworkModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setDescription('');
      setSelectedFile(null);
      setPreviewUrl(null);
      setIsDragging(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  const handleFile = useCallback((file: File | undefined) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFile(e.dataTransfer.files[0]);
    },
    [handleFile]
  );

  const questSteps = [
    { id: 'image', label: 'Drop Art', icon: ImageIcon, done: !!selectedFile },
    { id: 'title', label: 'Name It', icon: PenLine, done: title.trim().length > 0 },
    { id: 'launch', label: 'Launch!', icon: Rocket, done: !!selectedFile && title.trim().length > 0 },
  ];

  const completedSteps = questSteps.filter((s) => s.done).length;
  const progressPct = Math.round((completedSteps / questSteps.length) * 100);

  const handleSubmit = async () => {
    if (!selectedFile || !title.trim()) return;
    await onSubmit(selectedFile, title.trim(), description.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="upload-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="upload-modal-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-modal-title"
      >
        <button type="button" className="upload-modal-close" onClick={onClose} aria-label="Close">
          <X className="w-5 h-5" />
        </button>

        <div className="upload-modal-header">
          <div className="upload-modal-badge">
            <Sparkles className="w-4 h-4" />
            <span>{variant === 'mashup' ? 'Creative Quest' : 'Gallery Mission'}</span>
          </div>
          <h2 id="upload-modal-title" className="upload-modal-title">
            {variant === 'mashup' ? '🎨 Forge Your Mashup!' : '🚀 Share Your Masterpiece!'}
          </h2>
          <p className="upload-modal-subtitle">
            {variant === 'mashup'
              ? 'Combine your two characters into one epic artwork — the community awaits!'
              : 'Upload your creation and join the hall of legendary mashup artists!'}
          </p>
        </div>

        {/* Quest progress bar */}
        <div className="upload-quest-progress">
          <div className="upload-quest-steps">
            {questSteps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.id}
                  className={`upload-quest-step ${step.done ? 'upload-quest-step--done' : ''} ${i === completedSteps && !step.done ? 'upload-quest-step--active' : ''}`}
                >
                  <div className="upload-quest-step-icon">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span>{step.label}</span>
                </div>
              );
            })}
          </div>
          <div className="upload-progress-track">
            <div className="upload-progress-fill" style={{ width: `${progressPct}%` }} />
            <span className="upload-progress-label">{progressPct}% Complete</span>
          </div>
        </div>

        <div className="upload-modal-body">
          {/* Drop zone */}
          <div
            className={`upload-dropzone ${isDragging ? 'upload-dropzone--dragging' : ''} ${selectedFile ? 'upload-dropzone--has-file' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />

            {previewUrl ? (
              <div className="upload-preview-wrap">
                <img src={previewUrl} alt="Preview" className="upload-preview-img" />
                <div className="upload-preview-overlay">
                  <Upload className="w-8 h-8" />
                  <span>Tap to change image</span>
                </div>
              </div>
            ) : (
              <>
                <div className="upload-dropzone-icon">
                  <Upload className="w-10 h-10" />
                </div>
                <p className="upload-dropzone-text">
                  {isDragging ? '✨ Release to capture!' : 'Drag & drop your artwork here'}
                </p>
                <p className="upload-dropzone-hint">or click to browse files</p>
                <div className="upload-dropzone-sparks" aria-hidden="true">
                  <span>✦</span><span>✦</span><span>✦</span>
                </div>
              </>
            )}
          </div>

          {/* Title */}
          <div className="upload-field">
            <label htmlFor="upload-title" className="upload-field-label">
              <PenLine className="w-4 h-4" />
              Artwork Title
              <span className="upload-field-xp">+50 XP</span>
            </label>
            <input
              id="upload-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your creation an epic name..."
              className="upload-field-input"
              maxLength={80}
            />
            <div className="upload-char-count">{title.length}/80</div>
          </div>

          {/* Description */}
          <div className="upload-field">
            <label htmlFor="upload-desc" className="upload-field-label">
              <Sparkles className="w-4 h-4" />
              Creative Vision
              <span className="upload-field-xp upload-field-xp--bonus">+25 XP bonus</span>
            </label>
            <textarea
              id="upload-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your mashup — what inspired you? Which genres collide?"
              className="upload-field-textarea"
              rows={3}
              maxLength={500}
            />
          </div>

          {uploadError && (
            <div className="upload-error-banner" role="alert">
              ⚠️ {uploadError}
            </div>
          )}
        </div>

        <div className="upload-modal-actions">
          <button type="button" className="upload-btn-cancel" onClick={onClose} disabled={isUploading}>
            Retreat
          </button>
          <button
            type="button"
            className={`upload-btn-submit ${completedSteps === questSteps.length ? 'upload-btn-submit--ready' : ''}`}
            onClick={handleSubmit}
            disabled={isUploading || !selectedFile || !title.trim()}
          >
            {isUploading ? (
              <>
                <span className="upload-btn-spinner" />
                Launching...
              </>
            ) : (
              <>
                <Rocket className="w-5 h-5" />
                {variant === 'mashup' ? 'Submit Mashup!' : 'Launch to Gallery!'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
