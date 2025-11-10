import { Donation, Donor, NGO, Requirement } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ApiService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  // Auth operations
  async login(email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();
    localStorage.setItem('token', data.token);
    return data;
  }

  async register(email: string, password: string, userData: Partial<Donor | NGO>) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, userData })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    const data = await response.json();
    localStorage.setItem('token', data.token);
    return data;
  }

  async verifyToken() {
    const response = await fetch(`${API_BASE_URL}/auth/verify`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      localStorage.removeItem('token');
      throw new Error('Invalid token');
    }

    return response.json();
  }

  // User operations
  async getUserById(id: string) {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }

    return response.json();
  }

  async updateUser(id: string, updates: Partial<Donor | NGO>) {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update user');
    }

    return response.json();
  }

  async getAllNGOs() {
    const response = await fetch(`${API_BASE_URL}/users/ngos`);

    if (!response.ok) {
      throw new Error('Failed to fetch NGOs');
    }

    return response.json();
  }

  async getUserStats(id: string) {
    const response = await fetch(`${API_BASE_URL}/users/${id}/stats`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user stats');
    }

    return response.json();
  }

  // Donation operations
  async createDonation(donation: {
    ngo_id: string;
    amount?: number;
    currency?: string;
    payment_method?: string;
    transaction_id?: string;
    message?: string;
    anonymous?: boolean;
    donation_type: 'money' | 'food' | 'essentials';
    quantity?: number;
    unit?: string;
    delivery_date?: string;
    essential_type?: string;
  }) {
    const response = await fetch(`${API_BASE_URL}/donations`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(donation)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create donation');
    }

    return response.json();
  }

  async getDonationsByDonor(donorId: string) {
    const response = await fetch(`${API_BASE_URL}/donations/donor/${donorId}`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch donations');
    }

    return response.json();
  }

  async getDonationsByNGO(ngoId: string) {
    const response = await fetch(`${API_BASE_URL}/donations/ngo/${ngoId}`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch donations');
    }

    return response.json();
  }

  async getAllDonations() {
    const response = await fetch(`${API_BASE_URL}/donations`);

    if (!response.ok) {
      throw new Error('Failed to fetch donations');
    }

    return response.json();
  }

  async updateDonationStatus(id: string, status: string) {
    const response = await fetch(`${API_BASE_URL}/donations/${id}/status`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ status })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update donation status');
    }

    return response.json();
  }

  // Requirement operations
  async createRequirement(requirement: Omit<Requirement, 'id' | 'created_at' | 'updated_at'>) {
    const response = await fetch(`${API_BASE_URL}/requirements`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(requirement)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create requirement');
    }

    return response.json();
  }

  async getRequirementsByNGO(ngoId: string) {
    const response = await fetch(`${API_BASE_URL}/requirements/ngo/${ngoId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch requirements');
    }

    return response.json();
  }

  async getAllRequirements() {
    const response = await fetch(`${API_BASE_URL}/requirements`);

    if (!response.ok) {
      throw new Error('Failed to fetch requirements');
    }

    return response.json();
  }

  async getRequirementById(id: string) {
    const response = await fetch(`${API_BASE_URL}/requirements/${id}`);

    if (!response.ok) {
      throw new Error('Failed to fetch requirement');
    }

    return response.json();
  }

  async updateRequirement(id: string, updates: Partial<Requirement>) {
    const response = await fetch(`${API_BASE_URL}/requirements/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update requirement');
    }

    return response.json();
  }

  async deleteRequirement(id: string) {
    const response = await fetch(`${API_BASE_URL}/requirements/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete requirement');
    }

    return response.json();
  }

  async getRequirementsByCategory(category: string) {
    const response = await fetch(`${API_BASE_URL}/requirements/category/${category}`);

    if (!response.ok) {
      throw new Error('Failed to fetch requirements by category');
    }

    return response.json();
  }

  // Utility methods
  logout() {
    localStorage.removeItem('token');
  }

  isAuthenticated() {
    return !!localStorage.getItem('token');
  }
}

export const apiService = new ApiService();
