import React, { useState, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';
import { Card3D } from './Card3D';
import { Upload } from 'lucide-react';

export function Card3DDisplay() {
  const { spinResult, uploadArtwork } = useGame();
  const { user } = useAuth();
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  
  useEffect(() => {
    if (spinResult) {
      const timer = setTimeout(() => {
        setIsLoaded(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [spinResult]);

  const handleUpload = async () => {
    if (!uploadTitle || !selectedFile) {
      setUploadError('Please provide a title and select an image');
      return;
    }
    setIsUploading(true);
    setUploadError('');
    try {
      const success = await uploadArtwork(selectedFile, uploadTitle, uploadDescription, spinResult);
      if (success) {
        setUploadTitle('');
        setUploadDescription('');
        setSelectedFile(null);
        setShowUploadModal(false);
        const event = new CustomEvent('navigate-to-gallery');
        window.dispatchEvent(event);
      } else {
        setUploadError('Upload failed. Please try again.');
      }
    } catch (error) {
      setUploadError('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  if (!spinResult) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 to-indigo-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading your mashup...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold gradient-text mb-4">
            ✨ Your Epic Mashup ✨
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Two legendary characters have been chosen for your creative fusion!
          </p>
        </div>

        <div className={`
          flex flex-col lg:flex-row items-center justify-center gap-12
          transition-all duration-1000 ease-out
          ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
        `}>
          <Card3D character={spinResult.character1} index={0} />
          
          {/* Mashup symbol */}
          <div className="flex items-center justify-center">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black p-6 rounded-full text-4xl font-bold shadow-2xl animate-pulse card-glow">
              +
            </div>
          </div>
          
          <Card3D character={spinResult.character2} index={1} />
        </div>

        <div className="text-center mt-16">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 inline-block">
            <h3 className="text-2xl font-bold gradient-text mb-4">
              Ready to Create?
            </h3>
            <p className="text-gray-300 mb-6">
              Draw, paint, or digitally create your mashup of these two characters!
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-4 rounded-full font-bold text-lg transition-all duration-200 transform hover:scale-105 shadow-2xl flex items-center gap-3 mx-auto"
            >
              <Upload className="w-6 h-6" />
              Upload Your Artwork
            </button>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-[#1E1E2F] rounded-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <h3 className="text-2xl font-bold text-center mb-6 text-white">
              Upload Your Mashup
            </h3>

            <div className="space-y-6">
              {/* Drag & Drop File Upload */}
              <div className="border-2 border-dashed border-gray-500 rounded-lg p-8 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:border-purple-400 transition-colors">
                <Upload className="w-10 h-10 mb-3 text-gray-400" />
                <p className="mb-2">Drag and drop your image here, or click to select file</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold mt-2 cursor-pointer hover:bg-purple-700"
                >
                  Choose File
                </label>
                {selectedFile && (
                  <p className="mt-3 text-sm text-green-400">{selectedFile.name}</p>
                )}
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-gray-300 font-semibold mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="Enter a title for your artwork..."
                  className="w-full px-4 py-3 rounded-lg bg-[#2A2A3D] text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Description Input */}
              <div>
                <label className="block text-gray-300 font-semibold mb-2">
                  Description
                </label>
                <textarea
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Describe your mashup, its genres, and your creative vision..."
                  className="w-full px-4 py-3 rounded-lg bg-[#2A2A3D] text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={4}
                ></textarea>
              </div>

              {uploadError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {uploadError}
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setShowUploadModal(false)}
                disabled={isUploading}
                className="flex-1 bg-gray-700 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={isUploading || !uploadTitle || !selectedFile}
                className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? 'Uploading...' : 'Submit Mashup'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
