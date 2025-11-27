import { Heart, IndianRupee, Package, Users, Mail, Clock, CheckCircle, XCircle, AlertCircle, Utensils, ShoppingBag, DollarSign, MapPin, Eye, Check, X, Loader2, RefreshCw } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../api/database';
import { useAuth } from '../contexts/AuthContext';
import { Donation } from '../types';

const Donations: React.FC = () => {
  const { userProfile, loading } = useAuth();
  const navigate = useNavigate();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);

  useEffect(() => {
    const loadDonations = async () => {
      if (loading) {
        return;
      }

      if (!userProfile) {
        navigate('/login');
        return;
      }

      setPageLoading(true);
      try {
        const response =
          userProfile.user_type === 'donor'
            ? await apiService.getDonationsByDonor(userProfile.id)
            : await apiService.getDonationsByNGO(userProfile.id);

        const list: Donation[] = (response?.donations || []).sort(
          (a: Donation, b: Donation) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setDonations(list);
      } catch (error: any) {
        console.error('Failed to load donations', error);
        toast.error(error?.message || 'Unable to load donations right now.');
        setDonations([]);
      } finally {
        setPageLoading(false);
      }
    };

    loadDonations();
  }, [loading, userProfile, navigate]);

  const isDonor = userProfile?.user_type === 'donor';

  const formatCurrency = useMemo(
    () =>
      new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }),
    []
  );

  const totalAmount = useMemo(() => {
    return donations
      .filter((donation) => donation.donation_type === 'money')
      .reduce((sum, donation) => sum + Number(donation.amount || 0), 0);
  }, [donations]);

  const handleViewDonation = (donation: Donation) => {
    setSelectedDonation(donation);
  };

  const handleAcceptDonation = async (donationId: string) => {
    if (!window.confirm('Are you sure you want to accept this donation?')) {
      return;
    }

    setProcessingStatus(donationId);
    try {
      await apiService.updateDonationStatus(donationId, 'confirmed');
      toast.success('Donation accepted successfully!');
      
      // Update local state
      setDonations((prev) =>
        prev.map((donation) =>
          donation.id === donationId
            ? { ...donation, status: 'confirmed' }
            : donation
        )
      );
      
      if (selectedDonation?.id === donationId) {
        setSelectedDonation((prev) => prev ? { ...prev, status: 'confirmed' } : null);
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to accept donation');
    } finally {
      setProcessingStatus(null);
    }
  };

  const handleRejectDonation = async (donationId: string) => {
    if (!window.confirm('Are you sure you want to reject this donation?')) {
      return;
    }

    setProcessingStatus(donationId);
    try {
      await apiService.updateDonationStatus(donationId, 'cancelled');
      toast.success('Donation rejected');
      
      // Update local state
      setDonations((prev) =>
        prev.map((donation) =>
          donation.id === donationId
            ? { ...donation, status: 'cancelled' }
            : donation
        )
      );
      
      if (selectedDonation?.id === donationId) {
        setSelectedDonation((prev) => prev ? { ...prev, status: 'cancelled' } : null);
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to reject donation');
    } finally {
      setProcessingStatus(null);
    }
  };

  const handleRequestAgain = async (donationId: string) => {
    if (!window.confirm('Send a request to the donor to fulfill this donation again with a new delivery date?')) {
      return;
    }

    if (!userProfile) {
      toast.error('User profile not found');
      return;
    }

    setProcessingStatus(donationId);
    try {
      const response = await apiService.requestDonationAgain(donationId);
      toast.success('Request sent to donor successfully!');
      
      // Reload donations to get updated data
      const donationsResponse = userProfile.user_type === 'donor'
        ? await apiService.getDonationsByDonor(userProfile.id)
        : await apiService.getDonationsByNGO(userProfile.id);

      const list: Donation[] = (donationsResponse?.donations || []).sort(
        (a: Donation, b: Donation) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setDonations(list);
      
      // Update selected donation if it's the one we just updated
      if (selectedDonation?.id === donationId && response.donation) {
        setSelectedDonation(response.donation);
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to send request');
    } finally {
      setProcessingStatus(null);
    }
  };

  // Check if donation is eligible for "Request Again"
  const canRequestAgain = (donation: Donation) => {
    if (isDonor) return false; // Only NGOs can request again
    if (donation.status === 'completed' || donation.status === 'cancelled') return false;
    if (!donation.delivery_date) return false;
    
    const deliveryDate = new Date(donation.delivery_date);
    const now = new Date();
    return deliveryDate < now; // Delivery date has passed
  };

  if (loading || pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading donations...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="btn-outline inline-flex items-center mb-6"
        >
          Back to Dashboard
        </button>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {isDonor ? 'My Donations' : 'Donations Received'}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-2">
              {isDonor
                ? "Track every contribution you've made and revisit the NGOs you support."
                : "View all contributions made to your organization and plan follow-ups with donors."}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-1 flex self-start md:self-auto">
            {(['all', 'completed', 'pending'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition ${
                  statusFilter === status
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg">
                <Heart className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Donations</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{donations.length}</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-success-100 dark:bg-success-900 rounded-lg">
                <IndianRupee className="h-6 w-6 text-success-600 dark:text-success-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency.format(totalAmount)}
                </p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-secondary-100 rounded-lg">
                <Users className="h-6 w-6 text-secondary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {isDonor ? 'NGOs Supported' : 'Donors Connected'}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {new Set(
                    donations.map((donation) =>
                      isDonor ? donation.ngo_id : donation.donor_id
                    )
                  ).size}
                </p>
              </div>
            </div>
          </div>
        </div>

        {donations.length > 0 ? (
          <div className="card overflow-hidden p-0 shadow-sm">
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b-2 border-gray-300 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-[200px]">
                      {isDonor ? 'NGO' : 'Donor'}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-[140px]">
                      Type
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-[130px]">
                      Amount/Quantity
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-[100px]">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-[130px]">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-[110px]">
                      Delivery
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider min-w-[250px]">
                      Message
                    </th>
                    {!isDonor && (
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-[140px] sticky right-0 bg-gray-50 dark:bg-gray-800 z-10">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {donations
              .filter((donation) => {
                if (statusFilter === 'all') return true;
                return donation.status === statusFilter;
              })
              .map((donation) => {
              const isMoney = donation.donation_type === 'money';
              const amountLabel = isMoney
                ? formatCurrency.format(Number(donation.amount || 0))
                : `${donation.quantity ?? '-'} ${donation.unit ?? ''}`.trim();
                      
                      const getTypeIcon = () => {
                        if (isMoney) return <DollarSign className="h-4 w-4 text-green-600" />;
                        if (donation.donation_type === 'food') return <Utensils className="h-4 w-4 text-orange-600" />;
                        return <ShoppingBag className="h-4 w-4 text-blue-600" />;
                      };

                      const getTypeLabel = () => {
                        if (isMoney) return 'Money';
                        if (donation.donation_type === 'food') return 'Food';
                        return 'Essentials';
                      };

                      const getStatusBadge = () => {
                        const status = donation.status?.toLowerCase() || 'pending';
                        if (status === 'completed') {
                          return (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="h-3.5 w-3.5" />
                              Completed
                            </span>
                          );
                        }
                        if (status === 'confirmed') {
                          return (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              <CheckCircle className="h-3.5 w-3.5" />
                              Confirmed
                            </span>
                          );
                        }
                        if (status === 'cancelled' || status === 'failed') {
                          return (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <XCircle className="h-3.5 w-3.5" />
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </span>
                          );
                        }
                        return (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <AlertCircle className="h-3.5 w-3.5" />
                            Pending
                          </span>
                        );
                      };

                      const canModify = !isDonor && (donation.status === 'pending' || donation.status === 'confirmed');

                return (
                        <tr key={donation.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center min-w-0">
                              <div className="flex-shrink-0 h-10 w-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                                <Users className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                              </div>
                              <div className="ml-3 min-w-0 flex-1">
                                <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {isDonor
                            ? donation.ngo_name || 'NGO'
                            : donation.donor_name || donation.display_name || 'Donor'}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5 truncate">
                                  <Mail className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">
                          {isDonor
                                      ? donation.ngo_email || 'No email'
                                      : donation.donor_email || 'No email'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                {getTypeIcon()}
                                <span className="text-sm font-medium text-gray-900 dark:text-white">{getTypeLabel()}</span>
                              </div>
                              {donation.essential_type && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate max-w-[120px]" title={donation.essential_type}>
                                  {donation.essential_type}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex flex-col items-end">
                              {isMoney ? (
                                <div className="text-sm font-bold text-gray-900 dark:text-white">{amountLabel}</div>
                              ) : (
                                <>
                                  <div className="text-sm font-bold text-gray-900 dark:text-white">
                                    {donation.quantity ?? '-'} {donation.unit ?? ''}
                                  </div>
                                  {donation.amount && Number(donation.amount) > 0 && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                      {formatCurrency.format(Number(donation.amount))}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {getStatusBadge()}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {new Date(donation.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                                <Clock className="h-3 w-3" />
                                {new Date(donation.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                          </td>
                          <td className="px-6 py-4">
                            {donation.delivery_date ? (
                              <div className="text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                                <MapPin className="h-4 w-4 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                                <span>{new Date(donation.delivery_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400 dark:text-gray-500">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-600 dark:text-gray-300 max-w-[300px] truncate" title={donation.message || ''}>
                              {donation.message || <span className="text-gray-400 dark:text-gray-500 italic">No message</span>}
                            </div>
                          </td>
                          {!isDonor && (
                            <td className="px-6 py-4 text-center sticky right-0 bg-white dark:bg-gray-800 z-10 border-l border-gray-200 dark:border-gray-700">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleViewDonation(donation)}
                                  className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                  title="View Details"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                {canModify && (
                                  <>
                                    <button
                                      onClick={() => handleAcceptDonation(donation.id)}
                                      disabled={processingStatus === donation.id}
                                      className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                      title="Accept"
                                    >
                                      {processingStatus === donation.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Check className="h-4 w-4" />
                                      )}
                                    </button>
                                    <button
                                      onClick={() => handleRejectDonation(donation.id)}
                                      disabled={processingStatus === donation.id}
                                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                      title="Reject"
                                    >
                                      {processingStatus === donation.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <X className="h-4 w-4" />
                                      )}
                                    </button>
                                  </>
                                )}
                                {canRequestAgain(donation) && (
                                  <button
                                    onClick={() => handleRequestAgain(donation.id)}
                                    disabled={processingStatus === donation.id}
                                    className="p-2 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Request Again"
                                  >
                                    {processingStatus === donation.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <RefreshCw className="h-4 w-4" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden divide-y divide-gray-200">
              {donations
                .filter((donation) => {
                  if (statusFilter === 'all') return true;
                  return donation.status === statusFilter;
                })
                .map((donation) => {
                  const isMoney = donation.donation_type === 'money';
                  const amountLabel = isMoney
                    ? formatCurrency.format(Number(donation.amount || 0))
                    : `${donation.quantity ?? '-'} ${donation.unit ?? ''}`.trim();

                  const getTypeIcon = () => {
                    if (isMoney) return <DollarSign className="h-5 w-5 text-green-600" />;
                    if (donation.donation_type === 'food') return <Utensils className="h-5 w-5 text-orange-600" />;
                    return <ShoppingBag className="h-5 w-5 text-blue-600" />;
                  };

                  const getTypeLabel = () => {
                    if (isMoney) return 'Money';
                    if (donation.donation_type === 'food') return 'Food';
                    return 'Essentials';
                  };

                  const getStatusBadge = () => {
                    const status = donation.status?.toLowerCase() || 'pending';
                    if (status === 'completed') {
                      return (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="h-3.5 w-3.5" />
                          Completed
                        </span>
                      );
                    }
                    if (status === 'confirmed') {
                      return (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <CheckCircle className="h-3.5 w-3.5" />
                          Confirmed
                        </span>
                      );
                    }
                    if (status === 'cancelled' || status === 'failed') {
                      return (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <XCircle className="h-3.5 w-3.5" />
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                      </span>
                      );
                    }
                    return (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Pending
                      </span>
                    );
                  };

                  return (
                    <div key={donation.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-gray-900 truncate">
                              {isDonor
                                ? donation.ngo_name || 'NGO'
                                : donation.donor_name || donation.display_name || 'Donor'}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5 truncate">
                              <Mail className="h-3 w-3 flex-shrink-0" />
                              {isDonor
                                ? donation.ngo_email || 'No email'
                                : donation.donor_email || 'No email'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right ml-2">
                          <div className="text-lg font-bold text-gray-900">{amountLabel}</div>
                          {getStatusBadge()}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-3">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Type</div>
                          <div className="flex items-center gap-2">
                            {getTypeIcon()}
                            <span className="font-medium text-gray-900">{getTypeLabel()}</span>
                          </div>
                          {donation.essential_type && (
                            <div className="text-xs text-gray-500 mt-1">{donation.essential_type}</div>
                          )}
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Date</div>
                          <div className="text-gray-900 flex items-center gap-1.5">
                            <Clock className="h-4 w-4 text-gray-400" />
                            {new Date(donation.created_at).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {new Date(donation.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>

                      {donation.delivery_date && (
                        <div className="mb-3">
                          <div className="text-xs text-gray-500 mb-1">Delivery Date</div>
                          <div className="text-sm text-gray-900 flex items-center gap-1.5">
                            <MapPin className="h-4 w-4 text-primary-600" />
                            {new Date(donation.delivery_date).toLocaleDateString()}
                          </div>
                        </div>
                      )}

                      {donation.message && (
                        <div className="pt-3 border-t border-gray-100">
                          <div className="text-xs text-gray-500 mb-1">Message</div>
                          <div className="text-sm text-gray-600">{donation.message}</div>
                        </div>
                      )}

                      {!isDonor && (donation.status === 'pending' || donation.status === 'confirmed') && (
                        <div className="pt-3 border-t border-gray-100 flex gap-2">
                          <button
                            onClick={() => handleViewDonation(donation)}
                            className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </button>
                          <button
                            onClick={() => handleAcceptDonation(donation.id)}
                            disabled={processingStatus === donation.id}
                            className="flex-1 px-3 py-2 text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {processingStatus === donation.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Check className="h-4 w-4" />
                                Accept
                              </>
                      )}
                          </button>
                          <button
                            onClick={() => handleRejectDonation(donation.id)}
                            disabled={processingStatus === donation.id}
                            className="flex-1 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {processingStatus === donation.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <X className="h-4 w-4" />
                                Reject
                              </>
                            )}
                          </button>
                        </div>
                    )}
                  </div>
                );
              })}
            </div>

            {donations.filter((donation) => statusFilter === 'all' || donation.status === statusFilter).length === 0 && (
              <div className="p-12 text-center">
                <Package className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No donations found</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {statusFilter === 'pending'
                    ? 'No pending donations.'
                    : 'No completed donations yet.'}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="card text-center py-12">
            <Package className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No donations yet</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {isDonor
                ? 'Start supporting an NGO to see your donations listed here.'
                : 'As soon as donors contribute, the history will appear here.'}
            </p>
            <button
              onClick={() => navigate(isDonor ? '/ngos' : '/dashboard')}
              className="btn-primary"
            >
              {isDonor ? 'Browse NGOs' : 'Go to Dashboard'}
            </button>
          </div>
        )}

        {/* Donation Details Modal */}
        {selectedDonation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4 transition-colors">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4 flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Donation Details</h2>
                <button
                  onClick={() => setSelectedDonation(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Donor/NGO Info */}
                <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
                  <div className="h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center">
                    <Users className="h-8 w-8 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {isDonor
                        ? selectedDonation.ngo_name || 'NGO'
                        : selectedDonation.donor_name || selectedDonation.display_name || 'Donor'}
                    </h3>
                    <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                      <Mail className="h-4 w-4" />
                      {isDonor
                        ? selectedDonation.ngo_email || 'No email provided'
                        : selectedDonation.donor_email || 'No email provided'}
                    </p>
                  </div>
                </div>

                {/* Donation Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Type</label>
                    <div className="mt-1 flex items-center gap-2">
                      {selectedDonation.donation_type === 'money' ? (
                        <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                      ) : selectedDonation.donation_type === 'food' ? (
                        <Utensils className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      ) : (
                        <ShoppingBag className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      )}
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedDonation.donation_type === 'money'
                          ? 'Money'
                          : selectedDonation.donation_type === 'food'
                          ? 'Food'
                          : 'Essentials'}
                      </span>
                    </div>
                    {selectedDonation.essential_type && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{selectedDonation.essential_type}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</label>
                    <div className="mt-1">
                      {selectedDonation.status === 'completed' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="h-3.5 w-3.5" />
                          Completed
                        </span>
                      ) : selectedDonation.status === 'confirmed' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <CheckCircle className="h-3.5 w-3.5" />
                          Confirmed
                        </span>
                      ) : selectedDonation.status === 'cancelled' || selectedDonation.status === 'failed' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <XCircle className="h-3.5 w-3.5" />
                          {selectedDonation.status.charAt(0).toUpperCase() + selectedDonation.status.slice(1)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <AlertCircle className="h-3.5 w-3.5" />
                          Pending
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {selectedDonation.donation_type === 'money' ? 'Amount' : 'Quantity'}
                    </label>
                    <div className="mt-1">
                      {selectedDonation.donation_type === 'money' ? (
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {formatCurrency.format(Number(selectedDonation.amount || 0))}
                        </p>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-lg font-bold text-gray-900 dark:text-white">
                            {selectedDonation.quantity ?? '-'} {selectedDonation.unit ?? ''}
                          </p>
                          {selectedDonation.amount && Number(selectedDonation.amount) > 0 && (
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              Estimated value: {formatCurrency.format(Number(selectedDonation.amount))}
                            </p>
                          )}
                          {selectedDonation.essential_type && (
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              Type: {selectedDonation.essential_type}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Date</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      {new Date(selectedDonation.created_at).toLocaleString()}
                    </p>
                  </div>

                  {selectedDonation.delivery_date && (
                    <div className="col-span-2">
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Delivery Date</label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                        {new Date(selectedDonation.delivery_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                {/* Description/Message */}
                {selectedDonation.message && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {selectedDonation.donation_type === 'money' ? 'Message' : 'Description'}
                    </label>
                    <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{selectedDonation.message}</p>
                  </div>
                )}

                {/* Action Buttons */}
                {!isDonor && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-3">
                    {(selectedDonation.status === 'pending' || selectedDonation.status === 'confirmed') && (
                      <>
                        <button
                          onClick={() => handleAcceptDonation(selectedDonation.id)}
                          disabled={processingStatus === selectedDonation.id}
                          className="flex-1 px-4 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {processingStatus === selectedDonation.id ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Check className="h-4 w-4" />
                              Accept Donation
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleRejectDonation(selectedDonation.id)}
                          disabled={processingStatus === selectedDonation.id}
                          className="flex-1 px-4 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {processingStatus === selectedDonation.id ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <X className="h-4 w-4" />
                              Reject Donation
                            </>
                          )}
                        </button>
                      </>
                    )}
                    {canRequestAgain(selectedDonation) && (
                      <button
                        onClick={() => handleRequestAgain(selectedDonation.id)}
                        disabled={processingStatus === selectedDonation.id}
                        className="flex-1 px-4 py-2.5 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {processingStatus === selectedDonation.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4" />
                            Request Again
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Donations;

