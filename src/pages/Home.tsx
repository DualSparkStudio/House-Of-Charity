import { ArrowRight, Globe, Heart, Shield } from 'lucide-react';
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Home: React.FC = () => {
  const { userProfile } = useAuth();
  const donorCtaLink = useMemo(
    () => (userProfile?.user_type === 'donor' ? '/ngos' : '/register'),
    [userProfile]
  );

  return (
    <div className="bg-white dark:bg-gray-900 transition-colors">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-800 dark:to-gray-900 py-20 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Connect, Donate,
              <span className="text-gradient"> Make a Difference</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Join House of Charity to connect generous donors with impactful NGOs. 
              Together, we can create positive change in communities worldwide.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={donorCtaLink} className="btn-primary text-lg px-8 py-3">
                Get Started
              </Link>
              <Link to="/ngos" className="btn-outline text-lg px-8 py-3">
                Explore NGOs
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose House of Charity?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              We provide a secure and transparent platform for charitable giving
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="h-8 w-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Direct Impact
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Connect directly with NGOs and see the real impact of your donations 
                through transparent reporting and updates.
              </p>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-secondary-100 dark:bg-secondary-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="h-8 w-8 text-secondary-600 dark:text-secondary-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Secure & Transparent
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                All transactions are secure and transparent. Track your donations 
                and see exactly how your contributions are being used.
              </p>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-success-100 dark:bg-success-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <Globe className="h-8 w-8 text-success-600 dark:text-success-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Global Reach
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Support NGOs from around the world. Choose from verified organizations 
                working on various causes that matter to you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Simple steps to start making a difference
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 dark:bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-xl font-bold">1</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Create Account
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Sign up as a donor or NGO and complete your profile
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 dark:bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-xl font-bold">2</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Connect
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Browse NGOs or connect with donors based on your interests
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 dark:bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-xl font-bold">3</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Donate
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Make secure donations in money, food, or essential items
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 dark:bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-xl font-bold">4</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Track Impact
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Receive updates and see the impact of your contributions
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">500+</div>
              <div className="text-gray-600 dark:text-gray-300">NGOs Registered</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">10,000+</div>
              <div className="text-gray-600 dark:text-gray-300">Donors</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">₹2Cr+</div>
              <div className="text-gray-600 dark:text-gray-300">Total Donations</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">50+</div>
              <div className="text-gray-600 dark:text-gray-300">Countries</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600 dark:bg-primary-700 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Make a Difference?
          </h2>
          <p className="text-xl text-primary-100 dark:text-primary-200 mb-8 max-w-2xl mx-auto">
            Join thousands of donors and NGOs making positive change in communities worldwide.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to={donorCtaLink} 
              className="bg-white dark:bg-gray-100 text-primary-600 dark:text-primary-700 hover:bg-gray-100 dark:hover:bg-gray-200 font-medium py-3 px-8 rounded-lg transition-colors duration-200 flex items-center justify-center"
            >
              Start Donating
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link 
              to="/ngos" 
              className="border border-white dark:border-gray-200 text-white dark:text-gray-100 hover:bg-white dark:hover:bg-gray-100 hover:text-primary-600 dark:hover:text-primary-700 font-medium py-3 px-8 rounded-lg transition-colors duration-200"
            >
              Browse NGOs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home; 