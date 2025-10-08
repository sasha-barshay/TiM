#!/bin/bash
set -e

echo "🚀 TiM GCP Deployment Script"
echo "=============================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "\n${YELLOW}Checking prerequisites...${NC}"

if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI not found. Install: https://cloud.google.com/sdk/docs/install${NC}"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not found. Install: https://docs.docker.com/get-docker/${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Get project ID
echo -e "\n${YELLOW}Enter your GCP Project ID:${NC}"
read -r PROJECT_ID

if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}❌ Project ID cannot be empty${NC}"
    exit 1
fi

# Set project
gcloud config set project "$PROJECT_ID"

# Deploy backend
echo -e "\n${YELLOW}Deploying backend to Cloud Run...${NC}"
cd backend

if [ ! -f ".env.production" ]; then
    echo -e "${RED}❌ .env.production not found. Copy from env.production.template${NC}"
    exit 1
fi

gcloud builds submit --config cloudbuild.yaml

echo -e "${GREEN}✅ Backend deployed${NC}"

# Get backend URL
BACKEND_URL=$(gcloud run services describe tim-backend --platform managed --region us-central1 --format 'value(status.url)')
echo -e "${GREEN}Backend URL: ${BACKEND_URL}${NC}"

# Build frontend
echo -e "\n${YELLOW}Building frontend...${NC}"
cd ../frontend

# Update frontend env with backend URL
echo "VITE_API_URL=${BACKEND_URL}/api" > .env.production
echo "VITE_GOOGLE_CLIENT_ID=38029766832-datp9enkof3h02j822vm1bh83kqm8fr8.apps.googleusercontent.com" >> .env.production
echo "VITE_NODE_ENV=production" >> .env.production

npm run build

echo -e "${GREEN}✅ Frontend built${NC}"

# Deploy frontend to Cloud Storage
echo -e "\n${YELLOW}Deploying frontend to Cloud Storage...${NC}"

BUCKET_NAME="tim-frontend-${PROJECT_ID}"
gsutil mb -p "$PROJECT_ID" -c STANDARD -l us-central1 "gs://${BUCKET_NAME}" 2>/dev/null || echo "Bucket already exists"
gsutil -m rsync -r -d dist "gs://${BUCKET_NAME}"
gsutil iam ch allUsers:objectViewer "gs://${BUCKET_NAME}"
gsutil web set -m index.html -e index.html "gs://${BUCKET_NAME}"

echo -e "${GREEN}✅ Frontend deployed${NC}"
echo -e "${GREEN}Frontend URL: https://storage.googleapis.com/${BUCKET_NAME}/index.html${NC}"

echo -e "\n${GREEN}🎉 Deployment complete!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Setup custom domain in GCP Console"
echo "2. Update DNS records"
echo "3. Update Google OAuth settings"
echo "4. Test the application"

cd ..

