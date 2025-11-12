import {
  Calendar,
  Clock,
  Heart,
  IndianRupee,
  Plus,
  TrendingUp,
  Users,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../api/database';
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
  const { userProfile, loading, connections } = useAuth();
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

  if (loading || (userProfile && dashboardLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="space-y-6">
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Access</h2>
              <div className="space-y-3">
                {sidebarItems.map(({ label, description, icon: Icon, onClick }) => (
                  <button
                    key={label}
                    onClick={onClick}
                    className="w-full text-left flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:border-primary-400 hover:bg-primary-50/50 transition"
                  >
                    <div className="p-2 rounded-lg bg-primary-100 text-primary-600">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{label}</p>
                      <p className="text-sm text-gray-500">{description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {isDonor ? (
              <div className="card">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2">
                  Connections
                </h3>
                <p className="text-sm text-gray-600">
                  You are connected with {connections.length} NGO
                  {connections.length !== 1 ? 's' : ''}. Keep nurturing those relationships.
                </p>
              </div>
            ) : (
              <div className="card">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2">
                  Donor Engagement
                </h3>
                <p className="text-sm text-gray-600">
                  Share updates and requirements regularly to keep donors engaged.
                </p>
              </div>
            )}
          </aside>

          <main className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-gray-900">Dashboard Insights</h1>
              <p className="text-gray-600">{insightSubtitle}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
              {statsCards.map(({ title, value, icon: Icon, accent, subtext }) => (
                <div key={title} className="card">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${accent}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">{title}</p>
                      <p className="text-2xl font-bold text-gray-900">{value}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">{subtext}</p>
                </div>
              ))}
            </div>


            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">{latestDonationLabel}</h2>
                  <Clock className="h-5 w-5 text-gray-400" />
                </div>
                {latestDonation ? (
                  <div className="space-y-3">
                    {latestDonationDescription && (
                      <p className="text-gray-900 font-medium">{latestDonationDescription}</p>
                    )}
                    {latestDonationValue && (
                      <p className="text-2xl font-semibold text-primary-600">{latestDonationValue}</p>
                    )}
                    {latestDonationTime && (
                      <p className="text-sm text-gray-500">On {latestDonationTime}</p>
                    )}
                    {latestDonation.message && (
                      <p className="text-sm text-gray-600 border-t border-dashed border-gray-200 pt-3">
                        “{latestDonation.message}”
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    {isDonor
                      ? 'You have not made any donations yet.'
                      : 'Your NGO has not received donations yet.'}
                  </p>
                )}
              </div>

              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {isDonor ? 'This Month Overview' : 'Upcoming Donation'}
                  </h2>
                  <TrendingUp className="h-5 w-5 text-gray-400" />
                </div>
                <p className="text-gray-900 font-medium">{monthOverviewText}</p>
                <p className="text-sm text-gray-500 mt-2">{monthOverviewMeta}</p>
                {isDonor && stats.totalAmount > 0 && (
                  <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                    <span>Total impact so far</span>
                    <span className="font-semibold text-primary-600">
                      {currencyFormatter.format(stats.totalAmount || 0)}
                    </span>
                  </div>
                )}
                {!isDonor && nextScheduledDonation && nextScheduledDonation.status && (
                  <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                    <span>Status</span>
                    <span className="font-semibold capitalize text-primary-600">
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
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
              onClick={() => setShowRequirementModal(false)}
            >
              ✕
            </button>
            <div className="bg-white rounded-xl p-0 shadow-xl max-h-[80vh] overflow-hidden">
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
    </div>
  );
};

export default Dashboard;

