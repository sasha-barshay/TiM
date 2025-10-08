# GCP Migration Plan

## Overview
**From:** Render ($14/month)  
**To:** Google Cloud Run + Neon PostgreSQL (~$0-2/month)  
**Time:** 2-3 hours

---

## Phase 1: Preparation (30 min)

### 1.1 Database Setup
- [ ] Sign up: https://neon.tech (free tier: 3GB, 0.5GB RAM)
- [ ] Create project: `tim-production`
- [ ] Create database: `tim_production`
- [ ] Save connection string
- [ ] Run migration: `psql <connection-string> < backend/database/schema.sql`
- [ ] Seed users: `node backend/scripts/seed-users.js`

### 1.2 GCP Setup
- [ ] Enable billing: https://console.cloud.google.com/billing
- [ ] Create project: `tim-app`
- [ ] Enable APIs: Cloud Run, Cloud Build, Artifact Registry
- [ ] Install gcloud CLI: https://cloud.google.com/sdk/docs/install

---

## Phase 2: Application Changes (45 min)

### 2.1 Backend
**Changes:** Docker configuration, port handling
- [x] Dockerfile created
- [x] .dockerignore created
- [x] cloudbuild.yaml created
- [ ] Update PORT handling (already done)

### 2.2 Frontend
**Changes:** Build for Cloud Storage
- [x] Dockerfile created (optional)
- [ ] Build command: `npm run build`
- [ ] Output: `dist/` folder

### 2.3 Environment Variables
**Backend:**
```bash
PORT=8080
NODE_ENV=production
DATABASE_URL=<neon-connection-string>
JWT_SECRET=<generate-new>
GOOGLE_CLIENT_ID=<existing>
GOOGLE_CLIENT_SECRET=<existing>
GOOGLE_CLIENT_TYPE=web
FRONTEND_URL=https://tim.barlys.com
ALLOWED_ORIGINS=https://tim.barlys.com,http://localhost:3001
```

**Frontend (build-time):**
```bash
VITE_API_URL=<cloud-run-backend-url>/api
VITE_GOOGLE_CLIENT_ID=<existing>
VITE_NODE_ENV=production
```

---

## Phase 3: Deployment (45 min)

### 3.1 Backend to Cloud Run
```bash
# Build and deploy
cd backend
gcloud builds submit --config cloudbuild.yaml
gcloud run deploy tim-backend \
  --image gcr.io/tim-app/tim-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars-file=.env.production
```

### 3.2 Frontend to Cloud Storage + CDN
```bash
# Build
cd frontend
npm run build

# Deploy to Cloud Storage
gsutil mb -p tim-app -c STANDARD -l us-central1 gs://tim-frontend
gsutil -m cp -r dist/* gs://tim-frontend
gsutil iam ch allUsers:objectViewer gs://tim-frontend

# Enable CDN
gcloud compute backend-buckets create tim-frontend-backend \
  --gcs-bucket-name=tim-frontend \
  --enable-cdn
```

### 3.3 Custom Domain
```bash
# Map domain to Cloud Run backend
gcloud run domain-mappings create --service tim-backend --domain api.barlys.com

# Map domain to Cloud Storage frontend  
gcloud compute url-maps create tim-frontend-map \
  --default-backend-bucket tim-frontend-backend
```

---

## Phase 4: DNS & Testing (15 min)

### 4.1 Update DNS
```
# Backend API
Type: CNAME
Name: api
Value: ghs.googlehosted.com

# Frontend
Type: CNAME  
Name: tim
Value: c.storage.googleapis.com
```

### 4.2 Verification
- [ ] Health check: `curl https://api.barlys.com/api/health`
- [ ] Frontend loads: https://tim.barlys.com
- [ ] Login works
- [ ] Create time entry
- [ ] Check database data

---

## Phase 5: Cleanup (15 min)

### 5.1 Render Shutdown
- [ ] Export any remaining data
- [ ] Delete `tim-backend` service
- [ ] Delete `tim-frontend` service  
- [ ] Delete `tim-database` (after confirming migration)
- [ ] Delete `tim-database-paid`
- [ ] Cancel Render subscription

### 5.2 Remove Render Files
- [ ] Delete `render.yaml`
- [ ] Delete `deploy.md` (replace with GCP guide)
- [ ] Delete `CUSTOM_DOMAIN_SETUP.md` (Render-specific)
- [ ] Delete `scripts/deploy.sh` (Render-specific)
- [ ] Update README.md

---

## Rollback Plan

If migration fails:
1. Keep Render running during migration
2. Test GCP fully before DNS switch
3. Can revert DNS immediately if issues
4. Database backup on Neon (point-in-time recovery)

---

## Cost Monitoring

### Cloud Run Free Tier
- 2M requests/month
- 360k GB-seconds memory
- 180k vCPU-seconds

### Expected Usage (TiM)
- ~10k requests/month = $0
- Well within free tier

### Set Budget Alert
```bash
gcloud billing budgets create --billing-account=<id> \
  --display-name="TiM App Budget" \
  --budget-amount=5USD
```

---

## Support

- Cloud Run docs: https://cloud.google.com/run/docs
- Neon docs: https://neon.tech/docs
- GCP pricing: https://cloud.google.com/run/pricing

