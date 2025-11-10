# Supabase Setup Guide for House of Charity

This guide will help you set up Supabase for the House of Charity application.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - Name: `house-of-charity`
   - Database Password: Choose a strong password
   - Region: Choose the closest region to your users
5. Click "Create new project"

## 2. Get Your Project Credentials

1. In your Supabase dashboard, go to Settings > API
2. Copy the following values:
   - Project URL
   - Anon public key

## 3. Set Up Environment Variables

Create a `.env` file in your project root with the following variables:

```env
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 4. Set Up Database Schema

1. In your Supabase dashboard, go to SQL Editor
2. Copy and paste the contents of `supabase/schema.sql`
3. Click "Run" to execute the schema

This will create:
- `users` table for donors and NGOs
- `donations` table for tracking donations
- `requirements` table for NGO requirements
- Row Level Security (RLS) policies
- Triggers for automatic timestamps

## 5. Configure Authentication

1. Go to Authentication > Settings in your Supabase dashboard
2. Configure your site URL (e.g., `http://localhost:3000` for development)
3. Add any additional redirect URLs as needed

## 6. Install Dependencies

Run the following command to install Supabase client:

```bash
npm install @supabase/supabase-js
```

## 7. Test the Setup

1. Start your development server: `npm start`
2. Try to register a new user
3. Check the Supabase dashboard to see if the user was created

## 8. Database Tables Overview

### Users Table
- Stores both donors and NGOs
- Uses `user_type` field to distinguish between 'donor' and 'ngo'
- Automatically created when a user signs up

### Donations Table
- Tracks all donations made by donors to NGOs
- Includes payment information and status tracking
- Supports anonymous donations

### Requirements Table
- Stores NGO requirements/needs
- Includes priority levels and deadlines
- Supports different categories of requirements

## 9. Row Level Security (RLS)

The application uses RLS policies to ensure data security:

- Users can only view and edit their own profiles
- NGOs can only manage their own requirements
- Donations are visible to both the donor and recipient NGO
- Public requirements are visible to everyone

## 10. Next Steps

After setup, you can:
1. Customize the database schema as needed
2. Add additional RLS policies for specific use cases
3. Set up real-time subscriptions for live updates
4. Configure email templates for notifications

## Troubleshooting

### Common Issues

1. **Environment variables not loading**: Make sure your `.env` file is in the project root and variables start with `REACT_APP_`

2. **RLS blocking queries**: Check that your RLS policies are correctly configured

3. **Authentication errors**: Verify your Supabase URL and anon key are correct

4. **Database connection issues**: Ensure your Supabase project is active and not paused

### Getting Help

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [GitHub Issues](https://github.com/supabase/supabase/issues) 