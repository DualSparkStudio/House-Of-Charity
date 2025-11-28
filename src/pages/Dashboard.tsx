import {
  Calendar,
  Clock,
  Heart,
  IndianRupee,
  Plus,
  TrendingUp,
  Users,
  RefreshCw,
  X,
  MapPin,
  DollarSign,
  ShoppingBag,
  Utensils,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../api/database';
import DonationForm from '../components/DonationForm';
import RequirementForm from '../components/RequirementForm';
import { useAuth } from '../contexts/AuthContext';
import { Donation } from '../types';

type SidebarItem = {
  label: string;
  description: string;
  icon: React.ElementType;
  onClick: () => void;
};

const Dashboard: React.FC = () => {
  const { userProfile, loading, connections, notifications, refreshNotifications } = useAuth();
  const navigate = useNavigate();
  const [recentDonations, setRecentDonations] = useState<Donation[]>([]);
  const [ngoDonations, setNgoDonations] = useState<Donation[]>([]);
  const [stats, setStats] = useState({
    totalDonations: 0,
    totalAmount: 0,
    connectedUsers: 0,
    thisMonth: 0,
  });
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [showRequirementModal, setShowRequirementModal] = useState(false);
  const [donationRequestModal, setDonationRequestModal] = useState<{
    donation: Donation | null;
    ngoName: string;
    notificationId?: string;
  } | null>(null);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [donationPreset, setDonationPreset] = useState<{
    type?: 'money' | 'food' | 'essentials';
    amount?: number;
    description?: string;
    quantity?: number;
    unit?: string;
    deliveryDate?: string;
    essentialType?: string;
    essentialSubType?: string;
    shirtQuantity?: number;
    pantQuantity?: number;
  } | null>(null);
  const [donationFormNgo, setDonationFormNgo] = useState<{ id: string; name: string } | null>(null);
  const [pendingRequestNotificationId, setPendingRequestNotificationId] = useState<string | null>(null);

  const ngoReceivedDonations = useMemo(
    () => ngoDonations.filter((donation) => donation.status === 'completed'),
    [ngoDonations]
  );

  const ngoScheduledDonations = useMemo(
    () => ngoDonations.filter((donation) => donation.status === 'pending'),
    [ngoDonations]
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

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!userProfile) {
        setDashboardLoading(false);
        return;
      }

      setDashboardLoading(true);
      try {
        if (userProfile.user_type === 'donor') {
          const [donationsRes, statsRes] = await Promise.all([
            apiService.getDonationsByDonor(userProfile.id),
            apiService.getUserStats(userProfile.id),
          ]);

          const donations: Donation[] = (donationsRes?.donations || []).sort(
            (a: Donation, b: Donation) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );

          const statsData = statsRes?.stats || {};
          const totalAmount = Number(statsData.total_amount) || 0;
          const totalDonations = Number(statsData.total_donations) || donations.length;
          const connected = new Set(donations.map((donation) => donation.ngo_id)).size;
          const thisMonthCount = donations.filter((donation) => {
            const created = new Date(donation.created_at);
            const now = new Date();
            return (
              created.getFullYear() === now.getFullYear() &&
              created.getMonth() === now.getMonth()
            );
          }).length;

          setRecentDonations(donations);
          setStats({
            totalDonations,
            totalAmount,
            connectedUsers: connected,
            thisMonth: thisMonthCount,
          });
          setNgoDonations([]);
        } else {
          const [donationsRes, statsRes] = await Promise.all([
            apiService.getDonationsByNGO(userProfile.id),
            apiService.getUserStats(userProfile.id),
          ]);

          const donations: Donation[] = (donationsRes?.donations || []).sort(
            (a: Donation, b: Donation) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );

          const statsData = statsRes?.stats || {};
          const totalAmount = Number(statsData.total_amount_received) || 0;
          const totalDonations = Number(statsData.total_donations_received) || donations.length;
          const connected = new Set(donations.map((donation) => donation.donor_id)).size;
          const thisMonthCount = donations.filter((donation) => {
            const created = new Date(donation.created_at);
            const now = new Date();
            return (
              created.getFullYear() === now.getFullYear() &&
              created.getMonth() === now.getMonth()
            );
          }).length;

          setNgoDonations(donations);
          setRecentDonations([]);
          setStats({
            totalDonations,
            totalAmount,
            connectedUsers: connected,
            thisMonth: thisMonthCount,
          });
        }
      } catch (error: any) {
        console.error('Dashboard data load error:', error);
        toast.error(error?.message || 'Unable to load dashboard data.');
        setRecentDonations([]);
        setNgoDonations([]);
        setStats({
          totalDonations: 0,
          totalAmount: 0,
          connectedUsers: 0,
          thisMonth: 0,
        });
      } finally {
        setDashboardLoading(false);
      }
    };

    loadDashboardData();
  }, [userProfile]);

  // Check for donation request notifications
  useEffect(() => {
    if (!userProfile || userProfile.user_type !== 'donor' || !notifications.length) {
      return;
    }

    // Find unread donation request notifications
    const donationRequestNotification = notifications.find(
      (notification) =>
        !notification.read &&
        notification.type === 'donation' &&
        notification.meta?.action === 'request_again' &&
        notification.related_id
    );

    if (donationRequestNotification && donationRequestNotification.related_id) {
      // Fetch the donation details
      const fetchDonationDetails = async () => {
        try {
          const response = await apiService.getDonationById(donationRequestNotification.related_id!);
          if (response?.donation) {
            // Get NGO name from notification or donation
            const ngoName = (donationRequestNotification.meta?.ngo_name as string) || 
                           response.donation.ngo_name || 
                           'An NGO';
            
            setDonationRequestModal({
              donation: response.donation,
              ngoName,
              notificationId: donationRequestNotification.id,
            });
          }
        } catch (error) {
          console.error('Failed to fetch donation details:', error);
        }
      };

      fetchDonationDetails();
    }
  }, [notifications, userProfile]);

  if (loading || (userProfile && dashboardLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    navigate('/login');
    return null;
  }

  const isDonor = userProfile.user_type === 'donor';

  const latestDonation = isDonor
    ? recentDonations[0]
    : ngoReceivedDonations[0] || ngoDonations[0];

  const nextScheduledDonation = !isDonor ? ngoScheduledDonations[0] : undefined;

  const sidebarItems: SidebarItem[] = isDonor
    ? [
        {
          label: 'Donations',
          description: 'View your complete donation history',
          icon: Heart,
          onClick: () => navigate('/donations'),
        },
        {
          label: 'Connected NGOs',
          description: 'Manage the NGOs you support',
          icon: Users,
          onClick: () => navigate('/connections'),
        },
        {
          label: 'Donation Requests',
          description: 'View requests to repeat donations',
          icon: RefreshCw,
          onClick: async () => {
            // Find donation request notifications
            const donationRequests = notifications.filter(
              (notification) =>
                notification.type === 'donation' &&
                notification.meta?.action === 'request_again' &&
                notification.related_id
            );
            if (donationRequests.length > 0 && donationRequests[0].related_id) {
              try {
                const response = await apiService.getDonationById(donationRequests[0].related_id);
                if (response?.donation) {
                  const ngoName = (donationRequests[0].meta?.ngo_name as string) || 
                                 response.donation.ngo_name || 
                                 'An NGO';
                  setDonationRequestModal({
                    donation: response.donation,
                    ngoName,
                    notificationId: donationRequests[0].id,
                  });
                }
              } catch (error) {
                console.error('Failed to fetch donation:', error);
                toast.error('Failed to load donation request');
              }
            } else {
              toast('No donation requests at the moment', { icon: 'ℹ️' });
            }
          },
        },
      ]
    : [
        {
          label: 'Donations',
          description: 'Review all donations received',
          icon: Heart,
          onClick: () => navigate('/donations'),
        },
        {
          label: 'Connected Donors',
          description: 'See who is supporting you',
          icon: Users,
          onClick: () => navigate('/connections'),
        },
        {
          label: 'Post Requirements',
          description: 'Share new needs with donors',
          icon: Plus,
          onClick: () => setShowRequirementModal(true),
        },
      ];

  const statsCards = isDonor
    ? [
        {
          title: 'Total Donations',
          value: stats.totalDonations.toLocaleString(),
          icon: Heart,
          accent: 'bg-primary-100 text-primary-600',
          subtext: 'Across all NGOs you support',
        },
        {
          title: 'Total Given',
          value: currencyFormatter.format(stats.totalAmount || 0),
          icon: IndianRupee,
          accent: 'bg-green-100 text-green-600',
          subtext: 'Lifetime monetary impact',
        },
        {
          title: 'Connected NGOs',
          value: stats.connectedUsers.toLocaleString(),
          icon: Users,
          accent: 'bg-purple-100 text-purple-600',
          subtext: 'Active partnerships',
        },
        {
          title: 'This Month',
          value: stats.thisMonth.toLocaleString(),
          icon: Calendar,
          accent: 'bg-yellow-100 text-yellow-600',
          subtext: 'Donations in the last 30 days',
        },
      ]
    : [
        {
          title: 'Donations Received',
          value: stats.totalDonations.toLocaleString(),
          icon: Heart,
          accent: 'bg-primary-100 text-primary-600',
          subtext: 'Completed contributions',
        },
        {
          title: 'Connected Donors',
          value: stats.connectedUsers.toLocaleString(),
          icon: Users,
          accent: 'bg-purple-100 text-purple-600',
          subtext: 'Supporters engaged',
        },
        {
          title: 'Total Raised',
          value: currencyFormatter.format(stats.totalAmount || 0),
          icon: IndianRupee,
          accent: 'bg-green-100 text-green-600',
          subtext: 'Funds received so far',
        },
        {
          title: 'Scheduled Deliveries',
          value: ngoScheduledDonations.length.toLocaleString(),
          icon: Calendar,
          accent: 'bg-yellow-100 text-yellow-600',
          subtext: 'Upcoming commitments',
        },
      ];

  const insightSubtitle = isDonor
    ? 'Track your giving impact and stay connected.'
    : 'Monitor your NGO’s reach and donor engagement.';

  const latestDonationLabel = isDonor ? 'Latest Donation' : 'Latest Donation Received';
  const latestDonationDescription = latestDonation
    ? isDonor
      ? `You supported ${latestDonation.ngo_name || 'an NGO'}`
      : `Received from ${latestDonation.donor_name || latestDonation.display_name || 'a donor'}`
    : undefined;

  const latestDonationValue = latestDonation
    ? latestDonation.donation_type === 'money'
      ? currencyFormatter.format(Number(latestDonation.amount || 0))
      : `${latestDonation.quantity ?? '-'} ${latestDonation.unit ?? ''}`.trim()
    : undefined;

  const latestDonationTime = latestDonation
    ? new Date(latestDonation.created_at).toLocaleString()
    : undefined;

  const monthOverviewText = isDonor
    ? stats.thisMonth > 0
      ? `You have made ${stats.thisMonth} donation${stats.thisMonth !== 1 ? 's' : ''} this month.`
      : 'No donations this month yet.'
    : nextScheduledDonation
    ? `${
        nextScheduledDonation.donor_name ||
        nextScheduledDonation.display_name ||
        'A donor'
      } plans to contribute ${
        nextScheduledDonation.donation_type === 'money'
          ? currencyFormatter.format(Number(nextScheduledDonation.amount || 0))
          : [
              nextScheduledDonation.donation_type === 'essentials'
                ? nextScheduledDonation.essential_type
                : nextScheduledDonation.donation_type,
              nextScheduledDonation.quantity
                ? `${nextScheduledDonation.quantity} ${nextScheduledDonation.unit ?? ''}`
                : null,
            ]
              .filter(Boolean)
              .join(' · ')
      }.`
    : 'No scheduled donations at the moment.';

  const monthOverviewMeta = isDonor
    ? connections.length > 0
      ? `You are connected with ${connections.length} NGO${connections.length !== 1 ? 's' : ''}.`
      : 'Connect with NGOs to build long-term impact.'
    : nextScheduledDonation
    ? `Scheduled for ${
        nextScheduledDonation.delivery_date
          ? new Date(nextScheduledDonation.delivery_date).toLocaleDateString()
          : 'date to be decided'
      }.`
    : 'Invite donors to schedule their next contribution.';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="space-y-6 order-2 lg:order-1">
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Access</h2>
              <div className="space-y-3">
                {sidebarItems.map(({ label, description, icon: Icon, onClick }) => (
                  <button
                    key={label}
                    onClick={onClick}
                    className="w-full text-left flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50/50 dark:hover:bg-primary-900/20 transition"
                  >
                    <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{label}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-300">{description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {isDonor ? (
              <div className="card">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide mb-2">
                  Connections
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  You are connected with {connections.length} NGO
                  {connections.length !== 1 ? 's' : ''}. Keep nurturing those relationships.
                </p>
              </div>
            ) : (
              <div className="card">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide mb-2">
                  Donor Engagement
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Share updates and requirements regularly to keep donors engaged.
                </p>
              </div>
            )}
          </aside>

          <main className="space-y-6 order-1 lg:order-2">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Dashboard Insights</h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">{insightSubtitle}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
              {statsCards.map(({ title, value, icon: Icon, accent, subtext }) => (
                <div key={title} className="card">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${accent}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{title}</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">{subtext}</p>
                </div>
              ))}
            </div>


            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{latestDonationLabel}</h2>
                  <Clock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                {latestDonation ? (
                  <div className="space-y-3">
                    {latestDonationDescription && (
                      <p className="text-gray-900 dark:text-white font-medium">{latestDonationDescription}</p>
                    )}
                    {latestDonationValue && (
                      <p className="text-2xl font-semibold text-primary-600 dark:text-primary-400">{latestDonationValue}</p>
                    )}
                    {latestDonationTime && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">On {latestDonationTime}</p>
                    )}
                    {latestDonation.message && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 border-t border-dashed border-gray-200 dark:border-gray-700 pt-3">
                        "{latestDonation.message}"
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {isDonor
                      ? 'You have not made any donations yet.'
                      : 'Your NGO has not received donations yet.'}
                  </p>
                )}
              </div>

              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {isDonor ? 'This Month Overview' : 'Upcoming Donation'}
                  </h2>
                  <TrendingUp className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-gray-900 dark:text-white font-medium">{monthOverviewText}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{monthOverviewMeta}</p>
                {isDonor && stats.totalAmount > 0 && (
                  <div className="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                    <span>Total impact so far</span>
                    <span className="font-semibold text-primary-600 dark:text-primary-400">
                      {currencyFormatter.format(stats.totalAmount || 0)}
                    </span>
                  </div>
                )}
                {!isDonor && nextScheduledDonation && nextScheduledDonation.status && (
                  <div className="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                    <span>Status</span>
                    <span className="font-semibold capitalize text-primary-600 dark:text-primary-400">
                      {nextScheduledDonation.status}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

      {!isDonor && showRequirementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="relative max-w-2xl w-full">
            <button
              className="absolute right-4 top-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              onClick={() => setShowRequirementModal(false)}
            >
              ✕
            </button>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-0 shadow-xl max-h-[80vh] overflow-hidden transition-colors">
              <RequirementForm
                className="w-full max-h-[80vh] overflow-y-auto px-6 py-6"
                onCancel={() => setShowRequirementModal(false)}
                onSuccess={() => {
                  toast.success('Requirement posted successfully.');
                  setShowRequirementModal(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Donation Request Modal for Donors */}
      {isDonor && donationRequestModal && donationRequestModal.donation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="relative max-w-2xl w-full bg-white dark:bg-gray-800 rounded-xl shadow-xl max-h-[90vh] overflow-hidden transition-colors">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Donation Request</h2>
              <button
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                onClick={() => {
                  if (donationRequestModal.notificationId) {
                    apiService.markNotificationsRead([donationRequestModal.notificationId]);
                    refreshNotifications();
                  }
                  setDonationRequestModal(null);
                }}
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="space-y-6">
                <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
                  <p className="text-primary-800 dark:text-primary-200 font-medium">
                    {donationRequestModal.ngoName} is requesting you to fulfill your donation again with a new delivery date.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Donation Type</label>
                    <div className="mt-1 flex items-center gap-2">
                      {donationRequestModal.donation.donation_type === 'money' ? (
                        <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                      ) : donationRequestModal.donation.donation_type === 'food' ? (
                        <Utensils className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      ) : (
                        <ShoppingBag className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      )}
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {donationRequestModal.donation.donation_type === 'money'
                          ? 'Money'
                          : donationRequestModal.donation.donation_type === 'food'
                          ? 'Food'
                          : 'Essentials'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {donationRequestModal.donation.donation_type === 'money' ? 'Amount' : 'Quantity'}
                    </label>
                    <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
                      {donationRequestModal.donation.donation_type === 'money'
                        ? currencyFormatter.format(Number(donationRequestModal.donation.amount || 0))
                        : `${donationRequestModal.donation.quantity ?? '-'} ${donationRequestModal.donation.unit ?? ''}`}
                    </p>
                  </div>

                  {donationRequestModal.donation.delivery_date && (
                    <div className="sm:col-span-2">
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">New Delivery Date</label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                        {new Date(donationRequestModal.donation.delivery_date).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  )}

                  {donationRequestModal.donation.message && (
                    <div className="sm:col-span-2">
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Message</label>
                      <p className="mt-1 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {donationRequestModal.donation.message}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  if (!donationRequestModal.donation) return;
                  
                  // Convert donation to preset format
                  // Parse essential_type - it might be stored as "clothes: Winter Clothes" or just "clothes"
                  let essentialType = undefined;
                  let essentialSubType = undefined;
                  if (donationRequestModal.donation.essential_type) {
                    const essentialTypeParts = donationRequestModal.donation.essential_type.split(':').map(s => s.trim());
                    if (essentialTypeParts.length > 1) {
                      essentialType = essentialTypeParts[0].toLowerCase();
                      essentialSubType = essentialTypeParts[1];
                    } else {
                      // Check if it's a valid base type (clothes, furniture, etc.)
                      const baseType = essentialTypeParts[0].toLowerCase();
                      const validBaseTypes = ['clothes', 'furniture', 'blankets', 'shoes', 'kitchen', 'toiletries', 'other'];
                      if (validBaseTypes.includes(baseType)) {
                        essentialType = baseType;
                      } else {
                        // Try to match common variations
                        const typeMap: Record<string, string> = {
                          'clothes': 'clothes',
                          'furniture': 'furniture',
                          'blankets': 'blankets',
                          'bedding': 'blankets',
                          'shoes': 'shoes',
                          'kitchen': 'kitchen',
                          'toiletries': 'toiletries',
                          'other': 'other',
                        };
                        essentialType = typeMap[baseType] || 'other';
                      }
                    }
                  }
                  
                  // Parse shirt and pant quantities from message if it's a clothes donation
                  let shirtQuantity: number | undefined;
                  let pantQuantity: number | undefined;
                  let cleanDescription = donationRequestModal.donation.message || '';
                  
                  if (donationRequestModal.donation.donation_type === 'daily_essentials' && essentialType === 'clothes') {
                    // Parse message like "Quantity: 3 Shirts, 3 Pants, 1 item. cloths are in good condition"
                    const quantityMatch = cleanDescription.match(/Quantity:\s*([^.]*)/i);
                    if (quantityMatch) {
                      const quantityPart = quantityMatch[1];
                      // Extract shirt quantity
                      const shirtMatch = quantityPart.match(/(\d+)\s*shirt/i);
                      if (shirtMatch) {
                        shirtQuantity = parseInt(shirtMatch[1], 10);
                      }
                      // Extract pant quantity
                      const pantMatch = quantityPart.match(/(\d+)\s*pant/i);
                      if (pantMatch) {
                        pantQuantity = parseInt(pantMatch[1], 10);
                      }
                      // Remove quantity prefix from description
                      cleanDescription = cleanDescription.replace(/Quantity:\s*[^.]*\.?\s*/i, '').trim();
                    }
                  }
                  
                  const preset = {
                    type: donationRequestModal.donation.donation_type === 'daily_essentials' 
                      ? 'essentials' 
                      : donationRequestModal.donation.donation_type as 'money' | 'food' | 'essentials',
                    amount: donationRequestModal.donation.amount ? Number(donationRequestModal.donation.amount) : undefined,
                    description: cleanDescription || undefined,
                    quantity: donationRequestModal.donation.quantity ? Number(donationRequestModal.donation.quantity) : undefined,
                    unit: donationRequestModal.donation.unit || undefined,
                    deliveryDate: donationRequestModal.donation.delivery_date || undefined,
                    essentialType,
                    essentialSubType,
                    shirtQuantity,
                    pantQuantity,
                  };
                  
                  setDonationPreset(preset);
                  setDonationFormNgo({
                    id: donationRequestModal.donation.ngo_id || '',
                    name: donationRequestModal.ngoName,
                  });
                  // Store notification ID to mark as read after successful donation
                  if (donationRequestModal.notificationId) {
                    setPendingRequestNotificationId(donationRequestModal.notificationId);
                  }
                  setShowDonationModal(true);
                  setDonationRequestModal(null);
                }}
                className="flex-1 px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Repeat Donation
              </button>
              <button
                onClick={() => {
                  if (donationRequestModal.notificationId) {
                    apiService.markNotificationsRead([donationRequestModal.notificationId]);
                    refreshNotifications();
                  }
                  setDonationRequestModal(null);
                  navigate('/donations');
                }}
                className="flex-1 px-4 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
              >
                <Heart className="h-4 w-4" />
                View in Donations
              </button>
              <button
                onClick={() => {
                  if (donationRequestModal.notificationId) {
                    apiService.markNotificationsRead([donationRequestModal.notificationId]);
                    refreshNotifications();
                  }
                  setDonationRequestModal(null);
                }}
                className="flex-1 px-4 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Donation Form Modal */}
      {isDonor && showDonationModal && donationFormNgo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="relative max-w-3xl w-full bg-white dark:bg-gray-800 rounded-xl shadow-xl max-h-[90vh] overflow-hidden transition-colors">
            <button
              className="absolute right-4 top-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 z-10"
              onClick={() => {
                setShowDonationModal(false);
                setDonationPreset(null);
                setDonationFormNgo(null);
              }}
            >
              <X className="h-6 w-6" />
            </button>
            <div className="p-6 overflow-y-auto max-h-[90vh]">
              <DonationForm
                ngoId={donationFormNgo.id}
                ngoName={donationFormNgo.name}
                initialData={donationPreset || undefined}
                onSuccess={() => {
                  setShowDonationModal(false);
                  setDonationPreset(null);
                  setDonationFormNgo(null);
                  // Mark the donation request notification as read
                  if (pendingRequestNotificationId) {
                    apiService.markNotificationsRead([pendingRequestNotificationId]);
                    refreshNotifications();
                    setPendingRequestNotificationId(null);
                  }
                  toast.success('Donation submitted successfully!');
                }}
                onCancel={() => {
                  setShowDonationModal(false);
                  setDonationPreset(null);
                  setDonationFormNgo(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

