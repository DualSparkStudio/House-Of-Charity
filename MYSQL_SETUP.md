# MySQL Workbench Setup Guide for House of Charity

This guide will help you connect your House of Charity application to MySQL Workbench.

## Prerequisites

1. **MySQL Server** installed on your system
2. **MySQL Workbench** installed
3. **Node.js** and **npm** installed

## Step 1: Set Up MySQL Database

### 1.1 Create Database in MySQL Workbench

1. Open MySQL Workbench
2. Connect to your MySQL server
3. Create a new database:
   ```sql
   CREATE DATABASE house_of_charity;
   USE house_of_charity;
   ```

### 1.2 Import the Schema

1. Copy the contents of `mysql_schema.sql` file
2. In MySQL Workbench, go to **File > Open SQL Script**
3. Paste the schema content
4. Click **Execute** (or press Ctrl+Shift+Enter)

This will create:
- `users` table (for donors and NGOs)
- `donations` table (for tracking donations)
- `requirements` table (for NGO requirements)
- Sample data for testing
- Indexes for performance
- Views and stored procedures

## Step 2: Configure Backend Environment

### 2.1 Update Database Configuration

1. Navigate to the `backend` folder
2. Copy `config.env` to `.env`:
   ```bash
   cd backend
   copy config.env .env
   ```

3. Edit `.env` file with your MySQL credentials:
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=house_of_charity

   # Server Configuration
   PORT=5000
   JWT_SECRET=your_super_secret_jwt_key_here

   # CORS Configuration
   FRONTEND_URL=http://localhost:3000
   ```

### 2.2 Install Backend Dependencies

```bash
cd backend
npm install
```

## Step 3: Configure Frontend Environment

### 3.1 Update Frontend Environment

Create a `.env` file in the root directory:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

## Step 4: Test the Connection

### 4.1 Start the Backend Server

```bash
cd backend
npm run dev
```

You should see:
```
🚀 Server running on port 5000
📊 Health check: http://localhost:5000/health
🔗 API Base URL: http://localhost:5000/api
✅ Connected to MySQL database successfully!
```

### 4.2 Test API Endpoints

1. **Health Check**: Visit `http://localhost:5000/health`
2. **Get NGOs**: Visit `http://localhost:5000/api/users/ngos`
3. **Get Requirements**: Visit `http://localhost:5000/api/requirements`

### 4.3 Start the Frontend

In a new terminal:
```bash
npm start
```

The React app will start on `http://localhost:3000`

## Step 5: Run Both Frontend and Backend Together

Install concurrently for running both servers:
```bash
npm install
```

Then run:
```bash
npm run dev
```

This will start both the backend (port 5000) and frontend (port 3000) simultaneously.

## Step 6: Test the Full Application

1. **Register a new user**:
   - Go to `/register`
   - Fill in the form
   - Check MySQL Workbench to see the user in the `users` table

2. **Login**:
   - Go to `/login`
   - Use your credentials
   - You should be redirected to the dashboard

3. **Create a donation**:
   - Go to `/dashboard`
   - Create a donation
   - Check the `donations` table in MySQL Workbench

4. **Create a requirement** (for NGOs):
   - Login as an NGO
   - Create a requirement
   - Check the `requirements` table in MySQL Workbench

## Troubleshooting

### Common Issues:

1. **Database Connection Error**:
   - Check MySQL server is running
   - Verify credentials in `.env` file
   - Ensure database `house_of_charity` exists

2. **Port Already in Use**:
   - Change PORT in backend `.env` file
   - Or kill the process using the port

3. **CORS Errors**:
   - Check `FRONTEND_URL` in backend `.env`
   - Ensure it matches your React app URL

4. **Authentication Issues**:
   - Check JWT_SECRET is set in backend `.env`
   - Clear browser localStorage and try again

### Database Queries for Testing:

```sql
-- Check users
SELECT * FROM users;

-- Check donations
SELECT * FROM donations;

-- Check requirements
SELECT * FROM requirements;

-- Check user stats
CALL GetDonorStats('user-id-here');
CALL GetNGOStats('ngo-id-here');
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/verify` - Verify token

### Users
- `GET /api/users/ngos` - Get all NGOs
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user profile
- `GET /api/users/:id/stats` - Get user statistics

### Donations
- `POST /api/donations` - Create donation
- `GET /api/donations` - Get all donations
- `GET /api/donations/donor/:id` - Get donations by donor
- `GET /api/donations/ngo/:id` - Get donations by NGO
- `PUT /api/donations/:id/status` - Update donation status

### Requirements
- `POST /api/requirements` - Create requirement
- `GET /api/requirements` - Get all requirements
- `GET /api/requirements/:id` - Get requirement by ID
- `PUT /api/requirements/:id` - Update requirement
- `DELETE /api/requirements/:id` - Delete requirement

## Next Steps

1. **Add password hashing** to the users table
2. **Implement file upload** for NGO logos
3. **Add email notifications**
4. **Implement payment gateway integration**
5. **Add admin dashboard**
6. **Deploy to production**

Your House of Charity application is now connected to MySQL Workbench! 🎉
