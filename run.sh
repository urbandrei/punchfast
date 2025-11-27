#!/bin/bash
set -e

echo "=========================================="
echo "PunchFast Deployment Script"
echo "=========================================="

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd server
npm install --production
cd ..

# Install and build frontend
echo "📦 Installing frontend dependencies..."
cd client
npm install
echo "🏗️  Building React frontend..."
npm run build
echo "✅ React build completed"
cd ..

# Start server
echo "🚀 Starting backend server..."
cd server
NODE_ENV=production node index.js
