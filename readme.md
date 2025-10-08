# Perfume Community Platform

A community-driven perfume database with hierarchical approval workflow built with Next.js 14, Supabase, and tRPC.

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Supabase, tRPC
- **State Management**: Zustand, React Query
- **Forms**: React Hook Form with Zod validation
- **Analytics**: PostHog

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd everyspray-admin
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env.local
   ```
   Update `.env.local` with your actual values:
   - Supabase project URL and keys
   - NextAuth configuration
   - PostHog analytics key (optional)

4. **Start development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── (auth)/            # Authentication pages (grouped route)
│   ├── admin/             # Admin dashboard
│   ├── team/              # Team member dashboard
│   ├── contribute/        # User contribution interface
│   └── dashboard/         # Main dashboard
├── components/            # React components
│   ├── ui/               # UI components (shadcn/ui)
│   ├── auth/             # Authentication components
│   ├── layout/           # Layout components
│   └── common/           # Shared components
├── lib/                  # Utility libraries
│   ├── supabase/         # Supabase client configuration
│   ├── trpc/             # tRPC setup and providers
│   ├── utils/            # Utility functions
│   └── stores/           # Zustand stores
├── server/               # Server-side code
│   ├── api/              # tRPC API routers
│   └── db/               # Database utilities
└── types/                # TypeScript type definitions
```

## Features

- **Multi-Role System**: End Users, Team Members, Super Admins
- **Hierarchical Approval Workflow**: Two-level approval system
- **Comprehensive CRUD**: Manage perfumes, brands, and notes
- **Community Features**: User contributions and achievements
- **Real-time Updates**: Live data synchronization
- **Responsive Design**: Mobile-first approach

## Development Progress

See [project-overview.md](./project-overview.md) for detailed development phases and progress tracking.
