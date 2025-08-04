# 🚀 TiM Local Development Setup

## ✅ What's Ready

Your TiM (Time is Money) application is now fully set up and ready for local development!

## 🏃‍♂️ Quick Start

### Option 1: Use the Startup Script (Recommended)
```bash
./start-dev.sh
```

### Option 2: Manual Startup
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

## 🌐 Access Your Application

- **Frontend App**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **API Health Check**: http://localhost:3000/health

## 🔐 Login Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@tim.com` | `password123` |
| **Account Manager** | `manager@tim.com` | `password123` |
| **Engineer** | `engineer@tim.com` | `password123` |

## 🗄️ Database Status

✅ **PostgreSQL** installed and running  
✅ **Database** `tim_dev` created  
✅ **Schema** applied with all tables  
✅ **Sample data** inserted  
✅ **Users** seeded with hashed passwords  

## 📱 Features Available

### Mobile-First Design
- ✅ Progressive Web App (PWA)
- ✅ Responsive design for all devices
- ✅ Touch-optimized interface
- ✅ Offline capability

### Authentication & Security
- ✅ JWT-based authentication
- ✅ Role-based access control
- ✅ Secure password hashing
- ✅ Input validation

### Core Functionality
- ✅ User management with invitations
- ✅ Customer management
- ✅ Time entry tracking
- ✅ Dashboard with analytics
- ✅ Reporting system

## 🛠️ Development Tools

### Backend (Node.js/Express)
- **Location**: `backend/`
- **Port**: 3000
- **Database**: PostgreSQL
- **Key Features**: RESTful API, JWT auth, role-based permissions

### Frontend (React/TypeScript)
- **Location**: `frontend/`
- **Port**: 3001
- **Build Tool**: Vite
- **Key Features**: PWA, offline support, mobile-first design

## 🔧 Available Scripts

### Backend Scripts
```bash
cd backend
npm run dev          # Start development server
npm run db:setup     # Setup database schema
npm run db:seed      # Seed users
npm run db:reset     # Reset database and seed
npm run test         # Run tests
npm run lint         # Lint code
```

### Frontend Scripts
```bash
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Lint code
npm run test         # Run tests
```

## 📁 Project Structure

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
├── start-dev.sh            # Development startup script
├── README.md               # Main documentation
└── SETUP.md               # This file
```

## 🎯 Next Steps

1. **Open the application**: Navigate to http://localhost:3001
2. **Login**: Use one of the test accounts above
3. **Explore features**: Try the dashboard, time entries, and customer management
4. **Mobile testing**: Open on your phone or use browser dev tools
5. **Development**: Start building new features!

## 🐛 Troubleshooting

### Backend Issues
- **Port 3000 in use**: Kill existing processes or change port in `.env`
- **Database connection**: Ensure PostgreSQL is running (`brew services start postgresql@14`)
- **Missing dependencies**: Run `npm install` in backend directory

### Frontend Issues
- **Port 3001 in use**: Kill existing processes or change port in `vite.config.ts`
- **Build errors**: Check TypeScript errors with `npm run lint`
- **Missing dependencies**: Run `npm install` in frontend directory
- **Tailwind CSS errors**: Ensure `@tailwindcss/forms` is installed (`npm install @tailwindcss/forms`)

### Database Issues
- **Reset database**: Run `npm run db:reset` in backend directory
- **PostgreSQL not running**: Start with `brew services start postgresql@14`
- **Permission issues**: Check PostgreSQL user permissions

## 🎉 You're All Set!

Your TiM application is ready for development. The mobile-first design, secure authentication, and comprehensive feature set provide a solid foundation for building a professional time tracking application.

Happy coding! 🚀 