#!/bin/bash

# BetterSearch - Frontend Only
# Run with: ./run.sh

# Clear port 3000 if in use
clear_port() {
  local pid=$(lsof -ti:$1)
  if [ -n "$pid" ]; then
    echo "🧹 Killing process on port $1 (PID: $pid)..."
    kill -9 $pid
  fi
}

clear_port 3000

echo "🚀 Starting BetterSearch..."
npm run dev
