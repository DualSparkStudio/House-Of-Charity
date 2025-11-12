import { ArrowLeft, Award, Calendar, CheckCircle, DollarSign, Globe, Heart, Image as ImageIcon, Mail, MapPin, Pencil, Phone, Star, Target, Users, X } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiService } from '../api/database';
import DonationForm from '../components/DonationForm';
import ProfileEditor from '../components/ProfileEditor';
import { useAuth } from '../contexts/AuthContext';
import { NGO } from '../types';

type DonationPreset = {
  type?: 'money' | 'food' | 'essentials';
  amount?: number;
  description?: string;
  quantity?: number;
  unit?: string;
  deliveryDate?: string;
  essentialType?: string;
};

const NGODetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userProfile, connections, addConnection, removeConnection } = useAuth();
  const [ngo, setNgo] = useState<NGO | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [donationPreset, setDonationPreset] = useState<DonationPreset | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const isDonor = userProfile?.user_type === 'donor';
  const isOwner = userProfile?.user_type === 'ngo' && userProfile?.id === id;
  const isConnected = useMemo(
    () => connections.some((connection) => connection.id === id),
    [connections, id]
  );

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }),
    []
  );

  const handleDonateClick = (preset?: DonationPreset) => {
    if (!isDonor) {
      toast.error('Please login as a donor to make a donation.');
      navigate('/login');
      return;
    }
    setDonationPreset(preset || null);
    setShowDonationModal(true);
  };

  const currentRequirements = useMemo(
    () => [
      {
        title: 'Education Materials',
        priorityLabel: 'Urgent',
        priorityClass: 'bg-red-100 text-red-800',
        description: 'Need school supplies, books, and educational materials for 100 children.',
        goal: currencyFormatter.format(5000),
        donationPreset: {
          type: 'money' as const,
          amount: 5000,
          description: 'Funding support for purchasing education materials for 100 children.',
        },
      },
      {
        title: 'Food Supplies',
        priorityLabel: 'High Priority',
        priorityClass: 'bg-yellow-100 text-yellow-800',
        description: 'Monthly food supplies for 50 families in need.',
        goal: currencyFormatter.format(3000),
        donationPreset: {
          type: 'food' as const,
          quantity: 50,
          unit: 'boxes',
          description: 'Provide monthly food supply boxes for 50 families in need.',
        },
      },
    ],
    [currencyFormatter]
  );

  useEffect(() => {
    const fetchNGODetails = async () => {
      setLoading(true);
      try {
        const response = await apiService.getAllNGOs();
        const list: NGO[] = response.ngos || [];
        const found = list.find((n) => n.id === id) || null;
        setNgo(found);
        if (!found) {
          toast.error('NGO not found.');
        }
      } catch (error: any) {
        console.error('Failed to load NGO details:', error);
        toast.error(error?.message || 'Unable to load NGO details.');
        setNgo(null);
      } finally {
        setLoading(false);
      }
    };

    fetchNGODetails();
  }, [id]);

  useEffect(() => {
    if (isOwner && userProfile) {
      setNgo((previous) =>
        previous ? { ...previous, ...userProfile } : (userProfile as NGO)
      );
    }
  }, [isOwner, userProfile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading NGO details...</p>
        </div>
      </div>
    );
  }

  if (!ngo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">NGO Not Found</h1>
          <p className="text-gray-600 mb-6">The NGO you're looking for doesn't exist.</p>
          <Link to="/ngos" className="btn-primary">
            Back to NGOs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-full mx-auto" style={{paddingLeft: '10%', paddingRight: '10%', paddingTop: '2%', paddingBottom: '2%'}}>
        {/* Back Button */}
        <Link 
          to="/ngos" 
          className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to NGOs
        </Link>

        {/* NGO Header */}
        <div className="card mb-6">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">{ngo.name}</h1>
            {ngo.verified && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <Star className="h-4 w-4 mr-1" />
                Verified
              </span>
            )}
          </div>
          <p className="text-gray-600 text-lg">{ngo.description}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-primary-50 rounded-lg p-4 text-center">
            <Heart className="h-8 w-8 text-primary-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">150+</div>
            <div className="text-sm text-gray-600">Total Donations</div>
          </div>
          <div className="bg-secondary-50 rounded-lg p-4 text-center">
            <Users className="h-8 w-8 text-secondary-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">25+</div>
            <div className="text-sm text-gray-600">Active Donors</div>
          </div>
          <div className="bg-success-50 rounded-lg p-4 text-center">
            <Globe className="h-8 w-8 text-success-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">₹50K+</div>
            <div className="text-sm text-gray-600">Total Raised</div>
          </div>
          <div className="bg-warning-50 rounded-lg p-4 text-center">
            <Star className="h-8 w-8 text-warning-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">4.8</div>
            <div className="text-sm text-gray-600">Rating</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {isOwner ? (
            <button
              className="btn-primary flex-1"
              onClick={() => setIsEditingProfile((prev) => !prev)}
            >
              <Pencil className="h-5 w-5 mr-2" />
              {isEditingProfile ? 'Close Editor' : 'Edit Profile'}
            </button>
          ) : (
            <>
              <button 
                onClick={() => handleDonateClick()}
                className="btn-primary flex-1"
              >
                <Heart className="h-5 w-5 mr-2" />
                Make a Donation
              </button>
              {!isDonor && (
                <Link
                  to="/login"
                  className="btn-primary flex-1 text-center"
                >
                  <Heart className="h-5 w-5 mr-2 inline-block" />
                  Login to Donate
                </Link>
              )}
              {isDonor ? (
                isConnected ? (
                  <button
                    className="btn-outline flex-1 border-red-200 text-red-600 hover:text-red-700 hover:border-red-300"
                    onClick={() => {
                      removeConnection(ngo.id);
                      toast.success(`Removed ${ngo.name} from your connections.`);
                    }}
                  >
                    <Users className="h-5 w-5 mr-2" />
                    Remove Connection
                  </button>
                ) : (
                  <button
                    className="btn-outline flex-1"
                    onClick={() => {
                      if (!ngo) return;
                      addConnection({
                        id: ngo.id,
                        name: ngo.name || 'Unknown NGO',
                        email: ngo.email,
                        phone: ngo.phone,
                        description: ngo.description,
                      });
                      toast.success(`Connected with ${ngo.name}`);
                    }}
                  >
                    <Users className="h-5 w-5 mr-2" />
                    Connect with NGO
                  </button>
                )
              ) : (
                <button
                  className="btn-outline flex-1"
                  onClick={() => {
                    toast.error('Please login as a donor to connect.');
                    navigate('/login');
                  }}
                >
                  <Users className="h-5 w-5 mr-2" />
                  Connect with NGO
                </button>
              )}
            </>
          )}
        </div>

        {isOwner && isEditingProfile && (
          <div className="mb-8">
            <ProfileEditor onSuccess={() => setIsEditingProfile(false)} />
          </div>
        )}

        {/* About Section - Full Width */}
        <div className="card mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">About</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            {ngo.description}
          </p>
          <p className="text-gray-600 leading-relaxed">
            We are committed to making a lasting difference in the communities we serve. 
            Through our various programs and initiatives, we work tirelessly to create 
            positive change and improve lives. Our dedicated team of volunteers and staff 
            members ensure that every donation makes a meaningful impact.
          </p>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Gallery */}
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                    <ImageIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Gallery</h2>
                    <p className="text-sm text-gray-500">See our work in action</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: 1, title: 'Community Outreach Program', url: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=400' },
                  { id: 2, title: 'Education Initiative', url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400' },
                  { id: 3, title: 'Food Distribution Drive', url: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400' },
                  { id: 4, title: 'Healthcare Camp', url: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=400' },
                ].map((image) => (
                  <div key={image.id} className="relative group overflow-hidden rounded-xl aspect-video bg-gray-200 shadow-sm hover:shadow-lg transition-all duration-300">
                    <img 
                      src={image.url} 
                      alt={image.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-white text-xs font-semibold leading-tight">
                          {image.title}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Work Done */}
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Work Done</h2>
                    <p className="text-sm text-gray-500">Our completed initiatives and impact</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  {
                    title: 'Education Program',
                    year: '2023',
                    description: 'Provided quality education to over 500 underprivileged children across 10 schools.',
                    beneficiaries: '500+ Beneficiaries',
                    duration: 'Jan - Dec 2023',
                    icon: '🎓'
                  },
                  {
                    title: 'Healthcare Initiative',
                    year: '2023',
                    description: 'Organized free medical camps providing healthcare services to over 1,000 families.',
                    beneficiaries: '1,000+ Families',
                    duration: 'Mar - Nov 2023',
                    icon: '🏥'
                  },
                  {
                    title: 'Food Distribution Program',
                    year: '2022-2023',
                    description: 'Distributed food packages to 2,000+ families during crisis periods.',
                    beneficiaries: '2,000+ Families',
                    duration: '2022 - 2023',
                    icon: '🍽️'
                  }
                ].map((work, index) => (
                  <div key={index} className="group relative overflow-hidden bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-3 border border-green-200 hover:shadow-md transition-all duration-300">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-2xl shadow-sm">
                        {work.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold text-gray-900 text-lg">{work.title}</h3>
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                            {work.year}
                          </span>
                        </div>
                        <p className="text-gray-700 mb-4 leading-relaxed text-sm">
                          {work.description}
                        </p>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 text-green-600">
                            <Users className="h-4 w-4" />
                            <span className="text-xs font-medium">{work.beneficiaries}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-500">
                            <Calendar className="h-4 w-4" />
                            <span className="text-xs">{work.duration}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Awards */}
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center">
                    <Award className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Awards & Recognition</h2>
                    <p className="text-sm text-gray-500">Our achievements and honors</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  {
                    title: 'Best NGO Award 2023',
                    organization: 'National Welfare Association',
                    date: 'December 2023',
                    icon: '🏆',
                    color: 'yellow'
                  },
                  {
                    title: 'Excellence in Education Award',
                    organization: 'Ministry of Education',
                    date: 'August 2023',
                    icon: '🎓',
                    color: 'blue'
                  },
                  {
                    title: 'Healthcare Champion Award 2022',
                    organization: 'Health Ministry',
                    date: 'November 2022',
                    icon: '🏥',
                    color: 'green'
                  }
                ].map((award, index) => {
                  const colorClasses: Record<string, string> = {
                    yellow: 'from-yellow-50 to-orange-50 border-yellow-200',
                    blue: 'from-blue-50 to-indigo-50 border-blue-200',
                    green: 'from-green-50 to-emerald-50 border-green-200'
                  };
                  
                  const badgeColors: Record<string, string> = {
                    yellow: 'bg-yellow-100 text-yellow-700',
                    blue: 'bg-blue-100 text-blue-700',
                    green: 'bg-green-100 text-green-700'
                  };

                  return (
                    <div key={index} className={`bg-gradient-to-r ${colorClasses[award.color]} rounded-lg p-4 border`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-xl shadow-sm">
                          {award.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 text-sm">{award.title}</h3>
                          <p className="text-gray-600 text-xs">{award.organization}</p>
                          <span className={`px-2 py-1 ${badgeColors[award.color]} text-xs font-medium rounded-full inline-block mt-1`}>
                            {award.date}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Current Requirements */}
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-semibold text-gray-900">Current Requirements</h2>
              </div>
              <div className="space-y-3">
                {currentRequirements.map((requirement) => (
                  <div key={requirement.title} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{requirement.title}</h3>
                      <span className={`px-2 py-1 ${requirement.priorityClass} text-xs font-medium rounded`}>
                        {requirement.priorityLabel}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">
                      {requirement.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Goal: {requirement.goal}</span>
                      <button
                        className="btn-primary text-sm py-1 px-4"
                        onClick={() => handleDonateClick(requirement.donationPreset)}
                      >
                        Donate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Future Plans */}
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <Target className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Future Plans</h2>
                    <p className="text-sm text-gray-500">Upcoming initiatives and goals</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {[
                      {
                        title: 'Expansion to Rural Areas',
                        year: '2024',
                        description: 'Expand education program to 20 additional rural schools, reaching 1,000 more children.',
                        target: 'Q4 2024',
                        funding: currencyFormatter.format(75000),
                        icon: '🌾',
                        color: 'blue'
                      },
                      {
                        title: 'Mobile Healthcare Units',
                        year: '2024',
                        description: 'Launch 3 mobile healthcare units to provide medical services in remote areas.',
                        target: 'Q2 2024',
                        funding: currencyFormatter.format(120000),
                        icon: '🚐',
                        color: 'purple'
                      },
                      {
                        title: 'Women Empowerment Program',
                        year: '2024',
                        description: 'Establish training centers helping 500 women become financially independent.',
                        target: 'Q3 2024',
                        funding: currencyFormatter.format(50000),
                        icon: '👩‍💼',
                        color: 'green'
                      }
                ].map((plan, index) => {
                  const colorClasses: Record<string, string> = {
                    blue: 'from-blue-50 to-indigo-50 border-blue-200',
                    purple: 'from-purple-50 to-violet-50 border-purple-200',
                    green: 'from-green-50 to-emerald-50 border-green-200',
                    orange: 'from-orange-50 to-amber-50 border-orange-200'
                  };
                  
                  const badgeColors: Record<string, string> = {
                    blue: 'bg-blue-100 text-blue-700',
                    purple: 'bg-purple-100 text-purple-700',
                    green: 'bg-green-100 text-green-700',
                    orange: 'bg-orange-100 text-orange-700'
                  };

                  return (
                    <div key={index} className={`group relative overflow-hidden bg-gradient-to-r ${colorClasses[plan.color]} rounded-xl p-3 border hover:shadow-md transition-all duration-300`}>
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-2xl shadow-sm">
                          {plan.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-bold text-gray-900 text-lg">{plan.title}</h3>
                            <span className={`px-2 py-1 ${badgeColors[plan.color]} text-xs font-medium rounded-full`}>
                              {plan.year}
                            </span>
                          </div>
                          <p className="text-gray-700 mb-4 leading-relaxed text-sm">
                            {plan.description}
                          </p>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-blue-600">
                              <Calendar className="h-4 w-4" />
                              <span className="text-xs font-medium">Target: {plan.target}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <DollarSign className="h-4 w-4" />
                              <span className="text-xs font-medium">Funding: {plan.funding}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Activities */}
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-semibold text-gray-900">Recent Activities</h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-4 pb-4 border-b border-gray-200">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Heart className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium">Received donation of ₹500</p>
                    <p className="text-gray-600 text-sm">From anonymous donor</p>
                    <p className="text-gray-400 text-xs mt-1">2 days ago</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 pb-4 border-b border-gray-200">
                  <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Users className="h-6 w-6 text-success-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium">New donor connected</p>
                    <p className="text-gray-600 text-sm">John Smith joined our community</p>
                    <p className="text-gray-400 text-xs mt-1">1 week ago</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-warning-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Star className="h-6 w-6 text-warning-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium">Completed project milestone</p>
                    <p className="text-gray-600 text-sm">Education program reached 100 children</p>
                    <p className="text-gray-400 text-xs mt-1">2 weeks ago</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Share Your NGO */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Share this NGO</h3>
              <p className="text-sm text-gray-600 mb-4">
                Help us reach more donors by sharing this NGO profile
              </p>
              <div className="flex gap-2">
                <button className="flex-1 btn-outline py-2 text-sm">Share</button>
                <button className="flex-1 btn-outline py-2 text-sm">Copy Link</button>
              </div>
            </div>

          </div>
        </div>

        {/* Contact Information - Full Width Bottom */}
        <div className="mt-6">
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Address</p>
                  <p className="text-sm text-gray-600">{ngo.address}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Phone</p>
                  <p className="text-sm text-gray-600">{ngo.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Email</p>
                  <p className="text-sm text-gray-600">{ngo.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Globe className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Website</p>
                  <a 
                    href={`https://${ngo?.name?.toLowerCase().replace(/\s+/g, '') || 'website'}.org`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary-600 hover:underline"
                  >
                    {ngo?.name?.toLowerCase().replace(/\s+/g, '') || 'website'}.org
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Donation Modal */}
        {showDonationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="relative bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <button
                  onClick={() => {
                    setShowDonationModal(false);
                    setDonationPreset(null);
                  }}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
              >
                <X className="h-6 w-6" />
              </button>
              <div className="p-6">
                <DonationForm
                  ngoId={ngo?.id || ''}
                  ngoName={ngo?.name || 'Unknown NGO'}
                    initialData={donationPreset || undefined}
                  onSuccess={() => {
                    setShowDonationModal(false);
                      setDonationPreset(null);
                  }}
                    onCancel={() => {
                      setShowDonationModal(false);
                      setDonationPreset(null);
                    }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NGODetail;