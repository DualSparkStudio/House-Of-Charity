-- Seed data for donors in the House of Charity Supabase project.
-- Run this after the schema and NGO seeds if you want sample donors.

insert into public.donors (
  id,
  name,
  email,
  password_hash,
  phone_number,
  address,
  city,
  state,
  country,
  pincode,
  description,
  website,
  logo_url,
  verified,
  created_at,
  updated_at
) values
  -- Password: donor123
  (
    gen_random_uuid(),
    'Aryan Sharma',
    'aryan.sharma@example.com',
    crypt('donor123', gen_salt('bf')),
    '+91-9123456789',
    'Flat 12A, Infinity Towers, Park Street',
    'Kolkata',
    'West Bengal',
    'India',
    '700016',
    'Entrepreneur passionate about child healthcare and education.',
    'https://aryansharma.dev',
    'https://assets.example.org/avatars/aryan.png',
    true,
    now(),
    now()
  ),
  -- Password: donor456
  (
    gen_random_uuid(),
    'Meera Iyer',
    'meera.iyer@example.com',
    crypt('donor456', gen_salt('bf')),
    '+91-9988776655',
    'Villa 9, Lotus Enclave, Jubilee Hills',
    'Hyderabad',
    'Telangana',
    'India',
    '500033',
    'Corporate professional supporting climate action initiatives.',
    'https://meera-iyer.com',
    'https://assets.example.org/avatars/meera.png',
    true,
    now(),
    now()
  ),
  -- Password: donor789
  (
    gen_random_uuid(),
    'Raghav Patel',
    'raghav.patel@example.com',
    crypt('donor789', gen_salt('bf')),
    '+91-9012345678',
    '21, Sunrise Apartments, Gandhinagar',
    'Ahmedabad',
    'Gujarat',
    'India',
    '380009',
    'IT consultant donating time and resources to women empowerment.',
    null,
    null,
    false,
    now(),
    now()
  )
on conflict (email) do update
set
  name = excluded.name,
  password_hash = excluded.password_hash,
  phone_number = excluded.phone_number,
  address = excluded.address,
  city = excluded.city,
  state = excluded.state,
  country = excluded.country,
  pincode = excluded.pincode,
  description = excluded.description,
  website = excluded.website,
  logo_url = excluded.logo_url,
  verified = excluded.verified,
  updated_at = now();

