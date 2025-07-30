# 🚀 FantasyBlock Deployment Guide

## ⚡ Super Quick Start (Recommended)

**Want to run FantasyBlock in 30 seconds?**

```bash
npm run fantasyblock
```

This single command does EVERYTHING:
- Installs dependencies
- Sets up environment  
- Configures database with sample data
- Starts the app at `http://localhost:3000`

See [QUICKSTART.md](QUICKSTART.md) for details.

---

## 🏠 Manual Local Development Setup

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database (local, Docker, or cloud service)
- Git

### Quick Start
```bash
# 1. Clone and setup
git clone <repository-url>
cd fantasyblock
chmod +x dev-setup.sh
./dev-setup.sh

# 2. Configure database
# Edit .env.local and set your DATABASE_URL

# 3. Run database migrations
npm run db:push

# 4. Start development server
npm run dev
```

### Manual Setup
```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Edit .env.local with your values
# Required: DATABASE_URL, BETTER_AUTH_SECRET, AUTUMN_SECRET_KEY

# Generate Better Auth secret
openssl rand -base64 32

# Push database schema
npm run db:push

# Start development
npm run dev
```

## < Vercel Deployment

### 1. Database Setup (Choose One)

#### Option A: Vercel Postgres
```bash
# Install Vercel CLI
npm i -g vercel

# Login and create database
vercel login
vercel postgres create fantasyblock-db
```

#### Option B: External Database (Recommended)
- **Supabase**: Free PostgreSQL with 500MB storage
- **Neon**: Serverless PostgreSQL
- **PlanetScale**: MySQL (requires schema changes)
- **Railway**: Simple PostgreSQL hosting

### 2. Environment Variables

Set these in Vercel Dashboard � Project � Settings � Environment Variables:

**Required:**
```
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=<32-char-secret>
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
AUTUMN_SECRET_KEY=<autumn-key>
```

**Optional (for enhanced features):**
```
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLISHABLE_KEY=pk_...
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Deploy to Vercel

#### Option A: Vercel CLI
```bash
vercel login
vercel --prod
```

#### Option B: GitHub Integration
1. Push code to GitHub
2. Connect repository in Vercel Dashboard
3. Deploy automatically on push

### 4. Post-Deployment Setup

```bash
# Run database migrations on production
npm run db:push

# Optional: Seed database with test data
npm run db:seed  # (if created)
```

## =� Database Schema

The app uses Drizzle ORM with these main tables:
- Better Auth tables (users, sessions, accounts)
- Application tables (defined in `lib/db/schema.ts`)

## =' Development Commands

```bash
# Development
npm run dev              # Start with Turbopack
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint

# Database
npm run db:generate     # Generate migrations
npm run db:migrate      # Run migrations
npm run db:push         # Push schema changes
npm run db:studio       # Open Drizzle Studio
npm run db:drop         # Drop database

# Setup
npm run setup           # Basic setup
npm run setup:autumn    # Payment setup
npm run setup:stripe-portal # Stripe setup
```

## =� Troubleshooting

### Build Issues
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npm run build
```

### Database Issues
```bash
# Reset database
npm run db:drop
npm run db:push

# Check connection
npm run db:studio
```

### Authentication Issues
- Verify `BETTER_AUTH_SECRET` is set
- Check `NEXT_PUBLIC_APP_URL` matches your domain
- Ensure database tables are created

### Environment Variables
```bash
# Verify all required vars are set
node -e "require('./lib/env-validation').validateEnv()"
```

## =� Performance Tips

### Vercel Optimizations
- Enable Edge Runtime for API routes where possible
- Use Vercel Edge Config for dynamic configuration
- Implement proper caching headers

### Database Optimizations
- Use connection pooling (already configured)
- Add database indexes for frequent queries
- Consider read replicas for heavy read workloads

## = Security Checklist

-  Environment variables secured
-  Database connection encrypted
-  Authentication properly configured
-  API routes protected
-  CORS properly configured
-  Rate limiting implemented

## =� Production Checklist

Before going live:
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] SSL certificate active
- [ ] Custom domain configured
- [ ] Analytics setup (optional)
- [ ] Error monitoring setup (optional)
- [ ] Backup strategy in place

## =� Support

If you encounter issues:
1. Check this documentation
2. Review Vercel deployment logs
3. Check database connectivity
4. Verify environment variables
5. Review application logs

## <� FantasyBlock Specific Features

After deployment, test these key features:
- [ ] Homepage loads with sport selection
- [ ] User registration/login works
- [ ] Draft setup flow functions
- [ ] Draft room interface loads
- [ ] League management accessible
- [ ] AI recommendations display