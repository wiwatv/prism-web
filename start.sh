#!/bin/bash
echo "=============================================="
echo "       Starting PRISM Web Application"
echo "=============================================="
echo ""

# Check if node is installed
if ! command -v node &> /dev/null
then
    echo "[ERROR] Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "[INFO] First time setup: Installing dependencies..."
    npm install --production
fi

echo "[INFO] Starting the local server on http://localhost:3001"
echo ""
echo "Please keep this terminal window open while using the application."
echo "To stop the server, press Ctrl+C."
echo ""

# Try to open the browser automatically
if command -v xdg-open > /dev/null; then
  xdg-open http://localhost:3001 &
elif command -v open > /dev/null; then
  open http://localhost:3001 &
fi

node server.js
