import {
    ArrowLeft,
    Award,
    Calendar,
    CheckCircle,
    DollarSign,
    Globe,
    Heart,
    ImageIcon,
    Mail,
    MapPin,
    Phone,
    Star,
    Target,
    Users
} from 'lucide-react';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const DemoNGODashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalDonations: 45,
    totalAmount: 8500,
    connectedUsers: 25,
    thisMonth: 12,
  });

  const [isEditing, setIsEditing] = useState<{[key: string]: boolean}>({});
  const [editValues, setEditValues] = useState<{[key: string]: any}>({
    name: "Save the Children",
    description: "Working to improve the lives of children through better education, health care, and economic opportunities.",
    about: "Working to improve the lives of children through better education, health care, and economic opportunities. We are committed to making a lasting difference in the communities we serve. Through our various programs and initiatives, we work tirelessly to create positive change and improve lives. Our dedicated team of volunteers and staff members ensure that every donation makes a meaningful impact.",
    address: "123 Charity St, New York, NY 10001",
    phone: "+1 (555) 123-4567",
    email: "info@savethechildren.org",
    website: "https://savethechildren.org",
    gallery: [
      { id: 1, title: 'Community Outreach Program', url: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=400' },
      { id: 2, title: 'Education Initiative', url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400' },
      { id: 3, title: 'Food Distribution Drive', url: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400' },
      { id: 4, title: 'Healthcare Camp', url: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=400' },
    ],
    requirements: [
      {
        id: 1,
        title: 'Education Materials',
        priority: 'Urgent',
        description: 'Need school supplies, books, and educational materials for 100 children.',
        goal: 5000
      },
      {
        id: 2,
        title: 'Food Supplies',
        priority: 'High Priority',
        description: 'Monthly food supplies for 50 families in need.',
        goal: 3000
      }
    ]
  });

  const toggleEdit = (section: string) => {
    setIsEditing(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleSave = (section: string, value: any) => {
    setEditValues(prev => ({
      ...prev,
      [section]: value
    }));
    setIsEditing(prev => ({
      ...prev,
      [section]: false
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-full mx-auto" style={{paddingLeft: '10%', paddingRight: '10%', paddingTop: '2%', paddingBottom: '2%'}}>
        {/* Back Button */}
        <Link 
          to="/demo-donor-dashboard" 
          className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          View Donor Dashboard UI
        </Link>

        {/* NGO Header */}
        <div className="card mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {isEditing.name ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editValues.name}
                      onChange={(e) => setEditValues(prev => ({...prev, name: e.target.value}))}
                      className="text-3xl font-bold text-gray-900 bg-white border border-primary-300 rounded px-2 py-1"
                    />
                    <button
                      onClick={() => handleSave('name', editValues.name)}
                      className="text-green-600 hover:text-green-700"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => setIsEditing(prev => ({...prev, name: false}))}
                      className="text-red-600 hover:text-red-700"
                    >
                      ✗
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-bold text-gray-900">{editValues.name}</h1>
                    <button
                      onClick={() => toggleEdit('name')}
                      className="text-gray-400 hover:text-gray-600 text-sm"
                    >
                      ✏️
                    </button>
                  </div>
                )}
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  <Star className="h-4 w-4 mr-1" />
                  Verified
                </span>
              </div>
              {isEditing.description ? (
                <div className="flex items-start gap-2">
                  <textarea
                    value={editValues.description}
                    onChange={(e) => setEditValues(prev => ({...prev, description: e.target.value}))}
                    className="text-gray-600 text-lg bg-white border border-primary-300 rounded px-2 py-1 w-full"
                    rows={2}
                  />
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleSave('description', editValues.description)}
                      className="text-green-600 hover:text-green-700"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => setIsEditing(prev => ({...prev, description: false}))}
                      className="text-red-600 hover:text-red-700"
                    >
                      ✗
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <p className="text-gray-600 text-lg">{editValues.description}</p>
                  <button
                    onClick={() => toggleEdit('description')}
                    className="text-gray-400 hover:text-gray-600 text-sm mt-1"
                  >
                    ✏️
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl text-white relative group p-6">
              <div className="flex items-center gap-3">
                <Heart className="h-5 w-5" />
                <div>
                  <p className="text-blue-100 text-xs">Total Donations</p>
                  <p className="text-xl font-bold">{stats.totalDonations}+</p>
                </div>
              </div>
              <button
                onClick={() => {
                  const newValue = prompt("Enter new total donations:", stats.totalDonations.toString());
                  if (newValue && !isNaN(Number(newValue))) {
                    setStats(prev => ({...prev, totalDonations: Number(newValue)}));
                  }
                }}
                className="absolute top-1 right-1 text-blue-200 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity text-xs"
              >
                ✏️
              </button>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl text-white relative group p-6">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5" />
                <div>
                  <p className="text-purple-100 text-xs">Active Donors</p>
                  <p className="text-xl font-bold">{stats.connectedUsers}+</p>
                </div>
              </div>
              <button
                onClick={() => {
                  const newValue = prompt("Enter new active donors:", stats.connectedUsers.toString());
                  if (newValue && !isNaN(Number(newValue))) {
                    setStats(prev => ({...prev, connectedUsers: Number(newValue)}));
                  }
                }}
                className="absolute top-1 right-1 text-purple-200 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity text-xs"
              >
                ✏️
              </button>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl text-white relative group p-6">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5" />
                <div>
                  <p className="text-green-100 text-xs">Total Raised</p>
                  <p className="text-xl font-bold">
                    ₹{Math.floor(stats.totalAmount / 1000)}K+
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  const newValue = prompt("Enter new total raised:", stats.totalAmount.toString());
                  if (newValue && !isNaN(Number(newValue))) {
                    setStats(prev => ({...prev, totalAmount: Number(newValue)}));
                  }
                }}
                className="absolute top-1 right-1 text-green-200 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity text-xs"
              >
                ✏️
              </button>
            </div>
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl text-white relative group p-6">
              <div className="flex items-center gap-3">
                <Star className="h-5 w-5" />
                <div>
                  <p className="text-orange-100 text-xs">Rating</p>
                  <p className="text-xl font-bold">4.8</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <button className="btn-primary flex-1">
              <Heart className="h-5 w-5 mr-2" />
              Edit Profile
            </button>
            <button className="btn-outline flex-1">
              <Users className="h-5 w-5 mr-2" />
              Manage Donors
            </button>
          </div>
        </div>

        {/* About Section - Full Width */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold text-gray-900">About</h2>
            <button
              onClick={() => toggleEdit('about')}
              className="text-gray-400 hover:text-gray-600 text-sm"
            >
              ✏️ Edit
            </button>
          </div>
          {isEditing.about ? (
            <div className="space-y-3">
              <textarea
                value={editValues.about}
                onChange={(e) => setEditValues(prev => ({...prev, about: e.target.value}))}
                className="text-gray-600 leading-relaxed bg-white border border-primary-300 rounded px-3 py-2 w-full"
                rows={4}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleSave('about', editValues.about)}
                  className="text-green-600 hover:text-green-700 text-sm"
                >
                  ✓ Save
                </button>
                <button
                  onClick={() => setIsEditing(prev => ({...prev, about: false}))}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  ✗ Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-gray-600 leading-relaxed mb-3">
                {editValues.description}
              </p>
              <p className="text-gray-600 leading-relaxed">
                {editValues.about}
              </p>
            </div>
          )}
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
                <button 
                  onClick={() => toggleEdit('gallery')}
                  className="text-gray-400 hover:text-gray-600 text-sm"
                >
                  ✏️ Edit
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {editValues.gallery.map((image: any) => (
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
                <button 
                  onClick={() => toggleEdit('workDone')}
                  className="text-gray-400 hover:text-gray-600 text-sm"
                >
                  ✏️ Edit
                </button>
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
                <button 
                  onClick={() => toggleEdit('awards')}
                  className="text-gray-400 hover:text-gray-600 text-sm"
                >
                  ✏️ Edit
                </button>
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
                <button 
                  onClick={() => toggleEdit('requirements')}
                  className="text-gray-400 hover:text-gray-600 text-sm"
                >
                  ✏️ Edit
                </button>
              </div>
              <div className="space-y-3">
                {editValues.requirements.map((req: any) => (
                  <div key={req.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{req.title}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        req.priority === 'Urgent' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {req.priority}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">
                      {req.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Goal: ₹{req.goal.toLocaleString('en-IN')}
                      </span>
                      <button className="btn-primary text-sm py-1 px-4">
                        Edit
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
                <button 
                  onClick={() => toggleEdit('futurePlans')}
                  className="text-gray-400 hover:text-gray-600 text-sm"
                >
                  ✏️ Edit
                </button>
              </div>
              <div className="space-y-3">
                {[
                  {
                    title: 'Expansion to Rural Areas',
                    year: '2024',
                    description: 'Expand education program to 20 additional rural schools, reaching 1,000 more children.',
                    target: 'Q4 2024',
                    funding: '₹75,000',
                    icon: '🌾',
                    color: 'blue'
                  },
                  {
                    title: 'Mobile Healthcare Units',
                    year: '2024',
                    description: 'Launch 3 mobile healthcare units to provide medical services in remote areas.',
                    target: 'Q2 2024',
                    funding: '₹120,000',
                    icon: '🚐',
                    color: 'purple'
                  },
                  {
                    title: 'Women Empowerment Program',
                    year: '2024',
                    description: 'Establish training centers helping 500 women become financially independent.',
                    target: 'Q3 2024',
                    funding: '₹50,000',
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
                <button 
                  onClick={() => toggleEdit('activities')}
                  className="text-gray-400 hover:text-gray-600 text-sm"
                >
                  ✏️ Edit
                </button>
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
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Share Your NGO</h3>
              <p className="text-sm text-gray-600 mb-4">
                Help us reach more donors by sharing your NGO profile
              </p>
              <div className="flex gap-2">
                <button className="flex-1 btn-outline py-2 text-sm">Share</button>
                <button className="flex-1 btn-outline py-2 text-sm">Copy Link</button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card bg-gradient-to-br from-primary-500 to-secondary-500">
              <h3 className="text-xl font-semibold text-white mb-3">Quick Actions</h3>
              <p className="text-primary-100 text-sm mb-3">
                Manage your NGO profile and requirements.
              </p>
              <div className="space-y-2">
                <button className="w-full bg-white text-primary-600 font-semibold py-2 px-4 rounded-lg hover:bg-gray-100 transition">
                  Edit Profile
                </button>
                <button className="w-full bg-white text-primary-600 font-semibold py-2 px-4 rounded-lg hover:bg-gray-100 transition">
                  Add Requirement
                </button>
                <button className="w-full bg-white text-primary-600 font-semibold py-2 px-4 rounded-lg hover:bg-gray-100 transition">
                  Update Gallery
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information - Full Width Bottom */}
        <div className="mt-6">
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold text-gray-900">Contact Information</h2>
              <button
                onClick={() => toggleEdit('contact')}
                className="text-gray-400 hover:text-gray-600 text-sm"
              >
                ✏️ Edit
              </button>
            </div>
            {isEditing.contact ? (
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 mb-1">Address</p>
                    <input
                      type="text"
                      value={editValues.address}
                      onChange={(e) => setEditValues(prev => ({...prev, address: e.target.value}))}
                      className="text-sm text-gray-600 bg-white border border-primary-300 rounded px-2 py-1 w-full"
                    />
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 mb-1">Phone</p>
                    <input
                      type="text"
                      value={editValues.phone}
                      onChange={(e) => setEditValues(prev => ({...prev, phone: e.target.value}))}
                      className="text-sm text-gray-600 bg-white border border-primary-300 rounded px-2 py-1 w-full"
                    />
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 mb-1">Email</p>
                    <input
                      type="email"
                      value={editValues.email}
                      onChange={(e) => setEditValues(prev => ({...prev, email: e.target.value}))}
                      className="text-sm text-gray-600 bg-white border border-primary-300 rounded px-2 py-1 w-full"
                    />
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Globe className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 mb-1">Website</p>
                    <input
                      type="url"
                      value={editValues.website}
                      onChange={(e) => setEditValues(prev => ({...prev, website: e.target.value}))}
                      className="text-sm text-gray-600 bg-white border border-primary-300 rounded px-2 py-1 w-full"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleSave('contact', editValues)}
                    className="text-green-600 hover:text-green-700 text-sm"
                  >
                    ✓ Save
                  </button>
                  <button
                    onClick={() => setIsEditing(prev => ({...prev, contact: false}))}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    ✗ Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Address</p>
                    <p className="text-sm text-gray-600">{editValues.address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Phone</p>
                    <p className="text-sm text-gray-600">{editValues.phone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Email</p>
                    <p className="text-sm text-gray-600">{editValues.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Globe className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Website</p>
                    <a 
                      href={editValues.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary-600 hover:underline"
                    >
                      {editValues.website.replace('https://', '')}
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoNGODashboard;
