import React, { useRef } from 'react';
import { Upload, Sparkles, PenLine, ImageIcon } from 'lucide-react';

interface MashupSlotCardProps {
  previewUrl: string | null;
  onSelectFile: (file: File) => void;
  onOpenUpload: () => void;
  index?: number;
}

export function MashupSlotCard({
  previewUrl,
  onSelectFile,
  onOpenUpload,
  index = 2,
}: MashupSlotCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onSelectFile(file);
    }
  };

  return (
    <div
      className="mashup-slot-card"
      style={{ animationDelay: `${index * 200}ms` }}
    >
      <div className="mashup-slot-card-inner">
        <button
          type="button"
          className="mashup-slot-card-badge"
          onClick={onOpenUpload}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Your Mashup
        </button>

        <div
          className={`mashup-slot-card-stage ${previewUrl ? 'mashup-slot-card-stage--filled' : ''}`}
          onClick={() => (previewUrl ? onOpenUpload() : fileInputRef.current?.click())}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              previewUrl ? onOpenUpload() : fileInputRef.current?.click();
            }
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleFileChange}
          />

          {previewUrl ? (
            <>
              <img
                src={previewUrl}
                alt="Your mashup preview"
                className="mashup-slot-card-preview"
              />
              <div className="mashup-slot-card-preview-overlay">
                <PenLine className="h-5 w-5" />
                <span>Edit &amp; Submit</span>
              </div>
            </>
          ) : (
            <div className="mashup-slot-card-empty">
              <div className="mashup-slot-card-empty-icon">
                <ImageIcon className="h-8 w-8" />
              </div>
              <p className="mashup-slot-card-empty-title">Drop Your Creation</p>
              <p className="mashup-slot-card-empty-hint">
                Upload your mashup while referencing both characters above
              </p>
              <span className="mashup-slot-card-empty-cta">
                <Upload className="h-4 w-4" />
                Choose Image
              </span>
            </div>
          )}
        </div>

        <p className="mashup-slot-card-footer">
          {previewUrl
            ? 'Ready to name & launch — tap to finish your quest'
            : 'Draw, paint, or design — then upload here'}
        </p>
      </div>
    </div>
  );
}
