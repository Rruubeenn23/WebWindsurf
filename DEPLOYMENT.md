# FitFuel Deployment Guide

This guide will walk you through deploying the FitFuel application to production, including setting up Vercel, Supabase, and n8n.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Vercel Deployment](#vercel-deployment)
3. [Supabase Setup](#supabase-setup)
4. [n8n Configuration](#n8n-configuration)
5. [Environment Variables](#environment-variables)
6. [Database Migrations](#database-migrations)
7. [Final Steps](#final-steps)

## Prerequisites

Before you begin, make sure you have:

- A GitHub, GitLab, or Bitbucket account
- A Vercel account (free tier is sufficient)
- A Supabase account (free tier is sufficient)
- An n8n instance (can be self-hosted or cloud)
- Node.js 16+ installed locally for running database migrations

## Vercel Deployment

1. **Push your code to a Git repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repository-url>
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to [Vercel](https://vercel.com) and sign in
   - Click "Add New" → "Project"
   - Import your Git repository
   - Configure the project:
     - Framework Preset: Next.js
     - Root Directory: (leave empty if your project is at the root)
     - Build Command: `npm run build`
     - Output Directory: `.next`
     - Install Command: `npm install`
   - Click "Deploy"

3. **Configure Environment Variables**
   - In your Vercel project, go to "Settings" → "Environment Variables"
   - Add the following environment variables (we'll get these values in the next sections):
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
     NEXTAUTH_URL=your_vercel_app_url
     NEXTAUTH_SECRET=generate_a_secure_secret
     ```
   - Generate a secure secret for `NEXTAUTH_SECRET` (you can use `openssl rand -base64 32` in your terminal)

## Supabase Setup

1. **Create a new project**
   - Go to [Supabase](https://supabase.com) and sign in
   - Click "New Project"
   - Choose a name and strong database password
   - Select a region close to your users
   - Click "Create new project"

2. **Configure Database**
   - Go to the SQL Editor in the Supabase dashboard
   - Click "New Query"
   - Copy the contents of `supabase/migrations/20240101000000_initial_schema.sql` and run it
   - Then run the contents of `supabase/migrations/20240101000001_workout_functions.sql`
   - Finally, run the contents of `supabase/migrations/20240101000002_nutrition_functions.sql`

3. **Configure Authentication**
   - Go to Authentication → URL Configuration
   - Add your Vercel app URL to "Site URL"
   - Add `http://localhost:3000` for local development
   - Add `http://localhost:3000/api/auth/callback` to "Redirect URLs"
   - Add `http://localhost:3000/login` to "Additional Redirect URLs"

4. **Get API Keys**
   - Go to Project Settings → API
   - Note down the following:
     - Project URL (NEXT_PUBLIC_SUPABASE_URL)
     - anon public (NEXT_PUBLIC_SUPABASE_ANON_KEY)
     - service_role secret (SUPABASE_SERVICE_ROLE_KEY)

5. **Enable Email Provider**
   - Go to Authentication → Providers
   - Enable "Email" provider
   - Configure email templates as needed
   - Optionally, set up a custom SMTP server

## n8n Configuration

1. **Set up n8n**
   - If you haven't already, set up an n8n instance:
     - Cloud: Sign up at [n8n.cloud](https://n8n.cloud/)
     - Self-hosted: Follow the [n8n documentation](https://docs.n8n.io/hosting/installation/docker/)

2. **Import Workflows**
   - In your n8n dashboard, go to "Workflows"
   - Click "Import from File"
   - Import the workflows from the `n8n/workflows` directory
   - For each workflow, update the credentials and variables:
     - Set the Supabase URL and API key
     - Configure the email/SMS provider
     - Set the appropriate schedule

3. **Configure Webhooks**
   - For webhook-triggered workflows, note the webhook URL
   - In your Supabase dashboard, go to Database → Webhooks
   - Create a new webhook that points to your n8n webhook URL

## Environment Variables

Update your Vercel environment variables with the following:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Authentication
NEXTAUTH_URL=your_vercel_app_url
NEXTAUTH_SECRET=your_generated_secret
NEXTAUTH_URL_INTERNAL=http://localhost:3000  # For local development

# Optional: Email Provider (if using email auth)
EMAIL_SERVER_HOST=smtp.example.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=username
EMAIL_SERVER_PASSWORD=password
EMAIL_FROM=noreply@yourdomain.com

# Optional: n8n webhook secret (if using webhooks)
N8N_WEBHOOK_SECRET=your_webhook_secret
```

## Database Migrations

For any future database changes, create a new migration file:

1. Create a new file in `supabase/migrations` with the format `YYYYMMDDHHMMSS_description.sql`
2. Add your SQL changes to this file
3. To apply migrations to your Supabase project:
   ```bash
   # Install the Supabase CLI
   npm install -g supabase
   
   # Link to your project
   supabase login
   
   # Apply migrations
   supabase db push --db-url=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   ```

## Final Steps

1. **Test Your Deployment**
   - Visit your Vercel app URL
   - Test user registration and login
   - Verify that data is being saved to Supabase
   - Check that n8n workflows are running as expected

2. **Set Up a Custom Domain (Optional)**
   - In your Vercel project, go to "Settings" → "Domains"
   - Add your custom domain and follow the verification steps
   - Update your Supabase auth configuration with the new domain

3. **Enable Backups**
   - In Supabase, go to "Database" → "Backups"
   - Set up automated backups
   - Consider setting up Point-in-Time Recovery for production

4. **Monitor Your Application**
   - Set up logging and monitoring
   - Configure alerts for errors and performance issues
   - Monitor database performance and scale as needed

## Troubleshooting

- **Database Connection Issues**: Verify your Supabase connection strings and network settings
- **Authentication Problems**: Check the Supabase logs and ensure redirect URLs are correctly configured
- **n8n Workflow Failures**: Check the n8n execution logs for detailed error messages
- **Environment Variables**: Ensure all required environment variables are set in both Vercel and n8n

## Support

For additional help, refer to:
- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [n8n Documentation](https://docs.n8n.io/)
- [Next.js Documentation](https://nextjs.org/docs)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
