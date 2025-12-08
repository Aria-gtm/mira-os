# Mira OS - Permanent Deployment Guide

**Time Required**: 10-15 minutes  
**Cost**: Free (Vercel free tier)  
**Result**: Permanent URL like `mira-os.vercel.app`

---

## Prerequisites

1. **GitHub Account** - [Sign up free](https://github.com/signup)
2. **Vercel Account** - [Sign up free](https://vercel.com/signup)
3. **Database** - TiDB Cloud or PlanetScale (free tier)

---

## Step 1: Push Code to GitHub (5 minutes)

### Option A: Using GitHub Desktop (Easiest)
1. Download [GitHub Desktop](https://desktop.github.com/)
2. Open GitHub Desktop
3. Click "Add" → "Add Existing Repository"
4. Select the `mira-project` folder
5. Click "Publish repository"
6. Name it `mira-os`
7. Click "Publish"

### Option B: Using Command Line
```bash
cd mira-project
git init
git add .
git commit -m "Initial commit - Mira OS"
gh repo create mira-os --public --source=. --remote=origin --push
```

---

## Step 2: Set Up Database (5 minutes)

### Option A: TiDB Cloud (Recommended)
1. Go to [TiDB Cloud](https://tidbcloud.com/)
2. Sign up for free
3. Create new cluster (free tier)
4. Wait 5 minutes for provisioning
5. Click "Connect"
6. Copy the connection string (looks like: `mysql://user:pass@host:4000/db`)
7. Convert to format: `mysql://user:pass@host:4000/db?ssl={"rejectUnauthorized":true}`

### Option B: PlanetScale
1. Go to [PlanetScale](https://planetscale.com/)
2. Sign up for free
3. Create new database
4. Click "Connect"
5. Copy connection string

**Save this connection string** - you'll need it in Step 3.

---

## Step 3: Deploy to Vercel (3 minutes)

1. Go to [Vercel](https://vercel.com/)
2. Click "Add New" → "Project"
3. Import your `mira-os` repository from GitHub
4. **Framework Preset**: Other
5. **Build Command**: `pnpm install && pnpm build`
6. **Output Directory**: `dist/public`
7. **Install Command**: `pnpm install`

### Add Environment Variables:
Click "Environment Variables" and add:

```
DATABASE_URL = [paste your database connection string from Step 2]
NODE_ENV = production
```

### Add these if using OpenAI:
```
OPENAI_API_KEY = [your OpenAI API key]
```

8. Click "Deploy"
9. Wait 2-3 minutes

---

## Step 4: Verify Deployment (2 minutes)

1. Vercel will give you a URL like: `https://mira-os.vercel.app`
2. Open it in browser
3. Check:
   - [ ] Homepage loads
   - [ ] `/os` route works
   - [ ] Can create account
   - [ ] Voice recording works

---

## Troubleshooting

### "Build Failed"
- Check Vercel build logs
- Make sure `DATABASE_URL` is set correctly
- Verify database is accessible (not behind firewall)

### "Database Connection Error"
- Check connection string format
- Make sure SSL is enabled if required
- Verify database is running

### "OAuth Error"
- This is expected - OAuth needs configuration
- For now, you can skip login and use as guest

---

## Custom Domain (Optional)

1. Buy domain from [Namecheap](https://namecheap.com) (~$10/year)
2. In Vercel project settings → "Domains"
3. Add your domain (e.g., `mira.yourdomain.com`)
4. Follow Vercel's DNS instructions
5. Wait 10-60 minutes for DNS propagation

---

## What's Already Configured

✅ `vercel.json` - Deployment configuration  
✅ `.gitignore` - Excludes node_modules, etc.  
✅ `package.json` - Build scripts  
✅ Database schema - Ready to sync  
✅ Production build - Optimized  

---

## Need Help?

**Common Issues**:
- **Port errors**: Vercel handles ports automatically
- **Database errors**: Check connection string format
- **Build errors**: Check Vercel logs for details

**Still stuck?**
1. Check Vercel deployment logs
2. Check database connection
3. Verify all environment variables are set

---

## Alternative: Railway Deployment

If Vercel doesn't work, try Railway:

1. Go to [Railway](https://railway.app/)
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select `mira-os`
5. Add environment variables (same as above)
6. Click "Deploy"

Railway includes free database, so you can skip Step 2.

---

## Cost Breakdown

**Free Tier** (Recommended for testing):
- Vercel: Free (100GB bandwidth/month)
- TiDB Cloud: Free (5GB storage)
- Total: **$0/month**

**Paid Tier** (For production):
- Vercel Pro: $20/month (unlimited bandwidth)
- TiDB Cloud: $0.02/hour (~$15/month)
- Custom domain: $10/year
- Total: **~$35/month**

---

## Next Steps After Deployment

1. Test all features in production
2. Set up monitoring (Vercel Analytics)
3. Configure custom domain
4. Set up OAuth properly
5. Add rate limiting
6. Set up backups

---

**Your permanent URL will be**: `https://mira-os.vercel.app`

(Or whatever you name your project)
