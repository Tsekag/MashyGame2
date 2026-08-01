import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { uploadAPI } from '../services/api';
import { resolveImageUrl } from '../config/api';
import { User, Calendar, Heart, Image, Trophy, Trash2, Pencil, Eye, EyeOff, Maximize2, Sparkles } from 'lucide-react';
import { ImagePreviewModal } from './ImagePreviewModal';

export function Dashboard() {
  const { user } = useAuth();

  const [userUploads, setUserUploads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingUpload, setEditingUpload] = useState<{ id: string; title: string; description: string } | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [visibleDescriptions, setVisibleDescriptions] = useState<Record<string, boolean>>({});
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [stats, setStats] = useState({
    totalUploads: 0,
    totalLikes: 0,
    favoriteGenre: 'None'
  });

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

  const fetchData = async () => {
    if (!user) {
      console.warn('No logged-in user found.');
      return;
    }

    console.log('Fetching dashboard data for user:', user);

    setIsLoading(true);
    try {
      // Fetch user uploads
      const uploadsResponse = await uploadAPI.getUserUploads(user.id.toString());
      console.log('Raw uploads response:', uploadsResponse);

      // Handle different response shapes
      const uploadsData = uploadsResponse.uploads || uploadsResponse.data || [];

      // Fix image URLs to point to backend
      const uploadsWithFullUrls = uploadsData.map((upload: any) => ({
        ...upload,
        imageUrl: upload.imageUrl?.startsWith('http') ? upload.imageUrl : resolveImageUrl(upload.imageUrl)
      }));

      console.log('Parsed uploads data with full URLs:', uploadsWithFullUrls);
      setUserUploads(uploadsWithFullUrls);

      // Fetch user stats
      const statsResponse = await uploadAPI.getUserStats(user.id.toString());
      console.log('Raw stats response:', statsResponse);

      setStats({
        totalUploads: statsResponse.totalUploads || 0,
        totalLikes: statsResponse.totalLikes || 0,
        favoriteGenre: statsResponse.favoriteGenre || 'None'
      });
    } catch (error: any) {
      console.error('Failed to load dashboard:', error.message || error);
      setUserUploads([]);
      setStats({ totalUploads: 0, totalLikes: 0, favoriteGenre: 'None' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleDeleteUpload = async (uploadId: string) => {
    if (!window.confirm('Delete this upload?')) return;

    try {
      setDeletingId(uploadId);
      await uploadAPI.deleteUpload(uploadId);
      await fetchData();
    } catch (error: any) {
      console.error('Failed to delete upload:', error.message || error);
      alert('Failed to delete upload');
    } finally {
      setDeletingId(null);
    }
  };

  const previewImages = userUploads.map((upload) => ({
    src: upload.imageUrl || 'https://via.placeholder.com/300',
    title: upload.title || 'Untitled',
    description: upload.description,
    username: user?.username,
    likes: upload.likes || 0,
    createdAt: upload.createdAt,
  }));

  const handleToggleDescription = (uploadId: string) => {
    setVisibleDescriptions((prev) => ({ ...prev, [uploadId]: !prev[uploadId] }));
  };

  const handleStartEdit = (upload: any) => {
    setEditingUpload({
      id: String(upload.id),
      title: upload.title || '',
      description: upload.description || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingUpload || !editingUpload.title.trim()) return;

    try {
      setIsSavingEdit(true);
      await uploadAPI.updateUpload(editingUpload.id, {
        title: editingUpload.title.trim(),
        description: editingUpload.description.trim(),
      });
      setEditingUpload(null);
      await fetchData();
    } catch (error: any) {
      console.error('Failed to update upload:', error.message || error);
      alert('Failed to update upload');
    } finally {
      setIsSavingEdit(false);
    }
  };

  if (isLoading) {
    return (
      <div className="game-page-bg min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="game-page-bg min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-6">
        {/* User Profile Header */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 mb-8">
          <div className="flex items-center gap-6 mb-6">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-4 rounded-full">
              <User className="w-12 h-12 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Welcome back, {user?.username || 'User'}!
              </h1>
              <p className="text-gray-300 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Member since {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-6 rounded-xl text-center">
              <Image className="w-8 h-8 text-white mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stats.totalUploads}</div>
              <div className="text-blue-100">Artworks Created</div>
            </div>
            
            <div className="bg-gradient-to-br from-red-500 to-pink-500 p-6 rounded-xl text-center">
              <Heart className="w-8 h-8 text-white mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stats.totalLikes}</div>
              <div className="text-red-100">Total Likes</div>
            </div>
            
            <div className="bg-gradient-to-br from-yellow-500 to-orange-500 p-6 rounded-xl text-center">
              <Trophy className="w-8 h-8 text-white mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stats.favoriteGenre}</div>
              <div className="text-yellow-100">Favorite Genre</div>
            </div>
          </div>
        </div>

        {/* User's Uploads */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6">Your Mashup Creations</h2>
          
          {userUploads.length === 0 ? (
            <div className="text-center py-12">
              <Image className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400 text-xl mb-4">No artworks yet!</p>
              <p className="text-gray-500">
                Create your first mashup by spinning the wheel and uploading your artwork.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userUploads.map((upload, index) => (
                <article
                  key={upload.id || index}
                  className="artwork-card"
                  style={{ animationDelay: `${index * 0.08}s` }}
                >
                  <div
                    className="artwork-card-image-wrap"
                    onClick={() => setPreviewIndex(index)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setPreviewIndex(index)}
                    aria-label={`View ${upload.title || 'Untitled'}`}
                  >
                    <img
                      src={upload.imageUrl || 'https://via.placeholder.com/300'}
                      alt={upload.title || 'Untitled'}
                      onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/300'; }}
                    />
                    <div className="artwork-card-image-overlay">
                      <span className="artwork-card-expand-icon">
                        <Maximize2 className="h-5 w-5" />
                      </span>
                      <span className="artwork-card-expand-label">View Fullscreen</span>
                    </div>
                  </div>

                  <div className="artwork-card-body">
                    <h3 className="artwork-card-title">{upload.title || 'Untitled'}</h3>

                    {visibleDescriptions[String(upload.id)] && (
                      <div className="artwork-card-description">
                        <div className="artwork-card-description-label">
                          <Sparkles className="h-3 w-3" />
                          Creative Vision
                        </div>
                        <p className="artwork-card-description-inner">
                          {upload.description || 'No description provided.'}
                        </p>
                      </div>
                    )}

                    <div className="artwork-card-actions mb-3">
                      <span className="inline-flex items-center gap-1.5 text-sm text-gray-300">
                        <Heart className="w-4 h-4 text-red-400" />
                        {upload.likes || 0} likes
                      </span>
                      <span className="artwork-card-date">
                        {upload.createdAt ? new Date(upload.createdAt).toLocaleDateString() : 'Unknown'}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleDescription(String(upload.id))}
                        className="artwork-card-action-btn artwork-card-action-btn--view w-full justify-center py-2"
                      >
                        {visibleDescriptions[String(upload.id)] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        {visibleDescriptions[String(upload.id)] ? 'Hide Vision' : 'View Creative Vision'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartEdit(upload)}
                        className="artwork-card-action-btn artwork-card-action-btn--edit w-full justify-center py-2"
                      >
                        <Pencil className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteUpload(String(upload.id))}
                        disabled={deletingId === String(upload.id)}
                        className="artwork-card-action-btn artwork-card-action-btn--delete w-full justify-center py-2 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-4 h-4" />
                        {deletingId === String(upload.id) ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      <ImagePreviewModal
        images={previewImages}
        initialIndex={previewIndex ?? 0}
        isOpen={previewIndex !== null}
        onClose={() => setPreviewIndex(null)}
      />

      {editingUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-[#1E1E2F] rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-white mb-6">Edit Upload</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 font-semibold mb-2">Title</label>
                <input
                  type="text"
                  value={editingUpload.title}
                  onChange={(e) => setEditingUpload((prev) => prev ? { ...prev, title: e.target.value } : prev)}
                  className="w-full px-4 py-3 rounded-lg bg-[#2A2A3D] text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-gray-300 font-semibold mb-2">Description</label>
                <textarea
                  rows={4}
                  value={editingUpload.description}
                  onChange={(e) => setEditingUpload((prev) => prev ? { ...prev, description: e.target.value } : prev)}
                  className="w-full px-4 py-3 rounded-lg bg-[#2A2A3D] text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setEditingUpload(null)}
                disabled={isSavingEdit}
                className="flex-1 bg-gray-700 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSavingEdit || !editingUpload.title.trim()}
                className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {isSavingEdit ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
