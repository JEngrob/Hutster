#!/bin/bash

# Azure App Service startup script for Linux
# This script is used when deploying to Azure App Service on Linux
# Note: NODE_ENV should be set in Azure App Service Configuration

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install --production=false
fi

# Build Next.js app
echo "Building Next.js app..."
npm run build

# Start the combined server
# NODE_ENV is set via Azure App Service Configuration
echo "Starting combined server..."
npm run start:production

