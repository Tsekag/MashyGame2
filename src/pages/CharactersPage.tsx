// src/pages/CharactersPage.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Search, ArrowUpDown, Plus, Edit, Trash2, ToggleLeft, ToggleRight, User } from 'lucide-react';
import { adminAPI } from '../services/api';
import { resolveImageUrl } from '../config/api';

interface Character {
  id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  genre_id: number;
  genre_name: string;
  created_at: string;
  updated_at: string;
}

interface Genre {
  id: number;
  name: string;
  is_active: boolean;
}

export const CharactersPage: React.FC = () => {
  const { user } = useAuth();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    genre_id: '',
    is_active: true,
    image: null as File | null
  });
  const [error, setError] = useState('');
  const DEFAULT_AVATAR = 'https://via.placeholder.com/96x96?text=No+Image';

  const resolveCharacterImageUrl = (imageUrl: string | null) => {
    if (!imageUrl) return DEFAULT_AVATAR;
    return resolveImageUrl(imageUrl);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching characters and genres data...');
      const [charactersResponse, genresResponse] = await Promise.all([
        adminAPI.getCharacters(),
        adminAPI.getGenres()
      ]);
      console.log('📚 Characters response:', charactersResponse);
      console.log('📚 Genres response:', genresResponse);
      setCharacters(charactersResponse.characters);
      setGenres(genresResponse.genres);
      console.log('✅ Data fetched successfully');
    } catch (err: any) {
      console.error('❌ Error fetching data:', err);
      setError('Failed to fetch data: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, image: file }));
  };

  const handleAddCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.genre_id) return;

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name.trim());
      formDataToSend.append('description', formData.description.trim());
      formDataToSend.append('genre_id', formData.genre_id);
      formDataToSend.append('is_active', formData.is_active.toString());
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      await adminAPI.createCharacter(formDataToSend);
      resetForm();
      setShowAddModal(false);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create character');
    }
  };

  const handleEditCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCharacter || !formData.name.trim() || !formData.genre_id) return;

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name.trim());
      formDataToSend.append('description', formData.description.trim());
      formDataToSend.append('genre_id', formData.genre_id);
      formDataToSend.append('is_active', formData.is_active.toString());
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      await adminAPI.updateCharacter(editingCharacter.id.toString(), formDataToSend);
      resetForm();
      setEditingCharacter(null);
      setShowEditModal(false);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update character');
    }
  };

  const handleDeleteCharacter = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this character?')) return;

    try {
      await adminAPI.deleteCharacter(id.toString());
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete character');
    }
  };

  const handleToggleCharacter = async (id: number) => {
    try {
      await adminAPI.toggleCharacter(id.toString());
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to toggle character status');
    }
  };

  const openEditModal = (character: Character) => {
    setEditingCharacter(character);
    setFormData({
      name: character.name,
      description: character.description || '',
      genre_id: character.genre_id.toString(),
      is_active: character.is_active,
      image: null
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      genre_id: '',
      is_active: true,
      image: null
    });
  };

  const filteredCharacters = characters
    .filter(character => 
      character.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      character.genre_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortOrder === 'asc') {
        return a.name.localeCompare(b.name);
      } else {
        return b.name.localeCompare(a.name);
      }
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-8">
      {/* Debug Info (dev only) */}
      {import.meta.env.DEV && (
        <div className="bg-blue-500/20 border border-blue-500 text-blue-200 px-4 py-3 rounded-lg mb-6">
          <p>Debug: Characters: {characters.length}, Genres: {genres.length}, Loading: {loading.toString()}</p>
          <p>Error: {error || 'None'}</p>
          <p>Auth: {user ? `${user.username} (${user.role ?? 'user'})` : 'Not authenticated'}</p>
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Characters Card */}
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-green-400">CHARACTERS</h2>
        </div>

        {/* Search and Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search chara"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="flex items-center gap-2 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-700 transition-colors"
          >
            <ArrowUpDown size={16} />
            Sort {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
          </button>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 rounded-lg text-white transition-colors"
          >
            <Plus size={16} />
            Add Character
          </button>
        </div>

        {/* Characters Grid */}
        <div className="grid grid-cols-2 gap-4">
          {filteredCharacters.map((character) => (
            <div key={character.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex items-start gap-3 mb-3">
                  {character.image_url ? (
                    <img
                      src={resolveCharacterImageUrl(character.image_url)}
                      alt={character.name}
                      className="w-12 h-12 rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = DEFAULT_AVATAR;
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                      <User size={20} className="text-gray-400" />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-lg uppercase">
                      {character.name}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {character.description || character.genre_name}
                    </p>
                  </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(character)}
                    className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
                    title="Edit"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteCharacter(character.id)}
                    className="p-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm">
                    {character.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <button
                    onClick={() => handleToggleCharacter(character.id)}
                    className="transition-colors"
                  >
                    {character.is_active ? (
                      <ToggleRight size={20} className="text-green-500" />
                    ) : (
                      <ToggleLeft size={20} className="text-gray-500" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredCharacters.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">
              {searchTerm ? 'No characters found matching your search.' : 'No characters available.'}
            </p>
          </div>
        )}
      </div>

      {/* Add Character Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md border border-gray-700 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">Add New Character</h3>
            <form onSubmit={handleAddCharacter}>
              <div className="space-y-4">
                <input
                  type="text"
                  name="name"
                  placeholder="Character name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
                
                <textarea
                  name="description"
                  placeholder="Character description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                
                <select
                  name="genre_id"
                  value={formData.genre_id}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Select Genre</option>
                  {genres.map(genre => (
                    <option key={genre.id} value={genre.id}>
                      {genre.name}
                    </option>
                  ))}
                </select>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-green-600 bg-gray-800 border-gray-700 rounded focus:ring-green-500"
                  />
                  <label className="text-white text-sm">Active</label>
                </div>
                
                <div>
                  <label className="block text-white text-sm mb-2">Character Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-600 file:text-white hover:file:bg-green-700"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg transition-colors"
                >
                  Create Character
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Character Modal */}
      {showEditModal && editingCharacter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md border border-gray-700 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">Edit Character</h3>
            <form onSubmit={handleEditCharacter}>
              <div className="space-y-4">
                <input
                  type="text"
                  name="name"
                  placeholder="Character name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
                
                <textarea
                  name="description"
                  placeholder="Character description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                
                <select
                  name="genre_id"
                  value={formData.genre_id}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Select Genre</option>
                  {genres.map(genre => (
                    <option key={genre.id} value={genre.id}>
                      {genre.name}
                    </option>
                  ))}
                </select>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-green-600 bg-gray-800 border-gray-700 rounded focus:ring-green-500"
                  />
                  <label className="text-white text-sm">Active</label>
                </div>
                
                <div>
                  <label className="block text-white text-sm mb-2">Character Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-600 file:text-white hover:file:bg-green-700"
                  />
                  {editingCharacter.image_url && (
                    <p className="text-gray-400 text-xs mt-1">
                      Current: {editingCharacter.image_url.split('/').pop()}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg transition-colors"
                >
                  Update Character
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingCharacter(null);
                    resetForm();
                  }}
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
