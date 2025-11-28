#!/bin/bash

# Database Reset Script
# WARNING: This will delete ALL data from the database!

echo "⚠️  WARNING: This will delete ALL data from the database!"
echo "Press Ctrl+C within 3 seconds to cancel..."
sleep 3

echo "Starting database reset..."
cd server && node scripts/resetDatabase.js

if [ $? -eq 0 ]; then
    echo "✓ Database reset successful!"
else
    echo "✗ Database reset failed!"
    exit 1
fi
