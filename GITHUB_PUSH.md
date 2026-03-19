# TypeBlaze — GitHub Push Guide
## Exact commands to run, one by one

---

## Step 1 — Download the project files

Download the `typeblaze-final` folder from Claude's output.
Extract it somewhere on your computer, for example:
  C:\Users\YourName\typeblaze       (Windows)
  /Users/yourname/typeblaze         (Mac)

---

## Step 2 — Create a GitHub repository

1. Go to github.com → sign in (or sign up free)
2. Click the + button (top right) → New repository
3. Repository name: typeblaze
4. Set to Public (free) or Private — your choice
5. Do NOT tick "Add README" or any other checkbox
6. Click Create repository
7. GitHub shows you a page with setup commands — you can ignore them, use ours below

---

## Step 3 — Open your terminal

Windows: press Win + R → type cmd → Enter
         OR search "PowerShell" in Start menu
Mac:     press Cmd + Space → type Terminal → Enter

---

## Step 4 — Run these commands one by one

Paste each command and press Enter. Wait for it to finish before the next.

```bash
# 1. Go into your project folder (adjust path to where you extracted it)
cd C:\Users\YourName\typeblaze       # Windows
cd /Users/yourname/typeblaze          # Mac/Linux

# 2. Install all dependencies
npm install

# 3. Generate Prisma client (needed before build)
npx prisma generate

# 4. Set up Git in this folder
git init

# 5. Stage all files
git add .

# 6. Create first commit
git commit -m "TypeBlaze v1.0 - initial commit"

# 7. Link to your GitHub repo
#    Replace YOUR_USERNAME with your actual GitHub username
git remote add origin https://github.com/YOUR_USERNAME/typeblaze.git

# 8. Push to GitHub
git branch -M main
git push -u origin main
```

---

## Step 5 — Connect GitHub to Vercel

1. Go to vercel.com → your dashboard
2. Click Add New → Project
3. Click Import Git Repository
4. Select your typeblaze repo
5. Vercel auto-detects Next.js — no changes needed
6. Scroll down — your environment variables are already saved from earlier
7. Click Deploy

Vercel builds and deploys in about 2-3 minutes.
Your live URL: https://typeblaze.vercel.app

---

## Step 6 — Run database migration

After first deploy, run this to create all database tables:

```bash
# In your project folder (same terminal from Step 4)
npx prisma migrate deploy
```

If you get a connection error, make sure DATABASE_URL in .env.local matches
what you added to Vercel.

---

## If you get errors

### "git: command not found"
→ Download Git from git-scm.com and install it, then retry from Step 4

### "npm: command not found"  
→ Download Node.js from nodejs.org, install it, restart terminal, retry

### "error: remote origin already exists"
→ Run: git remote remove origin
   Then repeat step 7 and 8

### "Permission denied" on GitHub push
→ GitHub will ask you to log in — use your GitHub username and password
   Or generate a personal access token at: github.com/settings/tokens

---

## After it's live — test these URLs

https://typeblaze.vercel.app              ← Homepage
https://typeblaze.vercel.app/typing-test  ← Type test
https://typeblaze.vercel.app/sitemap.xml  ← Should show XML
https://typeblaze.vercel.app/robots.txt   ← Should show text

---

*TypeBlaze GitHub Push Guide — March 2026*
