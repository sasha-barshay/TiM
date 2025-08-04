TiM (Time is Money) - Functional Application Description
Overview
TiM is a comprehensive time management and billing application designed for professional services teams. It enables users to track their work hours across multiple customers/projects, generate reports, and manage billing efficiently.

User Roles & Permissions
Admin
Full system access
Can create, edit, and delete all customers
Can invite and manage all users
Can assign users to customers in any role
Can view all time entries and reports across the organization
Can modify user roles and permissions
Account Manager
Can create and edit customers
Can view customers they are assigned to
Can log time entries for their assigned customers
Can view reports for their assigned customers
Cannot manage other users or system settings
Engineer
Read-only access to customers they are assigned to
Can log time entries for their assigned customers
Can view their own reports and time entries
Cannot create or edit customers
Cannot manage users
Core Features
1. User Management (Admin Only)
Invite Users: Create invitations with pre-assigned roles
Role Assignment: Assign users as Admin, Account Manager, or Engineer
Manual Invitation Process: Generate invitation text that admins copy and send via email
Automatic Setup: New users' roles are automatically assigned upon first login based on their invitation
2. Customer Management
Customer Creation: Name, contact details, billing information
User Assignment: Assign Account Managers, Leading Engineers, and Associated Engineers
Billing Configuration: Hourly rates, currency, timezone settings
Working Schedules: Link customers to predefined working schedule templates
Status Management: Active, Inactive, Archived customers
3. Time Entry System
Quick Entry: Log time with start/end times or direct hours
Customer Selection: Choose from assigned customers (filtered by permissions)
Calendar Integration: Visual calendar showing logged time entries
Status Tracking: Draft, Submitted, Approved entries
Minimum Time Validation: 30-minute minimum with automatic rounding
4. Reporting & Analytics
Dashboard Overview: Monthly hours, earnings, customer statistics
Time Reports: Filter by date range, customer, status
Customer Reports: Individual customer billing summaries
Export Functionality: CSV export for billing and analysis
Visual Charts: Monthly trends, top customers by hours/revenue
5. Settings & Configuration
Working Schedules: Create templates for different time zones and work patterns
User Profiles: Personal settings, timezone, contact information
System Configuration: Global application settings
Data Access Rules
Customer Access
Admins: See all customers
Account Managers & Engineers: Only see customers where they are listed in assigned_user_ids
Time Entry Access
Admins: Can view all time entries across the organization
Account Managers & Engineers: Can only log time for customers they are assigned to
User Data Access
Admins: Can view and manage all users
Non-Admins: Can only view their own profile data
Key Workflows
User Onboarding
Admin creates invitation with roles and timezone
Admin copies generated invitation text and emails it manually
New user clicks link, signs up with Google SSO
System automatically assigns roles from invitation upon first login
User can immediately access their assigned customers and log time
Time Logging
User selects customer from their assigned list
Enters date, start/end times (or direct hours)
Adds work description and sets status
System validates minimum time requirements
Entry is saved and visible in reports
Customer Assignment
Admin or Account Manager creates/edits customer
Assigns specific users as Account Manager, Leading Engineer, etc.
System automatically populates assigned_user_ids array
Assigned users immediately see customer in their filtered views
Technical Architecture
Entities
User: Extended with roles, timezone, working schedules
Customer: Complete business information with user assignments
TimeEntry: Time logging with customer references
Invitation: Pending user invitations with pre-assigned roles
WorkingSchedule: Templates for different work patterns
Security Model
Application-level filtering instead of database RLS
Role-based access control using custom roles array
Google SSO integration for authentication
Permission checks at component and data loading levels
User Interface
Responsive design for desktop and mobile
Modern sidebar navigation with role-based menu items
Real-time filtering based on user permissions
Intuitive forms with validation and error handling
Visual dashboard with charts and statistics
Current Status & Known Issues
Core functionality implemented and working
User permission filtering active at application level
Manual invitation process requires admin to send emails
Debug tools available for troubleshooting permissions
All major features functional for multi-user scenarios
This application provides a complete time tracking and billing solution suitable for consulting firms, agencies, and professional services organizations with multiple clients and team members.