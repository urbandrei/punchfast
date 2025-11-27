#!/bin/bash
set -e

echo "=========================================="
echo "PunchFast Deployment Script"
echo "=========================================="

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd server
yarn install --production
cd ..

# Install and build frontend
echo "📦 Installing frontend dependencies and building..."
cd client
yarn build
echo "✅ React build completed"
cd ..

# Start server
echo "🚀 Starting backend server..."
cd server
yarn start
