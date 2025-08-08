#!/bin/bash

# Production build script for Chrome Extension
# Usage: ./build-production.sh YOUR_PRODUCTION_DOMAIN

if [ -z "$1" ]; then
    echo "Usage: ./build-production.sh YOUR_PRODUCTION_DOMAIN"
    echo "Example: ./build-production.sh https://supamind.vercel.app"
    exit 1
fi

PRODUCTION_DOMAIN=$1

echo "Building Chrome Extension for production domain: $PRODUCTION_DOMAIN"

# Create temporary production env file
cat > .env.production.tmp << EOF
VITE_APP_ORIGIN=$PRODUCTION_DOMAIN
VITE_SUPABASE_URL=https://ehqdibhqhevjnknojogm.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVocWRpYmhxaGV2am5rbm9qb2dtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyMjA2NTIsImV4cCI6MjA2Nzc5NjY1Mn0.EPHkD66KS0L5zbSMegRzDs0vezziWGv_sQzm5xSEECw
VITE_GOOGLE_CLIENT_ID=896317691877-98bai5a87c014nlchk882d5je80ibqtn.apps.googleusercontent.com
EOF

# Backup current .env and use production env
cp .env .env.backup
cp .env.production.tmp .env

# Build the extension
npm run build

# Restore original .env
mv .env.backup .env
rm .env.production.tmp

echo "Production build complete! Extension ready in dist/ folder"
echo "Upload dist/ folder to Chrome Web Store"
