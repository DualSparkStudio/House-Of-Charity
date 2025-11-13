const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const now = () => new Date().toISOString();
const hashPassword = (password) => bcrypt.hashSync(password, 10);

const mockUsers = [
  {
    id: 'ngo-1',
    email: 'ngo@example.com',
    password: hashPassword('password123'),
    user_type: 'ngo',
    name: 'Save the Children',
    phone: '+1 (555) 123-4567',
    address: '123 Charity St, New York, NY 10001',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    pincode: '10001',
    description: 'Working to improve the lives of children through better education, health care, and economic opportunities.',
    website: 'https://savethechildren.org',
    logo_url: null,
    verified: true,
  connected_donors: [],
    created_at: now(),
    updated_at: now(),
  },
  {
    id: 'ngo-2',
    email: 'foodbank@example.com',
    password: hashPassword('password123'),
    user_type: 'ngo',
    name: 'Food Bank International',
    phone: '+1 (555) 987-6543',
    address: '456 Hope Ave, Los Angeles, CA 90210',
    city: 'Los Angeles',
    state: 'CA',
    country: 'USA',
    pincode: '90210',
    description: 'Providing food assistance to families in need across the country.',
    website: 'https://foodbank.org',
    logo_url: null,
    verified: true,
  connected_donors: [],
    created_at: now(),
    updated_at: now(),
  },
  {
    id: 'donor-1',
    email: 'donor@example.com',
    password: hashPassword('password123'),
    user_type: 'donor',
    name: 'Jane Doe',
    phone: '+1 (555) 222-3344',
    address: '789 Kindness Blvd, Austin, TX 73301',
    city: 'Austin',
    state: 'TX',
    country: 'USA',
    pincode: '73301',
    description: 'Passionate about supporting education and child welfare.',
    website: null,
    logo_url: null,
    verified: true,
  connected_ngos: [],
    created_at: now(),
    updated_at: now(),
  },
  {
    id: 'donor-2',
    email: 'kindgiver@example.com',
    password: hashPassword('password123'),
    user_type: 'donor',
    name: 'Kind Giver',
    phone: '+1 (555) 987-1122',
    address: '52 Hope Street, Denver, CO 80014',
    city: 'Denver',
    state: 'CO',
    country: 'USA',
    pincode: '80014',
    description: 'Excited to support NGOs with time and resources.',
    website: null,
    logo_url: null,
    verified: true,
  connected_ngos: [],
    created_at: now(),
    updated_at: now(),
  },
];

const mockDonations = [
  {
    id: 'donation-1',
    donor_id: 'donor-1',
    ngo_id: 'ngo-1',
    amount: 5000,
    currency: 'USD',
    payment_method: 'credit_card',
    transaction_id: 'TXN123456',
    status: 'completed',
    message: 'Keep up the great work!',
    anonymous: false,
    donation_type: 'money',
    quantity: null,
    unit: null,
    essential_type: null,
    delivery_date: null,
    created_at: now(),
    updated_at: now(),
  },
  {
    id: 'donation-2',
    donor_id: 'donor-1',
    ngo_id: 'ngo-2',
    amount: 2500,
    currency: 'USD',
    payment_method: 'paypal',
    transaction_id: 'TXN654321',
    status: 'completed',
    message: null,
    anonymous: true,
    donation_type: 'food',
    quantity: 40,
    unit: 'boxes',
    essential_type: null,
    delivery_date: now(),
    created_at: now(),
    updated_at: now(),
  },
  {
    id: 'donation-3',
    donor_id: 'donor-2',
    ngo_id: 'ngo-1',
    amount: 0,
    currency: 'USD',
    payment_method: null,
    transaction_id: null,
    status: 'pending',
    message: 'Winter clothes delivery scheduled next week.',
    anonymous: false,
    donation_type: 'essentials',
    quantity: 75,
    unit: 'items',
    essential_type: 'clothes',
    delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: now(),
    updated_at: now(),
  },
];

const mockRequirements = [
  {
    id: 'req-1',
    ngo_id: 'ngo-1',
    title: 'School Supplies for 100 Children',
    description: 'Notebooks, backpacks, and stationery for underprivileged students.',
    category: 'education',
    amount_needed: 5000,
    currency: 'USD',
    priority: 'urgent',
    status: 'active',
    deadline: null,
    created_at: now(),
    updated_at: now(),
  },
  {
    id: 'req-2',
    ngo_id: 'ngo-2',
    title: 'Monthly Food Packages',
    description: 'Food essentials for 50 families for one month.',
    category: 'food',
    amount_needed: 3000,
    currency: 'USD',
    priority: 'high',
    status: 'active',
    deadline: null,
    created_at: now(),
    updated_at: now(),
  },
];

const useMockDb = () => process.env.USE_MOCK_DB === 'true';

const findUserById = (id) => mockUsers.find((user) => user.id === id) || null;
const findUserByEmail = (email) => mockUsers.find((user) => user.email === email) || null;

const createUser = (userData) => {
  const newUser = {
    id: uuidv4(),
    created_at: now(),
    updated_at: now(),
    verified: false,
    logo_url: null,
    connected_ngos: [],
    connected_donors: [],
    ...userData,
  };

  mockUsers.push(newUser);
  return newUser;
};

const updateUser = (id, updates) => {
  const user = findUserById(id);
  if (!user) return null;

  Object.assign(user, updates, { updated_at: now() });
  return user;
};

const getNGOs = () => mockUsers.filter((user) => user.user_type === 'ngo');

const createDonation = (donationData) => {
  const donation = {
    id: uuidv4(),
    status: 'pending',
    anonymous: false,
    created_at: now(),
    updated_at: now(),
    ...donationData,
    donation_type: donationData.donation_type || 'money',
    quantity: donationData.quantity ?? null,
    unit: donationData.unit ?? null,
    essential_type: donationData.essential_type ?? null,
    delivery_date: donationData.delivery_date ?? null,
  };

  mockDonations.push(donation);
  return donation;
};

const updateDonation = (id, updates) => {
  const donation = mockDonations.find((item) => item.id === id);
  if (!donation) return null;

  Object.assign(donation, updates, { updated_at: now() });
  return donation;
};

const addRequirement = (requirementData) => {
  const requirement = {
    id: uuidv4(),
    status: 'active',
    created_at: now(),
    updated_at: now(),
    ...requirementData,
  };

  mockRequirements.push(requirement);
  return requirement;
};

const updateRequirement = (id, updates) => {
  const requirement = mockRequirements.find((item) => item.id === id);
  if (!requirement) return null;

  Object.assign(requirement, updates, { updated_at: now() });
  return requirement;
};

const deleteRequirement = (id) => {
  const index = mockRequirements.findIndex((item) => item.id === id);
  if (index === -1) return false;
  mockRequirements.splice(index, 1);
  return true;
};

const sanitizeUser = (user) => {
  if (!user) return null;
  const { password, ...rest } = user;
  return rest;
};

const linkDonorNgo = (donorId, ngoId) => {
  const donor = findUserById(donorId);
  const ngo = findUserById(ngoId);

  if (!donor || donor.user_type !== 'donor') {
    throw new Error('Donor not found');
  }
  if (!ngo || ngo.user_type !== 'ngo') {
    throw new Error('NGO not found');
  }

  donor.connected_ngos = Array.from(
    new Set([...(donor.connected_ngos || []), ngoId])
  );
  ngo.connected_donors = Array.from(
    new Set([...(ngo.connected_donors || []), donorId])
  );
  donor.updated_at = now();
  ngo.updated_at = now();

  return {
    donor: sanitizeUser(donor),
    ngo: sanitizeUser(ngo),
  };
};

const unlinkDonorNgo = (donorId, ngoId) => {
  const donor = findUserById(donorId);
  const ngo = findUserById(ngoId);

  if (!donor || donor.user_type !== 'donor') {
    throw new Error('Donor not found');
  }
  if (!ngo || ngo.user_type !== 'ngo') {
    throw new Error('NGO not found');
  }

  donor.connected_ngos = (donor.connected_ngos || []).filter(
    (id) => id !== ngoId
  );
  ngo.connected_donors = (ngo.connected_donors || []).filter(
    (id) => id !== donorId
  );
  donor.updated_at = now();
  ngo.updated_at = now();

  return {
    donor: sanitizeUser(donor),
    ngo: sanitizeUser(ngo),
  };
};

const getConnectedDonorsForNgo = (ngoId) => {
  const ngo = findUserById(ngoId);
  if (!ngo || ngo.user_type !== 'ngo') {
    return [];
  }

  const ids = Array.isArray(ngo.connected_donors) ? ngo.connected_donors : [];
  return ids
    .map((id) => findUserById(id))
    .filter((donor) => donor && donor.user_type === 'donor')
    .map(sanitizeUser);
};

const getConnectedNgosForDonor = (donorId) => {
  const donor = findUserById(donorId);
  if (!donor || donor.user_type !== 'donor') {
    return [];
  }

  const ids = Array.isArray(donor.connected_ngos) ? donor.connected_ngos : [];
  return ids
    .map((id) => findUserById(id))
    .filter((ngo) => ngo && ngo.user_type === 'ngo')
    .map(sanitizeUser);
};

module.exports = {
  useMockDb,
  mockUsers,
  mockDonations,
  mockRequirements,
  findUserById,
  findUserByEmail,
  createUser,
  updateUser,
  getNGOs,
  createDonation,
  updateDonation,
  addRequirement,
  updateRequirement,
  deleteRequirement,
  linkDonorNgo,
  unlinkDonorNgo,
  getConnectedDonorsForNgo,
  getConnectedNgosForDonor,
};

