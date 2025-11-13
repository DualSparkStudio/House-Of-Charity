import { Calendar, IndianRupee, Mail, Phone, Users } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../api/database';
import { Donation } from '../types';

const Connections: React.FC = () => {
  const { userProfile, loading, connections, removeConnection } = useAuth();
  const navigate = useNavigate();
  const [pageLoading, setPageLoading] = useState(true);
  const [ngoDonorConnections, setNgoDonorConnections] = useState<
    {
      id: string;
      name: string;
      email?: string;
      totalDonations: number;
      monetaryImpact: number;
      lastDonation?: string;
    }[]
  >([]);

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
    const loadConnections = async () => {
      if (!userProfile) {
        setPageLoading(false);
        return;
      }

      if (userProfile.user_type === 'donor') {
        setPageLoading(false);
        return;
      }

      setPageLoading(true);
      try {
        const response = await apiService.getDonationsByNGO(userProfile.id);
        const donations: Donation[] = response?.donations || [];
        const donorMap = new Map<string, {
          id: string;
          name: string;
          email?: string;
          totalDonations: number;
          monetaryImpact: number;
          lastDonation?: string;
        }>();

        donations.forEach((donation) => {
          if (!donation.donor_id) {
            return;
          }

          const existing = donorMap.get(donation.donor_id) || {
            id: donation.donor_id,
            name: donation.donor_name || donation.display_name || 'Donor',
            email: donation.donor_email || undefined,
            totalDonations: 0,
            monetaryImpact: 0,
            lastDonation: donation.created_at,
          };

          existing.totalDonations += 1;
          if (donation.donation_type === 'money') {
            existing.monetaryImpact += Number(donation.amount || 0);
          }
          if (!existing.lastDonation || new Date(donation.created_at) > new Date(existing.lastDonation)) {
            existing.lastDonation = donation.created_at;
          }
          if (!existing.email && donation.donor_email) {
            existing.email = donation.donor_email;
          }

          donorMap.set(donation.donor_id, existing);
        });

        setNgoDonorConnections(
          Array.from(donorMap.values()).sort((a, b) => {
            if (!a.lastDonation || !b.lastDonation) return 0;
            return new Date(b.lastDonation).getTime() - new Date(a.lastDonation).getTime();
          })
        );
      } catch (error: any) {
        console.error('Failed to load donor connections:', error);
        toast.error(error?.message || 'Unable to load donor connections.');
        setNgoDonorConnections([]);
      } finally {
        setPageLoading(false);
      }
    };

    if (!loading) {
      loadConnections();
    }
  }, [loading, userProfile]);

  if (loading || pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your connections...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    navigate('/login');
    return null;
  }

  if (userProfile.user_type === 'donor') {
    return (
      <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="btn-outline inline-flex items-center"
        >
          Back to Dashboard
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Connections</h1>
            <p className="text-gray-600 mt-1">
              Manage the NGOs you are connected with and continue supporting their work.
            </p>
          </div>
          <button onClick={() => navigate('/ngos')} className="btn-primary">
            Browse NGOs
          </button>
          </div>

          {connections.length === 0 ? (
            <div className="card text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">No connections yet</h2>
              <p className="text-gray-600 mb-6">
                When you connect with an NGO, it will appear here.
              </p>
              <button onClick={() => navigate('/ngos')} className="btn-primary">
                Connect with an NGO
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {connections.map((connection) => (
                <div key={connection.id} className="card h-full flex flex-col">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {connection.name}
                    </h3>
                    {connection.description && (
                      <p className="text-gray-600 text-sm mb-4">{connection.description}</p>
                    )}
                    <div className="space-y-3 text-sm text-gray-600">
                      {connection.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span>{connection.email}</span>
                        </div>
                      )}
                      {connection.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>{connection.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-6 flex items-center gap-3">
                    <button
                      onClick={() => navigate(`/ngos/${connection.id}`)}
                      className="btn-outline flex-1"
                    >
                      View Details
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await removeConnection(connection.id);
                          toast.success(`Removed ${connection.name} from your connections.`);
                        } catch (error: any) {
                          console.error('Failed to remove connection:', error);
                          toast.error(error?.message || 'Unable to remove connection.');
                        }
                      }}
                      className="btn-primary flex-1"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="btn-outline inline-flex items-center"
        >
          Back to Dashboard
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Connected Donors</h1>
          <p className="text-gray-600 mt-1">
            Keep track of all donors who have supported your organisation.
          </p>
        </div>

        {ngoDonorConnections.length === 0 ? (
          <div className="card text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">No donors yet</h2>
            <p className="text-gray-600">
              Once donors contribute to your organisation, their details will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ngoDonorConnections.map((donor) => (
              <div key={donor.id} className="card h-full flex flex-col">
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{donor.name}</h3>
                    {donor.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span>{donor.email}</span>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span>
                        {donor.totalDonations} donation{donor.totalDonations !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <IndianRupee className="h-4 w-4 text-gray-400" />
                      <span>
                        {currencyFormatter.format(donor.monetaryImpact)} contributed
                      </span>
                    </div>
                    {donor.lastDonation && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>
                          Last donation on {new Date(donor.lastDonation).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Connections;

