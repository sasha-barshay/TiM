# GCP Deployment Checklists

## Pre-Migration Checklist

- [ ] Backup current Render database
- [ ] Export environment variables from Render
- [ ] Test application locally with Docker
- [ ] Create GCP project
- [ ] Install gcloud CLI
- [ ] Setup Neon PostgreSQL account

---

## Database Migration Checklist

- [ ] Create Neon database
- [ ] Note connection string
- [ ] Run schema: `psql <url> < backend/database/schema.sql`
- [ ] Seed data: Update `DATABASE_URL` in `.env` and run `npm run db:seed`
- [ ] Verify tables created: `psql <url> -c "\dt"`
- [ ] Test connection from local backend

---

## Backend Deployment Checklist

- [ ] Create `.env.production` with all variables
- [ ] Test Docker build: `docker build -t tim-backend .`
- [ ] Test Docker run: `docker run -p 8080:8080 --env-file .env.production tim-backend`
- [ ] Test health endpoint: `curl http://localhost:8080/api/health`
- [ ] Deploy to Cloud Run: `gcloud builds submit --config cloudbuild.yaml`
- [ ] Set environment variables in Cloud Run console
- [ ] Test deployed backend: `curl https://<cloud-run-url>/api/health`
- [ ] Verify database connection in logs

---

## Frontend Deployment Checklist

- [ ] Update `.env.production` with Cloud Run backend URL
- [ ] Build: `npm run build`
- [ ] Test build locally: `npx serve dist`
- [ ] Create Cloud Storage bucket
- [ ] Upload: `gsutil -m cp -r dist/* gs://tim-frontend`
- [ ] Set public access: `gsutil iam ch allUsers:objectViewer gs://tim-frontend`
- [ ] Setup load balancer + CDN
- [ ] Test frontend URL

---

## Custom Domain Checklist

- [ ] Map Cloud Run backend to `api.barlys.com`
- [ ] Verify domain in GCP Console
- [ ] Update DNS CNAME for api subdomain
- [ ] Map Cloud Storage to `tim.barlys.com`
- [ ] Update DNS CNAME for tim subdomain
- [ ] Wait for SSL certificate provisioning (15-30 min)
- [ ] Test HTTPS on both domains

---

## Google OAuth Update Checklist

- [ ] Go to Google Cloud Console
- [ ] Add `https://tim.barlys.com` to Authorized JavaScript origins
- [ ] Add `https://tim.barlys.com` to Authorized redirect URIs
- [ ] Add `https://api.barlys.com` if needed
- [ ] Save changes
- [ ] Test OAuth login flow

---

## Testing Checklist

- [ ] Health check: `curl https://api.barlys.com/api/health`
- [ ] Frontend loads: https://tim.barlys.com
- [ ] Google login works
- [ ] Create time entry
- [ ] Edit time entry
- [ ] Delete time entry
- [ ] View reports
- [ ] Customer management (admin)
- [ ] User management (admin)
- [ ] Mobile responsiveness
- [ ] PWA functionality

---

## Monitoring Setup Checklist

- [ ] Enable Cloud Run logging
- [ ] Set up budget alert ($5/month)
- [ ] Enable Cloud Run metrics dashboard
- [ ] Setup uptime check for backend
- [ ] Setup uptime check for frontend
- [ ] Configure error reporting
- [ ] Test alert notifications

---

## Render Cleanup Checklist

⚠️ **Only after confirming GCP works perfectly!**

- [ ] Keep Render running for 48 hours parallel
- [ ] Monitor GCP for issues
- [ ] Backup final Render database
- [ ] Delete `tim-backend` service
- [ ] Delete `tim-frontend` service
- [ ] Delete `tim-database`
- [ ] Delete `tim-database-paid`
- [ ] Cancel Render subscription
- [ ] Remove payment method (if desired)

---

## Code Cleanup Checklist

- [ ] Delete `render.yaml`
- [ ] Delete `CUSTOM_DOMAIN_SETUP.md`
- [ ] Delete `deploy.md`
- [ ] Delete `scripts/deploy.sh` (if Render-specific)
- [ ] Update `README.md` with GCP instructions
- [ ] Add `GCP_MIGRATION.md` reference
- [ ] Commit changes
- [ ] Push to GitHub

---

## Rollback Checklist (If Needed)

- [ ] Revert DNS to Render
- [ ] Verify Render still works
- [ ] Investigate GCP issues
- [ ] Fix issues
- [ ] Re-attempt migration
- [ ] Document what went wrong

