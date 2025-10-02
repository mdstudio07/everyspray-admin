# Perfume Community Platform - Development Phases

## 🗺️ WORLD MAP: Complete Project Overview

**Goal**: Build a community-driven perfume database with hierarchical approval workflow
**Timeline**: 12-16 weeks
**Tech Stack**: Next.js 14, Supabase, tRPC, Tailwind CSS
**Current Status**: Phase 1 Complete, RBAC System Implementation Complete (Frontend + Types)

---

## 📁 FOLDER STRUCTURE & PAGE OVERVIEW

### 🔹 Contributor Section (`/src/app/contribute/`)
**Role Access**: contributor only
- `layout.tsx` - Contributor navigation and layout wrapper
- `dashboard/page.tsx` - Personal dashboard showing contribution stats, recent activities, achievements summary
- `perfume/create/page.tsx` - Form to submit new perfume entries for review
- `brand/create/page.tsx` - Form to submit new brand entries for review
- `my-contributions/page.tsx` - List of all user's submissions with status (pending/approved/rejected)
- `profile/page.tsx` - Personal profile with achievements, badges, contribution history
- `achievements/page.tsx` - Detailed view of earned badges, milestones, and rewards

### 🔹 Admin Section (`/src/app/admin/`)
**Role Access**: team_member + super_admin
- `layout.tsx` - Admin navigation and layout wrapper
- `dashboard/page.tsx` - Admin overview with key metrics, pending approvals, system status
- `perfumes/page.tsx` - Manage all perfumes (CRUD operations, bulk actions)
- `brands/page.tsx` - Manage all brands (CRUD operations, merging duplicates)
- `notes/page.tsx` - Manage fragrance notes (CRUD operations, categorization)
- `moderation/page.tsx` - Review pending submissions, approve/reject content
- `settings/page.tsx` - Admin profile settings (no achievements for admin roles)

### 🔹 Super Admin Only Section (`/src/app/admin/(super-only)/`)
**Role Access**: super_admin only
- `layout.tsx` - Super admin restriction wrapper with access control
- `users/page.tsx` - Manage all users, roles, permissions, user analytics
- `team-management/page.tsx` - Manage team members, assign roles, monitor performance
- `analytics/page.tsx` - Advanced system metrics, usage statistics, content insights

### 🔹 Authentication Pages (`/src/app/(auth)/`)
**Role Access**: public
- `login/page.tsx` - User authentication with role-based redirect
- `register/page.tsx` - User registration (defaults to contributor role)

### 🔹 API Routes (`/src/app/api/`)
- `trpc/[trpc]/route.ts` - tRPC API handler for all server functions
- `upload/route.ts` - File upload endpoint for images and documents

### 🔹 Components (`/src/components/`)
- `layouts/` - Role-specific layout components
  - `ContributorLayout.tsx` - Layout for contributor pages
  - `AdminLayout.tsx` - Layout for admin pages
  - `SuperAdminLayout.tsx` - Layout for super admin pages
- `ui/` - Reusable UI components (prepared for shadcn/ui)
- `common/` - Shared components across all roles

### 🔹 Core Libraries (`/src/lib/`)
- `trpc/` - tRPC configuration and routers
  - `client.ts` - Client-side tRPC setup
  - `server.ts` - Server-side tRPC configuration
  - `provider.tsx` - React Query integration
  - `router.ts` - API route definitions
- `stores/` - Global state management
  - `auth.ts` - Authentication state (Zustand)
- `utils/` - Utility functions
  - `env.ts` - Environment variable validation

### 🔹 Type Definitions (`/src/types/`)
- `database.types.ts` - Database schema types for Supabase
- `auth.types.ts` - Authentication and user role types

---

## 🌍 PHASE 1: FOUNDATION (Weeks 1-2)
**Goal**: Basic project setup, authentication, and database foundation

### Countries (Major Areas):
1. **Project Setup** - Next.js + Supabase + tRPC configuration
2. **Database Schema** - Core tables and relationships
3. **Authentication System** - Login/register with role-based access
4. **Basic UI Framework** - Layout components and routing

### States (Specific Tasks per Country):
**Each prompt = max 5 tasks**

---

## 🌍 PHASE 2: ADMIN CORE (Weeks 3-4)
**Goal**: Super Admin can manage all perfumes, brands, notes with full CRUD

### Countries (Major Areas):
1. **Admin Dashboard** - Overview and navigation
2. **Perfume Management** - Full CRUD with rich forms
3. **Brand & Notes Management** - CRUD operations
4. **Data Tables & Search** - Listing, filtering, sorting

---

## 🌍 PHASE 3: CONTRIBUTION SYSTEM (Weeks 5-6)
**Goal**: End users can contribute, team members can moderate

### Countries (Major Areas):
1. **Contributor Interface** - Simplified submission forms
2. **Team Member Dashboard** - Moderation queue and tools
3. **Basic Approval Workflow** - Single-level approve/reject
4. **My Contributions** - Status tracking for users

---

## 🌍 PHASE 4: ADVANCED WORKFLOW (Weeks 7-8)
**Goal**: Multi-level approval system with bulk operations

### Countries (Major Areas):
1. **Two-Level Approval** - Team → Super Admin workflow
2. **Bulk Operations** - Mass approve/reject capabilities
3. **Advanced Filtering** - Complex search and filter options
4. **Workflow Analytics** - Basic reporting on approval process

---

## 🌍 PHASE 5: USER MANAGEMENT (Weeks 9-10)
**Goal**: Complete user system with achievements and community features

### Countries (Major Areas):
1. **User Administration** - User management, suspension, trust levels
2. **Achievement System** - Animal-themed badges and progression
3. **Community Features** - Public profiles, leaderboards
4. **Team Management** - Invite system, role management

---

## 🌍 PHASE 6: POLISH & LAUNCH (Weeks 11-12)
**Goal**: Production-ready application with monitoring

### Countries (Major Areas):
1. **Performance Optimization** - Caching, database optimization
2. **Error Handling & Monitoring** - Comprehensive error management
3. **Final Testing** - End-to-end testing and bug fixes
4. **Production Deployment** - Launch preparation and monitoring

---

## 🏗️ DETAILED BREAKDOWN: PHASE 1 - FOUNDATION

### 🌍 Country 1: Project Setup
**Prompts needed: 2**

#### 🏛️ State 1.1: Initial Configuration
**Prompt Tasks (5 max):**
1. Create Next.js 14 project with TypeScript and app router
2. Setup Supabase client and environment configuration
3. Install and configure tRPC with authentication middleware
4. Setup Tailwind CSS and shadcn/ui component library
5. Create basic project structure and folders

#### 🏛️ State 1.2: Development Environment
**Prompt Tasks (5 max):**
1. Configure TypeScript strict mode and ESLint rules
2. Setup environment variables and type safety
3. Create basic error handling and logging setup
4. Configure PostHog analytics integration
5. Setup development scripts and testing framework

### 🌍 Country 2: Database Schema
**Prompts needed: 2**

#### 🏛️ State 2.1: Core Tables
**Prompt Tasks (5 max):**
1. Create users_profile table with role enum
2. Create brands table with status and approval fields
3. Create notes table with category and approval workflow
4. Create perfumes table with all required fields (from parfumo.com structure)
5. Create perfume_notes junction table for relationships

#### 🏛️ State 2.2: Workflow & Security
**Prompt Tasks (5 max):**
1. Create contributions table for tracking all submissions
2. Create approval_workflows table for multi-level approval
3. Setup Row Level Security (RLS) policies for all tables
4. Create database indexes for performance
5. Generate TypeScript types from Supabase schema

### 🌍 Country 3: Authentication System
**Prompts needed: 2**

#### 🏛️ State 3.1: Auth Pages & Flow
**Prompt Tasks (5 max):**
1. Create login page with form validation
2. Create register page with role selection
3. Create protected route middleware
4. Setup role-based redirects after authentication
5. Create user state management with Zustand

#### 🏛️ State 3.2: User Management
**Prompt Tasks (4 max):**
1. Create user profile page and edit functionality
2. Build tRPC auth router with user operations
3. Create authentication wrapper components
4. Setup session persistence and logout functionality

### 🌍 Country 4: Basic UI Framework
**Prompts needed: 2**

#### 🏛️ State 4.1: Layout Components
**Prompt Tasks (5 max):**
1. Create main layout with header, sidebar, footer
2. Build navigation menu with role-based visibility
3. Create dashboard layout for different user types
4. Build responsive mobile navigation
5. Setup theme configuration and dark mode

#### 🏛️ State 4.2: Common Components
**Prompt Tasks (5 max):**
1. Create reusable form components with validation
2. Build data table component with sorting and pagination
3. Create modal/dialog components
4. Build loading states and error boundary components
5. Create notification/toast system

---

## 🏗️ DETAILED BREAKDOWN: PHASE 2 - ADMIN CORE

### 🌍 Country 1: Admin Dashboard
**Prompts needed: 1**

#### 🏛️ State 2.1: Dashboard Overview
**Prompt Tasks (5 max):**
1. Create admin dashboard layout with statistics cards
2. Build overview metrics (total perfumes, brands, pending approvals)
3. Create recent activity feed component
4. Add quick action buttons for common tasks
5. Implement basic charts for data visualization

### 🌍 Country 2: Perfume Management
**Prompts needed: 2**

#### 🏛️ State 2.2: Perfume CRUD
**Prompt Tasks (5 max):**
1. Create perfume listing page with data table
2. Build perfume creation form with all fields
3. Create perfume edit/view page
4. Implement delete functionality with confirmation
5. Setup form validation with Zod schemas

#### 🏛️ State 2.3: Advanced Perfume Features
**Prompt Tasks (4 max):**
1. Create multi-select for notes (top, middle, base)
2. Build image upload functionality with Supabase Storage
3. Add tags input component
4. Create accords complex input system

### 🌍 Country 3: Brand & Notes Management
**Prompts needed: 1**

#### 🏛️ State 2.4: Brand & Notes CRUD
**Prompt Tasks (5 max):**
1. Create brand listing and management pages
2. Build brand creation and edit forms
3. Create notes listing and management pages
4. Build notes creation and edit forms
5. Setup proper relationships and validation

### 🌍 Country 4: Data Tables & Search
**Prompts needed: 2**

#### 🏛️ State 2.5: Basic Search & Filter
**Prompt Tasks (5 max):**
1. Implement search functionality across all entities
2. Create filter dropdowns (status, brand, date range)
3. Add sorting capabilities to data tables
4. Implement pagination with proper URL state
5. Create export functionality (CSV/JSON)

#### 🏛️ State 2.6: Advanced Table Features
**Prompt Tasks (4 max):**
1. Add bulk selection and operations
2. Create saved search functionality
3. Implement real-time updates for tables
4. Add column visibility and customization

---

## 🔄 PATTERN FOR REMAINING PHASES

Each phase follows the same pattern:
- **🌍 Countries** = Major feature areas (3-4 per phase)
- **🏛️ States** = Specific implementation tasks (1-3 per country)
- **📝 Prompts** = Individual AI tasks (max 5 tasks each)

## 📋 PROMPT VERIFICATION SYSTEM

Each prompt will include:
```
✅ VERIFY PREVIOUS WORK:
1. [Previous feature] is working correctly
2. [Database changes] are applied properly
3. [Components] are functional and tested
4. [Integration] works as expected

🎯 BUILD [CURRENT FEATURE]:
[Max 5 specific tasks]

🧪 TESTING REQUIREMENTS:
[What to test to confirm completion]
```

## 🚀 CURRENT IMPLEMENTATION STATUS

### ✅ COMPLETED: Phase 1 Foundation + RBAC Frontend
- **Next.js 14 Project**: Complete setup with TypeScript, Tailwind CSS, shadcn/ui
- **Project Structure**: All 24 pages created with proper folder organization
- **Design System**: Responsive design, dark/light themes, Geist Sans + Inter fonts
- **Authentication Store**: Production-ready Zustand store with RBAC support
- **Type System**: Comprehensive TypeScript types for RBAC (`src/types/rbac.types.ts`)
- **Permission System**: 16 granular permissions, 3 roles (super_admin, team_member, contributor)
- **JWT Integration**: Token decoding and role extraction ready for Supabase
- **UI Testing Page**: `/ui-testing` for component verification across devices
- **Temporary Development User**: `admin@temp.com` for testing all features

### 🚧 IN PROGRESS: Supabase RBAC Schema
- **Database Schema**: Ready to implement the production RBAC schema
- **Migration Files**: Use timestamp format `YYYYMMDDHHMMSS_description.sql`
- **Custom Access Token Hook**: JWT role injection implementation pending
- **Row Level Security**: RLS policies and authorization functions pending

### 📋 NEXT IMMEDIATE STEPS:
1. **Create Supabase Migration Files**: Implement the RBAC schema, hooks, and RLS
2. **Test RBAC Integration**: Verify JWT tokens contain role claims
3. **Auth Pages Implementation**: Build login/register pages with Supabase auth
4. **Remove Temporary User**: Switch to real Supabase authentication
5. **Permission Testing**: Verify all role-based access controls work

## 🚀 NEXT STEPS

1. **Complete RBAC Database Setup**: Implement Supabase schema with migrations
2. **Auth Pages**: Build production login/register with real authentication
3. **Permission Testing**: Verify role-based access across all pages
4. **Content Management**: Implement perfume/brand CRUD operations
5. **Begin Phase 2**: User contribution workflows and moderation system





























