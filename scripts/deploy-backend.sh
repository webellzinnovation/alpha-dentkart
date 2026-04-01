#!/bin/bash

# Alpha Dentkart Backend Deployment Script
# Deploys to Google Cloud Run

set -e

echo "🚀 Starting Alpha Dentkart Backend Deployment..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI not found. Please install Google Cloud SDK."
    exit 1
fi

# Set project
PROJECT_ID="alphadentkart-001"
SERVICE_NAME="api"
REGION="asia-south1"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

echo "📦 Building Docker image..."
cd backend
docker build -t $IMAGE_NAME .
cd ..

echo "🚀 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --image $IMAGE_NAME \
    --platform managed \
    --region $REGION \
    --project $PROJECT_ID \
    --allow-unauthenticated \
    --set-env-vars "NODE_ENV=production,PORT=3001" \
    --service-account "firebase-adminsdk@$PROJECT_ID.iam.gserviceaccount.com"

echo "✅ Deployment complete!"
echo "🌐 API URL: $(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --project $PROJECT_ID --format 'value(status.url)')"
