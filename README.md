# FitFuel - Fitness & Nutrition Tracker

A comprehensive fitness and nutrition tracking application built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Features

- **User Authentication**: Email/password and OAuth (Google) sign-in
- **Nutrition Tracking**: Log meals and track macronutrients
- **Workout Logging**: Record exercises, sets, and reps
- **Hydration Tracking**: Monitor daily water intake
- **Analytics Dashboard**: View progress and trends over time
- **Responsive Design**: Works on desktop and mobile devices
- **Dark Mode**: Built-in dark/light theme support

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **UI Components**: Radix UI, Shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Vercel account (for deployment)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/fitfuel.git
   cd fitfuel
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn
   # or
   pnpm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory and add the following variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up the database**
   - Create a new project in Supabase
   - Run the SQL migration from `supabase/migrations/20240101000000_initial_schema.sql` in the Supabase SQL editor
   - Enable Row Level Security (RLS) on all tables

5. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deployment

### Vercel

1. Push your code to a GitHub/GitLab/Bitbucket repository
2. Import the repository to Vercel
3. Add the same environment variables as in your `.env.local`
4. Deploy!

## Environment Variables

| Variable Name | Description |
|---------------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key |

## Project Structure

```
.
├── src/
│   ├── app/                    # App Router pages and API routes
│   │   ├── api/                # API routes
│   │   ├── dashboard/          # Dashboard pages
│   │   ├── login/              # Authentication pages
│   │   └── ...
│   ├── components/             # Reusable UI components
│   ├── lib/                    # Utility functions and configurations
│   └── styles/                 # Global styles
├── public/                     # Static files
├── supabase/                   # Database migrations
└── ...
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
