import { Globe, Heart, MapPin, Phone, Search, Star, Users } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { apiService } from '../api/database';
import { useAuth } from '../contexts/AuthContext';
import { NGO } from '../types';

const NGOs: React.FC = () => {
  const [ngos, setNgos] = useState<NGO[]>([]);
  const [filteredNGOs, setFilteredNGOs] = useState<NGO[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { userProfile, connections, addConnection } = useAuth();
  const connectedIds = useMemo(() => new Set(connections.map((item) => item.id)), [connections]);

  useEffect(() => {
    const fetchNGOs = async () => {
      try {
        const response = await apiService.getAllNGOs();
        const fetchedNGOs = response.ngos || [];
        setNgos(fetchedNGOs);
        setFilteredNGOs(fetchedNGOs);
      } catch (error: any) {
        console.error('Error fetching NGOs:', error);
        toast.error(error?.message || 'Unable to load NGOs. Please try again later.');
        setNgos([]);
        setFilteredNGOs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNGOs();
  }, []);

  useEffect(() => {
    let filtered = ngos;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(ngo =>
        (ngo.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (ngo.description?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category (verification status)
    if (selectedCategory === 'verified') {
      filtered = filtered.filter(ngo => ngo.verified);
    } else if (selectedCategory === 'unverified') {
      filtered = filtered.filter(ngo => !ngo.verified);
    }

    setFilteredNGOs(filtered);
  }, [searchTerm, selectedCategory, ngos]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading NGOs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Browse NGOs</h1>
          <p className="text-sm sm:text-base text-gray-600">
            Discover and connect with verified non-governmental organizations making a difference
          </p>
        </div>

        {/* Search and Filters */}
        <div className="card mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search NGOs by name, description, or mission..."
                  className="input-field pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="md:w-48">
              <select
                className="input-field"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">All NGOs</option>
                <option value="verified">Verified Only</option>
                <option value="unverified">Unverified</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {filteredNGOs.length} of {ngos.length} NGOs
          </p>
        </div>

        {/* NGO Grid */}
        {filteredNGOs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNGOs.map((ngo) => (
              <div
                key={ngo.id}
                className="card hover:shadow-lg transition-shadow h-full flex flex-col min-h-[420px]"
              >
                {/* NGO Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {ngo.name}
                      </h3>
                      {ngo.verified && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <Star className="h-3 w-3 mr-1" />
                          Verified
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{ngo.description}</p>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 mb-4 text-sm text-gray-600">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span className="truncate">{ngo.address}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    <span>{ngo.phone}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Globe className="h-4 w-4 mr-2" />
                    <span>{ngo.email}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
                  <div className="flex items-center text-gray-600">
                    <Users className="h-4 w-4 mr-1" />
                    <span>25+ donors</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Heart className="h-4 w-4 mr-1" />
                    <span>150+ donations</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-auto pt-2 flex gap-2">
                  <Link
                    to={`/ngos/${ngo.id}`}
                    className="flex-1 btn-outline text-center py-2"
                  >
                    View Details
                  </Link>
                  <button
                    className="flex-1 btn-primary py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={connectedIds.has(ngo.id)}
                    onClick={async () => {
                      if (!userProfile || userProfile.user_type !== 'donor') {
                        toast.error('Please login as a donor to connect with NGOs.');
                        navigate('/login');
                        return;
                      }

                      try {
                        await addConnection({
                          id: ngo.id,
                          name: ngo.name || 'Unknown NGO',
                          email: ngo.email,
                          phone: ngo.phone,
                          description: ngo.description,
                        });
                        toast.success(`Connected with ${ngo.name}`);
                      } catch (error: any) {
                        console.error('Failed to connect:', error);
                        toast.error(error?.message || 'Unable to connect with NGO.');
                      }
                    }}
                  >
                    {connectedIds.has(ngo.id) ? 'Connected' : 'Connect'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No NGOs found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search terms or filters
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }}
              className="btn-primary"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Load More */}
        {filteredNGOs.length > 0 && (
          <div className="text-center mt-8">
            <button className="btn-outline">
              Load More NGOs
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NGOs; 