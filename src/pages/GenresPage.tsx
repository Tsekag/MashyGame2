import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Search, ArrowUpDown, Plus, Edit, Trash2, ToggleLeft, ToggleRight, ImageIcon } from 'lucide-react';
import { adminAPI } from '../services/api';
import { resolveImageUrl } from '../config/api';

interface Genre {
  id: number;
  name: string;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const GenresPage: React.FC = () => {
  const { user } = useAuth();
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingGenre, setEditingGenre] = useState<Genre | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    is_active: true,
    image: null as File | null,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState('');

  const DEFAULT_IMAGE = 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"%3E%3Crect width="200" height="150" fill="%231f2937"/%3E%3Ctext x="50%25" y="50%25" fill="%239ca3af" font-family="Arial, sans-serif" font-size="14" text-anchor="middle" dominant-baseline="middle"%3ENo Image%3C/text%3E%3C/svg%3E';

  useEffect(() => {
    fetchGenres();
  }, []);

  const fetchGenres = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getGenres();
      setGenres(response.genres);
    } catch (err: any) {
      setError('Failed to fetch genres: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', is_active: true, image: null });
    setImagePreview(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, image: file }));
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImagePreview(null);
    }
  };

  const handleAddGenre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.image) return;

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name.trim());
      formDataToSend.append('is_active', formData.is_active.toString());
      formDataToSend.append('image', formData.image);

      await adminAPI.createGenre(formDataToSend);
      resetForm();
      setShowAddModal(false);
      fetchGenres();
    } catch (err: any) {
      setError(err.message || 'Failed to create genre');
    }
  };

  const handleEditGenre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGenre || !formData.name.trim()) return;

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name.trim());
      formDataToSend.append('is_active', formData.is_active.toString());
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      await adminAPI.updateGenre(editingGenre.id.toString(), formDataToSend);
      resetForm();
      setEditingGenre(null);
      setShowEditModal(false);
      fetchGenres();
    } catch (err: any) {
      setError(err.message || 'Failed to update genre');
    }
  };

  const handleDeleteGenre = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this genre?')) return;

    try {
      await adminAPI.deleteGenre(id.toString());
      fetchGenres();
    } catch (err: any) {
      setError(err.message || 'Failed to delete genre');
    }
  };

  const handleToggleGenre = async (id: number) => {
    try {
      await adminAPI.toggleGenre(id.toString());
      fetchGenres();
    } catch (err: any) {
      setError(err.message || 'Failed to toggle genre status');
    }
  };

  const openEditModal = (genre: Genre) => {
    setEditingGenre(genre);
    setFormData({ name: genre.name, is_active: genre.is_active, image: null });
    setImagePreview(genre.image_url ? resolveImageUrl(genre.image_url) : null);
    setShowEditModal(true);
  };

  const filteredGenres = genres
    .filter(genre => genre.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-4 sm:p-8">
      {import.meta.env.DEV && (
        <div className="bg-blue-500/20 border border-blue-500 text-blue-200 px-4 py-3 rounded-lg mb-6 text-sm">
          <p>Debug: Genres: {genres.length}, Auth: {user ? `${user.username} (${user.role ?? 'user'})` : 'Not authenticated'}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-300 hover:text-white ml-4">&times;</button>
        </div>
      )}

      <div className="bg-gray-900 rounded-2xl p-4 sm:p-6 border border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-purple-400">GENRES</h2>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search genres..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-700 transition-colors"
          >
            <ArrowUpDown size={16} />
            Sort {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
          </button>

          <button
            onClick={() => { resetForm(); setShowAddModal(true); }}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 rounded-lg text-white transition-colors"
          >
            <Plus size={16} />
            Add Genre
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredGenres.map((genre) => (
            <div key={genre.id} className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 group">
              <div className="aspect-[4/3] overflow-hidden bg-gray-900">
                <img
                  src={genre.image_url ? resolveImageUrl(genre.image_url) : DEFAULT_IMAGE}
                  alt={genre.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-bold text-base sm:text-lg uppercase truncate">
                    {genre.name}
                  </h3>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => openEditModal(genre)}
                      className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
                      title="Edit"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteGenre(genre.id)}
                      className="p-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-xs sm:text-sm">
                    {new Date(genre.created_at).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs sm:text-sm ${genre.is_active ? 'text-green-400' : 'text-gray-500'}`}>
                      {genre.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <button onClick={() => handleToggleGenre(genre.id)} className="transition-colors">
                      {genre.is_active ? (
                        <ToggleRight size={20} className="text-purple-500" />
                      ) : (
                        <ToggleLeft size={20} className="text-gray-500" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredGenres.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">
              {searchTerm ? 'No genres found matching your search.' : 'No genres available.'}
            </p>
          </div>
        )}
      </div>

      {/* Add Genre Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl p-6 w-full max-w-md border border-gray-700 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">Add New Genre</h3>
            <form onSubmit={handleAddGenre}>
              <input
                type="text"
                placeholder="Genre name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
                required
              />

              <div className="mb-4">
                <label className="block text-gray-300 text-sm mb-2">Genre Cover Image *</label>
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center hover:border-purple-500 transition-colors">
                  {imagePreview ? (
                    <div className="relative">
                      <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover rounded-lg mb-2" />
                      <button
                        type="button"
                        onClick={() => { setFormData(prev => ({ ...prev, image: null })); setImagePreview(null); }}
                        className="text-red-400 text-sm hover:text-red-300"
                      >
                        Remove image
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center gap-2 py-4">
                      <ImageIcon className="w-10 h-10 text-gray-500" />
                      <span className="text-gray-400 text-sm">Click to upload image</span>
                      <span className="text-gray-500 text-xs">JPEG, PNG, GIF, WebP (max 5MB)</span>
                      <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" required />
                    </label>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg transition-colors">
                  Create Genre
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); resetForm(); }}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Genre Modal */}
      {showEditModal && editingGenre && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl p-6 w-full max-w-md border border-gray-700 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">Edit Genre</h3>
            <form onSubmit={handleEditGenre}>
              <input
                type="text"
                placeholder="Genre name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
                required
              />

              <div className="mb-4">
                <label className="block text-gray-300 text-sm mb-2">Genre Cover Image</label>
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center hover:border-purple-500 transition-colors">
                  {imagePreview ? (
                    <div className="relative">
                      <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover rounded-lg mb-2" />
                      <label className="cursor-pointer text-purple-400 text-sm hover:text-purple-300">
                        Change image
                        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                      </label>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center gap-2 py-4">
                      <ImageIcon className="w-10 h-10 text-gray-500" />
                      <span className="text-gray-400 text-sm">Click to upload new image</span>
                      <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg transition-colors">
                  Update Genre
                </button>
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setEditingGenre(null); resetForm(); }}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
