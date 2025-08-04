# TiM - Time is Money

A mobile-first time tracking and billing application built with Node.js, React, and PostgreSQL.

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **PostgreSQL** (v12 or higher)
- **npm** or **yarn**

### 1. Clone and Setup

```bash
git clone <repository-url>
cd tim_app
```

### 2. Database Setup

#### Install PostgreSQL

**macOS (using Homebrew):**
```bash
brew install postgresql
brew services start postgresql
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Windows:**
Download and install from [PostgreSQL official website](https://www.postgresql.org/download/windows/)

#### Create Database User

```bash
# Connect to PostgreSQL as superuser
sudo -u postgres psql

# Create user and database
CREATE USER tim_user WITH PASSWORD 'password';
CREATE DATABASE tim_dev OWNER tim_user;
GRANT ALL PRIVILEGES ON DATABASE tim_dev TO tim_user;
\q
```

### 3. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp env.example .env

# Edit .env file with your database credentials
# Update DB_USER, DB_PASSWORD if needed

# Setup database (creates tables and sample data)
npm run db:setup

# Seed users with login credentials
npm run db:seed

# Start development server
npm run dev
```

The backend will be available at `http://localhost:3000`

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3001`

## 📱 Login Credentials

After running the setup, you can login with these test accounts:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@tim.com` | `password123` |
| Account Manager | `manager@tim.com` | `password123` |
| Engineer | `engineer@tim.com` | `password123` |

## 🏗️ Project Structure

```
tim_app/
├── backend/                 # Node.js Express API
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Auth & validation
│   │   └── config/         # Database config
│   ├── database/           # SQL schema
│   ├── scripts/            # Setup scripts
│   └── package.json
├── frontend/               # React PWA
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── stores/         # Zustand state
│   │   ├── services/       # API services
│   │   └── types/          # TypeScript types
│   └── package.json
└── infra/                  # AWS infrastructure
    └── schema.sql          # Database schema
```

## 🔧 Development Scripts

### Backend

```bash
npm run dev          # Start development server
npm run db:setup     # Setup database schema
npm run db:seed      # Seed users
npm run db:reset     # Reset database and seed
npm run test         # Run tests
npm run lint         # Lint code
```

### Frontend

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Lint code
npm run test         # Run tests
```

## 🌟 Features

### Mobile-First Design
- **Progressive Web App (PWA)** - Installable on mobile devices
- **Offline Support** - Time entries work without internet
- **Touch Optimized** - Large buttons, swipe gestures
- **Responsive Design** - Works on all screen sizes

### Time Tracking
- **Quick Entry** - Fast time entry for mobile use
- **Customer Assignment** - Link time to specific clients
- **Status Management** - Draft, submitted, approved states
- **Offline Sync** - Automatic sync when online

### User Management
- **Role-Based Access** - Admin, Account Manager, Engineer roles
- **Invitation System** - Secure user onboarding
- **Profile Management** - User settings and preferences

### Reporting
- **Dashboard Analytics** - Overview of time and earnings
- **Customer Reports** - Client-specific insights
- **Export Functionality** - CSV export for billing

### Security
- **JWT Authentication** - Secure token-based auth
- **Role-Based Permissions** - Granular access control
- **Input Validation** - Comprehensive form validation
- **Rate Limiting** - Protection against abuse

## 🚀 Production Deployment

### Environment Variables

Create `.env` files for production:

**Backend (.env):**
```env
NODE_ENV=production
DB_HOST=your-db-host
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=tim_prod
JWT_SECRET=your-super-secret-jwt-key
```

**Frontend (.env):**
```env
VITE_API_URL=https://your-api-domain.com
```

### AWS Deployment

The application is designed for AWS deployment with:
- **RDS PostgreSQL** - Managed database
- **EC2/Lambda** - Backend hosting
- **S3 + CloudFront** - Frontend hosting
- **Cognito** - User authentication (optional)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
1. Check the documentation
2. Search existing issues
3. Create a new issue with details

---

**TiM - Time is Money** - Making time tracking simple and efficient! ⏰💰 