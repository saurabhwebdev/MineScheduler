#!/usr/bin/env bash
# exit on error
set -o errexit

# Install backend dependencies
npm install

# Build frontend
cd client
npm install
npm run build
cd ..
