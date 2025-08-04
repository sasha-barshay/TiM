#!/bin/bash

echo "🛑 Forcefully stopping TiM Development Environment..."

# Function to kill processes by port
kill_by_port() {
    local port=$1
    local pids=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pids" ]; then
        echo "📡 Killing processes on port $port: $pids"
        kill -9 $pids 2>/dev/null
        sleep 1
        # Double-check if any processes are still running
        local remaining_pids=$(lsof -ti:$port 2>/dev/null)
        if [ ! -z "$remaining_pids" ]; then
            echo "⚠️  Force killing remaining processes on port $port: $remaining_pids"
            kill -9 $remaining_pids 2>/dev/null
        fi
    else
        echo "✅ No processes found on port $port"
    fi
}

# Function to kill Node.js processes by name
kill_node_processes() {
    echo "🔍 Looking for Node.js processes..."
    
    # Kill nodemon processes
    local nodemon_pids=$(pgrep -f "nodemon" 2>/dev/null)
    if [ ! -z "$nodemon_pids" ]; then
        echo "📡 Killing nodemon processes: $nodemon_pids"
        kill -9 $nodemon_pids 2>/dev/null
    fi
    
    # Kill npm processes
    local npm_pids=$(pgrep -f "npm run dev" 2>/dev/null)
    if [ ! -z "$npm_pids" ]; then
        echo "📡 Killing npm dev processes: $npm_pids"
        kill -9 $npm_pids 2>/dev/null
    fi
    
    # Kill any remaining node processes that might be related to our app
    local node_pids=$(pgrep -f "node.*tim" 2>/dev/null)
    if [ ! -z "$node_pids" ]; then
        echo "📡 Killing tim-related node processes: $node_pids"
        kill -9 $node_pids 2>/dev/null
    fi
}

# Kill processes on specific ports
echo "🎯 Targeting specific ports..."
kill_by_port 3000  # Backend
kill_by_port 3001  # Frontend
kill_by_port 5173  # Vite default port (in case frontend uses different port)

# Kill Node.js processes
kill_node_processes

# Wait a moment for processes to fully terminate
sleep 2

# Final verification
echo ""
echo "🔍 Final verification..."
echo "Port 3000 (Backend):"
lsof -i :3000 2>/dev/null || echo "✅ No processes on port 3000"

echo "Port 3001 (Frontend):"
lsof -i :3001 2>/dev/null || echo "✅ No processes on port 3001"

echo "Port 5173 (Vite):"
lsof -i :5173 2>/dev/null || echo "✅ No processes on port 5173"

echo ""
echo "✅ All TiM development servers have been forcefully stopped!"
echo "🚀 You can now run ./start-dev.sh to start fresh servers." 