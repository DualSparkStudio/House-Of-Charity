import { ArrowLeft, Heart, Pencil, Star, Users, X } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiService } from '../api/database';
import DonationForm from '../components/DonationForm';
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
  const { userProfile, connections, addConnection, removeConnection, updateProfile } = useAuth();
  const [ngo, setNgo] = useState<NGO | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [donationPreset, setDonationPreset] = useState<DonationPreset | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  type EditableFields = {
    name: string;
    description: string;
    about: string;
    works_done: string;
    current_requirements: string;
    future_plans: string;
    awards_and_recognition: string;
    recent_activities: string;
    gallery: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
    website: string;
  };

  const getEditableFromSource = (source: Partial<NGO> | null): EditableFields => ({
    name: source?.name ?? '',
    description: source?.description ?? '',
    about: source?.about ?? '',
    works_done: source?.works_done ?? '',
    current_requirements: source?.current_requirements ?? '',
    future_plans: source?.future_plans ?? '',
    awards_and_recognition: source?.awards_and_recognition ?? '',
    recent_activities: source?.recent_activities ?? '',
    gallery: source?.gallery ?? '',
    phone: source?.phone ?? '',
    address: source?.address ?? '',
    city: source?.city ?? '',
    state: source?.state ?? '',
    country: source?.country ?? '',
    pincode: source?.pincode ?? '',
    website: source?.website ?? '',
  });

  const [editableValues, setEditableValues] = useState<EditableFields>(getEditableFromSource(null));

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

  useEffect(() => {
    setEditableValues(getEditableFromSource(ngo));
  }, [ngo]);

  const handleFieldChange = (
    field: keyof EditableFields,
    value: string
  ) => {
    setEditableValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const splitLines = (value?: string | null) =>
    (value || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

  const parseGalleryItems = (value?: string | null) =>
    splitLines(value).map((line) => {
      const [url, caption] = line.split('|');
      return {
        url: url?.trim(),
        caption: caption?.trim() || '',
      };
    });

  const renderList = (items: string[], emptyMessage: string) =>
    items.length ? (
      <ul className="space-y-2 list-disc list-inside text-gray-700">
        {items.map((item, index) => (
          <li key={`${item}-${index}`} className="leading-relaxed">
            {item}
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-gray-500 text-sm">{emptyMessage}</p>
    );

  const toNullable = (value: string) => {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  };

  const handleCancelEdit = () => {
    setEditableValues(getEditableFromSource(ngo));
    setIsEditingProfile(false);
  };

  const handleSaveProfile = async () => {
    if (!isOwner || !ngo) return;

    const nameValue = editableValues.name.trim() || ngo.name || 'Untitled NGO';

    const payload: Partial<NGO> = {
      name: nameValue,
      description: toNullable(editableValues.description) ?? '',
      about: toNullable(editableValues.about),
      works_done: toNullable(editableValues.works_done),
      current_requirements: toNullable(editableValues.current_requirements),
      future_plans: toNullable(editableValues.future_plans),
      awards_and_recognition: toNullable(editableValues.awards_and_recognition),
      recent_activities: toNullable(editableValues.recent_activities),
      gallery: toNullable(editableValues.gallery),
      phone: toNullable(editableValues.phone),
      address: toNullable(editableValues.address),
      city: toNullable(editableValues.city),
      state: toNullable(editableValues.state),
      country: toNullable(editableValues.country),
      pincode: toNullable(editableValues.pincode),
      website: toNullable(editableValues.website),
    };

    setIsSavingProfile(true);
    try {
      await updateProfile(payload);
      setNgo((previous) =>
        previous
          ? ({
              ...previous,
              ...payload,
              name: nameValue,
              description:
                payload.description !== undefined
                  ? payload.description
                  : previous.description,
            } as NGO)
          : previous
      );
      toast.success('Profile updated successfully');
      setIsEditingProfile(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error?.message || 'Unable to save profile changes.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCopyProfileLink = async () => {
    try {
      if (typeof window !== 'undefined') {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Profile link copied to clipboard');
      }
    } catch (error) {
      console.error('Copy link error:', error);
      toast.error('Unable to copy link.');
    }
  };

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

  const viewValues = isEditingProfile ? editableValues : getEditableFromSource(ngo);
  const galleryItems = parseGalleryItems(viewValues.gallery);
  const workDoneItems = splitLines(viewValues.works_done);
  const requirementItems = splitLines(viewValues.current_requirements);
  const futurePlanItems = splitLines(viewValues.future_plans);
  const awardsItems = splitLines(viewValues.awards_and_recognition);
  const recentActivityItems = splitLines(viewValues.recent_activities);

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
          <div className="flex items-center gap-3 mb-4">
            {isEditingProfile ? (
              <input
                value={editableValues.name}
                onChange={(event) => handleFieldChange('name', event.target.value)}
                className="input-field text-2xl font-semibold text-gray-900"
                placeholder="Organisation name"
              />
            ) : (
              <h1 className="text-3xl font-bold text-gray-900">
                {ngo.name || 'Untitled Organisation'}
              </h1>
            )}
            {ngo.verified && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <Star className="h-4 w-4 mr-1" />
                Verified
              </span>
            )}
          </div>
          {isEditingProfile ? (
            <input
              value={editableValues.description}
              onChange={(event) => handleFieldChange('description', event.target.value)}
              className="input-field"
              placeholder="Short tagline or mission"
            />
          ) : (
            <p className="text-gray-600 text-lg">
              {ngo.description || 'Share a short tagline to tell donors what you do.'}
            </p>
          )}
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
            isEditingProfile ? (
              <>
                <button
                  className="btn-primary flex-1"
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile}
                >
                  {isSavingProfile ? 'Saving…' : 'Save Changes'}
                </button>
                <button
                  className="btn-outline flex-1"
                  onClick={handleCancelEdit}
                  disabled={isSavingProfile}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                className="btn-primary flex-1"
                onClick={() => setIsEditingProfile(true)}
              >
                <Pencil className="h-5 w-5 mr-2" />
                Edit Profile
              </button>
            )
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

        {/* About */}
        <div className="card mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">About</h2>
          {isEditingProfile ? (
            <textarea
              className="input-field min-h-[150px]"
              value={editableValues.about}
              onChange={(event) => handleFieldChange('about', event.target.value)}
              placeholder="Share your mission, story, and the impact you create."
            />
          ) : (
            <p className="text-gray-600 whitespace-pre-line leading-relaxed">
              {viewValues.about || ngo.description || 'Share your mission, story, and the impact you create.'}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Gallery</h2>
                  <p className="text-sm text-gray-500">Showcase your work</p>
                </div>
                {isEditingProfile && (
                  <span className="text-xs text-gray-400">
                    Add one entry per line as "image-url | caption".
                  </span>
                )}
              </div>
              {isEditingProfile && (
                <textarea
                  className="input-field min-h-[120px] mb-4"
                  value={editableValues.gallery}
                  onChange={(event) => handleFieldChange('gallery', event.target.value)}
                  placeholder="https://example.org/photo.jpg | Caption"
                />
              )}
              {galleryItems.length ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {galleryItems.map((item, index) =>
                    item.url && /^https?:\/\//i.test(item.url) ? (
                      <div
                        key={`${item.url}-${index}`}
                        className="relative overflow-hidden rounded-xl aspect-video bg-gray-200"
                      >
                        <img
                          src={item.url}
                          alt={item.caption || `Gallery item ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {item.caption && (
                          <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-xs px-3 py-2">
                            {item.caption}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        key={`${item.url}-${index}`}
                        className="border border-dashed border-gray-300 rounded-lg p-4 text-sm text-gray-500"
                      >
                        {item.url || item.caption}
                      </div>
                    )
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">
                  {isEditingProfile
                    ? 'Add links to photos to create a gallery.'
                    : 'No gallery items yet.'}
                </p>
              )}
            </div>

            <div className="card">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Work Done</h2>
                  <p className="text-sm text-gray-500">Completed initiatives and impact</p>
                </div>
              </div>
              {isEditingProfile ? (
                <textarea
                  className="input-field min-h-[150px]"
                  value={editableValues.works_done}
                  onChange={(event) => handleFieldChange('works_done', event.target.value)}
                  placeholder="List completed initiatives. Use one line per achievement."
                />
              ) : (
                renderList(workDoneItems, 'Share your completed initiatives to inspire donors.')
              )}
            </div>

            <div className="card">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Awards & Recognition</h2>
                  <p className="text-sm text-gray-500">Highlight your milestones</p>
                </div>
              </div>
              {isEditingProfile ? (
                <textarea
                  className="input-field min-h-[150px]"
                  value={editableValues.awards_and_recognition}
                  onChange={(event) => handleFieldChange('awards_and_recognition', event.target.value)}
                  placeholder="List awards or recognitions. Use one line per entry."
                />
              ) : (
                renderList(awardsItems, 'Add awards and recognitions to build trust.')
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="card">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Current Requirements</h2>
                  <p className="text-sm text-gray-500">Let donors know how they can help right now</p>
                </div>
              </div>
              {isEditingProfile ? (
                <textarea
                  className="input-field min-h-[150px]"
                  value={editableValues.current_requirements}
                  onChange={(event) => handleFieldChange('current_requirements', event.target.value)}
                  placeholder="List current requirements. Use one line per need."
                />
              ) : (
                renderList(requirementItems, 'Add your current requirements so donors can respond.')
              )}
            </div>

            <div className="card">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Future Plans</h2>
                  <p className="text-sm text-gray-500">Share what is coming next</p>
                </div>
              </div>
              {isEditingProfile ? (
                <textarea
                  className="input-field min-h-[150px]"
                  value={editableValues.future_plans}
                  onChange={(event) => handleFieldChange('future_plans', event.target.value)}
                  placeholder="Describe future plans or campaigns. Use one line per plan."
                />
              ) : (
                renderList(futurePlanItems, 'Describe your future plans to keep donors engaged.')
              )}
            </div>

            <div className="card">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Recent Activities</h2>
                  <p className="text-sm text-gray-500">Keep supporters updated</p>
                </div>
              </div>
              {isEditingProfile ? (
                <textarea
                  className="input-field min-h-[150px]"
                  value={editableValues.recent_activities}
                  onChange={(event) => handleFieldChange('recent_activities', event.target.value)}
                  placeholder="Summarize recent activities or news. Use one line per update."
                />
              ) : (
                renderList(recentActivityItems, 'Share recent activities to show ongoing impact.')
              )}
            </div>
          </div>
        </div>

        <div className="card mt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-900 mb-1">Address</p>
              {isEditingProfile ? (
                <textarea
                  className="input-field"
                  value={editableValues.address}
                  onChange={(event) => handleFieldChange('address', event.target.value)}
                  placeholder="Street, area, and other details"
                />
              ) : (
                <p className="text-gray-600">
                  {viewValues.address || 'No address provided.'}
                </p>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-900 mb-1">City</p>
                {isEditingProfile ? (
                  <input
                    className="input-field"
                    value={editableValues.city}
                    onChange={(event) => handleFieldChange('city', event.target.value)}
                    placeholder="City"
                  />
                ) : (
                  <p className="text-gray-600">{viewValues.city || '—'}</p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 mb-1">State / Region</p>
                {isEditingProfile ? (
                  <input
                    className="input-field"
                    value={editableValues.state}
                    onChange={(event) => handleFieldChange('state', event.target.value)}
                    placeholder="State or region"
                  />
                ) : (
                  <p className="text-gray-600">{viewValues.state || '—'}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-900 mb-1">Country</p>
                {isEditingProfile ? (
                  <input
                    className="input-field"
                    value={editableValues.country}
                    onChange={(event) => handleFieldChange('country', event.target.value)}
                    placeholder="Country"
                  />
                ) : (
                  <p className="text-gray-600">{viewValues.country || '—'}</p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 mb-1">Postal Code</p>
                {isEditingProfile ? (
                  <input
                    className="input-field"
                    value={editableValues.pincode}
                    onChange={(event) => handleFieldChange('pincode', event.target.value)}
                    placeholder="Postal code"
                  />
                ) : (
                  <p className="text-gray-600">{viewValues.pincode || '—'}</p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 mb-1">Phone</p>
                {isEditingProfile ? (
                  <input
                    className="input-field"
                    value={editableValues.phone}
                    onChange={(event) => handleFieldChange('phone', event.target.value)}
                    placeholder="Phone number"
                  />
                ) : (
                  <p className="text-gray-600">{viewValues.phone || '—'}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-900 mb-1">Email</p>
                <p className="text-gray-600">{ngo.email || '—'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 mb-1">Website</p>
                {isEditingProfile ? (
                  <input
                    className="input-field"
                    value={editableValues.website}
                    onChange={(event) => handleFieldChange('website', event.target.value)}
                    placeholder="https://example.org"
                  />
                ) : viewValues.website ? (
                  <a
                    href={/^https?:\/\//i.test(viewValues.website) ? viewValues.website : `https://${viewValues.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:underline"
                  >
                    {viewValues.website}
                  </a>
                ) : (
                  <p className="text-gray-600">No website provided.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="card mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Share this NGO</h3>
          <p className="text-sm text-gray-600 mb-4">
            Help us reach more donors by sharing this profile.
          </p>
          <div className="flex gap-2">
            <button className="flex-1 btn-outline py-2 text-sm" onClick={handleCopyProfileLink}>
              Copy Link
            </button>
            <button
              className="flex-1 btn-outline py-2 text-sm"
              onClick={() => {
                if (typeof navigator !== 'undefined' && 'share' in navigator) {
                  (navigator as any)
                    .share({
                      title: ngo.name || 'House of Charity NGO',
                      text: 'Support this NGO on House of Charity',
                      url:
                        typeof window !== 'undefined'
                          ? window.location.href
                          : '',
                    })
                    .catch(() => {});
                } else {
                  handleCopyProfileLink();
                }
              }}
            >
              Share
            </button>

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