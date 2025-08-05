# 🧪 TiM Application - Manual Testing Guide

## 🚀 **Application Status: READY FOR TESTING**

### **Server Information**
- **Frontend URL**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **Backend Health**: ✅ Running (Status: OK)
- **Database**: ✅ Connected (PostgreSQL)

---

## 📋 **Pre-Testing Checklist**

### ✅ **Infrastructure Status**
- [x] Frontend development server running (Vite)
- [x] Backend API server running (Express.js)
- [x] Database connected and accessible
- [x] All dependencies installed
- [x] Test suite passing (15/15 backend tests)
- [x] JavaScript runtime errors fixed

### 📊 **Database Status**
- **Development Database**: `tim_dev`
- **Test Database**: `tim_test`
- **Users**: 3 users available
- **Customers**: Multiple customers available

### 🛠 **Recent Fixes Applied**
- ✅ **Dashboard Component**: Fixed `.toFixed()` JavaScript errors
- ✅ **Frontend Rendering**: Resolved blank page issues
- ✅ **Test Configuration**: Updated to Vitest for frontend
- ✅ **API Response Format**: Aligned frontend/backend expectations
- ✅ **Code Cleanup**: Removed mock data and test artifacts

---

## 🎯 **Manual Testing Scenarios**

### **1. Frontend Dashboard Testing**

#### **1.1 Dashboard Loading**
- **URL**: http://localhost:3001
- **Expected**: Dashboard loads with summary cards, charts, and navigation
- **Test Steps**:
  1. Open browser and navigate to http://localhost:3001
  2. Verify dashboard header displays correctly
  3. Check that all summary cards show data
  4. Verify period selector is functional
  5. **NEW**: Confirm no JavaScript errors in browser console

#### **1.2 Dashboard Components**
- **Summary Cards**: Verify earnings, hours, projects, and customers display
- **Charts**: Check monthly hours trend and status breakdown charts
- **Top Customers**: Verify customer list with progress bars
- **Recent Activity**: Check timeline displays recent activities
- **Quick Actions**: Test all action buttons
- **NEW**: Verify all numeric values display correctly (no NaN or undefined)

#### **1.3 Period Selection**
- **Test**: Change period selector (This Month, Last Month, etc.)
- **Expected**: Dashboard data updates accordingly
- **Verify**: Charts and metrics reflect selected period

#### **1.4 Responsive Design**
- **Test**: Resize browser window
- **Expected**: Layout adapts to different screen sizes
- **Verify**: Mobile-friendly design on smaller screens

#### **1.5 JavaScript Error Testing**
- **Test**: Open browser developer tools (F12)
- **Expected**: No JavaScript errors in console
- **Verify**: All `.toFixed()` calls work correctly
- **Check**: No "TypeError" or "undefined" errors

### **2. Backend API Testing**

#### **2.1 Health Check**
- **Endpoint**: `GET http://localhost:3000/health`
- **Expected Response**:
```json
{
  "status": "ok",
  "timestamp": "2025-08-05T07:58:02.453Z",
  "version": "1.0.0"
}
```

#### **2.2 Customers API**
- **Base URL**: `http://localhost:3000/api/customers`

##### **GET /api/customers**
- **Test**: Retrieve list of customers
- **Expected**: JSON response with customers array and pagination
- **Query Parameters**:
  - `?status=active` - Filter by status
  - `?search=test` - Search by name
  - `?limit=5&offset=0` - Pagination

##### **POST /api/customers**
- **Test**: Create new customer
- **Sample Request**:
```json
{
  "name": "Test Customer",
  "contactInfo": {
    "email": "test@example.com",
    "phone": "+1234567890"
  },
  "billingInfo": {
    "hourlyRate": 100,
    "currency": "USD"
  },
  "status": "active"
}
```

##### **PUT /api/customers/:id**
- **Test**: Update existing customer
- **Expected**: Customer data updated successfully

##### **DELETE /api/customers/:id**
- **Test**: Archive customer (soft delete)
- **Expected**: Customer status changed to "archived"

#### **2.3 Authentication Testing**
- **Note**: Authentication is currently bypassed for testing
- **Expected**: All endpoints accessible without authentication

### **3. Database Testing**

#### **3.1 Data Verification**
```sql
-- Check customers
SELECT COUNT(*) FROM customers;

-- Check users
SELECT COUNT(*) FROM users;

-- Check customer details
SELECT name, status, contact_info FROM customers LIMIT 5;
```

#### **3.2 Search Functionality**
- **Test**: Search for "Test Company Inc"
- **Expected**: Customer found in search results

---

## 🛠 **Testing Tools**

### **API Testing**
- **Browser**: Use browser developer tools
- **Postman**: Import API endpoints
- **curl**: Command line testing
- **Insomnia**: REST client

### **Frontend Testing**
- **Browser**: Chrome, Firefox, Safari
- **DevTools**: Network, Console, Elements
- **Mobile**: Responsive design testing

### **Database Testing**
- **psql**: PostgreSQL command line
- **pgAdmin**: GUI database tool
- **DBeaver**: Universal database tool

---

## 🐛 **Common Issues & Solutions**

### **Frontend Issues**
1. **Page not loading**: Check if Vite server is running
2. **API errors**: Verify backend server is running
3. **Styling issues**: Check if Tailwind CSS is loaded
4. **JavaScript errors**: Check browser console for `.toFixed()` errors
5. **Blank page**: Verify no runtime JavaScript errors

### **Backend Issues**
1. **Database connection**: Check PostgreSQL is running
2. **Port conflicts**: Verify port 3000 is available
3. **CORS errors**: Check CORS configuration

### **Database Issues**
1. **Connection refused**: Start PostgreSQL service
2. **Permission denied**: Check database user permissions
3. **Schema issues**: Run database setup script

### **Recent Fixes Applied**
- ✅ **Dashboard JavaScript Errors**: Fixed `.toFixed()` calls with `safeNumber()` wrapper
- ✅ **Frontend Rendering**: Resolved blank page caused by runtime errors
- ✅ **Test Configuration**: Updated frontend tests to use Vitest
- ✅ **MSW Integration**: Updated mock handlers to MSW v2 syntax

---

## 📝 **Test Results Template**

### **Test Session Log**
```
Date: _______________
Tester: _______________
Environment: Development

✅ Frontend Dashboard:
- [ ] Loading: ___
- [ ] Components: ___
- [ ] Responsive: ___
- [ ] Period Selection: ___
- [ ] JavaScript Errors: ___ (NEW)

✅ Backend API:
- [ ] Health Check: ___
- [ ] Customers GET: ___
- [ ] Customers POST: ___
- [ ] Customers PUT: ___
- [ ] Customers DELETE: ___

✅ Database:
- [ ] Connection: ___
- [ ] Data Integrity: ___
- [ ] Search: ___

Issues Found: _______________
Resolution: _______________
```

---

## 🚀 **Next Steps**

### **After Manual Testing**
1. **Document Issues**: Record any bugs or UX problems
2. **Performance Testing**: Test with larger datasets
3. **Security Testing**: Test authentication when implemented
4. **Integration Testing**: Test with external services

### **Production Preparation**
1. **Environment Variables**: Configure production settings
2. **Database Migration**: Prepare production database
3. **Deployment**: Set up CI/CD pipeline
4. **Monitoring**: Implement logging and monitoring

---

## 📞 **Support**

### **Development Team**
- **Backend Issues**: Check server logs in terminal
- **Frontend Issues**: Check browser console
- **Database Issues**: Check PostgreSQL logs

### **Useful Commands**
```bash
# Check server status
curl http://localhost:3000/health

# Check database
psql -U postgres -d tim_dev -c "SELECT COUNT(*) FROM customers;"

# Restart servers
./start-dev.sh    # Start both servers
./stop-dev.sh     # Stop both servers

# Check frontend URL (may vary)
curl -I http://localhost:3001

# Run tests
cd backend && npm test
cd frontend && npm test
```

---

**🎉 Happy Testing! The TiM application is ready for comprehensive manual testing with all recent fixes applied.** 