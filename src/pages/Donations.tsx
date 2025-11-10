import { Calendar, Heart, IndianRupee, Package, Users } from 'lucide-react';
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

  if (loading || pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading donations...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="btn-outline inline-flex items-center mb-6"
        >
          Back to Dashboard
        </button>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isDonor ? 'My Donations' : 'Donations Received'}
            </h1>
            <p className="text-gray-600 mt-2">
              {isDonor
                ? 'Track every contribution you’ve made and revisit the NGOs you support.'
                : 'View all contributions made to your organization and plan follow-ups with donors.'}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-1 flex self-start md:self-auto">
            {(['all', 'completed', 'pending'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition ${
                  statusFilter === status
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
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
              <div className="p-2 bg-primary-100 rounded-lg">
                <Heart className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Donations</p>
                <p className="text-2xl font-bold text-gray-900">{donations.length}</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-success-100 rounded-lg">
                <IndianRupee className="h-6 w-6 text-success-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">
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
                <p className="text-sm font-medium text-gray-600">
                  {isDonor ? 'NGOs Supported' : 'Donors Connected'}
                </p>
                <p className="text-2xl font-bold text-gray-900">
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
          <div className="space-y-4">
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
              const typeLabel = isMoney
                ? 'Monetary donation'
                : donation.donation_type === 'food'
                ? 'Food donation'
                : 'Essential items';

                return (
                  <div key={donation.id} className="card">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <p className="text-lg font-semibold text-gray-900">
                          {isDonor
                            ? donation.ngo_name || 'NGO'
                            : donation.donor_name || donation.display_name || 'Donor'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {isDonor
                            ? donation.ngo_email || 'No email provided'
                            : donation.donor_email || 'No email provided'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-gray-900">{amountLabel}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(donation.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3 text-sm text-gray-600">
                      <span className="inline-flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
                        <Package className="h-4 w-4" />
                        {typeLabel}
                      </span>
                      <span className="inline-flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full capitalize">
                        <Calendar className="h-4 w-4" />
                        {donation.status}
                      </span>
                      {donation.delivery_date && (
                        <span className="inline-flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
                          <Calendar className="h-4 w-4" />
                          Delivery {new Date(donation.delivery_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {donation.message && (
                      <p className="mt-4 text-sm text-gray-600">{donation.message}</p>
                    )}
                  </div>
                );
              })}
            {donations.filter((donation) => statusFilter === 'all' || donation.status === statusFilter).length === 0 && (
              <div className="card text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No donations found</h3>
                <p className="text-gray-600">
                  {statusFilter === 'pending'
                    ? 'No pending donations.'
                    : 'No completed donations yet.'}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="card text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No donations yet</h3>
            <p className="text-gray-600 mb-6">
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
      </div>
    </div>
  );
};

export default Donations;

