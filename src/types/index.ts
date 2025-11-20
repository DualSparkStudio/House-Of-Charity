export interface User {
  id: string;
  email: string;
  name?: string | null;
  user_type: 'donor' | 'ngo';
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  pincode?: string | null;
  description?: string | null;
  website?: string | null;
  logo_url?: string | null;
  works_done?: string | null;
  awards_received?: string | null;
  about?: string | null;
  gallery?: string | null;
  current_requirements?: string | null;
  future_plans?: string | null;
  awards_and_recognition?: string | null;
  recent_activities?: string | null;
  verified?: boolean | null;
  connected_ngos?: string[] | null;
  connected_donors?: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface Donor extends User {
  user_type: 'donor';
}

export interface NGO extends User {
  user_type: 'ngo';
  // Additional NGO-specific fields are handled in the base User interface
}

export interface Donation {
  id: string;
  donor_id: string;
  ngo_id: string;
  amount: number;
  currency: string;
  payment_method?: string;
  transaction_id?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'failed' | 'cancelled';
  message?: string;
  anonymous: boolean;
  donation_type?: 'money' | 'food' | 'essentials' | string;
  quantity?: number | null;
  unit?: string | null;
  essential_type?: string | null;
  delivery_date?: string | null;
  ngo_name?: string | null;
  ngo_email?: string | null;
  donor_name?: string | null;
  donor_email?: string | null;
  display_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Requirement {
  id: string;
  ngo_id: string;
  title: string;
  description?: string;
  category?: string;
  amount_needed?: number;
  currency: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'active' | 'fulfilled' | 'cancelled';
  deadline?: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  account_type: 'donor' | 'ngo';
  title: string;
  message: string;
  type: 'donation' | 'requirement' | 'connection' | 'general';
  read: boolean;
  created_at: string;
  related_id?: string; // ID of related donation, requirement, etc.
  related_type?: string;
  meta?: Record<string, unknown>;
} 