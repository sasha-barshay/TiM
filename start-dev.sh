#!/bin/bash

echo "🚀 Starting TiM Development Environment..."

# Function to cleanup background processes
cleanup() {
    echo "🛑 Shutting down servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start backend
echo "📡 Starting backend server..."
(cd backend && npm run dev) &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "🎨 Starting frontend server..."
(cd frontend && npm run dev) &
FRONTEND_PID=$!

echo "✅ Development servers started!"
echo ""
echo "🌐 Backend API: http://localhost:3000"
echo "🎨 Frontend App: http://localhost:3001"
echo ""
echo "📱 Login Credentials:"
echo "   Admin: admin@tim.com / password123"
echo "   Manager: manager@tim.com / password123"
echo "   Engineer: engineer@tim.com / password123"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for background processes
wait 