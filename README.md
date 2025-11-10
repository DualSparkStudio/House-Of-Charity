# House of Charity

A modern web platform connecting donors and NGOs for charitable donations. Built with React, TypeScript, and Firebase, designed for deployment on Netlify.

## 🌟 Features

### For Donors
- **Browse NGOs**: Discover and connect with verified non-governmental organizations
- **Multiple Donation Types**: Support money, food items, daily essentials, and more
- **Connection Management**: Connect with NGOs to receive updates on their work
- **Donation History**: Track all your donations and their impact
- **Real-time Updates**: Get notified about new NGO requirements and activities

### For NGOs
- **Profile Management**: Create comprehensive organization profiles
- **Donation Dashboard**: View and manage incoming donations
- **Requirements Posting**: Post specific needs and notify all donors
- **Work Showcase**: Display past works, awards, and achievements
- **Donor Connections**: Manage relationships with donors

### Platform Features
- **Secure Authentication**: Firebase-based user authentication
- **Real-time Database**: Firestore for data management
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Modern UI/UX**: Beautiful, intuitive interface
- **Search & Filter**: Advanced NGO discovery tools

## 🧱 Architecture Overview

- **Frontend**: React 18 + TypeScript + Tailwind CSS (served via Vercel or Netlify)
- **Backend**: Express REST API (deployable to Vercel Serverless or any Node host)
- **Authentication**: JWT-based via the Express backend
- **Database Options**:
  - `USE_MOCK_DB=true` → in-memory mock data for instant demos (default)
  - `USE_MOCK_DB=false` → MySQL 8+ (see `mysql_schema.sql`)

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Firebase project setup

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/house-of-charity.git
   cd house-of-charity
   ```

2. **Install dependencies**
   ```bash
   npm install
   npm run install-backend
   ```

3. **Environment Variables**
   - Frontend (`.env` at project root)
     ```env
     REACT_APP_API_URL=https://your-backend-domain/api
     ```
     (defaults to `http://localhost:5000/api` if not set)
   - Backend (`backend/config.env`)
     ```env
     PORT=5000
     FRONTEND_URL=http://localhost:3000
     JWT_SECRET=change_me
     JWT_EXPIRE=7d
     USE_MOCK_DB=true
     
     # Optional MySQL settings (only needed when USE_MOCK_DB=false)
     DB_HOST=localhost
     DB_USER=root
     DB_PASSWORD=
     DB_NAME=house_of_charity
     ```

4. **Run in development**
   ```bash
   npm run dev
   ```
   This starts the React dev server (3000) and Express API (5000). Mock data is enabled by default.

5. **Build frontend only**
   ```bash
   npm run build
   ```

6. **Run backend only**
   ```bash
   cd backend
   npm run dev
   ```

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   └── Layout/         # Header, Footer, Layout components
├── contexts/           # React contexts (Auth, etc.)
├── firebase/           # Firebase configuration
├── pages/              # Page components
│   └── auth/          # Authentication pages
├── types/              # TypeScript type definitions
├── App.tsx            # Main app component
├── index.tsx          # App entry point
└── index.css          # Global styles
```

## 🚀 Deployment (GitHub + Vercel)

### 1. Push the full stack to GitHub
```bash
git add .
git commit -m "Prepare deployment"
git push origin main
```

### 2. Frontend on Vercel
- Import your GitHub repository in [Vercel](https://vercel.com/import)
- Build command: `npm run build`
- Output directory: `build`
- Environment variables:
  - `REACT_APP_API_URL=https://<your-project-name>.vercel.app/api`

Vercel will deploy the React SPA from the root directory.

### 3. Backend (Express API) on Vercel Functions
- The repository already contains `api/index.js`, which wraps the Express app (`backend/app.js`) with `serverless-http`
- Add backend environment variables in Vercel → Project → Settings → Environment Variables:
  - `USE_MOCK_DB=true`
  - `JWT_SECRET=change_me_in_production`
  - `FRONTEND_URL=https://<your-project-name>.vercel.app`
  - (Optional) MySQL credentials if you plan to switch `USE_MOCK_DB` to `false`
- Redeploy. Your API will be available at `https://<your-project-name>.vercel.app/api/...`

### 4. Preview locally before deploying
```bash
npm run dev
# Frontend: http://localhost:3000
# Backend:  http://localhost:5000/api
```

### 5. Switching to MySQL later
1. Set `USE_MOCK_DB=false` in `backend/config.env` (and in Vercel)
2. Provide `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
3. Run the schema in `mysql_schema.sql`
4. Redeploy the backend

## ⚙️ Customization Tips

- Colors & theme: `tailwind.config.js`
- Global styles: `src/index.css`
- UI building blocks: `src/components/`
- Mock data (when `USE_MOCK_DB=true`): `backend/services/mockData.js`

## 📱 Features in Detail

### User Authentication
- Secure login/registration system
- User type selection (Donor/NGO)
- Protected routes
- Profile management

### NGO Discovery
- Advanced search and filtering
- Verification badges
- Detailed organization profiles
- Contact information

### Donation System
- Multiple donation types (money, food, essentials)
- Real-time status tracking
- Donation history
- Impact visualization

### Communication
- NGO requirement notifications
- Connection management
- Real-time updates
- Activity feeds

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Routing**: React Router v6
- **Forms**: React Hook Form
- **Notifications**: React Hot Toast
- **Icons**: Lucide React
- **Deployment**: Netlify

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@houseofcharity.org or create an issue in this repository.

## 🔮 Roadmap

- [ ] Mobile app development
- [ ] Advanced analytics dashboard
- [ ] Payment gateway integration
- [ ] Multi-language support
- [ ] Advanced notification system
- [ ] Social media integration
- [ ] Volunteer management system
- [ ] Impact measurement tools

---

**Made with ❤️ for making the world a better place** 