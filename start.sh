#!/bin/bash
# Install dependencies if not present
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

# Start Backend
echo "Starting Backend on port 8001..."
python3 backend/server.py &
BACKEND_PID=$!

# Start Frontend
echo "Starting Frontend..."
npm run dev &
FRONTEND_PID=$!

echo "Project is running!"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "Press CTRL+C to stop both servers."

trap "kill $BACKEND_PID $FRONTEND_PID; exit" SIGINT SIGTERM

wait
