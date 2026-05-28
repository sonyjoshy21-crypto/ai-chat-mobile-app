#!/bin/bash

# Exit immediately if any command exits with a non-zero status
set -e

echo "==================================================="
echo "  AI Chat Mobile App - Dependency Setup Script"
echo "==================================================="
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed. Please install Node.js (v18+) and try again."
    exit 1
fi

echo "[1/4] Installing backend dependencies..."
cd backend
npm install
cd ..

echo "[2/4] Setting up backend environment file..."
cd backend
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Created .env file from .env.example in backend/"
    echo "Please configure your GEMINI_API_KEY and MONGODB_URI in backend/.env if needed."
else
    echo "backend/.env already exists. Skipping copy."
fi
cd ..

echo "[3/4] Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo ""
echo "==================================================="
echo "  Installation Successful!"
echo "==================================================="
echo ""
echo "To run the application:"
echo ""
echo "  1. Start the Backend:"
echo "     cd backend"
echo "     npm run dev"
echo ""
echo "  2. Start the Frontend (Expo Dev Server):"
echo "     cd frontend"
echo "     npm start"
echo ""
