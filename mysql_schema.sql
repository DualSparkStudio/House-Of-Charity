-- MySQL Schema for House of Charity Application
-- This schema is compatible with MySQL Workbench

-- Create database (uncomment if you want to create a new database)
-- CREATE DATABASE IF NOT EXISTS house_of_charity;
-- USE house_of_charity;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY, -- Using VARCHAR(36) for UUID
  email VARCHAR(255) UNIQUE NOT NULL,
  user_type ENUM('donor', 'ngo') NOT NULL,
  name VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100) DEFAULT 'India',
  pincode VARCHAR(10),
  description TEXT,
  website VARCHAR(255),
  logo_url VARCHAR(500),
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create donations table
CREATE TABLE IF NOT EXISTS donations (
  id VARCHAR(36) PRIMARY KEY, -- Using VARCHAR(36) for UUID
  donor_id VARCHAR(36) NOT NULL,
  ngo_id VARCHAR(36) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  payment_method VARCHAR(50),
  transaction_id VARCHAR(255),
  status ENUM('pending', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
  message TEXT,
  anonymous BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign key constraints
  FOREIGN KEY (donor_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (ngo_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create requirements table
CREATE TABLE IF NOT EXISTS requirements (
  id VARCHAR(36) PRIMARY KEY, -- Using VARCHAR(36) for UUID
  ngo_id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  amount_needed DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'INR',
  priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  status ENUM('active', 'fulfilled', 'cancelled') DEFAULT 'active',
  deadline DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign key constraints
  FOREIGN KEY (ngo_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_donations_donor_id ON donations(donor_id);
CREATE INDEX idx_donations_ngo_id ON donations(ngo_id);
CREATE INDEX idx_donations_status ON donations(status);
CREATE INDEX idx_donations_created_at ON donations(created_at);
CREATE INDEX idx_requirements_ngo_id ON requirements(ngo_id);
CREATE INDEX idx_requirements_status ON requirements(status);
CREATE INDEX idx_requirements_category ON requirements(category);
CREATE INDEX idx_requirements_priority ON requirements(priority);
CREATE INDEX idx_requirements_deadline ON requirements(deadline);

-- Insert sample data for testing
INSERT INTO users (id, email, user_type, name, phone, city, state, description, verified) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'john.doe@example.com', 'donor', 'John Doe', '+91-9876543210', 'Mumbai', 'Maharashtra', 'Passionate about helping children in need', TRUE),
('550e8400-e29b-41d4-a716-446655440002', 'jane.smith@example.com', 'donor', 'Jane Smith', '+91-9876543211', 'Delhi', 'Delhi', 'Animal welfare advocate', TRUE),
('550e8400-e29b-41d4-a716-446655440003', 'admin@helpinghands.org', 'ngo', 'Helping Hands Foundation', '+91-9876543212', 'Bangalore', 'Karnataka', 'We provide education and healthcare to underprivileged children across India', TRUE),
('550e8400-e29b-41d4-a716-446655440004', 'info@greenearth.org', 'ngo', 'Green Earth Society', '+91-9876543213', 'Chennai', 'Tamil Nadu', 'Environmental conservation and sustainable development initiatives', TRUE),
('550e8400-e29b-41d4-a716-446655440005', 'contact@animalcare.org', 'ngo', 'Animal Care Trust', '+91-9876543214', 'Pune', 'Maharashtra', 'Rescue, rehabilitation, and adoption of stray animals', TRUE);

-- Insert sample donations
INSERT INTO donations (id, donor_id, ngo_id, amount, currency, payment_method, status, message, anonymous, created_at) VALUES
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 5000.00, 'INR', 'UPI', 'completed', 'For children education fund', FALSE, '2024-01-15 10:30:00'),
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440005', 3000.00, 'INR', 'Credit Card', 'completed', 'For animal rescue operations', FALSE, '2024-01-16 14:20:00'),
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', 2000.00, 'INR', 'Net Banking', 'pending', 'For tree plantation drive', TRUE, '2024-01-17 09:15:00');

-- Insert sample requirements
INSERT INTO requirements (id, ngo_id, title, description, category, amount_needed, currency, priority, status, deadline, created_at) VALUES
('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 'School Supplies for 100 Children', 'We need notebooks, pencils, bags, and other school supplies for underprivileged children in rural areas', 'Education', 15000.00, 'INR', 'high', 'active', '2024-02-15', '2024-01-10 08:00:00'),
('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440004', 'Tree Plantation Drive', 'Organizing a large-scale tree plantation drive in urban areas to combat air pollution', 'Environment', 25000.00, 'INR', 'medium', 'active', '2024-03-01', '2024-01-12 10:30:00'),
('770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440005', 'Animal Medical Care Fund', 'Emergency medical treatment and vaccination for rescued animals', 'Animal Welfare', 20000.00, 'INR', 'urgent', 'active', '2024-01-25', '2024-01-14 16:45:00'),
('770e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003', 'Digital Learning Equipment', 'Tablets and educational software for digital learning in remote schools', 'Education', 50000.00, 'INR', 'medium', 'active', '2024-04-01', '2024-01-16 11:20:00');

-- Create views for common queries
CREATE VIEW donor_donations AS
SELECT 
    d.id,
    d.amount,
    d.currency,
    d.status,
    d.message,
    d.anonymous,
    d.created_at,
    u.name as ngo_name,
    u.description as ngo_description
FROM donations d
JOIN users u ON d.ngo_id = u.id
WHERE u.user_type = 'ngo';

CREATE VIEW ngo_requirements AS
SELECT 
    r.id,
    r.title,
    r.description,
    r.category,
    r.amount_needed,
    r.currency,
    r.priority,
    r.status,
    r.deadline,
    r.created_at,
    u.name as ngo_name
FROM requirements r
JOIN users u ON r.ngo_id = u.id
WHERE u.user_type = 'ngo';

-- Create stored procedures for common operations
DELIMITER //

CREATE PROCEDURE GetDonorStats(IN donor_id VARCHAR(36))
BEGIN
    SELECT 
        COUNT(*) as total_donations,
        SUM(amount) as total_amount,
        AVG(amount) as average_amount,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_donations
    FROM donations 
    WHERE donor_id = donor_id;
END //

CREATE PROCEDURE GetNGOStats(IN ngo_id VARCHAR(36))
BEGIN
    SELECT 
        COUNT(DISTINCT d.id) as total_donations_received,
        SUM(d.amount) as total_amount_received,
        COUNT(DISTINCT r.id) as total_requirements,
        COUNT(CASE WHEN r.status = 'active' THEN 1 END) as active_requirements
    FROM users u
    LEFT JOIN donations d ON u.id = d.ngo_id
    LEFT JOIN requirements r ON u.id = r.ngo_id
    WHERE u.id = ngo_id AND u.user_type = 'ngo';
END //

DELIMITER ;

-- Add comments to tables
ALTER TABLE users COMMENT = 'Stores user information for both donors and NGOs';
ALTER TABLE donations COMMENT = 'Records all donations made by donors to NGOs';
ALTER TABLE requirements COMMENT = 'Stores NGO requirements and funding needs';
