 #!/bin/bash
set -e

echo "Starting MishCredit deployment..."

# Determine which service to start based on RAILWAY_SERVICE_NAME or default to backend
SERVICE=${RAILWAY_SERVICE_NAME:-backend}

case $SERVICE in
  backend)
    echo "Starting backend service..."
    cd backend
    npm ci --production
    npm run build
    npm run start:prod
    ;;
  frontend)
    echo "Starting frontend service..."
    cd frontend
    npm ci
    npm run build
    # Serve static files (Railway provides PORT)
    npx serve -s dist -l ${PORT:-3000}
    ;;
  *)
    echo "Unknown service: $SERVICE"
    echo "Starting backend by default..."
    cd backend
    npm ci --production
    npm run build
    npm run start:prod
    ;;
esac