#!/bin/bash

# Function to clear ports
clear_port() {
  local port=$1
  local pid=$(lsof -ti:$port)
  if [ -n "$pid" ]; then
    echo "🧹 Killing process on port $port (PID: $pid)..."
    kill -9 $pid
  fi
}

# Cleanup function for script exit
cleanup() {
    echo -e "\n🛑 Shutting down services..."
    kill $(jobs -p) 2>/dev/null
    exit
}

# Trap Ctrl+C (SIGINT)
trap cleanup SIGINT SIGTERM

# Clear ports 3000 (React) and 8001 (FastAPI)
clear_port 3000
clear_port 8001
clear_port 8000 # Just in case

echo "🚀 Starting BetterSearch Services..."

# Start Backend
echo "🐍 Starting Backend (Port 8001)..."
cd backend
# Use PYTHONUNBUFFERED to ensure logs show up immediately
export PYTHONUNBUFFERED=1
# Activate virtual environment
source venv/bin/activate
python3 server.py &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to initialize
sleep 2

# Start Frontend
echo "⚛️  Starting Frontend (Port 3000)..."
npm run dev &
FRONTEND_PID=$!

# Wait for both processes
echo "✅ Services Running. Press Ctrl+C to stop."
wait
