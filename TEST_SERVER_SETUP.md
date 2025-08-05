# 🧪 Test Server Setup Documentation

## Overview
This document describes the test server setup for the TiM application and provides rollback instructions for when development is complete.

## 🚀 Test Server Architecture

### Components Added:
1. **Backend Test Server** (`backend/src/test-server.js`)
2. **Test Environment Config** (`frontend/test.env`)
3. **Updated Package Scripts** (both frontend and backend)
4. **Test Mode Authentication Bypass** (`backend/src/middleware/auth.js`)

### Port Configuration:
- **Main Backend**: Port 3000 (production/development)
- **Test Server**: Port 3002 (testing)
- **Frontend**: Port 3001 (development)

## 📋 Usage Instructions

### Starting the Test Server

#### Option 1: Manual Start
```bash
# Terminal 1: Start test server
cd backend
npm run test:server

# Terminal 2: Run frontend tests
cd frontend
npm test
```

#### Option 2: Automated Test with Server
```bash
# Frontend directory
npm run test:with-server
```

#### Option 3: Development Mode
```bash
# Terminal 1: Start test server in dev mode
cd backend
npm run test:server:dev

# Terminal 2: Start frontend with test API
cd frontend
VITE_API_URL=http://localhost:3002 npm run dev
```

### Testing the Setup

#### 1. Health Check
```bash
curl http://localhost:3002/health
```
Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-08-05T12:35:46.070Z",
  "version": "1.0.0",
  "environment": "test"
}
```

#### 2. Dashboard API Test
```bash
curl http://localhost:3002/api/reports/dashboard
```
Expected: Real dashboard data (no authentication required in test mode)

#### 3. Frontend Test
```bash
cd frontend
npm test
```
Expected: Tests pass with real API data

## 🔧 Configuration Details

### Test Server Features:
- ✅ **Authentication Bypass**: All requests get admin user context
- ✅ **CORS Enabled**: Allows frontend connections
- ✅ **Real Database**: Uses actual PostgreSQL data
- ✅ **Error Handling**: Proper error responses
- ✅ **Health Monitoring**: Health check endpoint
- ✅ **Graceful Shutdown**: Proper cleanup on exit

### Environment Variables:
```bash
# Backend
NODE_ENV=test
TEST_PORT=3002

# Frontend
VITE_API_URL=http://localhost:3002
VITE_ENV=test
```

## 🗑️ Rollback Instructions

### When Development is Complete:

#### 1. Remove Test Server Files
```bash
# Remove test server file
rm backend/src/test-server.js

# Remove test environment config
rm frontend/test.env
```

#### 2. Revert Package.json Changes

**Backend (`backend/package.json`):**
```json
// Remove these lines from "scripts":
"test:server": "node src/test-server.js",
"test:server:dev": "nodemon src/test-server.js",
```

**Frontend (`frontend/package.json`):**
```json
// Remove these lines from "scripts":
"test:with-server": "npm run test:server:start && npm run test && npm run test:server:stop",
"test:server:start": "cd ../backend && npm run test:server &",
"test:server:stop": "pkill -f 'node src/test-server.js'",
```

#### 3. Revert Vite Config
**Frontend (`frontend/vite.config.ts`):**
```typescript
// Change back to:
proxy: {
  '/api': {
    target: 'http://localhost:3000',
    changeOrigin: true,
    secure: false,
  }
}
```

#### 4. Remove Test Mode Authentication
**Backend (`backend/src/middleware/auth.js`):**
```javascript
// Remove this block:
if (process.env.NODE_ENV === 'test') {
  req.user = {
    id: '1',
    email: 'admin@tim.com',
    name: 'Admin User',
    roles: ['admin'],
    is_active: true
  };
  return next();
}
```

#### 5. Clean Up Database
```bash
# Optional: Remove test data if needed
cd backend
psql -U postgres -d tim_dev -c "DELETE FROM time_entries WHERE description LIKE '%test%';"
```

### Verification After Rollback:
1. ✅ Main backend starts on port 3000
2. ✅ Frontend connects to main backend
3. ✅ Authentication works properly
4. ✅ No test server processes running
5. ✅ All tests use proper mocking

## 🚨 Important Notes

### Security Considerations:
- **Test Mode Only**: Test server should NEVER run in production
- **Authentication Bypass**: Only active in test environment
- **Port Conflicts**: Ensure test server doesn't interfere with main server
- **Database Access**: Test server uses same database as main server

### Performance Impact:
- **Minimal**: Test server only runs during testing
- **Resource Usage**: Similar to main server
- **Database Load**: Uses same database, may impact performance during heavy testing

### Troubleshooting:

#### Port Already in Use:
```bash
# Check what's using port 3002
lsof -i :3002

# Kill process if needed
kill -9 <PID>
```

#### Test Server Won't Start:
```bash
# Check database connection
cd backend
psql -U postgres -d tim_dev -c "SELECT 1;"

# Check logs
npm run test:server
```

#### Tests Still Failing:
```bash
# Ensure test server is running
curl http://localhost:3002/health

# Check frontend environment
cd frontend
echo $VITE_API_URL
```

## 📝 Maintenance

### Regular Tasks:
1. **Update Test Data**: Refresh database with new sample data
2. **Port Monitoring**: Ensure no port conflicts
3. **Security Review**: Verify test mode is secure
4. **Performance Check**: Monitor test server performance

### Monitoring:
- Test server logs in console
- Health check endpoint
- Database connection status
- Port availability

---

**Last Updated**: 2025-08-05
**Version**: 1.0.0
**Status**: Active for Development 