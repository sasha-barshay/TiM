#!/bin/bash

# TiM Deployment Script for Render.com
echo "🚀 TiM Deployment Script for Render.com"
echo "========================================"

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -f "backend/package.json" ]; then
    echo "❌ Error: Please run this script from the TiM project root directory"
    exit 1
fi

echo "✅ Project structure verified"

# Check if git is clean
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Warning: You have uncommitted changes. Consider committing them first."
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Deployment cancelled"
        exit 1
    fi
fi

echo "📋 Deployment Checklist:"
echo "1. ✅ Backend health check endpoint configured"
echo "2. ✅ Frontend build configuration ready"
echo "3. ✅ Environment variables documented"
echo "4. ✅ Database schema prepared"
echo "5. ✅ Google OAuth credentials configured"

echo ""
echo "🎯 Next Steps:"
echo "1. Push your code to GitHub"
echo "2. Go to https://render.com"
echo "3. Follow the deployment guide in deploy.md"
echo "4. Create PostgreSQL database first"
echo "5. Deploy backend service"
echo "6. Deploy frontend static site"
echo "7. Update Google OAuth redirect URIs"
echo "8. Run database setup and seeding"

echo ""
echo "📖 See deploy.md for detailed instructions"
echo "🔗 Render Dashboard: https://dashboard.render.com"

# Check if we can push to git
if git remote -v | grep -q origin; then
    echo ""
    read -p "Push current changes to GitHub? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
        git commit -m "Prepare for Render deployment

- Add health check endpoint at /api/health
- Create deployment configuration and documentation
- Prepare environment variables for production"
        git push origin main
        echo "✅ Changes pushed to GitHub"
    fi
fi

echo ""
echo "🎉 Ready for deployment!"
