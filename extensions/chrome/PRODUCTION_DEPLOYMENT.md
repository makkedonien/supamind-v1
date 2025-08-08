# 🚀 Chrome Extension Production Deployment Guide

## Prerequisites

1. **Deploy your main Supamind web app** to a production domain first (Vercel, Netlify, etc.)
2. **Update Supabase configuration** to allow your production domain
3. **Configure Google OAuth** for your production domain

## Step-by-Step Deployment

### 1. Deploy Main Web App

Deploy your main Supamind app to a production service:

**Vercel (Recommended):**
```bash
# In the main project directory
npm run build
# Deploy to Vercel via CLI or GitHub integration
```

**Netlify:**
```bash
# In the main project directory
npm run build
# Deploy dist/ folder to Netlify
```

### 2. Update Supabase Configuration

In your Supabase dashboard:

1. **Authentication Settings:**
   - Go to Authentication > Settings
   - Update Site URL to your production domain
   - Add production domain to Additional Redirect URLs

2. **CORS Configuration:**
   - Ensure your production domain is allowed in CORS settings

### 3. Update Google OAuth (if using)

In Google Cloud Console:
1. Add your production domain to Authorized JavaScript origins
2. Add your production domain + `/auth` to Authorized redirect URIs

### 4. Build Extension for Production

```bash
# Replace with your actual production domain
./build-production.sh https://your-supamind-domain.com
```

This script will:
- Temporarily update the extension's environment variables
- Build the extension with production settings
- Output ready-to-publish files in `dist/` folder

### 5. Test Extension Locally with Production Backend

1. Load the built extension (`dist/` folder) in Chrome
2. Test authentication flow with your production domain
3. Verify page addition works with production backend

### 6. Submit to Chrome Web Store

1. **Prepare Store Assets:**
   - Extension icons (✅ already created)
   - Screenshots of the extension in action
   - Store description and promotional images

2. **Upload to Chrome Web Store:**
   - Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
   - Create new item and upload the `dist/` folder as ZIP
   - Fill in store listing details
   - Submit for review

## Required Configuration Updates

### Supabase Settings

```toml
# In supabase/config.toml, update:
[auth]
site_url = "https://your-production-domain.com"
additional_redirect_urls = ["https://your-production-domain.com"]
```

### Environment Variables Check

Make sure these are set in your production web app:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` 
- `VITE_GOOGLE_CLIENT_ID`

## Security Considerations

1. **Host Permissions:** The extension has broad `https://*/*` permissions to work on any site
2. **API Keys:** Supabase anon key is exposed (this is normal for public APIs)
3. **Authentication:** Extension uses secure postMessage API for auth handoff

## Testing Checklist

- [ ] Web app deployed and accessible at production domain
- [ ] Supabase allows connections from production domain
- [ ] Google OAuth configured for production domain
- [ ] Extension authenticates successfully with production app
- [ ] Page addition works from extension to production backend
- [ ] Extension popup shows correct branding and messaging

## Troubleshooting

**Authentication Issues:**
- Check browser console in extension popup
- Verify production domain in extension environment
- Ensure Supabase CORS settings include production domain

**Page Addition Fails:**
- Check network tab for API call failures
- Verify Supabase edge functions are deployed
- Check edge function logs in Supabase dashboard

## Maintenance

To update the extension:
1. Make changes to source code
2. Run production build script with your domain
3. Upload new version to Chrome Web Store
4. Users will auto-update (or manual approval required depending on changes)
