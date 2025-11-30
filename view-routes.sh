#!/bin/bash

# View Routes Script
# Displays all routes currently in the database

echo "Fetching routes from database..."
cd server && node scripts/viewRoutes.js

if [ $? -eq 0 ]; then
    echo ""
else
    echo "Failed to fetch routes!"
    exit 1
fi
