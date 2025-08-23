# Pactoria - Setup Guide

## Prerequisites

- Node.js 20+ and npm/pnpm
- Git
- Supabase account (free tier)
- Groq API key (free tier)
- Vercel/Netlify account (free tier) for deployment

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/pactoria.git
cd pactoria
```

### 2. Install Dependencies

```bash
cd apps/web
npm install
```

### 3. Set Up Supabase

#### 3.1 Create a Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create a new project (free tier)
3. Save your project URL and anon key from Settings > API

#### 3.2 Run Database Migrations

1. Go to SQL Editor in Supabase Dashboard
2. Run each migration file in order from `supabase/migrations/`:
   - `0001_init.sql` - Core tables
   - `0002_rpc_take_snapshot.sql` - Snapshot functionality
   - `0003_performance_indexes.sql` - Performance optimizations
   - `0004_recreate_rls_policies.sql` - Security policies
   - `20240821000001_add_billing_tables.sql` - Billing (optional)
   - `20240822000001_add_templates_table.sql` - Templates
   - `20240121_email_notifications.sql` - Email system
   - `20240122_analytics_monitoring.sql` - Analytics

3. Run the seed data (optional):
   ```sql
   -- Run contents of supabase/seed.sql
   ```

### 4. Deploy Edge Functions

#### 4.1 Install Supabase CLI

```bash
npm install -g supabase
```

#### 4.2 Login and Link Project

```bash
supabase login
supabase link --project-ref <your-project-ref>
```

#### 4.3 Set Function Secrets

```bash
# Required
supabase secrets set GROQ_API_KEY=<your-groq-api-key>

# Optional (for advanced features)
supabase secrets set RESEND_API_KEY=<your-resend-api-key>
supabase secrets set HOCUSPOCUS_JWT_SECRET=<random-secret>
```

#### 4.4 Deploy Functions

```bash
# Deploy all functions
supabase functions deploy ai
supabase functions deploy contracts
supabase functions deploy collab-token
```

### 5. Configure Environment Variables

Create `.env.local` in `apps/web`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key # Optional, for admin functions

# Optional: Email
RESEND_API_KEY=your-resend-api-key

# Optional: Collaboration
NEXT_PUBLIC_COLLAB_PROVIDER=y-webrtc # or 'hocuspocus'
```

### 6. Run Development Server

```bash
cd apps/web
npm run dev
```

Visit http://localhost:3000

## Production Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Configure environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (optional)
4. Deploy!

### Deploy to Netlify

1. Push your code to GitHub
2. Import project in Netlify
3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
4. Add environment variables
5. Deploy!

## Feature Configuration

### Email Notifications (Optional)

1. Sign up for [Resend](https://resend.com) (free tier)
2. Get your API key
3. Add to environment variables:
   ```env
   RESEND_API_KEY=your-resend-api-key
   ```
4. Configure sender domain in Resend dashboard

### Real-time Collaboration

The app supports three collaboration modes:

#### Option A: y-webrtc (Default, Free)
- No additional setup required
- P2P collaboration
- Works out of the box

#### Option B: Hocuspocus (Self-hosted)
1. Deploy Hocuspocus server (see [Hocuspocus docs](https://tiptap.dev/hocuspocus))
2. Set environment variables:
   ```env
   NEXT_PUBLIC_COLLAB_PROVIDER=hocuspocus
   HOCUSPOCUS_URL=https://your-hocuspocus-server.com
   ```

#### Option C: Liveblocks (Managed, Post-MVP)
1. Sign up for [Liveblocks](https://liveblocks.io)
2. Configure API keys
3. Update collaboration provider

## Testing

### Run Unit Tests

```bash
npm run test
```

### Run E2E Tests

```bash
# Install Playwright
npx playwright install

# Run tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui
```

## Troubleshooting

### Common Issues

#### 1. "Missing GROQ_API_KEY" Error
- Ensure you've set the secret in Supabase: `supabase secrets set GROQ_API_KEY=...`
- Redeploy the AI function: `supabase functions deploy ai`

#### 2. Authentication Issues
- Check Supabase Auth settings
- Ensure email/password auth is enabled
- Verify redirect URLs are configured

#### 3. Database Connection Errors
- Verify Supabase URL and keys are correct
- Check RLS policies are properly configured
- Ensure migrations ran successfully

#### 4. Real-time Not Working
- Check Supabase Realtime is enabled
- Verify websocket connections aren't blocked
- Check browser console for errors

### Debug Mode

Enable debug logging:

```env
NEXT_PUBLIC_DEBUG=true
```

### Support

- GitHub Issues: [github.com/yourusername/pactoria/issues](https://github.com/yourusername/pactoria/issues)
- Documentation: [docs.pactoria.com](https://docs.pactoria.com)
- Discord: [discord.gg/pactoria](https://discord.gg/pactoria)

## Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────┐
│                 │     │                  │     │              │
│   Next.js App   │────▶│  Supabase APIs   │────▶│  PostgreSQL  │
│   (Frontend)    │     │   (Backend)      │     │  (Database)  │
│                 │     │                  │     │              │
└─────────────────┘     └──────────────────┘     └──────────────┘
         │                       │
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌──────────────────┐
│                 │     │                  │
│   y-webrtc      │     │  Edge Functions  │
│ (Collaboration) │     │   (AI, Auth)     │
│                 │     │                  │
└─────────────────┘     └──────────────────┘
                                 │
                                 ▼
                        ┌──────────────────┐
                        │                  │
                        │    Groq API      │
                        │  (AI Provider)   │
                        │                  │
                        └──────────────────┘
```

## Security Best Practices

1. **Environment Variables**: Never commit `.env.local` files
2. **API Keys**: Use different keys for development and production
3. **RLS Policies**: Always test RLS policies thoroughly
4. **Service Role Key**: Only use on server-side, never expose to client
5. **CORS**: Configure allowed origins in production
6. **Rate Limiting**: Monitor and adjust rate limits as needed

## Performance Optimization

1. **Database Indexes**: Already configured in migrations
2. **Edge Functions**: Deployed close to users via Supabase
3. **Caching**: Use TanStack Query's built-in caching
4. **Image Optimization**: Use Next.js Image component
5. **Code Splitting**: Automatic with Next.js App Router

## Monitoring

1. **Performance Metrics**: Check Analytics dashboard at `/analytics`
2. **Error Tracking**: Monitor error logs in Supabase Dashboard
3. **User Activity**: Track via user sessions table
4. **API Usage**: Monitor in API usage table

## Backup and Recovery

1. **Database Backups**: Automatic in Supabase (Pro plan)
2. **Manual Backups**: Use `pg_dump` for manual backups
3. **Version Control**: All code in Git
4. **Document Snapshots**: Stored in `contract_versions` table

---

## Next Steps

After setup:

1. Create your first account
2. Create a test contract
3. Try collaborative editing
4. Generate content with AI
5. Export to PDF/DOCX
6. Explore the analytics dashboard

Happy contract managing! 🚀
