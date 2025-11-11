import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import { AuthProvider } from './contexts/AuthContext';
import Dashboard from './pages/Dashboard';
import Connections from './pages/Connections';
import DemoDonorDashboard from './pages/DemoDonorDashboard';
import DemoNGODashboard from './pages/DemoNGODashboard';
import Home from './pages/Home';
import NGODetail from './pages/NGODetail';
import NGOs from './pages/NGOs';
import Donations from './pages/Donations';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

function App() {
  useEffect(() => {
    const checkApiHealth = async () => {
      const baseApiUrl =
        process.env.REACT_APP_API_URL ||
        (process.env.NODE_ENV === 'development' ? 'http://localhost:5000/api' : '/api');

      try {
        const response = await fetch(`${baseApiUrl.replace(/\/$/, '')}/health`);
        if (!response.ok) {
          throw new Error(`Status ${response.status}`);
        }
        const data = await response.json();
        console.log(`✅ API connected (mode: ${data.mode || 'unknown'})`);
      } catch (error) {
        console.error('❌ API health check failed:', error);
      }
    };

    checkApiHealth();
  }, []);

  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
          <Routes>
            <Route path="/" element={<Layout><Home /></Layout>} />
            <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
            <Route path="/donations" element={<Layout><Donations /></Layout>} />
            <Route path="/connections" element={<Layout><Connections /></Layout>} />
            <Route path="/demo-donor-dashboard" element={<Layout><DemoDonorDashboard /></Layout>} />
            <Route path="/demo-ngo-dashboard" element={<Layout><DemoNGODashboard /></Layout>} />
            <Route path="/ngos" element={<Layout><NGOs /></Layout>} />
            <Route path="/ngos/:id" element={<Layout><NGODetail /></Layout>} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App; 